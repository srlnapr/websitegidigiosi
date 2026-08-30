import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Team, ProjectTrack, UserRole, H3Role, MatchmakingStatus, TeamStatus } from '@/types';

// Helper to generate unique 6-character code like GDG-7X9K
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GDG-${randomStr}`;
}

// ─── Firestore Helper Functions ──────────────────────────────────────────────

/** Fetch a single user profile by UID */
export async function getUser(uid: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: snap.id,
      name: d.name ?? 'User',
      email: d.email ?? '',
      avatar_url: d.avatar_url ?? undefined,
      role: (d.role as UserRole) ?? 'member',
      h3_role: (d.h3_role as H3Role) ?? undefined,
      matchmaking_status: (d.matchmaking_status as MatchmakingStatus) ?? 'idle',
      team_id: d.team_id ?? null,
      student_id: d.student_id ?? undefined,
      created_at: d.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Fetch all users */
export async function getAllUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? 'User',
        email: data.email ?? '',
        avatar_url: data.avatar_url ?? undefined,
        role: (data.role as UserRole) ?? 'member',
        h3_role: (data.h3_role as H3Role) ?? undefined,
        matchmaking_status: (data.matchmaking_status as MatchmakingStatus) ?? 'idle',
        team_id: data.team_id ?? null,
        student_id: data.student_id ?? undefined,
        created_at: data.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

/** Fetch all teams with their members */
export async function getAllTeams(): Promise<(Team & { members: User[]; leader?: User })[]> {
  try {
    const teamSnap = await getDocs(collection(db, 'teams'));
    const users = await getAllUsers();

    return teamSnap.docs.map((d) => {
      const data = d.data();
      const team: Team = {
        id: d.id,
        name: data.name ?? '',
        description: data.description ?? '',
        track: (data.track as ProjectTrack) ?? 'WEB',
        invite_code: data.invite_code ?? '',
        status: (data.status as TeamStatus) ?? 'pending_approval',
        whatsapp_group_url: data.whatsapp_group_url ?? null,
        leader_id: data.leader_id ?? '',
        max_members: data.max_members ?? 3,
        created_at: data.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      };

      const members = users.filter((u) => u.team_id === team.id);
      const leader = users.find((u) => u.id === team.leader_id);
      return { ...team, members, leader };
    });
  } catch {
    return [];
  }
}

/** Fetch the team for a specific user */
export async function getUserTeam(userId: string): Promise<(Team & { members: User[]; leader?: User }) | null> {
  const user = await getUser(userId);
  if (!user?.team_id) return null;

  try {
    const teamDoc = await getDoc(doc(db, 'teams', user.team_id));
    if (!teamDoc.exists()) return null;

    const data = teamDoc.data();
    const team: Team = {
      id: teamDoc.id,
      name: data.name ?? '',
      description: data.description ?? '',
      track: (data.track as ProjectTrack) ?? 'WEB',
      invite_code: data.invite_code ?? '',
      status: (data.status as TeamStatus) ?? 'pending_approval',
      whatsapp_group_url: data.whatsapp_group_url ?? null,
      leader_id: data.leader_id ?? '',
      max_members: data.max_members ?? 3,
      created_at: data.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    };

    const users = await getAllUsers();
    const members = users.filter((u) => u.team_id === team.id);
    const leader = users.find((u) => u.id === team.leader_id);

    return { ...team, members, leader };
  } catch {
    return null;
  }
}

/** Create a new Team with Strict H3 Leader Role */
export async function createTeam(data: {
  name: string;
  description: string;
  track: ProjectTrack;
  leaderId: string;
  leaderH3Role: H3Role;
}): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    const user = await getUser(data.leaderId);
    if (!user) return { success: false, error: 'User tidak ditemukan.' };
    if (user.team_id) {
      return { success: false, error: 'Kamu sudah tergabung dalam tim. Keluar dari tim saat ini terlebih dahulu.' };
    }

    // Generate unique code
    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const q = query(collection(db, 'teams'), where('invite_code', '==', inviteCode));
      const existing = await getDocs(q);
      if (existing.empty) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    const teamRef = doc(collection(db, 'teams'));
    const teamId = teamRef.id;

    const newTeam = {
      name: data.name.trim(),
      description: data.description.trim(),
      track: data.track,
      invite_code: inviteCode,
      status: 'pending_approval' as TeamStatus,
      whatsapp_group_url: null,
      leader_id: data.leaderId,
      max_members: 3,
      created_at: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'teams', teamId), newTeam);
    batch.update(doc(db, 'users', data.leaderId), {
      team_id: teamId,
      h3_role: data.leaderH3Role,
      matchmaking_status: 'assigned',
    });
    await batch.commit();

    return {
      success: true,
      team: {
        id: teamId,
        name: data.name,
        description: data.description,
        track: data.track,
        invite_code: inviteCode,
        status: 'pending_approval',
        whatsapp_group_url: null,
        leader_id: data.leaderId,
        max_members: 3,
        created_at: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('createTeam error:', err);
    return { success: false, error: 'Gagal membuat tim. Coba lagi.' };
  }
}

/** Join an existing team by invite code with Strict H3 Role Conflict Guard */
export async function joinTeam(
  inviteCode: string,
  userId: string,
  userH3Role?: H3Role
): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    const user = await getUser(userId);
    if (!user) return { success: false, error: 'User tidak ditemukan.' };
    if (user.team_id) return { success: false, error: 'Kamu sudah tergabung dalam tim. Keluar terlebih dahulu.' };

    const effectiveRole: H3Role | undefined = userH3Role || user.h3_role;
    if (!effectiveRole) {
      return { success: false, error: 'Harap pilih peran H3 kamu (Hacker, Hipster, atau Hustler) sebelum bergabung.' };
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const q = query(collection(db, 'teams'), where('invite_code', '==', cleanCode));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: 'Kode undangan tidak valid. Periksa kembali kode dari team leader.' };

    const teamDoc = snap.docs[0];
    const teamData = teamDoc.data();

    // Fetch existing team members
    const usersSnap = await getDocs(query(collection(db, 'users'), where('team_id', '==', teamDoc.id)));
    const existingMembers: User[] = usersSnap.docs.map((d) => ({
      id: d.id,
      name: d.data().name ?? '',
      email: d.data().email ?? '',
      role: d.data().role ?? 'member',
      h3_role: d.data().h3_role,
      matchmaking_status: d.data().matchmaking_status,
      created_at: d.data().created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    }));

    // Strict 1: Check capacity (Strictly 3 members)
    if (existingMembers.length >= (teamData.max_members ?? 3)) {
      return { success: false, error: `Tim "${teamData.name}" sudah penuh (Maksimal 3 anggota: 1 Hacker, 1 Hipster, 1 Hustler).` };
    }

    // Strict 2: Role Conflict Guard (Check if effectiveRole is already taken)
    const roleTaken = existingMembers.some((m) => m.h3_role === effectiveRole);
    if (roleTaken) {
      return { success: false, error: `Cannot join team: The ${effectiveRole} spot is already occupied in this team.` };
    }

    await updateDoc(doc(db, 'users', userId), {
      team_id: teamDoc.id,
      h3_role: effectiveRole,
      matchmaking_status: 'assigned',
    });

    return {
      success: true,
      team: {
        id: teamDoc.id,
        name: teamData.name,
        description: teamData.description,
        track: teamData.track,
        invite_code: teamData.invite_code,
        status: teamData.status ?? 'pending_approval',
        whatsapp_group_url: teamData.whatsapp_group_url ?? null,
        leader_id: teamData.leader_id,
        max_members: teamData.max_members ?? 3,
        created_at: teamData.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('joinTeam error:', err);
    return { success: false, error: 'Gagal bergabung. Coba lagi.' };
  }
}

/** Leave the current team */
export async function leaveTeam(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser(userId);
    if (!user?.team_id) return { success: false, error: 'Kamu tidak tergabung dalam tim.' };

    const teamRef = doc(db, 'teams', user.team_id);
    const teamSnap = await getDoc(teamRef);

    if (teamSnap.exists()) {
      const teamData = teamSnap.data();
      if (teamData.leader_id === userId) {
        const membersSnap = await getDocs(
          query(collection(db, 'users'), where('team_id', '==', user.team_id))
        );
        const remaining = membersSnap.docs.filter((d) => d.id !== userId);
        if (remaining.length > 0) {
          await updateDoc(teamRef, { leader_id: remaining[0].id });
        } else {
          await deleteDoc(teamRef);
        }
      }
    }

    await updateDoc(doc(db, 'users', userId), {
      team_id: null,
      matchmaking_status: 'idle',
    });
    return { success: true };
  } catch (err) {
    console.error('leaveTeam error:', err);
    return { success: false, error: 'Gagal keluar dari tim. Coba lagi.' };
  }
}

/** Disband an entire team */
export async function disbandTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const membersSnap = await getDocs(
      query(collection(db, 'users'), where('team_id', '==', teamId))
    );

    const batch = writeBatch(db);
    membersSnap.docs.forEach((d) => {
      batch.update(doc(db, 'users', d.id), {
        team_id: null,
        matchmaking_status: 'idle',
      });
    });
    batch.delete(doc(db, 'teams', teamId));
    await batch.commit();

    return { success: true };
  } catch (err) {
    console.error('disbandTeam error:', err);
    return { success: false, error: 'Gagal membubarkan tim. Coba lagi.' };
  }
}

/** Update a user's role */
export async function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean }> {
  try {
    await updateDoc(doc(db, 'users', userId), { role });
    return { success: true };
  } catch {
    return { success: false };
  }
}

/** Remove user from their team (admin action) */
export async function removeUserFromTeam(userId: string): Promise<{ success: boolean; error?: string }> {
  return leaveTeam(userId);
}

/** Update user profile fields (name, student_id) */
export async function updateProfile(
  userId: string,
  data: { name?: string; student_id?: string; h3_role?: H3Role }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.student_id !== undefined) updates.student_id = data.student_id.trim();
    if (data.h3_role !== undefined) updates.h3_role = data.h3_role;

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'Tidak ada perubahan.' };
    }

    await updateDoc(doc(db, 'users', userId), updates);
    return { success: true };
  } catch (err) {
    console.error('updateProfile error:', err);
    return { success: false, error: 'Gagal memperbarui profil. Coba lagi.' };
  }
}

/** Update team name and/or description (leader only) */
export async function updateTeamInfo(
  teamId: string,
  leaderId: string,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const teamSnap = await getDoc(doc(db, 'teams', teamId));
    if (!teamSnap.exists()) return { success: false, error: 'Tim tidak ditemukan.' };

    const teamData = teamSnap.data();
    if (teamData.leader_id !== leaderId) {
      return { success: false, error: 'Hanya Team Leader yang bisa mengubah info tim.' };
    }

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined && data.name.trim()) updates.name = data.name.trim();
    if (data.description !== undefined) updates.description = data.description.trim();

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'Tidak ada perubahan.' };
    }

    await updateDoc(doc(db, 'teams', teamId), updates);
    return { success: true };
  } catch (err) {
    console.error('updateTeamInfo error:', err);
    return { success: false, error: 'Gagal memperbarui info tim. Coba lagi.' };
  }
}

// ─── Admin Team Approval & WhatsApp Distribution ─────────────────────────────

/** Admin: Approve team and distribute official WhatsApp group link */
export async function approveTeam(
  teamId: string,
  whatsappGroupUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUrl = whatsappGroupUrl.trim();
    if (!cleanUrl) {
      return { success: false, error: 'Tautan WhatsApp group tidak boleh kosong.' };
    }

    await updateDoc(doc(db, 'teams', teamId), {
      status: 'approved',
      whatsapp_group_url: cleanUrl,
    });

    return { success: true };
  } catch (err) {
    console.error('approveTeam error:', err);
    return { success: false, error: 'Gagal menyetujui tim.' };
  }
}

/** Admin: Reject / Request changes for a team */
export async function rejectTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'teams', teamId), {
      status: 'rejected',
    });
    return { success: true };
  } catch (err) {
    console.error('rejectTeam error:', err);
    return { success: false, error: 'Gagal menolak tim.' };
  }
}

// ─── H3 Matchmaking & Plotting Operations ────────────────────────────────────

/** Submit user to H3 Matchmaking queue */
export async function joinMatchmaking(
  userId: string,
  h3Role: H3Role
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser(userId);
    if (!user) return { success: false, error: 'User tidak ditemukan.' };
    if (user.team_id) return { success: false, error: 'Kamu sudah memiliki tim.' };

    await updateDoc(doc(db, 'users', userId), {
      h3_role: h3Role,
      matchmaking_status: 'waiting',
    });

    return { success: true };
  } catch (err) {
    console.error('joinMatchmaking error:', err);
    return { success: false, error: 'Gagal bergabung antrian matchmaking. Coba lagi.' };
  }
}

/** Cancel H3 Matchmaking queue */
export async function cancelMatchmaking(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      matchmaking_status: 'idle',
    });
    return { success: true };
  } catch (err) {
    console.error('cancelMatchmaking error:', err);
    return { success: false, error: 'Gagal membatalkan antrian matchmaking.' };
  }
}

/** Admin: Manually assign unassigned user into an existing open team with Strict H3 Role Conflict Check */
export async function assignUserToTeam(
  userId: string,
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [user, teamSnap] = await Promise.all([
      getUser(userId),
      getDoc(doc(db, 'teams', teamId)),
    ]);

    if (!user) return { success: false, error: 'User tidak ditemukan.' };
    if (!user.h3_role) return { success: false, error: 'User belum memiliki peran H3.' };
    if (!teamSnap.exists()) return { success: false, error: 'Tim tidak ditemukan.' };

    const teamData = teamSnap.data();
    const membersSnap = await getDocs(query(collection(db, 'users'), where('team_id', '==', teamId)));
    const existingMembers: User[] = membersSnap.docs.map((d) => ({
      id: d.id,
      name: d.data().name ?? '',
      email: d.data().email ?? '',
      role: d.data().role ?? 'member',
      h3_role: d.data().h3_role,
      matchmaking_status: d.data().matchmaking_status,
      created_at: d.data().created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    }));

    // Strict 1: Max capacity 3
    if (existingMembers.length >= (teamData.max_members ?? 3)) {
      return { success: false, error: `Tim ${teamData.name} sudah penuh (3/3 anggota).` };
    }

    // Strict 2: Role Conflict Guard
    if (existingMembers.some((m) => m.h3_role === user.h3_role)) {
      return { success: false, error: `Cannot join team: The ${user.h3_role} spot is already occupied in this team.` };
    }

    await updateDoc(doc(db, 'users', userId), {
      team_id: teamId,
      matchmaking_status: 'assigned',
    });

    return { success: true };
  } catch (err) {
    console.error('assignUserToTeam error:', err);
    return { success: false, error: 'Gagal menempatkan user ke tim.' };
  }
}

const PROJECT_CODENAMES = [
  'Apex Web Platform',
  'Nexus Cloud Service',
  'Quantum Web Engine',
  'Velocity Web Stack',
  'Vanguard Frontend',
  'CyberPulse Web App',
  'Horizon Solution Portal',
  'Orbit Hub Web'
];

/** Admin: Auto-Group 1 Hustler + 1 Hipster + 1 Hacker into Web Project Teams (Strictly 3 members) */
export async function autoGroupH3Teams(): Promise<{
  success: boolean;
  teamsCreated: number;
  assignedCount: number;
  error?: string;
}> {
  try {
    const allUsers = await getAllUsers();
    const pool = allUsers.filter((u) => !u.team_id && u.h3_role && u.matchmaking_status === 'waiting');

    const hustlers = pool.filter((u) => u.h3_role === 'Hustler');
    const hipsters = pool.filter((u) => u.h3_role === 'Hipster');
    const hackers = pool.filter((u) => u.h3_role === 'Hacker');

    if (hustlers.length === 0 || hipsters.length === 0 || hackers.length === 0) {
      return {
        success: false,
        teamsCreated: 0,
        assignedCount: 0,
        error: 'Tidak cukup kandidat lengkap. Diperlukan minimal 1 Hustler, 1 Hipster, dan 1 Hacker.',
      };
    }

    let teamsCreated = 0;
    let assignedCount = 0;

    while (hustlers.length > 0 && hipsters.length > 0 && hackers.length > 0) {
      const leader = hustlers.shift()!;
      const designer = hipsters.shift()!;
      const developer = hackers.shift()!;

      const teamMembers = [leader, designer, developer];
      const inviteCode = generateInviteCode();
      const codename = PROJECT_CODENAMES[teamsCreated % PROJECT_CODENAMES.length] + ` #${teamsCreated + 1}`;

      const teamRef = doc(collection(db, 'teams'));
      const teamId = teamRef.id;

      const newTeam = {
        name: codename,
        description: 'Auto-plotted Web Development team assembled via GDG Telkom H3 Matchmaking Engine.',
        track: 'WEB' as ProjectTrack,
        invite_code: inviteCode,
        status: 'pending_approval' as TeamStatus,
        whatsapp_group_url: null,
        leader_id: leader.id,
        max_members: 3,
        created_at: serverTimestamp(),
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'teams', teamId), newTeam);

      teamMembers.forEach((member) => {
        batch.update(doc(db, 'users', member.id), {
          team_id: teamId,
          matchmaking_status: 'assigned',
        });
        assignedCount++;
      });

      await batch.commit();
      teamsCreated++;
    }

    return {
      success: true,
      teamsCreated,
      assignedCount,
    };
  } catch (err) {
    console.error('autoGroupH3Teams error:', err);
    return {
      success: false,
      teamsCreated: 0,
      assignedCount: 0,
      error: 'Gagal menjalankan auto-group matchmaking.',
    };
  }
}
