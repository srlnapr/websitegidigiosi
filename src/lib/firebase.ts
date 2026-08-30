import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLoBN9qiK6BFdT9A8IFHlQ2pENQJ5qw58",
  authDomain: "gdgocpwt.firebaseapp.com",
  projectId: "gdgocpwt",
  storageBucket: "gdgocpwt.firebasestorage.app",
  messagingSenderId: "1051804387468",
  appId: "1:1051804387468:web:c1672fecfc7b52d1cd53a9",
  measurementId: "G-2LC08PVPXL"
};

// Prevent re-initialization in Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
