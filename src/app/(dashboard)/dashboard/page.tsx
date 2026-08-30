'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import * as store from '@/lib/store';
import * as adminSvc from '@/lib/admin-services';
import { User, Team, ProjectTrack, H3Role } from '@/types';
import type { Milestone, ChapterEvent } from '@/types/admin';
import UserAvatar from '@/components/UserAvatar';
import { 
  X, 
  Copy, 
  PlusCircle, 
  Trash2, 
  AlertCircle, 
  UserCheck, 
  Sparkles,
  Menu,
  LogOut,
  Users,
  Key,
  ArrowRight,
  Star,
  Code2,
  Settings,
  Pencil,
  Save,
  Laptop,
  Palette,
  Briefcase,
  Radio,
  Clock,
  Bell,
  Check,
  ExternalLink,
  Calendar,
  MapPin,
  Globe,
  GitBranch,
  Frame,
  Video,
  Mic,
  Flag,
  CheckCircle2
} from 'lucide-react';

const TRACK_BADGES: Record<ProjectTrack, { label: string; color: string; tag: string }> = {
  WEB: { label: 'Web Platform', color: 'bg-[#d8e2ff] text-[#0058bd] border-[#0058bd]/30', tag: '#WebDev' },
  MOBILE: { label: 'Mobile App', color: 'bg-[#86f898]/30 text-[#00722f] border-[#00722f]/30', tag: '#Mobile' },
  AI_ML: { label: 'AI / Machine Learning', color: 'bg-[#ffdea0] text-[#765700] border-[#765700]/30', tag: '#AIML' },
  CLOUD: { label: 'Cloud Infrastructure', color: 'bg-[#e1e2eb] text-[#191b22] border-[#727785]/30', tag: '#Cloud' },
  UI_UX: { label: 'UI/UX Design', color: 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/30', tag: '#UIUX' },
};

type ActiveTab = 'dashboard-overview' | 'my-teams' | 'explore-projects' | 'events-hackathons' | 'dashboard-settings';

export default function UserDashboard() {
  const router = useRouter();
  const { profile: currentUser, loading: authLoading, logout, refreshProfile } = useAuth();

  const [allTeams, setAllTeams] = useState<(Team & { members: User[]; leader?: User })[]>([]);
  const [userTeam, setUserTeam] = useState<(Team & { members: User[]; leader?: User }) | null>(null);
  
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard-overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Create Team Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTrack, setNewTrack] = useState<ProjectTrack>('WEB');
  const [newDescription, setNewDescription] = useState('');
  const [createLeaderRole, setCreateLeaderRole] = useState<H3Role>('Hustler');
  
  // Join Team Form state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinUserRole, setJoinUserRole] = useState<H3Role>('Hacker');
  
  // Feedback & Copy states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // User Settings states matching the provided template
  const [settingName, setSettingName] = useState(() => currentUser?.name || '');
  const [settingPhone, setSettingPhone] = useState(() => currentUser?.student_id || '+62 812-3456-7890');
  const [settingUniversity, setSettingUniversity] = useState('Telkom University Purwokerto');
  const [settingMajor, setSettingMajor] = useState('Informatics');
  const [settingH3Role, setSettingH3Role] = useState<H3Role>(() => currentUser?.h3_role || 'Hacker');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Edit Team state
  const [editingTeam, setEditingTeam] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [teamSaving, setTeamSaving] = useState(false);

  // H3 Matchmaking states
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false);
  const [selectedH3Role, setSelectedH3Role] = useState<H3Role>('Hacker');
  const [matchmakingSubmitting, setMatchmakingSubmitting] = useState(false);

  // Milestones & Chapter Events state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [chapterEvents, setChapterEvents] = useState<ChapterEvent[]>([]);

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    const [teams, team, activeMilestones, liveEvents] = await Promise.all([
      store.getAllTeams(),
      store.getUserTeam(currentUser.id),
      adminSvc.getActiveMilestones(),
      adminSvc.getPublishedEvents(),
    ]);
    setAllTeams(teams);
    setUserTeam(team);
    setMilestones(activeMilestones);
    setChapterEvents(liveEvents);
    await refreshProfile();
  }, [currentUser, refreshProfile]);

  useEffect(() => {
    let isSubscribed = true;
    async function loadInitialData() {
      if (!currentUser) return;
      if (currentUser.role === 'admin') {
        router.replace('/admin');
        return;
      }
      const [teams, team, activeMilestones, liveEvents] = await Promise.all([
        store.getAllTeams(),
        store.getUserTeam(currentUser.id),
        adminSvc.getActiveMilestones(),
        adminSvc.getPublishedEvents(),
      ]);
      if (isSubscribed) {
        setAllTeams(teams);
        setUserTeam(team);
        setMilestones(activeMilestones);
        setChapterEvents(liveEvents);
        setSettingName(currentUser.name || '');
        if (currentUser.student_id) setSettingPhone(currentUser.student_id);
        if (currentUser.h3_role) setSettingH3Role(currentUser.h3_role);
      }
    }
    loadInitialData();
    return () => {
      isSubscribed = false;
    };
  }, [currentUser, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await store.createTeam({
      name: newTitle,
      description: newDescription,
      track: newTrack,
      leaderId: currentUser.id,
      leaderH3Role: createLeaderRole,
    });

    if (res.success) {
      setSuccessMsg(`Team "${newTitle}" berhasil dibuat! Status menunggu verifikasi Admin GDG.`);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      await refreshData();
    } else {
      setErrorMsg(res.error || 'Gagal membuat tim.');
    }
  };

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !joinCodeInput) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const roleToUse = currentUser.h3_role || joinUserRole;
    const res = await store.joinTeam(joinCodeInput, currentUser.id, roleToUse);

    if (res.success) {
      setSuccessMsg(`Berhasil bergabung ke tim "${res.team?.name}" sebagai ${roleToUse}!`);
      setJoinCodeInput('');
      await refreshData();
    } else {
      setErrorMsg(res.error || 'Gagal bergabung ke tim.');
    }
  };

  const handleJoinMatchmakingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setMatchmakingSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await store.joinMatchmaking(currentUser.id, selectedH3Role);
    setMatchmakingSubmitting(false);

    if (res.success) {
      setShowMatchmakingModal(false);
      setSuccessMsg(`Kamu telah masuk antrian matchmaking sebagai ${selectedH3Role}! Tim Web Development akan segera di-plot oleh sistem/admin.`);
      await refreshProfile();
      await refreshData();
    } else {
      setErrorMsg(res.error || 'Gagal masuk antrian matchmaking.');
    }
  };

  const handleCancelMatchmaking = async () => {
    if (!currentUser) return;
    if (confirm('Yakin ingin membatalkan antrian matchmaking?')) {
      setErrorMsg(null);
      const res = await store.cancelMatchmaking(currentUser.id);
      if (res.success) {
        setSuccessMsg('Antrian matchmaking dibatalkan. Kamu sekarang bisa membuat atau bergabung ke tim manual.');
        await refreshProfile();
        await refreshData();
      } else {
        setErrorMsg(res.error || 'Gagal membatalkan antrian.');
      }
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentUser) return;
    if (confirm('Apakah Anda yakin ingin keluar dari tim?')) {
      const res = await store.leaveTeam(currentUser.id);
      if (res.success) {
        setSuccessMsg('Anda telah keluar dari tim.');
        await refreshData();
      } else {
        setErrorMsg(res.error || 'Gagal keluar dari tim.');
      }
    }
  };

  const handleDisbandTeam = async () => {
    if (!userTeam) return;
    if (confirm(`Yakin ingin membubarkan "${userTeam.name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      const res = await store.disbandTeam(userTeam.id);
      if (res.success) {
        setSuccessMsg('Tim telah dibubarkan.');
        setShowSettingsModal(false);
        await refreshData();
      } else {
        setErrorMsg(res.error || 'Gagal membubarkan tim.');
      }
    }
  };

  const handleCopyInviteCode = () => {
    if (!userTeam) return;
    navigator.clipboard.writeText(userTeam.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-md font-product">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-on-surface-variant font-semibold">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (currentUser?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4 font-product">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0058bd]/30 border-t-[#0058bd] rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#424753]">Mengalihkan ke Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-md font-product">
        <div className="max-w-md w-full bg-surface-container-lowest p-lg rounded-[28px] border border-outline-variant/30 text-center space-y-md shadow-xl animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <div className="space-y-1">
            <h2 className="font-headline-lg text-on-surface">Akses Diperlukan</h2>
            <p className="text-body-md text-on-surface-variant">
              Anda belum masuk. Silakan login terlebih dahulu untuk mengakses Dashboard & Workspace GDG Telkom.
            </p>
          </div>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-xs w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
          >
            <span>Masuk ke Akun Anda</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  const isLeader = userTeam?.leader_id === currentUser.id;

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-background flex flex-col">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white z-50 flex flex-col border-r border-[#c2c6d5]/30 shadow-xs transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Brand Logo Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#c2c6d5]/20 bg-white">
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
                Member Hub
              </span>
            </div>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 text-[#727785] hover:bg-[#f2f3fd] rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
          <div>
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#727785] mb-1.5">
              Main Menu
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('dashboard-overview'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard-overview'
                    ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                    : 'text-[#424753] hover:bg-[#f2f3fd] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  <span className="text-xs">Overview</span>
                </div>
                {activeTab === 'dashboard-overview' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </button>

              <button
                onClick={() => { setActiveTab('my-teams'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'my-teams'
                    ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                    : 'text-[#424753] hover:bg-[#f2f3fd] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                  <span className="text-xs">My Team</span>
                </div>
                {userTeam && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                    activeTab === 'my-teams' ? 'bg-white/20 text-white' : 'bg-[#e6f4ea] text-[#137333]'
                  }`}>
                    ACTIVE
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('explore-projects'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'explore-projects'
                    ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                    : 'text-[#424753] hover:bg-[#f2f3fd] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">search_insights</span>
                  <span className="text-xs">Explore Projects</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#727785] mb-1.5">
              Schedules & Submissions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('events-hackathons'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'events-hackathons'
                    ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                    : 'text-[#424753] hover:bg-[#f2f3fd] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span className="text-xs">Deadlines & Events</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e8f0fe] text-[#0058bd]">
                  Live
                </span>
              </button>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#727785] mb-1.5">
              Account & Settings
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('dashboard-settings'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard-settings'
                    ? 'bg-[#0058bd] text-white font-bold shadow-sm'
                    : 'text-[#424753] hover:bg-[#f2f3fd] font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span className="text-xs">Settings</span>
              </button>

              {(currentUser?.role as string) === 'admin' && (
                <div className="pt-2 space-y-1">
                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#ba1a1a] bg-[#ffdad6]/40 hover:bg-[#ffdad6] font-bold text-xs transition-all border border-[#ba1a1a]/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                      <span>Admin Overview</span>
                    </div>
                    <span className="text-[9px] bg-[#ba1a1a] text-white px-1.5 py-0.5 rounded-full uppercase">Admin</span>
                  </Link>

                  <Link
                    href="/admin/events-milestones"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#0058bd] bg-[#e8f0fe]/60 hover:bg-[#e8f0fe] font-bold text-xs transition-all border border-[#0058bd]/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                      <span>Deadlines & Event Panel</span>
                    </div>
                    <span className="text-[9px] bg-[#0058bd] text-white px-1.5 py-0.5 rounded-full font-bold">MANAGE</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="p-3 border-t border-[#c2c6d5]/20 space-y-1 bg-[#f9f9ff]">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#424753] hover:text-[#0058bd] transition-colors rounded-xl hover:bg-[#f2f3fd]"
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

      {/* Main Layout Container with Sidebar Offset */}
      <div className="lg:pl-64 min-h-screen flex flex-col bg-[#f9f9ff]">
        
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-40 px-4 md:px-8 flex items-center justify-between border-b border-[#c2c6d5]/20">
          
          {/* Mobile Sidebar Toggle Button */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-[#424753] hover:bg-[#f2f3fd] rounded-xl transition-colors mr-2"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#727785] text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, events, teams..."
                className="w-full pl-9 pr-10 py-1.5 bg-[#f2f3fd] rounded-full border border-transparent focus:border-[#0058bd] focus:bg-white transition-all text-xs text-[#191b22] outline-none"
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
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#c2c6d5]/30 p-3 z-50 animate-fade-in-up">
                  <div className="flex items-center justify-between pb-2 border-b border-[#c2c6d5]/20 mb-2">
                    <span className="text-xs font-bold text-[#191b22]">Notifications</span>
                    <span className="text-[9px] bg-[#0058bd]/10 text-[#0058bd] px-2 py-0.5 rounded-full font-bold">2 NEW</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 bg-[#f9f9ff] rounded-xl">
                      <div className="font-bold text-[#191b22]">Google Solution Challenge 2026</div>
                      <div className="text-[#424753] text-[11px] mt-0.5">Registration is officially open for Telkom University teams.</div>
                    </div>
                    <div className="p-2 bg-[#f9f9ff] rounded-xl">
                      <div className="font-bold text-[#191b22]">Team Workspace Status</div>
                      <div className="text-[#424753] text-[11px] mt-0.5">
                        {userTeam ? `Your team ${userTeam.name} has ${userTeam.members.length} active members.` : 'You are currently unassigned to any team.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge & Logout Button */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#c2c6d5]/30">
              <div className="text-right hidden sm:block">
                <div className="font-bold text-[#191b22] text-xs leading-tight">
                  {currentUser.name}
                </div>
                <div className={`px-1.5 py-0.2 rounded-full text-[8px] font-extrabold uppercase inline-block mt-0.5 ${
                  (currentUser.role as string) === 'admin' 
                    ? 'bg-[#ffdad6] text-[#ba1a1a]' 
                    : 'bg-[#e8f0fe] text-[#0058bd]'
                }`}>
                  {currentUser.role}
                </div>
              </div>
              
              <div className="relative">
                <UserAvatar name={currentUser.name} size="sm" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#006e2c] rounded-full ring-2 ring-white"></span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#ffdad6]/40 hover:bg-[#ffdad6] text-[#ba1a1a] transition-all text-xs font-bold border border-[#ba1a1a]/20 cursor-pointer ml-1 shadow-2xs"
                title="Keluar dari akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

          </div>
        </header>

        {/* Main Dashboard Body Container */}
        <main className="flex-1 pt-20 pb-12 px-4 md:px-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Toast Alert Feedback */}
          {errorMsg && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in-up shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="font-bold text-[#93000a]">×</button>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#e6f4ea] border border-[#137333]/30 text-[#137333] p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in-up shadow-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#137333] shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="font-bold text-[#137333]">×</button>
            </div>
          )}

          {/* SECTION 1: WELCOME & QUICK STATS HERO */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Welcome Banner Card */}
            <div className="lg:col-span-8 bg-white rounded-[24px] p-6 relative overflow-hidden border border-[#c2c6d5]/30 shadow-xs flex flex-col justify-between">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#0058bd]/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2f3fd] text-[10px] font-bold text-[#0058bd] border border-[#0058bd]/20">
                  <Sparkles className="w-3 h-3 text-[#fbbc06]" />
                  <span>GDG TELKOM MEMBER HUB</span>
                </div>
                <h1 className="text-2xl md:text-3xl text-[#191b22] font-extrabold tracking-tight">
                  Welcome back, {currentUser.name}!
                </h1>
                <p className="text-xs md:text-sm text-[#424753] max-w-xl leading-relaxed">
                  Ready to innovate? Work with your project team or discover ongoing Google Solution Challenge initiatives.
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-4 mt-5 pt-4 border-t border-[#c2c6d5]/20 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006e2c] text-[18px]">verified</span>
                  <span className="text-xs font-bold text-[#191b22]">3 ACTIVE PROJECTS</span>
                </div>
                <div className="flex items-center gap-2 pl-4 border-l border-[#c2c6d5]/30">
                  <span className="material-symbols-outlined text-[#fbbc06] text-[18px]">star</span>
                  <span className="text-xs font-bold text-[#191b22]">SOLUTION CHALLENGE 2026</span>
                </div>
              </div>
            </div>

            {/* Quick Action Card: Create Team */}
            <div className="lg:col-span-4 bg-gradient-to-br from-[#0058bd] to-[#004494] text-white rounded-[24px] p-6 flex flex-col justify-between shadow-md shadow-[#0058bd]/15 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-full text-white">Quick Action</span>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="my-3">
                <h3 className="text-lg font-bold">Start New Project Team</h3>
                <p className="text-xs text-white/80 mt-1">Form a new team as Team Leader for GDG Purwokerto challenges.</p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-2.5 bg-white text-[#0058bd] rounded-xl font-bold text-xs hover:bg-[#f2f3fd] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Create Team Form</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </section>


          {/* SECTION 2: MAIN TAB SWITCHER CONTENT */}
          {activeTab === 'dashboard-overview' || activeTab === 'my-teams' ? (
            <div className="space-y-6">
              
              {/* STATE A: Unassigned Member View (Team Onboarding Hub) */}
              {!userTeam ? (
                <section className="space-y-6 animate-fade-in-up">
                  
                  {/* If in Matchmaking Queue, show Queue Status Card */}
                  {currentUser.matchmaking_status === 'waiting' ? (
                    <div className="max-w-3xl mx-auto bg-white rounded-[28px] p-6 md:p-8 border-2 border-[#0058bd]/30 shadow-md relative overflow-hidden space-y-6">
                      <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#0058bd]/5 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#c2c6d5]/30">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-[#0058bd] text-white flex items-center justify-center shadow-md">
                              <Radio className="w-6 h-6 animate-pulse" />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2c] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#006e2c] border-2 border-white"></span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-[#0058bd] uppercase tracking-wider block">
                              Active Matchmaking Queue • Web Track
                            </span>
                            <h3 className="text-xl font-extrabold text-[#191b22]">Menunggu Plotting Tim H3</h3>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f2f3fd] border border-[#0058bd]/20 text-xs font-bold text-[#0058bd]">
                          <Clock className="w-4 h-4 animate-spin text-[#0058bd]" />
                          <span>Status: In Queue</span>
                        </div>
                      </div>

                      {/* Selected Role Card */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#c2c6d5]/40 flex flex-col justify-between space-y-2">
                          <span className="text-[10px] font-bold text-[#727785] uppercase">Peran Pilihan Anda</span>
                          <div className="flex items-center gap-2">
                            {currentUser.h3_role === 'Hacker' && <Laptop className="w-5 h-5 text-[#0058bd]" />}
                            {currentUser.h3_role === 'Hipster' && <Palette className="w-5 h-5 text-[#ba1a1a]" />}
                            {currentUser.h3_role === 'Hustler' && <Briefcase className="w-5 h-5 text-[#765700]" />}
                            <span className="text-base font-extrabold text-[#191b22]">{currentUser.h3_role || 'Hacker'}</span>
                          </div>
                          <span className="text-[11px] text-[#424753]">
                            {currentUser.h3_role === 'Hacker' && 'Fokus Tech & Web Development'}
                            {currentUser.h3_role === 'Hipster' && 'Fokus UI/UX & Product Design'}
                            {currentUser.h3_role === 'Hustler' && 'Fokus Project Lead & Strategy'}
                          </span>
                        </div>

                        <div className="md:col-span-2 p-4 rounded-2xl bg-[#f2f3fd] border border-[#0058bd]/20 flex flex-col justify-between space-y-1">
                          <span className="text-[10px] font-bold text-[#0058bd] uppercase">Aturan Auto-Grouping H3</span>
                          <p className="text-xs text-[#191b22] leading-relaxed">
                            Admin GDG akan melakukan <em>batch auto-grouping</em> dengan komposisi ideal: <strong className="text-[#0058bd]">1 Hustler + 1 Hipster + 1-2 Hackers</strong> untuk membangun proyek Web Development.
                          </p>
                        </div>
                      </div>

                      {/* Queue Actions */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs text-[#727785]">
                          Ingin bergabung dengan teman atau membuat tim sendiri?
                        </p>
                        <button
                          onClick={handleCancelMatchmaking}
                          className="px-4 py-2 bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          Batalkan Antrian & Gabung Manual
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-1.5 pt-2">
                        <div className="w-11 h-11 rounded-2xl bg-[#0058bd]/10 text-[#0058bd] flex items-center justify-center mb-1">
                          <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-[#191b22]">Team Onboarding Hub</h2>
                        <p className="text-xs text-[#424753] flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-[#ba1a1a]">warning</span>
                          <span>GDG Rule: Every member can only belong to 1 active team workspace.</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto pt-2">
                        
                        {/* Card 1: Create Team */}
                        <div className="bg-white p-6 rounded-[24px] border border-[#c2c6d5]/30 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded-2xl bg-[#0058bd]/10 text-[#0058bd] flex items-center justify-center">
                              <PlusCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-[#191b22]">Option 1: Create a Team</h3>
                            <p className="text-xs text-[#424753] leading-relaxed">
                              Start a new project team as the <strong className="text-[#0058bd] font-bold">Team Leader</strong>. You will get an invite code to recruit up to 4 members.
                            </p>
                          </div>

                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full py-2.5 bg-[#0058bd] text-white rounded-xl font-bold text-xs hover:bg-[#2771df] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Create Team Now</span>
                          </button>
                        </div>

                        {/* Card 2: Join Team with Code */}
                        <div className="bg-white p-6 rounded-[24px] border border-[#c2c6d5]/30 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded-2xl bg-[#006e2c]/10 text-[#006e2c] flex items-center justify-center">
                              <Key className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-[#191b22]">Option 2: Join with Code</h3>
                            <p className="text-xs text-[#424753] leading-relaxed">
                              Have an invite code from your team leader? Enter the code below to join their workspace.
                            </p>
                          </div>

                          <form onSubmit={handleJoinTeamSubmit} className="space-y-3">
                            {!currentUser.h3_role && (
                              <div>
                                <label className="block text-[10px] font-bold text-[#727785] uppercase mb-1">
                                  Your H3 Role in this Squad
                                </label>
                                <select
                                  value={joinUserRole}
                                  onChange={(e) => setJoinUserRole(e.target.value as H3Role)}
                                  className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#c2c6d5]/40 rounded-xl text-xs font-bold text-[#191b22] focus:ring-2 focus:ring-[#0058bd] outline-none"
                                >
                                  <option value="Hacker">💻 Hacker (Tech / Web Dev)</option>
                                  <option value="Hipster">🎨 Hipster (UI/UX & Design)</option>
                                  <option value="Hustler">💼 Hustler (Project Lead / Strategy)</option>
                                </select>
                              </div>
                            )}

                            <div>
                              <input
                                type="text"
                                maxLength={8}
                                required
                                value={joinCodeInput}
                                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                                placeholder="e.g. GDG-7X9K"
                                className="w-full px-4 py-2.5 bg-[#f9f9ff] border border-[#c2c6d5]/40 rounded-xl font-mono text-center uppercase tracking-widest text-[#0058bd] font-bold text-sm focus:ring-2 focus:ring-[#0058bd] outline-none"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full py-2.5 bg-[#006e2c] text-white rounded-xl font-bold text-xs hover:bg-[#00722f] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Key className="w-4 h-4" />
                              <span>Join Workspace</span>
                            </button>
                          </form>
                        </div>

                        {/* Card 3: Need a Team? Get Plotted */}
                        <div className="bg-gradient-to-b from-[#f2f3fd] to-white p-6 rounded-[24px] border-2 border-[#0058bd]/30 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-0.5 bg-[#0058bd] text-white text-[9px] font-extrabold uppercase rounded-full tracking-wider">
                              H3 Matching
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded-2xl bg-[#fbbc06]/20 text-[#765700] flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-[#0058bd]" />
                            </div>
                            <h3 className="text-base font-bold text-[#191b22]">Option 3: Need a Team? Get Plotted</h3>
                            <p className="text-xs text-[#424753] leading-relaxed">
                              Belum punya tim? Pilih peranmu (<strong className="text-[#0058bd]">Hacker</strong>, <strong className="text-[#ba1a1a]">Hipster</strong>, atau <strong className="text-[#765700]">Hustler</strong>) dan biarkan sistem mem-plot tim Web Dev seimbang.
                            </p>
                          </div>

                          <button
                            onClick={() => setShowMatchmakingModal(true)}
                            className="w-full py-2.5 bg-gradient-to-r from-[#0058bd] to-[#2771df] text-white rounded-xl font-bold text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Pilih Role & Masuk Antrian</span>
                          </button>
                        </div>

                      </div>
                    </>
                  )}

                </section>
              ) : (
                
                /* STATE B: Active Team View (Workspace Card) */
                <section className="space-y-4 animate-fade-in-up">
                  
                  {/* Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-[#191b22]">My Active Team Workspace</h2>
                      <p className="text-xs text-[#727785]">Web Development Track • 3-Member Squad (1 Hustler + 1 Hipster + 1 Hacker)</p>
                    </div>
                  </div>

                  {/* STATUS BANNER */}
                  {userTeam.status === 'pending_approval' && (
                    <div className="p-4 rounded-2xl bg-[#ffdea0]/35 border border-[#765700]/30 text-[#765700] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#ffdea0] text-[#765700] flex items-center justify-center shrink-0 font-bold text-lg">
                          ⏳
                        </div>
                        <div>
                          <span className="font-extrabold block text-sm text-[#191b22]">Team Under Review</span>
                          <span>Your team is under review by GDG Core Team. WhatsApp link and final confirmation will appear once approved.</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-[#ffdea0] text-[#765700] font-extrabold text-[10px] rounded-full uppercase shrink-0 w-max border border-[#765700]/20">
                        Pending Admin Approval
                      </span>
                    </div>
                  )}

                  {userTeam.status === 'approved' && (
                    <div className="p-4 rounded-2xl bg-[#e6f4ea] border border-[#137333]/30 text-[#137333] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#86f898] text-[#00722f] flex items-center justify-center shrink-0 font-bold text-lg">
                          ✅
                        </div>
                        <div>
                          <span className="font-extrabold block text-sm text-[#191b22]">Team Verified & Approved!</span>
                          <span>Your squad is officially approved for GDG Web Development. Connect with members and organizers below.</span>
                        </div>
                      </div>
                      {userTeam.whatsapp_group_url ? (
                        <a
                          href={userTeam.whatsapp_group_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#006e2c] hover:bg-[#005320] text-white rounded-xl font-extrabold text-xs shadow-md transition-all shrink-0 hover:scale-105"
                        >
                          <span>💬 Join Official WhatsApp Group</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#137333] font-semibold bg-white/70 px-3 py-1.5 rounded-xl">
                          Tautan WA sedang disiapkan oleh admin.
                        </span>
                      )}
                    </div>
                  )}

                  {userTeam.status === 'rejected' && (
                    <div className="p-4 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] flex items-center gap-3 text-xs">
                      <div className="w-10 h-10 rounded-xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 font-bold text-lg">
                        ❌
                      </div>
                      <div>
                        <span className="font-extrabold block text-sm text-[#93000a]">Revisi Diperlukan</span>
                        <span>Tim ini belum disetujui oleh GDG Core Team atau memerlukan penyesuaian data. Hubungi panitia GDG.</span>
                      </div>
                    </div>
                  )}

                  {/* Main Workspace Card Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT WORKSPACE MAIN PANEL (8 Cols) */}
                    <div className="lg:col-span-8 space-y-5">
                      
                      {/* Team Header Box */}
                      <div className="bg-white rounded-[24px] p-6 border border-[#c2c6d5]/30 shadow-xs space-y-4">
                        
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#c2c6d5]/20 flex-wrap">
                          <div className="flex items-center gap-4">
                            <UserAvatar name={userTeam.name} size="xl" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-[#191b22]">{userTeam.name}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${TRACK_BADGES[userTeam.track]?.color || ''}`}>
                                  {TRACK_BADGES[userTeam.track]?.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-[#006e2c] rounded-full animate-pulse"></span>
                                <span className="text-xs text-[#006e2c] font-bold uppercase">Active Team Workspace</span>
                              </div>
                            </div>
                          </div>

                          {/* Invite Code Badge */}
                          <div className="flex items-center gap-2 bg-[#f2f3fd] px-3 py-1.5 rounded-2xl border border-[#c2c6d5]/30">
                            <div className="text-left">
                              <span className="text-[9px] font-bold text-[#727785] uppercase block">INVITE CODE</span>
                              <span className="font-mono text-sm font-extrabold text-[#0058bd]">{userTeam.invite_code}</span>
                            </div>
                            <button
                              onClick={handleCopyInviteCode}
                              className="p-1.5 bg-white hover:bg-[#0058bd] hover:text-white rounded-xl text-[#0058bd] transition-colors cursor-pointer shadow-xs"
                              title="Copy Code"
                            >
                              {copiedCode ? <Check className="w-4 h-4 text-[#006e2c]" /> : <Copy className="w-4 h-4 text-[#0058bd]" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-[#727785] uppercase tracking-wider mb-1">Project Description</div>
                          <p className="text-xs text-[#191b22] leading-relaxed">{userTeam.description}</p>
                        </div>
                      </div>

                      {/* 3 FIXED H3 ROSTER SLOTS */}
                      <div className="bg-white rounded-[24px] p-6 border border-[#c2c6d5]/30 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#191b22] flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#0058bd]" />
                            <span>H3 Team Roster ({userTeam.members?.length || 0} / 3 Slots)</span>
                          </h4>
                          <span className="text-[11px] text-[#0058bd] font-bold">1 Hustler • 1 Hipster • 1 Hacker</span>
                        </div>

                        <div className="space-y-3">
                          {(() => {
                            const hustler = userTeam.members?.find((m) => m.h3_role === 'Hustler');
                            const hipster = userTeam.members?.find((m) => m.h3_role === 'Hipster');
                            const hacker = userTeam.members?.find((m) => m.h3_role === 'Hacker');

                            return (
                              <>
                                {/* Slot 1: Hustler */}
                                {hustler ? (
                                  <div className="flex items-center justify-between p-3.5 bg-[#f9f9ff] hover:bg-[#f2f3fd] rounded-2xl transition-colors border border-amber-200">
                                    <div className="flex items-center gap-3">
                                      <UserAvatar name={hustler.name} size="md" />
                                      <div>
                                        <div className="font-bold text-xs text-[#191b22] flex items-center gap-1.5">
                                          <span>{hustler.name}</span>
                                          {hustler.id === userTeam.leader_id && (
                                            <Star className="w-3.5 h-3.5 text-[#fbbc06] fill-[#fbbc06]" />
                                          )}
                                        </div>
                                        <div className="text-[11px] text-[#727785] font-mono">{hustler.email}</div>
                                      </div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-[#ffdea0] text-[#765700] rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                      <Briefcase className="w-3 h-3" /> 💼 Hustler {hustler.id === userTeam.leader_id && '(Lead)'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-3.5 bg-amber-50/30 rounded-2xl border-2 border-dashed border-amber-200 text-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-amber-100/60 text-[#765700] flex items-center justify-center font-bold">
                                        💼
                                      </div>
                                      <div>
                                        <span className="font-bold text-[#765700] block">Empty - Waiting for Hustler</span>
                                        <span className="text-[10px] text-[#727785]">Project Lead, Strategy & Pitching slot</span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#765700] bg-white px-2 py-0.5 rounded-full border border-amber-200">
                                      Share Code {userTeam.invite_code}
                                    </span>
                                  </div>
                                )}

                                {/* Slot 2: Hipster */}
                                {hipster ? (
                                  <div className="flex items-center justify-between p-3.5 bg-[#f9f9ff] hover:bg-[#f2f3fd] rounded-2xl transition-colors border border-rose-200">
                                    <div className="flex items-center gap-3">
                                      <UserAvatar name={hipster.name} size="md" />
                                      <div>
                                        <div className="font-bold text-xs text-[#191b22] flex items-center gap-1.5">
                                          <span>{hipster.name}</span>
                                          {hipster.id === userTeam.leader_id && (
                                            <Star className="w-3.5 h-3.5 text-[#fbbc06] fill-[#fbbc06]" />
                                          )}
                                        </div>
                                        <div className="text-[11px] text-[#727785] font-mono">{hipster.email}</div>
                                      </div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                      <Palette className="w-3 h-3" /> 🎨 Hipster
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-3.5 bg-rose-50/30 rounded-2xl border-2 border-dashed border-rose-200 text-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-rose-100/60 text-[#ba1a1a] flex items-center justify-center font-bold">
                                        🎨
                                      </div>
                                      <div>
                                        <span className="font-bold text-[#ba1a1a] block">Empty - Waiting for Hipster</span>
                                        <span className="text-[10px] text-[#727785]">UI/UX & Product Design slot</span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#ba1a1a] bg-white px-2 py-0.5 rounded-full border border-rose-200">
                                      Share Code {userTeam.invite_code}
                                    </span>
                                  </div>
                                )}

                                {/* Slot 3: Hacker */}
                                {hacker ? (
                                  <div className="flex items-center justify-between p-3.5 bg-[#f9f9ff] hover:bg-[#f2f3fd] rounded-2xl transition-colors border border-blue-200">
                                    <div className="flex items-center gap-3">
                                      <UserAvatar name={hacker.name} size="md" />
                                      <div>
                                        <div className="font-bold text-xs text-[#191b22] flex items-center gap-1.5">
                                          <span>{hacker.name}</span>
                                          {hacker.id === userTeam.leader_id && (
                                            <Star className="w-3.5 h-3.5 text-[#fbbc06] fill-[#fbbc06]" />
                                          )}
                                        </div>
                                        <div className="text-[11px] text-[#727785] font-mono">{hacker.email}</div>
                                      </div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-[#d8e2ff] text-[#0058bd] rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                      <Laptop className="w-3 h-3" /> 💻 Hacker
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-3.5 bg-blue-50/30 rounded-2xl border-2 border-dashed border-blue-200 text-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-blue-100/60 text-[#0058bd] flex items-center justify-center font-bold">
                                        💻
                                      </div>
                                      <div>
                                        <span className="font-bold text-[#0058bd] block">Empty - Waiting for Hacker</span>
                                        <span className="text-[10px] text-[#727785]">Web Tech & Code Architecture slot</span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#0058bd] bg-white px-2 py-0.5 rounded-full border border-blue-200">
                                      Share Code {userTeam.invite_code}
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                    </div>

                    {/* RIGHT WORKSPACE SIDEBAR PANEL (4 Cols) */}
                    <div className="lg:col-span-4 space-y-5">
                      
                      {/* Capacity Card */}
                      <div className="bg-white rounded-[24px] p-6 border border-[#c2c6d5]/30 shadow-xs space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#727785] block">
                          H3 Roster Capacity Status
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-extrabold text-[#191b22]">
                            {userTeam.members?.length || 0} / 3 Slots
                          </span>
                          <span className="text-xs font-bold text-[#006e2c]">
                            {Math.round(((userTeam.members?.length || 0) / 3) * 100)}% Filled
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-[#f2f3fd] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#006e2c] rounded-full transition-all duration-500"
                            style={{ width: `${((userTeam.members?.length || 0) / 3) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-[#727785]">
                          {3 - (userTeam.members?.length || 0) > 0 
                            ? `Can add ${3 - (userTeam.members?.length || 0)} more role(s) via invite code.` 
                            : 'All 3 H3 squad roles are completely filled.'}
                        </p>
                      </div>

                      {/* Workspace Controls Box */}
                      <div className="bg-white rounded-[24px] p-6 border border-[#c2c6d5]/30 shadow-xs space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#727785] block">
                          Workspace Actions
                        </span>

                        <div className="space-y-2 pt-1">
                          <button
                            onClick={handleCopyInviteCode}
                            className="w-full py-2.5 px-3 bg-[#f2f3fd] hover:bg-[#e1e2eb] text-[#191b22] rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Copy className="w-4 h-4 text-[#0058bd]" />
                              <span>Copy Invite Code</span>
                            </span>
                            <span className="font-mono text-[10px] text-[#0058bd]">{userTeam.invite_code}</span>
                          </button>

                          {isLeader ? (
                            <>
                              <button
                                onClick={() => setShowSettingsModal(true)}
                                className="w-full py-2.5 px-3 bg-[#f2f3fd] hover:bg-[#e1e2eb] text-[#191b22] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Settings className="w-4 h-4 text-[#727785]" />
                                <span>Manage / Edit Team</span>
                              </button>
                              <button
                                onClick={handleDisbandTeam}
                                className="w-full py-2.5 px-3 bg-[#ffdad6]/40 hover:bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-[#ba1a1a]/20"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Disband Team Workspace</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleLeaveTeam}
                              className="w-full py-2.5 px-3 bg-[#ffdad6]/40 hover:bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-[#ba1a1a]/20"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Leave Workspace</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>

                </section>
              )}

            </div>
          ) : activeTab === 'explore-projects' ? (
            
            /* EXPLORE PROJECTS TAB */
            <section className="space-y-md animate-fade-in-up">
              <div>
                <h2 className="font-headline-lg text-2xl font-bold text-on-surface">Explore GDG Projects</h2>
                <p className="text-xs text-on-surface-variant mt-1">Discover solutions built by student developer teams at Telkom University Purwokerto.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {allTeams.map((team) => (
                  <div key={team.id} className="bg-surface-container-lowest p-gutter rounded-[24px] border border-outline-variant/30 shadow-xs hover:shadow-md transition-all space-y-sm flex flex-col justify-between">
                    <div className="space-y-sm">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${TRACK_BADGES[team.track]?.color || ''}`}>
                          {TRACK_BADGES[team.track]?.label}
                        </span>
                        <span className="font-mono text-xs text-primary font-bold">{team.invite_code}</span>
                      </div>

                      <h3 className="font-title-md text-lg font-bold text-on-surface">{team.name}</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{team.description}</p>
                    </div>

                    <div className="pt-sm border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Leader: <strong className="text-on-surface">{team.leader?.name || 'Team Leader'}</strong></span>
                      <span className="font-mono text-[11px]">{team.members.length} / {team.max_members} Members</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          ) : activeTab === 'events-hackathons' ? (

            /* DEADLINES & EVENTS TAB */
            <section className="space-y-6 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#191b22] tracking-tight">
                    Project Deadlines & Chapter Events
                  </h2>
                  <p className="text-xs text-[#727785] mt-1">
                    Stay on track with project milestones, deliverable requirements, and upcoming GDG campus workshops.
                  </p>
                </div>
                {(currentUser?.role as string) === 'admin' && (
                  <Link
                    href="/admin/events-milestones"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0058bd] text-white rounded-xl text-xs font-bold hover:bg-[#2771df] transition-all shadow-sm shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Manage Events & Deadlines (Admin)</span>
                  </Link>
                )}
              </div>

              {/* 1. PROJECT MILESTONES SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-[#0058bd]" />
                    <h3 className="font-bold text-sm text-[#191b22]">Active Submission Milestones</h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#0058bd] bg-[#e8f0fe] px-2.5 py-0.5 rounded-full">
                    {milestones.length} Milestones
                  </span>
                </div>

                {milestones.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-[#c2c6d5]/30 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#f2f3fd] text-[#0058bd] flex items-center justify-center mx-auto">
                      <Flag className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-[#191b22]">No Active Deadlines Right Now</h4>
                    <p className="text-xs text-[#727785] max-w-sm mx-auto">
                      All project deliverables have been submitted or next milestone schedule will be announced soon.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {milestones.map((m) => {
                      const now = Date.now();
                      const due = new Date(m.due_date).getTime();
                      const diffMs = due - now;
                      const isOverdue = diffMs < 0;
                      const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const isClosed = m.status === 'closed';

                      return (
                        <div
                          key={m.id}
                          className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                            isClosed ? 'border-[#c2c6d5]/40 opacity-75' : 'border-[#c2c6d5]/40 hover:shadow-md'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isClosed
                                    ? 'bg-[#f2f3fd] text-[#727785] border-[#c2c6d5]/40'
                                    : 'bg-[#e8f0fe] text-[#0058bd] border-[#0058bd]/30'
                                }`}
                              >
                                {isClosed ? '🔒 Submissions Closed' : '✅ Open for Submissions'}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                                  isOverdue
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : daysLeft <= 3
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>{isOverdue ? 'Overdue' : `Closes in ${daysLeft} days`}</span>
                              </span>
                            </div>

                            <h4 className="font-extrabold text-base text-[#191b22]">{m.title}</h4>
                            {m.description && (
                              <p className="text-xs text-[#727785] leading-relaxed line-clamp-2">{m.description}</p>
                            )}
                          </div>

                          <div className="space-y-2.5 pt-2 border-t border-[#c2c6d5]/20">
                            <div className="flex items-center gap-1.5 text-xs text-[#424753]">
                              <Calendar className="w-3.5 h-3.5 text-[#727785]" />
                              <span>Due Date: <strong>{new Date(m.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                            </div>

                            {/* Required Badges */}
                            <div className="flex flex-wrap gap-1">
                              {m.required_fields?.github_url && (
                                <span className="px-2 py-0.5 bg-[#f2f3fd] text-[#0058bd] rounded-md text-[10px] font-bold flex items-center gap-1 border border-[#0058bd]/20">
                                  <GitBranch className="w-3 h-3" /> GitHub
                                </span>
                              )}
                              {m.required_fields?.figma_url && (
                                <span className="px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded-md text-[10px] font-bold flex items-center gap-1 border border-[#ba1a1a]/20">
                                  <Frame className="w-3 h-3" /> Figma
                                </span>
                              )}
                              {m.required_fields?.live_demo_url && (
                                <span className="px-2 py-0.5 bg-[#e6f4ea] text-[#006e2c] rounded-md text-[10px] font-bold flex items-center gap-1 border border-[#006e2c]/20">
                                  <Globe className="w-3 h-3" /> Live Demo
                                </span>
                              )}
                              {m.required_fields?.video_url && (
                                <span className="px-2 py-0.5 bg-[#ffdea0] text-[#765700] rounded-md text-[10px] font-bold flex items-center gap-1 border border-[#765700]/20">
                                  <Video className="w-3 h-3" /> Demo Video
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. CHAPTER EVENTS SECTION */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#006e2c]" />
                    <h3 className="font-bold text-sm text-[#191b22]">Upcoming Chapter Events & Workshops</h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#006e2c] bg-[#e6f4ea] px-2.5 py-0.5 rounded-full">
                    {chapterEvents.length} Published
                  </span>
                </div>

                {chapterEvents.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-[#c2c6d5]/30 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#e6f4ea] text-[#006e2c] flex items-center justify-center mx-auto">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-[#191b22]">No Upcoming Events Scheduled Yet</h4>
                    <p className="text-xs text-[#727785] max-w-sm mx-auto">
                      Our chapter leads are preparing hands-on tech workshops and study jams. Check back soon!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {chapterEvents.map((ev) => {
                      const categoryColors: Record<string, string> = {
                        Workshop: 'bg-blue-100 text-blue-800 border-blue-200',
                        Hackathon: 'bg-red-100 text-red-800 border-red-200',
                        'Info Session': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        'Study Jam': 'bg-amber-100 text-amber-800 border-amber-200',
                      };
                      const catColor = categoryColors[ev.category] || 'bg-[#e8f0fe] text-[#0058bd]';

                      return (
                        <div
                          key={ev.id}
                          className="bg-white rounded-2xl border border-[#c2c6d5]/40 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          {ev.banner_url && (
                            <div
                              className="w-full h-28 bg-cover bg-center"
                              style={{ backgroundImage: `url(${ev.banner_url})` }}
                            />
                          )}

                          <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${catColor}`}>
                                {ev.category}
                              </span>
                              <h4 className="font-extrabold text-sm text-[#191b22] leading-snug">{ev.title}</h4>
                              <div className="space-y-1 text-xs text-[#727785]">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-[#0058bd] shrink-0" />
                                  <span>{new Date(ev.date_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                  <MapPin className="w-3.5 h-3.5 text-[#006e2c] shrink-0" />
                                  <span className="truncate">{ev.venue_or_link}</span>
                                </div>
                                {ev.speaker_name && (
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Mic className="w-3.5 h-3.5 text-[#765700] shrink-0" />
                                    <span className="truncate font-semibold text-[#424753]">{ev.speaker_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#c2c6d5]/20">
                              {ev.rsvp_url ? (
                                <a
                                  href={ev.rsvp_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#0058bd] text-white rounded-xl text-xs font-bold hover:bg-[#2771df] transition-colors shadow-2xs"
                                >
                                  <span>RSVP Now</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="block text-center py-2 bg-[#f2f3fd] text-[#727785] rounded-xl text-xs font-semibold">
                                  Registration on site
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

          ) : (

            /* SETTINGS TAB */
            <section className="space-y-md animate-fade-in-up max-w-5xl">
              
              {/* Header Title */}
              <div className="flex flex-col space-y-xs pb-sm">
                <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">Profile Settings</h1>
                <p className="font-body-lg text-xs md:text-sm text-on-surface-variant">Manage your personal information and community identity.</p>
              </div>

              <div className="space-y-md">
                
                {/* 1. Main Profile Card */}
                <div className="bg-surface-container rounded-[24px] p-md sm:p-gutter flex flex-col sm:flex-row gap-lg border border-outline-variant/30 shadow-xs">
                  
                  {/* Left Avatar Section */}
                  <div className="relative shrink-0 flex flex-col items-center sm:items-start justify-center gap-2">
                    <UserAvatar name={settingName || currentUser.name} size="2xl" />
                    <span className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider text-center block">
                      Initials Avatar
                    </span>
                  </div>

                  {/* Right Form Fields Section */}
                  <div className="flex-1 space-y-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                      
                      {/* Full Name */}
                      <div className="flex flex-col space-y-base">
                        <label className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          value={settingName}
                          onChange={(e) => setSettingName(e.target.value)}
                          className="bg-surface-container-highest rounded-xl px-sm py-2.5 font-body-lg text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container transition-shadow border border-outline-variant/30"
                          placeholder="Your full name"
                        />
                      </div>

                      {/* Phone Number / NIM */}
                      <div className="flex flex-col space-y-base">
                        <label className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Phone Number / NIM</label>
                        <input
                          type="tel"
                          value={settingPhone}
                          onChange={(e) => setSettingPhone(e.target.value)}
                          className="bg-surface-container-highest rounded-xl px-sm py-2.5 font-body-lg text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container transition-shadow border border-outline-variant/30"
                          placeholder="+62 812-3456-7890"
                        />
                      </div>

                      {/* Email Address (Disabled with Badge) */}
                      <div className="flex flex-col space-y-base sm:col-span-2">
                        <label className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                        <div className="relative flex items-center">
                          <input
                            type="email"
                            disabled
                            value={currentUser.email}
                            className="w-full bg-surface-container-highest/60 rounded-xl pl-sm pr-40 py-2.5 font-body-lg text-xs text-on-surface-variant font-mono cursor-not-allowed border border-outline-variant/20"
                          />
                          <div className="absolute right-2 flex items-center gap-1 bg-[#e6f4ea] text-[#137333] px-2.5 py-1 rounded-full shadow-2xs border border-[#137333]/20">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            <span className="font-label-caps text-[10px] font-bold">Verified Google Account</span>
                          </div>
                        </div>
                      </div>

                      {/* University */}
                      <div className="flex flex-col space-y-base sm:col-span-2">
                        <label className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">University</label>
                        <input
                          type="text"
                          value={settingUniversity}
                          onChange={(e) => setSettingUniversity(e.target.value)}
                          className="bg-surface-container-highest rounded-xl px-sm py-2.5 font-body-lg text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container transition-shadow border border-outline-variant/30"
                        />
                      </div>

                      {/* Study Program */}
                      <div className="flex flex-col space-y-base sm:col-span-2">
                        <label className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Study Program</label>
                        <select
                          value={settingMajor}
                          onChange={(e) => setSettingMajor(e.target.value)}
                          className="bg-surface-container-highest rounded-xl px-sm py-2.5 font-body-lg text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container transition-shadow border border-outline-variant/30 appearance-none cursor-pointer"
                        >
                          <option value="Industrial Engineering">Industrial Engineering</option>
                          <option value="Informatics">Informatics</option>
                          <option value="Information Systems">Information Systems</option>
                          <option value="Software Engineering">Software Engineering</option>
                          <option value="Data Science">Data Science</option>
                        </select>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 2. Community Role (H3) Card */}
                <div className="bg-surface-container rounded-[24px] p-md sm:p-gutter space-y-sm border border-outline-variant/30 shadow-xs">
                  <h3 className="font-title-md text-base font-bold text-on-surface">Community Role</h3>
                  <div>
                    <p className="font-code-sm text-[11px] text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-xl inline-block border border-outline-variant/50 shadow-2xs">
                      Your role determines team composition eligibility (1 Hacker, 1 Hipster, 1 Hustler per team).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-sm pt-xs">
                    
                    {/* Hacker Button */}
                    <button
                      type="button"
                      onClick={() => setSettingH3Role('Hacker')}
                      className={`px-md py-sm rounded-full font-title-md shadow-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer text-xs font-bold ${
                        settingH3Role === 'Hacker'
                          ? 'bg-primary text-on-primary ring-2 ring-primary/40 shadow-md'
                          : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">terminal</span>
                      <span>💻 Hacker</span>
                    </button>

                    {/* Hipster Button */}
                    <button
                      type="button"
                      onClick={() => setSettingH3Role('Hipster')}
                      className={`px-md py-sm rounded-full font-title-md shadow-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer text-xs font-bold ${
                        settingH3Role === 'Hipster'
                          ? 'bg-[#ba1a1a] text-white ring-2 ring-[#ba1a1a]/40 shadow-md'
                          : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">palette</span>
                      <span>🎨 Hipster</span>
                    </button>

                    {/* Hustler Button */}
                    <button
                      type="button"
                      onClick={() => setSettingH3Role('Hustler')}
                      className={`px-md py-sm rounded-full font-title-md shadow-sm flex items-center gap-2 transition-all hover:scale-105 cursor-pointer text-xs font-bold ${
                        settingH3Role === 'Hustler'
                          ? 'bg-[#765700] text-white ring-2 ring-[#765700]/40 shadow-md'
                          : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">trending_up</span>
                      <span>💼 Hustler</span>
                    </button>

                  </div>
                </div>

                {/* 3. Team Workspace Management Card (If member has a team) */}
                {userTeam && (
                  <div className="bg-surface-container rounded-[24px] p-md sm:p-gutter space-y-md border border-outline-variant/30 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-title-md text-base font-bold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">groups</span>
                          <span>My Team Workspace: {userTeam.name}</span>
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          {userTeam.leader_id === currentUser.id ? 'You are the Team Leader' : 'Team Member'}
                        </p>
                      </div>

                      {userTeam.leader_id === currentUser.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeam(!editingTeam);
                            setEditTeamName(userTeam.name);
                            setEditTeamDesc(userTeam.description);
                          }}
                          className="px-3 py-1.5 bg-surface-container-highest hover:bg-surface-variant text-primary font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{editingTeam ? 'Tutup Edit' : 'Edit Info Tim'}</span>
                        </button>
                      )}
                    </div>

                    {editingTeam && userTeam.leader_id === currentUser.id ? (
                      <div className="space-y-sm pt-2 border-t border-outline-variant/20">
                        <div>
                          <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Nama Tim</label>
                          <input
                            type="text"
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="w-full px-sm py-2 bg-surface-container-highest border border-outline-variant/40 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Nama proyek tim"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Deskripsi Proyek</label>
                          <textarea
                            rows={3}
                            value={editTeamDesc}
                            onChange={(e) => setEditTeamDesc(e.target.value)}
                            className="w-full px-sm py-2 bg-surface-container-highest border border-outline-variant/40 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Deskripsi solusi dan sasaran..."
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={teamSaving}
                            onClick={async () => {
                              setTeamSaving(true);
                              const res = await store.updateTeamInfo(userTeam.id, currentUser.id, {
                                name: editTeamName,
                                description: editTeamDesc,
                              });
                              setTeamSaving(false);
                              if (res.success) {
                                setSuccessMsg('Info tim berhasil diperbarui!');
                                setEditingTeam(false);
                                await refreshData();
                              } else {
                                setErrorMsg(res.error || 'Gagal memperbarui info tim.');
                              }
                            }}
                            className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{teamSaving ? 'Menyimpan...' : 'Simpan Info Tim'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm text-xs pt-2 border-t border-outline-variant/20">
                        <div>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Invite Code</span>
                          <span className="font-mono font-bold text-primary">{userTeam.invite_code}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Track</span>
                          <span className="font-bold text-on-surface">{TRACK_BADGES[userTeam.track]?.label}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                            userTeam.status === 'approved' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#ffdea0] text-[#765700]'
                          }`}>
                            {userTeam.status || 'Pending Approval'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* 4. Sticky Bottom Action Bar */}
              <div className="sticky bottom-4 mt-lg z-20 flex items-center justify-end gap-sm bg-surface/85 backdrop-blur-md p-sm rounded-2xl shadow-lg border border-outline-variant/25">
                <button
                  type="button"
                  onClick={() => {
                    setSettingName(currentUser.name || '');
                    setSettingPhone(currentUser.student_id || '+62 812-3456-7890');
                    setSettingH3Role(currentUser.h3_role || 'Hacker');
                    setSuccessMsg('Perubahan dibatalkan.');
                  }}
                  className="px-md py-2.5 rounded-xl font-title-md text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={async () => {
                    if (!settingName.trim()) {
                      setErrorMsg('Full name cannot be empty.');
                      return;
                    }
                    setSettingsSaving(true);
                    setErrorMsg(null);
                    setSuccessMsg(null);

                    const res = await store.updateProfile(currentUser.id, {
                      name: settingName,
                      student_id: settingPhone,
                      h3_role: settingH3Role,
                    });
                    setSettingsSaving(false);

                    if (res.success) {
                      setSuccessMsg('Profile settings saved successfully!');
                      await refreshData();
                    } else {
                      setErrorMsg(res.error || 'Failed to save settings.');
                    }
                  }}
                  className="px-md py-2.5 rounded-xl font-title-md text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{settingsSaving ? 'Saving Settings...' : 'Save Settings'}</span>
                </button>
              </div>

            </section>

          )}

        </main>
      </div>

      {/* MODAL: Create Team */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-[28px] max-w-lg w-full p-gutter shadow-2xl space-y-md animate-fade-in-up border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                <h3 className="font-title-md text-lg font-bold text-on-surface">Create New Project Team</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-full hover:bg-surface-container-high">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-sm">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Protocol"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-md py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Category / Tech Track *
                </label>
                <select
                  value={newTrack}
                  onChange={(e) => setNewTrack(e.target.value as ProjectTrack)}
                  className="w-full px-md py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="WEB">Web Platform</option>
                  <option value="MOBILE">Mobile App</option>
                  <option value="AI_ML">AI / Machine Learning</option>
                  <option value="CLOUD">Cloud Infrastructure</option>
                  <option value="UI_UX">UI/UX Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Pilih Peran H3 Anda sebagai Team Leader *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateLeaderRole('Hustler')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      createLeaderRole === 'Hustler'
                        ? 'border-[#765700] bg-[#ffdea0]/40 text-[#765700] ring-2 ring-[#765700]/30'
                        : 'border-[#c2c6d5]/40 text-[#424753] hover:bg-[#f9f9ff]'
                    }`}
                  >
                    <span className="block text-base mb-0.5">💼</span>
                    <span>Hustler</span>
                    <span className="block text-[9px] font-normal text-[#727785]">Lead / Strategy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateLeaderRole('Hipster')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      createLeaderRole === 'Hipster'
                        ? 'border-[#ba1a1a] bg-[#ffdad6]/40 text-[#ba1a1a] ring-2 ring-[#ba1a1a]/30'
                        : 'border-[#c2c6d5]/40 text-[#424753] hover:bg-[#f9f9ff]'
                    }`}
                  >
                    <span className="block text-base mb-0.5">🎨</span>
                    <span>Hipster</span>
                    <span className="block text-[9px] font-normal text-[#727785]">UI/UX Design</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateLeaderRole('Hacker')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      createLeaderRole === 'Hacker'
                        ? 'border-[#0058bd] bg-[#d8e2ff]/50 text-[#0058bd] ring-2 ring-[#0058bd]/30'
                        : 'border-[#c2c6d5]/40 text-[#424753] hover:bg-[#f9f9ff]'
                    }`}
                  >
                    <span className="block text-base mb-0.5">💻</span>
                    <span>Hacker</span>
                    <span className="block text-[9px] font-normal text-[#727785]">Web Tech</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Project Summary & Goals *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your solution idea, target problem, and tech stack..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-md py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                ></textarea>
              </div>

              <div className="pt-xs flex items-center justify-end gap-sm">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-md py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-md py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:opacity-90 shadow-xs"
                >
                  Generate Team & Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Team Settings / Disband + Rename */}
      {showSettingsModal && userTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-[28px] max-w-lg w-full p-gutter shadow-2xl space-y-md animate-fade-in-up border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-lg font-bold text-on-surface">Manage Team Workspace</h3>
              <button onClick={() => { setShowSettingsModal(false); setEditingTeam(false); }} className="p-1 rounded-full hover:bg-surface-container-high">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-md text-xs">
              {/* Team Info Display */}
              <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface block text-sm">{userTeam.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TRACK_BADGES[userTeam.track]?.color || ''}`}>
                    {TRACK_BADGES[userTeam.track]?.label}
                  </span>
                </div>
                <span className="text-on-surface-variant font-mono block">Invite Code: {userTeam.invite_code}</span>
                <p className="text-on-surface-variant leading-relaxed">{userTeam.description}</p>
              </div>

              {/* Rename Team Section */}
              {!editingTeam ? (
                <button
                  onClick={() => {
                    setEditingTeam(true);
                    setEditTeamName(userTeam.name);
                    setEditTeamDesc(userTeam.description);
                  }}
                  className="w-full py-3 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-primary" />
                  <span>Ubah Nama & Deskripsi Tim</span>
                </button>
              ) : (
                <div className="space-y-sm p-md bg-surface-container-low rounded-2xl border border-primary/30">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Nama Tim Baru</label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      className="w-full px-md py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Deskripsi Baru</label>
                    <textarea
                      rows={2}
                      value={editTeamDesc}
                      onChange={(e) => setEditTeamDesc(e.target.value)}
                      className="w-full px-md py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditingTeam(false)} className="px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-xl">
                      Batal
                    </button>
                    <button
                      disabled={teamSaving}
                      onClick={async () => {
                        setTeamSaving(true);
                        const res = await store.updateTeamInfo(userTeam.id, currentUser.id, {
                          name: editTeamName,
                          description: editTeamDesc,
                        });
                        setTeamSaving(false);
                        if (res.success) {
                          setSuccessMsg('Info tim berhasil diperbarui!');
                          setEditingTeam(false);
                          await refreshData();
                        } else {
                          setErrorMsg(res.error || 'Gagal update tim.');
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:opacity-90 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{teamSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="pt-sm border-t border-outline-variant/20">
                <div className="text-[10px] font-bold text-error uppercase mb-2">Danger Zone</div>
                <button
                  onClick={handleDisbandTeam}
                  className="w-full py-3 bg-error-container text-on-error-container hover:opacity-90 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Bubarkan Team Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: H3 Role Selector Matchmaking Modal */}
      {showMatchmakingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in-up border border-[#c2c6d5]/30">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#c2c6d5]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0058bd]/10 text-[#0058bd] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#0058bd]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#191b22]">Pilih Peran H3 Kamu</h3>
                  <p className="text-xs text-[#727785]">Web Development Team Matchmaking Framework</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMatchmakingModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f2f3fd] text-[#727785]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Options */}
            <form onSubmit={handleJoinMatchmakingSubmit} className="space-y-4">
              <div className="space-y-3">
                
                {/* 1. Hacker */}
                <label 
                  onClick={() => setSelectedH3Role('Hacker')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedH3Role === 'Hacker'
                      ? 'border-[#0058bd] bg-[#f2f3fd]/70 shadow-xs'
                      : 'border-[#c2c6d5]/30 hover:border-[#0058bd]/40 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="h3Role"
                    value="Hacker"
                    checked={selectedH3Role === 'Hacker'}
                    onChange={() => setSelectedH3Role('Hacker')}
                    className="mt-1 accent-[#0058bd]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-[#0058bd]/10 text-[#0058bd] flex items-center justify-center shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#191b22]">💻 Hacker</span>
                      <span className="text-[10px] font-bold bg-[#d8e2ff] text-[#0058bd] px-2 py-0.5 rounded-full uppercase">
                        Tech & Web Dev
                      </span>
                    </div>
                    <p className="text-xs text-[#424753] leading-relaxed">
                      Fokus pada frontend, backend, APIs, integrasi database, dan arsitektur kode aplikasi web.
                    </p>
                  </div>
                </label>

                {/* 2. Hipster */}
                <label 
                  onClick={() => setSelectedH3Role('Hipster')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedH3Role === 'Hipster'
                      ? 'border-[#ba1a1a] bg-[#ffdad6]/40 shadow-xs'
                      : 'border-[#c2c6d5]/30 hover:border-[#ba1a1a]/40 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="h3Role"
                    value="Hipster"
                    checked={selectedH3Role === 'Hipster'}
                    onChange={() => setSelectedH3Role('Hipster')}
                    className="mt-1 accent-[#ba1a1a]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#191b22]">🎨 Hipster</span>
                      <span className="text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a] px-2 py-0.5 rounded-full uppercase">
                        UI/UX & Design
                      </span>
                    </div>
                    <p className="text-xs text-[#424753] leading-relaxed">
                      Fokus pada wireframing, styling tampilan antarmuka, user journey, prototipe Figma, dan estetika visual produk.
                    </p>
                  </div>
                </label>

                {/* 3. Hustler */}
                <label 
                  onClick={() => setSelectedH3Role('Hustler')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedH3Role === 'Hustler'
                      ? 'border-[#765700] bg-[#ffdea0]/30 shadow-xs'
                      : 'border-[#c2c6d5]/30 hover:border-[#765700]/40 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="h3Role"
                    value="Hustler"
                    checked={selectedH3Role === 'Hustler'}
                    onChange={() => setSelectedH3Role('Hustler')}
                    className="mt-1 accent-[#765700]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-[#ffdea0] text-[#765700] flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#191b22]">💼 Hustler</span>
                      <span className="text-[10px] font-bold bg-[#ffdea0] text-[#765700] px-2 py-0.5 rounded-full uppercase">
                        Project Lead & Strategy
                      </span>
                    </div>
                    <p className="text-xs text-[#424753] leading-relaxed">
                      Fokus pada validasi masalah, project management, penyusunan proposal/pitching, dan koordinasi tim.
                    </p>
                  </div>
                </label>

              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#c2c6d5]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMatchmakingModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#424753] hover:bg-[#f2f3fd] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={matchmakingSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0058bd] to-[#2771df] text-white rounded-xl text-xs font-extrabold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{matchmakingSubmitting ? 'Memproses...' : 'Masuk Antrian Matchmaking'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
