export type UserRole = 'member' | 'admin';
export type ProjectTrack = 'WEB' | 'MOBILE' | 'AI_ML' | 'CLOUD' | 'UI_UX';
export type H3Role = 'Hacker' | 'Hipster' | 'Hustler';
export type MatchmakingStatus = 'idle' | 'waiting' | 'assigned';
export type TeamStatus = 'pending_approval' | 'approved' | 'rejected';

export interface TeamMember {
  uid: string;
  name: string;
  email: string;
  avatar_url?: string;
  h3_role: H3Role;
  is_leader: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  h3_role?: H3Role;
  matchmaking_status?: MatchmakingStatus;
  team_id?: string | null; // Nullable, enforces 1 team per user
  student_id?: string;
  created_at: string;
}

export type UserProfile = User & { uid: string };

export interface Team {
  id: string;
  name: string;
  description: string;
  track: ProjectTrack;
  invite_code: string; // Unique, e.g. GDG-7X9K
  status: TeamStatus; // 'pending_approval' | 'approved' | 'rejected'
  whatsapp_group_url?: string | null; // Set exclusively by Admin
  leader_id: string;   // Foreign key to User
  max_members: number; // Strictly 3 (1 Hacker, 1 Hipster, 1 Hustler)
  created_at: string;
  members?: User[];
  leader?: User;
}

export interface PastEvent {
  id: string;
  title: string;
  date: string;
  month: string;
  day: number;
  description: string;
  badgeColor: string;
  category: string;
}

export interface Organizer {
  id: string;
  name: string;
  role: string;
  avatar: string;
  track: string;
  bio: string;
}
