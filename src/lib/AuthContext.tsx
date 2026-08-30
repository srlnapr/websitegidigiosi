'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { User, UserRole, H3Role, MatchmakingStatus } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  profile: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (name: string, email: string, password: string, studentId?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// Fetch or create the Firestore user profile document
async function fetchProfile(fbUser: FirebaseUser): Promise<User | null> {
  try {
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: fbUser.uid,
        name: data.name ?? fbUser.displayName ?? 'User',
        email: data.email ?? fbUser.email ?? '',
        avatar_url: data.avatar_url ?? fbUser.photoURL ?? undefined,
        role: data.role ?? 'member',
        h3_role: data.h3_role ?? undefined,
        matchmaking_status: data.matchmaking_status ?? 'idle',
        team_id: data.team_id ?? null,
        student_id: data.student_id ?? undefined,
        created_at: data.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}

// Create a new Firestore user profile document
async function createProfile(
  fbUser: FirebaseUser,
  extra: { name?: string; role?: UserRole; student_id?: string; h3_role?: H3Role; matchmaking_status?: MatchmakingStatus }
): Promise<User> {
  const profile: Record<string, unknown> = {
    name: extra.name ?? fbUser.displayName ?? 'User',
    email: fbUser.email ?? '',
    avatar_url: fbUser.photoURL ?? null,
    role: extra.role ?? 'member',
    h3_role: extra.h3_role ?? null,
    matchmaking_status: extra.matchmaking_status ?? 'idle',
    team_id: null,
    student_id: extra.student_id ?? '',
    created_at: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', fbUser.uid), profile);

  return {
    id: fbUser.uid,
    name: profile.name as string,
    email: profile.email as string,
    avatar_url: (profile.avatar_url as string) ?? undefined,
    role: profile.role as UserRole,
    h3_role: extra.h3_role,
    matchmaking_status: extra.matchmaking_status ?? 'idle',
    team_id: null,
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const p = await fetchProfile(fbUser);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (firebaseUser) {
      const p = await fetchProfile(firebaseUser);
      setProfile(p);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const p = await fetchProfile(cred.user);
      setProfile(p);
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      let message = 'Login gagal. Silakan coba lagi.';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        message = 'Email atau kata sandi salah. Periksa kembali atau daftar akun baru.';
      } else if (code === 'auth/wrong-password') {
        message = 'Kata sandi salah. Silakan coba lagi.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Terlalu banyak percobaan. Coba lagi nanti.';
      }
      return { success: false, error: message };
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    studentId?: string,
    role?: UserRole
  ) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const p = await createProfile(cred.user, { name, role, student_id: studentId });
      setProfile(p);
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      let message = 'Registrasi gagal. Silakan coba lagi.';
      if (code === 'auth/email-already-in-use') {
        message = 'Email sudah terdaftar. Silakan gunakan menu Login.';
      } else if (code === 'auth/weak-password') {
        message = 'Kata sandi terlalu lemah. Minimal 6 karakter.';
      } else if (code === 'auth/invalid-email') {
        message = 'Format email tidak valid.';
      }
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      
      // Auth succeeded — now try Firestore profile
      try {
        let p = await fetchProfile(cred.user);
        if (!p) {
          p = await createProfile(cred.user, {
            name: cred.user.displayName ?? 'User',
          });
        }
        setProfile(p);
      } catch (firestoreErr: unknown) {
        // Firestore write failed (e.g. permission-denied) but auth is valid
        // Use Firebase Auth data as fallback profile
        console.warn('Firestore profile write failed, using auth fallback:', firestoreErr);
        setProfile({
          id: cred.user.uid,
          name: cred.user.displayName ?? 'User',
          email: cred.user.email ?? '',
          avatar_url: cred.user.photoURL ?? undefined,
          role: 'member',
          team_id: null,
          created_at: new Date().toISOString(),
        });
      }

      return { success: true };
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      const code = firebaseErr.code ?? '';
      console.error('Google Sign-In error:', code, firebaseErr.message, err);

      if (code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Popup Google ditutup. Silakan coba lagi.' };
      }
      if (code === 'auth/unauthorized-domain') {
        return { success: false, error: `Domain "${window.location.hostname}" belum ditambahkan di Firebase Console → Authentication → Settings → Authorized domains.` };
      }
      if (code === 'auth/operation-not-allowed') {
        return { success: false, error: 'Google Sign-In belum di-enable. Buka Firebase Console → Authentication → Sign-in method → aktifkan Google provider.' };
      }
      return { success: false, error: `Login Google gagal (${code || 'unknown'}). Cek console browser untuk detail.` };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
