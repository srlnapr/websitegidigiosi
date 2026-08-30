'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import * as store from '@/lib/store';
import { User, Team, ProjectTrack, UserRole } from '@/types';
import UserAvatar from '@/components/UserAvatar';
import { 
  ShieldCheck, 
  Trash2, 
  Eye, 
  Sparkles, 
  AlertTriangle,
  X,
  Star,
  Menu,
  LogOut,
  Code2,
  CheckCircle2,
  TrendingUp,
  FolderGit2,
  Laptop,
  Palette,
  Briefcase,
  Radio,
  Check,
  Users,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

const TRACK_BADGES: Record<ProjectTrack, { label: string; color: string; tag: string }> = {
  WEB: { label: 'Web Platform', color: 'bg-blue-100 text-blue-800 border-blue-200', tag: '#React #NextJS' },
  MOBILE: { label: 'Mobile App', color: 'bg-green-100 text-green-800 border-green-200', tag: '#Flutter #Kotlin' },
  AI_ML: { label: 'AI / Machine Learning', color: 'bg-amber-100 text-amber-800 border-amber-200', tag: '#PyTorch #Gemini' },
  CLOUD: { label: 'Cloud Infrastructure', color: 'bg-slate-100 text-slate-800 border-slate-200', tag: '#GCP #Docker' },
  UI_UX: { label: 'UI/UX Design', color: 'bg-rose-100 text-rose-800 border-rose-200', tag: '#Figma #Design' },
};

type AdminNavTab = 'admin-overview' | 'h3-matchmaking' | 'team-approvals' | 'members-directory' | 'event-manager' | 'admin-settings';

export default function AdminDashboard() {
  const router = useRouter();
  const { profile: currentUser, loading: authLoading, logout } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<(Team & { members: User[]; leader?: User })[]>([]);
  
  // UI & Tab states
  const [activeTab, setActiveTab] = useState<AdminNavTab>('admin-overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [autoGrouping, setAutoGrouping] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Review & Approval Modal state
  const [reviewTeam, setReviewTeam] = useState<(Team & { members: User[]; leader?: User }) | null>(null);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [approving, setApproving] = useState(false);

  // Roster Inspect Modal & Action Feedback
  const [inspectTeam, setInspectTeam] = useState<(Team & { members: User[]; leader?: User }) | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    const [allUsers, allTeams] = await Promise.all([
      store.getAllUsers(),
      store.getAllTeams(),
    ]);
    setUsers(allUsers);
    setTeams(allTeams);
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    async function loadAdminData() {
      if (!currentUser) return;
      const [allUsers, allTeams] = await Promise.all([
        store.getAllUsers(),
        store.getAllTeams(),
      ]);
      if (isSubscribed) {
        setUsers(allUsers);
        setTeams(allTeams);
      }
    }
    loadAdminData();
    return () => {
      isSubscribed = false;
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  const handlePromoteDemote = async (targetUser: User) => {
    const newRole: UserRole = targetUser.role === 'admin' ? 'member' : 'admin';
    await store.updateUserRole(targetUser.id, newRole);
    setToastMsg(`Role ${targetUser.name} diubah menjadi ${newRole.toUpperCase()}.`);
    await refreshData();
  };

  const handleRemoveUserFromTeam = async (targetUser: User) => {
    if (confirm(`Keluarkan ${targetUser.name} dari tim mereka?`)) {
      await store.removeUserFromTeam(targetUser.id);
      setToastMsg(`${targetUser.name} telah dikeluarkan dari tim.`);
      await refreshData();
    }
  };

  const handleDisbandTeamAdmin = async (team: Team) => {
    if (confirm(`ADMIN ACTION: Yakin ingin membubarkan tim "${team.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      await store.disbandTeam(team.id);
      setToastMsg(`Tim "${team.name}" telah dibubarkan.`);
      if (inspectTeam?.id === team.id) setInspectTeam(null);
      if (reviewTeam?.id === team.id) setReviewTeam(null);
      await refreshData();
    }
  };

  // Admin Approval Actions
  const handleApproveTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTeam) return;
    setApproving(true);

    const res = await store.approveTeam(reviewTeam.id, whatsappInput);
    setApproving(false);

    if (res.success) {
      setToastMsg(`Tim "${reviewTeam.name}" berhasil disetujui & tautan WhatsApp group resmi telah didistribusikan!`);
      setReviewTeam(null);
      setWhatsappInput('');
      await refreshData();
    } else {
      setToastMsg(res.error || 'Gagal menyetujui tim.');
    }
  };

  const handleRejectTeam = async () => {
    if (!reviewTeam) return;
    if (confirm(`Tolak tim "${reviewTeam.name}" dan minta revisi dari anggota?`)) {
      const res = await store.rejectTeam(reviewTeam.id);
      if (res.success) {
        setToastMsg(`Tim "${reviewTeam.name}" telah ditolak/diminta revisi.`);
        setReviewTeam(null);
        await refreshData();
      } else {
        setToastMsg(res.error || 'Gagal menolak tim.');
      }
    }
  };

  // Manual Slot Assignment with Role Conflict Guard
  const handleManualAssign = async (userId: string, teamId: string) => {
    if (!teamId) return;
    const res = await store.assignUserToTeam(userId, teamId);
    if (res.success) {
      setToastMsg('Member berhasil dimasukkan ke dalam tim terpilih!');
      await refreshData();
    } else {
      setToastMsg(res.error || 'Gagal menempatkan member.');
    }
  };

  // Auto-Group H3 Feature
  const handleAutoGroup = async () => {
    setAutoGrouping(true);
    const res = await store.autoGroupH3Teams();
    setAutoGrouping(false);

    if (res.success) {
      setToastMsg(`Berhasil membentuk ${res.teamsCreated} tim Web Development baru (${res.assignedCount} anggota di-plot)!`);
      await refreshData();
    } else {
      setToastMsg(res.error || 'Gagal menjalankan auto-grouping.');
    }
  };

  // Filtered Teams
  const filteredTeams = teams.filter((t) => {
    return t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           t.invite_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (t.leader?.name && t.leader.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    return u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           u.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // H3 Matchmaking Pool Calculations
  const unassignedUsers = users.filter((u) => !u.team_id);
  const waitingPool = users.filter((u) => !u.team_id && u.matchmaking_status === 'waiting');
  const hackerCount = unassignedUsers.filter((u) => u.h3_role === 'Hacker').length;
  const hipsterCount = unassignedUsers.filter((u) => u.h3_role === 'Hipster').length;
  const hustlerCount = unassignedUsers.filter((u) => u.h3_role === 'Hustler').length;
  const possibleTeams = Math.min(hustlerCount, hipsterCount, Math.max(0, hackerCount));

  // Pending approval teams count
  const pendingApprovalTeams = teams.filter((t) => t.status === 'pending_approval');

  // Overall Metrics
  const activeTeamsCount = teams.length;
  const registeredMembersCount = users.length;
  const activeTracksCount = new Set(teams.map(t => t.track)).size;

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0058bd]/30 border-t-[#0058bd] rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#424753]">Memuat Admin Control Center...</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#191b22] font-product antialiased selection:bg-[#0058bd] selection:text-white flex flex-col">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#f2f3fd] z-50 flex flex-col border-r border-[#c2c6d5]/30 shadow-xs transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Brand Logo Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#c2c6d5]/20 bg-[#f2f3fd]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0058bd] via-[#006e2c] to-[#fbbc06] p-[2px] shadow-sm transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-white rounded-[8px] flex items-center justify-center">
                <Code2 className="w-4 h-4 text-[#0058bd]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#191b22] leading-tight">
                GDG <span className="text-[#0058bd]">Telkom</span>
              </span>
              <span className="text-[9px] font-semibold text-[#727785] uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 text-[#727785] hover:bg-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#727785] mb-2">
            Overview
          </div>

          <button
            onClick={() => { setActiveTab('admin-overview'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'admin-overview'
                ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                : 'text-[#424753] hover:bg-white/80 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              <span className="text-xs">Overview</span>
            </div>
            {activeTab === 'admin-overview' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
          </button>

          <button
            onClick={() => { setActiveTab('h3-matchmaking'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'h3-matchmaking'
                ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                : 'text-[#424753] hover:bg-white/80 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#fbbc06]" />
              <span className="text-xs">H3 Matchmaking Pool</span>
            </div>
            {waitingPool.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#fbbc06] text-[#765700] text-[9px] font-extrabold">
                {waitingPool.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('team-approvals'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'team-approvals'
                ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                : 'text-[#424753] hover:bg-white/80 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="text-xs">Team Approvals</span>
            </div>
            {pendingApprovalTeams.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[9px] font-extrabold animate-pulse">
                {pendingApprovalTeams.length} Pending
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e8f0fe] text-[#0058bd]">
                {teams.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('members-directory'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'members-directory'
                ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                : 'text-[#424753] hover:bg-white/80 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span className="text-xs">Members & Roles</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              activeTab === 'members-directory' ? 'bg-white/20 text-white' : 'bg-[#e6f4ea] text-[#137333]'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('event-manager'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'event-manager'
                ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                : 'text-[#424753] hover:bg-white/80 font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            <span className="text-xs">Event Manager</span>
          </button>
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="p-3 border-t border-[#c2c6d5]/30 space-y-1 bg-[#ecedf7]">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#424753] hover:text-[#0058bd] transition-colors rounded-xl hover:bg-white/80"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Public Website</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/60 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout / Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Container with Sidebar Offset */}
      <div className="lg:pl-64 min-h-screen flex flex-col bg-[#f9f9ff]">
        
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-4 md:px-8 flex items-center justify-between border-b border-[#c2c6d5]/20">
          
          {/* Mobile Sidebar Toggle Button */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-[#424753] hover:bg-[#f2f3fd] rounded-xl transition-colors mr-2"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727785] text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, events, members..."
                className="w-full pl-10 pr-10 py-1.5 bg-[#f2f3fd] rounded-full border border-transparent focus:border-[#0058bd] focus:bg-white transition-all text-xs text-[#191b22] outline-none"
              />
              <span className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-[#727785] bg-white px-1.5 py-0.5 rounded border border-[#c2c6d5]/40">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Header User Section */}
          <div className="flex items-center gap-3 ml-4">
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-[#424753] hover:bg-[#f2f3fd] rounded-full transition-colors"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {pendingApprovalTeams.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#c2c6d5]/30 p-3 z-50 animate-fade-in-up">
                  <div className="flex items-center justify-between pb-2 border-b border-[#c2c6d5]/20 mb-2">
                    <span className="text-xs font-bold text-[#191b22]">System Notifications</span>
                    <span className="text-[9px] bg-[#0058bd]/10 text-[#0058bd] px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 bg-[#ffdad6]/40 rounded-xl">
                      <div className="font-bold text-[#93000a]">Pending Team Reviews</div>
                      <div className="text-[#424753] text-[11px] mt-0.5">{pendingApprovalTeams.length} tim menunggu approval & WhatsApp link.</div>
                    </div>
                    <div className="p-2 bg-[#f9f9ff] rounded-xl">
                      <div className="font-bold text-[#191b22]">H3 Queue Pool</div>
                      <div className="text-[#424753] text-[11px] mt-0.5">{waitingPool.length} members ready for auto-grouping.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile & Status */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#c2c6d5]/30">
              <div className="text-right hidden sm:block">
                <div className="font-bold text-[#191b22] text-xs leading-tight">
                  {currentUser.name}
                </div>
                <div className="px-2 bg-[#86f898] text-[#00722f] rounded-full text-[9px] font-extrabold uppercase inline-block mt-0.5">
                  Admin Lead
                </div>
              </div>
              
              <UserAvatar name={currentUser.name} size="sm" />
            </div>

          </div>
        </header>

        {/* Main Dashboard Body Container */}
        <main className="flex-1 pt-20 pb-12 px-4 md:px-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Toast Notification */}
          {toastMsg && (
            <div className="bg-[#e6f4ea] border border-[#137333]/30 text-[#137333] p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in-up shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#137333]" />
                <span>{toastMsg}</span>
              </div>
              <button onClick={() => setToastMsg(null)} className="font-bold text-[#137333]">×</button>
            </div>
          )}

          {/* Role Gate Notice if not Admin */}
          {!isAdmin && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] p-4 rounded-2xl text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-[#ba1a1a]" />
                <div>
                  <span className="font-bold block">Akses Mode Tinjau (Preview Role)</span>
                  <span>Akun Anda saat ini memiliki role member standard. Beberapa aksi admin membutuhkan izin Lead Admin.</span>
                </div>
              </div>
              <button
                onClick={() => handlePromoteDemote(currentUser)}
                className="px-3 py-1.5 bg-[#ba1a1a] text-white rounded-xl font-bold text-xs hover:opacity-90 transition-opacity"
              >
                Promote Self to Admin
              </button>
            </div>
          )}

          {/* SECTION 1: HERO / WELCOME BANNER */}
          <div className="relative overflow-hidden rounded-3xl bg-[#e7e7f1] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-[#c2c6d5]/30">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path className="text-[#0058bd]" d="M0,100 C20,80 40,90 60,70 C80,50 100,60 100,0 L100,100 Z" fill="currentColor"></path>
              </svg>
            </div>

            <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
              <span className="text-[11px] font-extrabold text-[#0058bd] tracking-widest uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#fbbc06]" />
                Admin Dashboard & Team Approvals
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191b22] tracking-tight">
                Welcome back, {currentUser.name.split(' ')[0]} Lead.
              </h1>
              <p className="text-xs md:text-sm text-[#424753] max-w-xl leading-relaxed">
                Review pending team submissions, enforce strict 1-Hustler/1-Hipster/1-Hacker uniqueness, approve squads, and distribute official WhatsApp Group Links.
              </p>
            </div>

            <div className="relative z-10 hidden md:flex items-center justify-center">
              <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-[#0058bd] to-[#765700] opacity-30 blur-2xl absolute"></div>
              <div className="relative z-20 w-36 h-32 rounded-3xl bg-white/80 backdrop-blur-md border border-white p-4 shadow-lg flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-8 h-8 text-[#0058bd] mb-1" />
                <span className="text-[10px] font-extrabold text-[#191b22] uppercase tracking-wider">Approval Center</span>
                <span className="text-[9px] font-bold text-[#ba1a1a]">{pendingApprovalTeams.length} Pending Teams</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: H3 MATCHMAKING SUMMARY BAR & AUTO-GROUP HERO */}
          <div className="bg-gradient-to-br from-white to-[#f2f3fd] rounded-3xl p-6 md:p-8 border-2 border-[#0058bd]/25 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8e2ff] text-[#0058bd] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Web Track H3 Matchmaking Pool (3 Slots Strict)
                </div>
                <h2 className="text-xl font-extrabold text-[#191b22]">Hacker • Hipster • Hustler Pairing Status</h2>
                <p className="text-xs text-[#424753]">Real-time unassigned student distribution ready for Web Project team assembly</p>
              </div>

              {/* Auto Group Feature Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAutoGroup}
                  disabled={autoGrouping || possibleTeams === 0}
                  className="px-5 py-3 bg-gradient-to-r from-[#0058bd] to-[#2771df] text-white rounded-2xl text-xs font-extrabold hover:opacity-90 transition-all shadow-md shadow-[#0058bd]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-[#fbbc06]" />
                  <span>{autoGrouping ? 'Memproses Pairing...' : `Auto-Group Web Teams (${possibleTeams} Tim Siap)`}</span>
                </button>
              </div>
            </div>

            {/* H3 Counts Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              
              {/* 1. Hackers */}
              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#0058bd] uppercase tracking-wider block">💻 Hackers</span>
                  <span className="text-2xl font-extrabold text-[#191b22]">{hackerCount}</span>
                  <span className="text-[10px] text-[#727785] block">Tech & Web Dev</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0058bd] flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
              </div>

              {/* 2. Hipsters */}
              <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#ba1a1a] uppercase tracking-wider block">🎨 Hipsters</span>
                  <span className="text-2xl font-extrabold text-[#191b22]">{hipsterCount}</span>
                  <span className="text-[10px] text-[#727785] block">UI/UX & Design</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ba1a1a] flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
              </div>

              {/* 3. Hustlers */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#765700] uppercase tracking-wider block">💼 Hustlers</span>
                  <span className="text-2xl font-extrabold text-[#191b22]">{hustlerCount}</span>
                  <span className="text-[10px] text-[#727785] block">Project Leads</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#765700] flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>

              {/* 4. Ready Combinations */}
              <div className="bg-gradient-to-br from-[#0058bd] to-[#004494] text-white p-4 rounded-2xl shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider block">Full Squads</span>
                  <span className="text-2xl font-extrabold text-white">{possibleTeams}</span>
                  <span className="text-[10px] text-white/80 block">1H + 1H + 1H Match</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#fbbc06]" />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: BENTO GRID METRICS ROW (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1 */}
            <div className="bg-[#f2f3fd] rounded-2xl p-5 flex flex-col justify-between shadow-sm border border-[#c2c6d5]/30 hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#0058bd]/5 rounded-full transition-transform group-hover:scale-150"></div>
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Total Active Teams</span>
                <span className="material-symbols-outlined text-[#0058bd] text-[20px]">groups</span>
              </div>
              <div className="flex items-end gap-2 my-2 z-10">
                <span className="text-3xl font-extrabold text-[#191b22]">{activeTeamsCount}</span>
                <span className="text-xs text-[#006e2c] font-bold mb-1 flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +3
                </span>
              </div>
              <div className="w-full h-1 bg-[#e1e2eb] rounded-full z-10">
                <div className="h-full bg-[#0058bd] rounded-full" style={{ width: `${Math.min(activeTeamsCount * 15, 100)}%` }}></div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#f2f3fd] rounded-2xl p-5 flex flex-col justify-between shadow-sm border border-[#c2c6d5]/30 hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#006e2c]/5 rounded-full transition-transform group-hover:scale-150"></div>
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Registered Members</span>
                <span className="material-symbols-outlined text-[#006e2c] text-[20px]">person_add</span>
              </div>
              <div className="flex items-end gap-2 my-2 z-10">
                <span className="text-3xl font-extrabold text-[#191b22]">{registeredMembersCount}</span>
                <span className="text-xs text-[#006e2c] font-bold mb-1 flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +12%
                </span>
              </div>
              <div className="w-full h-1 bg-[#e1e2eb] rounded-full z-10">
                <div className="h-full bg-[#006e2c] rounded-full" style={{ width: `${Math.min(registeredMembersCount * 10, 100)}%` }}></div>
              </div>
            </div>

            {/* Metric 3 (Pending Approvals) */}
            <div className="bg-[#0058bd] text-white rounded-2xl p-5 flex flex-col justify-between shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full transition-transform group-hover:scale-150"></div>
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Pending Approvals</span>
                <span className="material-symbols-outlined text-white text-[20px]">pending_actions</span>
              </div>
              <div className="flex items-end gap-2 my-2 z-10">
                <span className="text-3xl font-extrabold text-white">{pendingApprovalTeams.length}</span>
                <span className="text-xs text-white/80 font-bold mb-1">Requires WA Link</span>
              </div>
              <div className="w-full h-1 bg-white/20 rounded-full z-10">
                <div className="h-full bg-white rounded-full animate-pulse" style={{ width: `${Math.min(pendingApprovalTeams.length * 33, 100)}%` }}></div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-[#f2f3fd] rounded-2xl p-5 flex flex-col justify-between shadow-sm border border-[#c2c6d5]/30 hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#765700]/5 rounded-full transition-transform group-hover:scale-150"></div>
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Active Tech Tracks</span>
                <span className="material-symbols-outlined text-[#765700] text-[20px]">rocket_launch</span>
              </div>
              <div className="flex items-end gap-2 my-2 z-10">
                <span className="text-3xl font-extrabold text-[#191b22]">{activeTracksCount} / 5</span>
                <span className="text-xs text-[#727785] font-bold mb-1">Tracks</span>
              </div>
              <div className="w-full h-1 bg-[#e1e2eb] rounded-full z-10">
                <div className="h-full bg-[#765700] rounded-full" style={{ width: `${(activeTracksCount / 5) * 100}%` }}></div>
              </div>
            </div>

          </div>

          {/* SECTION 4: MAIN SPLIT (2/3 TABLE + 1/3 ANALYTICS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT COLUMN: MANAGEMENT TABLE (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Header & View Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#191b22] flex items-center gap-2">
                    {activeTab === 'team-approvals' ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-[#0058bd]" />
                        <span>Team Approvals & WhatsApp Distribution</span>
                      </>
                    ) : activeTab === 'h3-matchmaking' ? (
                      <>
                        <Sparkles className="w-5 h-5 text-[#0058bd]" />
                        <span>H3 Pool & Manual Slot Assignment</span>
                      </>
                    ) : activeTab === 'members-directory' ? (
                      <>
                        <Users className="w-5 h-5 text-[#0058bd]" />
                        <span>Members & Role Directory</span>
                      </>
                    ) : (
                      <>
                        <FolderGit2 className="w-5 h-5 text-[#0058bd]" />
                        <span>Team Creation & Workspaces</span>
                      </>
                    )}
                  </h2>
                  <p className="text-xs text-[#727785]">Strict H3 Uniqueness Enforced • Max 3 Members per Squad</p>
                </div>

                {/* View Switchers */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab('team-approvals')}
                    className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 ${
                      activeTab === 'team-approvals'
                        ? 'bg-[#0058bd] text-white'
                        : 'bg-white border border-[#c2c6d5]/50 text-[#0058bd] hover:bg-[#f2f3fd]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Approvals ({pendingApprovalTeams.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('h3-matchmaking')}
                    className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 ${
                      activeTab === 'h3-matchmaking'
                        ? 'bg-[#0058bd] text-white'
                        : 'bg-white border border-[#c2c6d5]/50 text-[#0058bd] hover:bg-[#f2f3fd]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#fbbc06]" />
                    <span>H3 Pool ({unassignedUsers.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab(activeTab === 'members-directory' ? 'admin-overview' : 'members-directory')}
                    className="px-3 py-1.5 bg-[#f2f3fd] hover:bg-[#e1e2eb] text-[#191b22] font-bold text-xs rounded-xl transition-colors shadow-2xs"
                  >
                    {activeTab === 'members-directory' ? 'View Teams' : 'View Members'}
                  </button>
                </div>
              </div>

              {/* TABLE CARD */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-[#c2c6d5]/30">
                <div className="overflow-x-auto">
                  
                  {/* VIEW 1: TEAM APPROVALS TABLE */}
                  {activeTab === 'team-approvals' ? (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f2f3fd] border-b border-[#c2c6d5]/30 text-[#727785] uppercase text-[10px] font-bold tracking-wider">
                          <th className="p-3.5">Team Name</th>
                          <th className="p-3.5">H3 Squad Members</th>
                          <th className="p-3.5">Approval Status</th>
                          <th className="p-3.5">WhatsApp Group</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c2c6d5]/20 text-[#191b22]">
                        {filteredTeams.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-[#727785]">
                              Belum ada data tim yang terdaftar.
                            </td>
                          </tr>
                        ) : (
                          filteredTeams.map((team) => (
                            <tr key={team.id} className="hover:bg-[#f9f9ff] transition-colors">
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5">
                                  <UserAvatar name={team.name} size="sm" />
                                  <div>
                                    <span className="font-bold block text-[#191b22]">{team.name}</span>
                                    <span className="font-mono text-[10px] text-[#0058bd]">{team.invite_code}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {team.members?.map((m) => (
                                    <span 
                                      key={m.id}
                                      className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                                        m.h3_role === 'Hustler' ? 'bg-[#ffdea0] text-[#765700]' :
                                        m.h3_role === 'Hipster' ? 'bg-[#ffdad6] text-[#ba1a1a]' :
                                        'bg-[#d8e2ff] text-[#0058bd]'
                                      }`}
                                    >
                                      {m.h3_role === 'Hustler' && '💼 '}
                                      {m.h3_role === 'Hipster' && '🎨 '}
                                      {m.h3_role === 'Hacker' && '💻 '}
                                      {m.name.split(' ')[0]}
                                    </span>
                                  ))}
                                  {(team.members?.length || 0) < 3 && (
                                    <span className="text-[9px] text-[#727785] italic">
                                      +{3 - (team.members?.length || 0)} slot kosong
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-3.5">
                                {team.status === 'approved' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#e6f4ea] text-[#137333] border border-[#137333]/20">
                                    Approved
                                  </span>
                                ) : team.status === 'rejected' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ffdea0] text-[#765700] border border-[#765700]/20 animate-pulse">
                                    Pending Approval
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5 font-mono text-[11px]">
                                {team.whatsapp_group_url ? (
                                  <a 
                                    href={team.whatsapp_group_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#006e2c] font-bold hover:underline flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Tautan Aktif</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-[#727785] italic">Belum ada link</span>
                                )}
                              </td>

                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setReviewTeam(team);
                                      setWhatsappInput(team.whatsapp_group_url || '');
                                    }}
                                    className="px-3 py-1 bg-[#0058bd] hover:bg-[#2771df] text-white font-bold rounded-lg text-[10px] transition-colors shadow-2xs"
                                  >
                                    Review & WA Link
                                  </button>
                                  <button
                                    onClick={() => handleDisbandTeamAdmin(team)}
                                    className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                                    title="Disband Team"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : activeTab === 'h3-matchmaking' ? (

                    /* VIEW 2: H3 MATCHMAKING & MANUAL SLOT ASSIGNMENT TABLE */
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f2f3fd] border-b border-[#c2c6d5]/30 text-[#727785] uppercase text-[10px] font-bold tracking-wider">
                          <th className="p-3.5">Student / Member</th>
                          <th className="p-3.5">H3 Role</th>
                          <th className="p-3.5">Queue Status</th>
                          <th className="p-3.5">Manual Slot Assignment (Strict Role Guard)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c2c6d5]/20 text-[#191b22]">
                        {unassignedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-[#727785]">
                              <div className="flex flex-col items-center gap-2">
                                <Check className="w-8 h-8 text-[#006e2c]" />
                                <span className="font-bold text-sm text-[#191b22]">Semua anggota telah memiliki tim!</span>
                                <span className="text-xs">Tidak ada anggota yang menunggu di pool matchmaking saat ini.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          unassignedUsers.map((u) => {
                            // Filter available teams where user's role is NOT occupied
                            const availableTeamsForUser = teams.filter((t) => {
                              const notFull = (t.members?.length || 0) < 3;
                              const roleVacant = !t.members?.some((m) => m.h3_role === u.h3_role);
                              return notFull && roleVacant;
                            });

                            return (
                              <tr key={u.id} className="hover:bg-[#f9f9ff] transition-colors">
                                <td className="p-3.5 flex items-center gap-2.5">
                                  <UserAvatar name={u.name} size="sm" />
                                  <div>
                                    <span className="font-bold block text-[#191b22]">{u.name}</span>
                                    <span className="text-[10px] text-[#727785] font-mono">{u.email}</span>
                                  </div>
                                </td>
                                
                                <td className="p-3.5">
                                  {u.h3_role === 'Hacker' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#d8e2ff] text-[#0058bd] border border-blue-200">
                                      <Laptop className="w-3.5 h-3.5" /> 💻 Hacker
                                    </span>
                                  )}
                                  {u.h3_role === 'Hipster' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a] border border-rose-200">
                                      <Palette className="w-3.5 h-3.5" /> 🎨 Hipster
                                    </span>
                                  )}
                                  {u.h3_role === 'Hustler' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ffdea0] text-[#765700] border border-amber-200">
                                      <Briefcase className="w-3.5 h-3.5" /> 💼 Hustler
                                    </span>
                                  )}
                                  {!u.h3_role && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#e1e2eb] text-[#727785]">
                                      Belum Memilih
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5">
                                  {u.matchmaking_status === 'waiting' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f0fe] text-[#0058bd] border border-[#0058bd]/20 flex items-center gap-1 w-max">
                                      <Radio className="w-3 h-3 animate-pulse" /> In Queue
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-[#727785] bg-[#f2f3fd]">
                                      Idle
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5">
                                  {!u.h3_role ? (
                                    <span className="text-[11px] text-[#727785] italic">Perlu role H3 sebelum di-plot</span>
                                  ) : (
                                    <select
                                      defaultValue=""
                                      onChange={(e) => handleManualAssign(u.id, e.target.value)}
                                      className="w-full max-w-xs px-2.5 py-1.5 bg-[#f9f9ff] border border-[#c2c6d5]/50 rounded-xl text-[11px] font-semibold text-[#191b22] focus:border-[#0058bd] outline-none"
                                    >
                                      <option value="" disabled>
                                        ➕ Insert into Vacant {u.h3_role} Slot ({availableTeamsForUser.length} Tim)...
                                      </option>
                                      {availableTeamsForUser.map((team) => (
                                        <option key={team.id} value={team.id}>
                                          {team.name} ({team.members?.length || 0}/3 - {u.h3_role} slot vacant)
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  ) : activeTab === 'members-directory' ? (

                    /* VIEW 3: MEMBERS DIRECTORY TABLE */
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f2f3fd] border-b border-[#c2c6d5]/30 text-[#727785] uppercase text-[10px] font-bold tracking-wider">
                          <th className="p-3.5">Member</th>
                          <th className="p-3.5">Email</th>
                          <th className="p-3.5">H3 Role</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5">Workspace</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c2c6d5]/20 text-[#191b22]">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-[#727785]">
                              Tidak ada anggota yang ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => {
                            const assignedTeam = teams.find((t) => t.id === u.team_id);
                            return (
                              <tr key={u.id} className="hover:bg-[#f9f9ff] transition-colors">
                                <td className="p-3.5 flex items-center gap-2.5">
                                  <UserAvatar name={u.name} size="sm" />
                                  <span className="font-bold text-[#191b22]">{u.name}</span>
                                </td>
                                <td className="p-3.5 text-[#424753] font-mono">{u.email}</td>
                                <td className="p-3.5 font-semibold">
                                  {u.h3_role ? (
                                    <span className="text-[#0058bd] font-bold">{u.h3_role}</span>
                                  ) : (
                                    <span className="text-[#727785] italic">-</span>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    u.role === 'admin' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#e6f4ea] text-[#137333]'
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="p-3.5 font-semibold">
                                  {assignedTeam ? (
                                    <span className="text-[#0058bd]">{assignedTeam.name}</span>
                                  ) : (
                                    <span className="text-[#727785] italic">Unassigned</span>
                                  )}
                                </td>
                                <td className="p-3.5 text-right space-x-1.5">
                                  <button
                                    onClick={() => handlePromoteDemote(u)}
                                    className="px-2.5 py-1 bg-[#f2f3fd] hover:bg-[#e1e2eb] text-[#191b22] font-bold rounded-lg text-[10px] transition-colors"
                                  >
                                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                                  </button>
                                  {u.team_id && (
                                    <button
                                      onClick={() => handleRemoveUserFromTeam(u)}
                                      className="px-2.5 py-1 bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] font-bold rounded-lg text-[10px] transition-colors"
                                    >
                                      Remove Team
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  ) : (

                    /* VIEW 4: TEAMS OVERVIEW TABLE */
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f2f3fd] border-b border-[#c2c6d5]/30 text-[#727785] uppercase text-[10px] font-bold tracking-wider">
                          <th className="p-3.5">Team Name</th>
                          <th className="p-3.5">Leader</th>
                          <th className="p-3.5">Track</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">H3 Slots</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c2c6d5]/20 text-[#191b22]">
                        {filteredTeams.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-[#727785]">
                              Belum ada data tim yang sesuai dengan pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredTeams.map((team) => (
                            <tr key={team.id} className="hover:bg-[#f9f9ff] transition-colors group">
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5">
                                  <UserAvatar name={team.name} size="sm" />
                                  <div>
                                    <span className="font-bold block text-[#191b22]">{team.name}</span>
                                    <span className="font-mono text-[10px] text-[#0058bd]">{team.invite_code}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 font-medium">
                                <span>{team.leader?.name || 'Leader Unassigned'}</span>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${TRACK_BADGES[team.track]?.color || ''}`}>
                                  {TRACK_BADGES[team.track]?.label}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  team.status === 'approved' ? 'bg-[#e6f4ea] text-[#137333]' :
                                  team.status === 'rejected' ? 'bg-[#ffdad6] text-[#ba1a1a]' :
                                  'bg-[#ffdea0] text-[#765700]'
                                }`}>
                                  {team.status === 'approved' ? 'Approved' : team.status === 'rejected' ? 'Rejected' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono">
                                <span className="font-bold text-[#191b22]">{team.members?.length || 0}</span> / 3
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setReviewTeam(team);
                                      setWhatsappInput(team.whatsapp_group_url || '');
                                    }}
                                    className="p-1.5 text-[#0058bd] hover:bg-[#e8f0fe] rounded-lg transition-colors"
                                    title="Review & WA Link"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setInspectTeam(team)}
                                    className="p-1.5 text-[#424753] hover:bg-[#f2f3fd] rounded-lg transition-colors"
                                    title="Inspect Team Roster"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDisbandTeamAdmin(team)}
                                    className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                                    title="Disband Team"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: ANALYTICS & RECENT ACTIVITY (1/3) */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Activity Timeline Card */}
              <div>
                <h2 className="text-lg font-extrabold text-[#191b22] mb-1">Recent Activity</h2>
                <p className="text-xs text-[#727785] mb-3">Live updates across chapter teams</p>
                
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#c2c6d5]/30 flex flex-col gap-4 relative overflow-hidden">
                  
                  {/* Timeline Items */}
                  <div className="relative pl-3 border-l-2 border-[#e1e2eb] space-y-4">
                    
                    {/* Item 1 */}
                    <div className="relative">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 bg-[#0058bd] rounded-full ring-4 ring-white"></div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-[#727785]">Strict H3 Rules</span>
                        <span className="text-xs font-bold text-[#191b22]">1-Role Uniqueness Enforced</span>
                        <span className="text-[11px] text-[#424753]">Max 3 members per squad: 1 Hacker + 1 Hipster + 1 Hustler.</span>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="relative">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 bg-[#006e2c] rounded-full ring-4 ring-white"></div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-[#727785]">Official Channel</span>
                        <span className="text-xs font-bold text-[#191b22]">WhatsApp Link Distribution</span>
                        <span className="text-[11px] text-[#424753]">Unlocked on Member Dashboard upon Admin Approval.</span>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="relative">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 bg-[#fbbc06] rounded-full ring-4 ring-white"></div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-[#727785]">Global Event</span>
                        <span className="text-xs font-bold text-[#191b22]">Solution Challenge 2026</span>
                        <span className="text-[11px] text-[#424753]">Registration open for Purwokerto chapter developers.</span>
                      </div>
                    </div>

                  </div>

                  <div className="pt-2 border-t border-[#c2c6d5]/20 flex justify-center">
                    <button 
                      onClick={() => setToastMsg('Chapter activity log is up to date.')}
                      className="text-xs font-bold text-[#0058bd] hover:underline"
                    >
                      Refresh Activity Log
                    </button>
                  </div>
                </div>
              </div>

              {/* Signups Velocity Chart Card */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#c2c6d5]/30 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">
                  Member Activity Velocity (Last 7 Days)
                </span>
                
                <div className="h-24 w-full flex items-end justify-between gap-1.5 pt-2">
                  <div className="w-full bg-[#0058bd]/20 hover:bg-[#0058bd]/40 rounded-t transition-colors" style={{ height: '35%' }}></div>
                  <div className="w-full bg-[#0058bd]/20 hover:bg-[#0058bd]/40 rounded-t transition-colors" style={{ height: '55%' }}></div>
                  <div className="w-full bg-[#0058bd]/20 hover:bg-[#0058bd]/40 rounded-t transition-colors" style={{ height: '40%' }}></div>
                  <div className="w-full bg-[#0058bd]/20 hover:bg-[#0058bd]/40 rounded-t transition-colors" style={{ height: '80%' }}></div>
                  <div className="w-full bg-[#0058bd]/20 hover:bg-[#0058bd]/40 rounded-t transition-colors" style={{ height: '65%' }}></div>
                  <div className="w-full bg-[#0058bd]/20 hover:bg-[#0058bd]/40 rounded-t transition-colors" style={{ height: '90%' }}></div>
                  <div className="w-full bg-[#0058bd] rounded-t transition-colors" style={{ height: '100%' }}></div>
                </div>

                <div className="flex justify-between font-mono text-[10px] text-[#727785] pt-1">
                  <span>Mon</span>
                  <span>Sun</span>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* MODAL: Team Review & Official WhatsApp Link Distribution */}
      {reviewTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in-up border border-[#c2c6d5]/30">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#c2c6d5]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0058bd]/10 text-[#0058bd] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#0058bd]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#191b22]">Review & Approve Team</h3>
                  <p className="text-xs text-[#727785]">Verify 3-Member H3 Composition & Assign WhatsApp Group</p>
                </div>
              </div>
              <button onClick={() => setReviewTeam(null)} className="p-1.5 rounded-full hover:bg-[#f2f3fd] text-[#727785]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Team Details & Roster Summary */}
            <div className="p-4 bg-[#f9f9ff] rounded-2xl border border-[#c2c6d5]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#191b22]">{reviewTeam.name}</span>
                <span className="font-mono text-xs text-[#0058bd] font-bold">Code: {reviewTeam.invite_code}</span>
              </div>
              <p className="text-xs text-[#424753] leading-relaxed">{reviewTeam.description}</p>
              
              <div className="pt-2 border-t border-[#c2c6d5]/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#727785] block mb-1.5">
                  Squad Composition ({reviewTeam.members?.length || 0}/3)
                </span>
                <div className="space-y-1.5">
                  {reviewTeam.members?.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-[#c2c6d5]/20">
                      <span className="font-bold text-[#191b22]">{m.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        m.h3_role === 'Hustler' ? 'bg-[#ffdea0] text-[#765700]' :
                        m.h3_role === 'Hipster' ? 'bg-[#ffdad6] text-[#ba1a1a]' :
                        'bg-[#d8e2ff] text-[#0058bd]'
                      }`}>
                        {m.h3_role || 'Unassigned Role'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp Form */}
            <form onSubmit={handleApproveTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191b22] mb-1.5">
                  Official WhatsApp Group Link *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#006e2c] font-bold text-sm">
                    💬
                  </span>
                  <input
                    type="url"
                    required
                    placeholder="https://chat.whatsapp.com/..."
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-[#c2c6d5]/50 rounded-xl text-xs text-[#191b22] font-mono focus:border-[#006e2c] focus:bg-white outline-none"
                  />
                </div>
                <span className="text-[10px] text-[#727785] mt-1 block">
                  Link ini akan langsung muncul di dashboard anggota setelah tim disetujui.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#c2c6d5]/20 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRejectTeam}
                  className="px-4 py-2.5 bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] rounded-xl text-xs font-bold transition-colors"
                >
                  Reject / Request Changes
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewTeam(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-[#424753] hover:bg-[#f2f3fd] rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={approving}
                    className="px-5 py-2.5 bg-[#006e2c] hover:bg-[#005320] text-white rounded-xl text-xs font-extrabold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{approving ? 'Menyimpan...' : 'Approve & Send WA Link'}</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Roster Inspect Modal */}
      {inspectTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in-up border border-[#c2c6d5]/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#191b22]">{inspectTeam.name} Roster</h3>
                <p className="text-xs text-[#727785] font-mono">Code: {inspectTeam.invite_code} • Track: {inspectTeam.track}</p>
              </div>
              <button onClick={() => setInspectTeam(null)} className="p-1.5 rounded-full hover:bg-[#f2f3fd]">
                <X className="w-5 h-5 text-[#424753]" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {inspectTeam.members?.map((m) => (
                <div key={m.id} className="p-3 bg-[#f9f9ff] rounded-2xl border border-[#c2c6d5]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={m.name} size="sm" />
                    <div>
                      <span className="font-bold text-[#191b22] block">{m.name}</span>
                      <span className="text-[10px] text-[#727785] font-mono">{m.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.h3_role && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        m.h3_role === 'Hustler' ? 'bg-[#ffdea0] text-[#765700]' :
                        m.h3_role === 'Hipster' ? 'bg-[#ffdad6] text-[#ba1a1a]' :
                        'bg-[#d8e2ff] text-[#0058bd]'
                      }`}>
                        {m.h3_role}
                      </span>
                    )}
                    {m.id === inspectTeam.leader_id && (
                      <span className="bg-[#ffdea0] text-[#765700] px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Leader
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#c2c6d5]/20 flex items-center justify-between">
              <span className="text-xs text-[#727785]">Total: {inspectTeam.members?.length || 0} / 3 members</span>
              <button
                onClick={() => setInspectTeam(null)}
                className="px-4 py-2 bg-[#0058bd] text-white rounded-xl text-xs font-bold hover:bg-[#2771df]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
