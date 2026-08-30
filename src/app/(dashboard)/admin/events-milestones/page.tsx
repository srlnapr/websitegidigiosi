'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import * as adminSvc from '@/lib/admin-services';
import * as store from '@/lib/store';
import type { Milestone, ChapterEvent, TeamSubmission, EventCategory, LocationType } from '@/types/admin';
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Lock,
  Unlock,
  Globe,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  GitBranch,
  Frame,
  Video,
  Link2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Flag,
  Zap,
  BookOpen,
  Coffee,
  Code2,
  Radio,
  MapPin,
  Users,
  ArrowLeft,
  Check,
  Menu,
  LogOut,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getCountdown(dueIso: string): { label: string; color: string; urgent: boolean } {
  try {
    const now = Date.now();
    const due = new Date(dueIso).getTime();
    const diffMs = due - now;
    if (diffMs < 0) return { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200', urgent: true };
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days === 0) return { label: `${hours}h left`, color: 'bg-red-100 text-red-700 border-red-200', urgent: true };
    if (days <= 3) return { label: `Closes in ${days}d ${hours}h`, color: 'bg-amber-100 text-amber-800 border-amber-200', urgent: true };
    return { label: `Closes in ${days} days`, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', urgent: false };
  } catch {
    return { label: 'Invalid Date', color: 'bg-gray-100 text-gray-700 border-gray-200', urgent: false };
  }
}

const CATEGORY_META: Record<EventCategory, { label: string; color: string; icon: React.ReactNode }> = {
  Workshop: { label: 'Workshop', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Code2 className="w-3 h-3" /> },
  Hackathon: { label: 'Hackathon', color: 'bg-red-100 text-red-800 border-red-200', icon: <Zap className="w-3 h-3" /> },
  'Info Session': { label: 'Info Session', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <BookOpen className="w-3 h-3" /> },
  'Study Jam': { label: 'Study Jam', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Coffee className="w-3 h-3" /> },
};

const LOCATION_META: Record<LocationType, { label: string; icon: React.ReactNode }> = {
  offline: { label: 'Offline', icon: <MapPin className="w-3 h-3" /> },
  online: { label: 'Online', icon: <Globe className="w-3 h-3" /> },
  hybrid: { label: 'Hybrid', icon: <Radio className="w-3 h-3" /> },
};

const DUMMY_EVENTS: Omit<ChapterEvent, 'id' | 'created_at'>[] = [
  {
    title: 'Google Solution Challenge 2026 Kickoff & Ideation',
    category: 'Hackathon',
    date_start: '2026-09-15T09:00:00Z',
    date_end: '2026-09-15T15:00:00Z',
    location_type: 'hybrid',
    venue_or_link: 'Auditorium Gedung Rektorat Lt. 3 / Google Meet',
    speaker_name: 'Google Developer Expert & GDG Chapter Lead',
    description: 'Kickoff resmi Google Solution Challenge 2026 untuk mahasiswa Telkom University Purwokerto. Pelajari 17 UN SDGs, strategi pembentukan tim H3, dan bimbingan langsung dari GDE.',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
    rsvp_url: 'https://gdg.community.dev/events/details/developer-student-clubs-telkom-university-purwokerto-presents-solution-challenge-2026/',
  },
  {
    title: 'Hands-on Cloud Study Jam: Gemini & Vertex AI on GCP',
    category: 'Study Jam',
    date_start: '2026-09-22T13:30:00Z',
    date_end: '2026-09-22T17:00:00Z',
    location_type: 'offline',
    venue_or_link: 'Laboratorium Komputer DC-204, Telkom University Purwokerto',
    speaker_name: 'Faiz Ramadhan (Cloud Infrastructure Lead)',
    description: 'Workshop praktis membangun REST API cerdas bertenaga Gemini 1.5 Flash menggunakan Google Cloud Run dan Vertex AI. Dapatkan free Qwiklabs credits dan sertifikat digital.',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    rsvp_url: 'https://gdg.community.dev/events/details/developer-student-clubs-telkom-university-purwokerto-presents-cloud-study-jam-gemini/',
  },
  {
    title: 'UI/UX Masterclass: Designing High-Impact Tech Products in Figma',
    category: 'Workshop',
    date_start: '2026-09-29T10:00:00Z',
    date_end: '2026-09-29T12:30:00Z',
    location_type: 'online',
    venue_or_link: 'Google Meet Live Stream',
    speaker_name: 'Alisha Zahra (Product Designer at Tech Startup)',
    description: 'Panduan mendesain prototipe UI/UX interaktif berbasis Material You Google Design System untuk Solution Challenge.',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    rsvp_url: 'https://gdg.community.dev/events/details/developer-student-clubs-telkom-university-purwokerto-presents-uiux-masterclass/',
  },
  {
    title: 'GDG Purwokerto Tech Info Session & Meetup',
    category: 'Info Session',
    date_start: '2026-10-06T14:00:00Z',
    date_end: '2026-10-06T16:30:00Z',
    location_type: 'offline',
    venue_or_link: 'Coworking Space Telkom Purwokerto',
    speaker_name: 'Core Chapter Leads GDG Telkom',
    description: 'Temu komunitas developer, perkenalan roadmap program semester ini, dan networking bareng tech enthusiast.',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    rsvp_url: 'https://gdg.community.dev/events/details/developer-student-clubs-telkom-university-purwokerto-presents-info-session/',
  },
];

const DUMMY_MILESTONES: Omit<Milestone, 'id' | 'created_at'>[] = [
  {
    title: 'Milestone 1: Problem Definition & Wireframe Prototype',
    description: 'Submit problem statement aligning with UN SDGs and interactive Figma wireframe prototype.',
    due_date: '2026-09-20T23:59:00Z',
    required_fields: { github_url: false, figma_url: true, live_demo_url: false, video_url: false },
    is_locked_after_due: false,
    status: 'active',
  },
  {
    title: 'Milestone 2: MVP Architecture & Core Frontend/Backend Repository',
    description: 'Submit working code repository on GitHub and public deployed URL demo.',
    due_date: '2026-10-10T23:59:00Z',
    required_fields: { github_url: true, figma_url: false, live_demo_url: true, video_url: false },
    is_locked_after_due: false,
    status: 'active',
  },
  {
    title: 'Milestone 3: Final Pitch Video & Solution Submission',
    description: 'Complete deliverable bundle: GitHub code, live web/app URL, and YouTube demo video (max 3 min).',
    due_date: '2026-10-30T23:59:00Z',
    required_fields: { github_url: true, figma_url: true, live_demo_url: true, video_url: true },
    is_locked_after_due: false,
    status: 'active',
  },
];

// ─────────────────────────────────────────────
// Milestone Form Modal
// ─────────────────────────────────────────────

const EMPTY_MILESTONE_FORM = {
  title: '',
  description: '',
  due_date: '',
  is_locked_after_due: true,
  status: 'active' as 'active' | 'closed',
  required_fields: { github_url: true, figma_url: false, live_demo_url: false, video_url: false },
};

function MilestoneFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Milestone;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          description: initial.description,
          due_date: initial.due_date ? initial.due_date.slice(0, 16) : '',
          is_locked_after_due: initial.is_locked_after_due ?? true,
          status: initial.status ?? 'active',
          required_fields: {
            github_url: initial.required_fields?.github_url ?? false,
            figma_url: initial.required_fields?.figma_url ?? false,
            live_demo_url: initial.required_fields?.live_demo_url ?? false,
            video_url: initial.required_fields?.video_url ?? false,
          },
        }
      : { ...EMPTY_MILESTONE_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleField = (field: keyof typeof form.required_fields) => {
    setForm((f) => ({ ...f, required_fields: { ...f.required_fields, [field]: !f.required_fields[field] } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.due_date) {
      setError('Title and due date are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      due_date: new Date(form.due_date).toISOString(),
    };

    if (initial) {
      const res = await adminSvc.updateMilestone(initial.id, payload);
      if (!res.success) setError(res.error || 'Failed to update milestone.');
      else {
        onSaved();
        onClose();
      }
    } else {
      const res = await adminSvc.createMilestone(payload);
      if (!res.success) setError(res.error || 'Failed to create milestone.');
      else {
        onSaved();
        onClose();
      }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-[#c2c6d5]/30 animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#0058bd] to-[#2771df] px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base">{initial ? 'Edit Milestone' : 'New Milestone Deadline'}</h2>
              <p className="text-xs text-white/80">Configure deliverable requirements and cutoff dates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#191b22] mb-1.5">Milestone Title *</label>
            <input
              className="w-full px-4 py-2.5 border border-[#c2c6d5]/60 rounded-xl text-sm focus:border-[#0058bd] focus:outline-hidden transition-colors"
              placeholder="e.g. Sprint 1 — MVP Submission"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#191b22] mb-1.5">Description & Guidelines</label>
            <textarea
              className="w-full px-4 py-2.5 border border-[#c2c6d5]/60 rounded-xl text-sm focus:border-[#0058bd] focus:outline-hidden transition-colors resize-none"
              rows={3}
              placeholder="Detailed deliverables checklist and submission instructions for teams..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#191b22] mb-1.5">Submission Deadline *</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2.5 border border-[#c2c6d5]/60 rounded-xl text-sm focus:border-[#0058bd] focus:outline-hidden transition-colors"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#191b22] mb-2">Required Submission Fields</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'github_url', label: 'GitHub Repo', icon: <GitBranch className="w-3.5 h-3.5" /> },
                { key: 'figma_url', label: 'Figma Design', icon: <Frame className="w-3.5 h-3.5" /> },
                { key: 'live_demo_url', label: 'Live Demo URL', icon: <Globe className="w-3.5 h-3.5" /> },
                { key: 'video_url', label: 'Demo Video', icon: <Video className="w-3.5 h-3.5" /> },
              ] as { key: keyof typeof form.required_fields; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleField(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    form.required_fields[key]
                      ? 'bg-[#0058bd] text-white border-[#0058bd] shadow-xs'
                      : 'bg-[#f2f3fd] text-[#424753] border-[#c2c6d5]/50 hover:border-[#0058bd]'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                  {form.required_fields[key] && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#f9f9ff] rounded-xl border border-[#c2c6d5]/30">
            <div>
              <div className="text-xs font-bold text-[#191b22]">Lock submissions after deadline</div>
              <div className="text-[10px] text-[#727785]">Automatically prevent late submissions when time expires</div>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_locked_after_due: !f.is_locked_after_due }))}
              className="cursor-pointer"
            >
              {form.is_locked_after_due
                ? <ToggleRight className="w-8 h-8 text-[#0058bd]" />
                : <ToggleLeft className="w-8 h-8 text-[#c2c6d5]" />}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#c2c6d5]/60 text-xs font-bold text-[#424753] hover:bg-[#f2f3fd] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#0058bd] text-white text-xs font-bold hover:bg-[#2771df] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Event Form Modal
// ─────────────────────────────────────────────

const EMPTY_EVENT_FORM = {
  title: '',
  category: 'Workshop' as EventCategory,
  banner_url: '',
  date_start: '',
  date_end: '',
  location_type: 'offline' as LocationType,
  venue_or_link: '',
  description: '',
  speaker_name: '',
  speaker_title: '',
  rsvp_url: '',
  status: 'draft' as 'draft' | 'published',
};

function EventFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: ChapterEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          category: initial.category,
          banner_url: initial.banner_url || '',
          date_start: initial.date_start ? initial.date_start.slice(0, 16) : '',
          date_end: initial.date_end ? initial.date_end.slice(0, 16) : '',
          location_type: initial.location_type,
          venue_or_link: initial.venue_or_link,
          description: initial.description,
          speaker_name: initial.speaker_name || '',
          speaker_title: initial.speaker_title || '',
          rsvp_url: initial.rsvp_url || '',
          status: initial.status,
        }
      : { ...EMPTY_EVENT_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date_start || !form.date_end || !form.venue_or_link.trim()) {
      setError('Title, start/end dates, and venue/link are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      title: form.title.trim(),
      venue_or_link: form.venue_or_link.trim(),
      description: form.description.trim(),
      speaker_name: form.speaker_name.trim() || undefined,
      speaker_title: form.speaker_title.trim() || undefined,
      rsvp_url: form.rsvp_url.trim() || undefined,
      banner_url: form.banner_url.trim() || undefined,
      date_start: new Date(form.date_start).toISOString(),
      date_end: new Date(form.date_end).toISOString(),
    };

    if (initial) {
      const res = await adminSvc.updateEvent(initial.id, payload);
      if (!res.success) setError(res.error || 'Failed to update event.');
      else {
        onSaved();
        onClose();
      }
    } else {
      const res = await adminSvc.createEvent(payload);
      if (!res.success) setError(res.error || 'Failed to create event.');
      else {
        onSaved();
        onClose();
      }
    }
    setSaving(false);
  };

  const field = (label: string, input: React.ReactNode) => (
    <div>
      <label className="block text-xs font-bold text-[#191b22] mb-1.5">{label}</label>
      {input}
    </div>
  );

  const inputCls = "w-full px-4 py-2.5 border border-[#c2c6d5]/60 rounded-xl text-sm focus:border-[#0058bd] focus:outline-hidden transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-[#c2c6d5]/30 animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#765700] to-[#956e00] px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base">{initial ? 'Edit Chapter Event' : 'Create Chapter Event'}</h2>
              <p className="text-xs text-white/80">Manage event details and landing page sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {field('Event Title *',
            <input className={inputCls} placeholder="e.g. Google Cloud Study Jam 2026" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          )}

          <div className="grid grid-cols-2 gap-3">
            {field('Category *',
              <select className={inputCls} value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as EventCategory }))}>
                {(['Workshop', 'Hackathon', 'Info Session', 'Study Jam'] as EventCategory[]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            {field('Location Type *',
              <select className={inputCls} value={form.location_type}
                onChange={(e) => setForm((f) => ({ ...f, location_type: e.target.value as LocationType }))}>
                <option value="offline">Offline (In-Person)</option>
                <option value="online">Online (Virtual)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Start Date & Time *',
              <input type="datetime-local" className={inputCls} value={form.date_start}
                onChange={(e) => setForm((f) => ({ ...f, date_start: e.target.value }))} required />
            )}
            {field('End Date & Time *',
              <input type="datetime-local" className={inputCls} value={form.date_end}
                onChange={(e) => setForm((f) => ({ ...f, date_end: e.target.value }))} required />
            )}
          </div>

          {field('Venue / Meeting Link *',
            <input className={inputCls} placeholder="Auditorium Telkom Purwokerto or https://meet.google.com/..." value={form.venue_or_link}
              onChange={(e) => setForm((f) => ({ ...f, venue_or_link: e.target.value }))} required />
          )}

          {field('Description',
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Event overview, agenda, and participant requirements..."
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          )}

          <div className="grid grid-cols-2 gap-3">
            {field('Speaker Name (optional)',
              <input className={inputCls} placeholder="e.g. Budi Santoso" value={form.speaker_name}
                onChange={(e) => setForm((f) => ({ ...f, speaker_name: e.target.value }))} />
            )}
            {field('Speaker Title (optional)',
              <input className={inputCls} placeholder="e.g. Google Developer Expert" value={form.speaker_title}
                onChange={(e) => setForm((f) => ({ ...f, speaker_title: e.target.value }))} />
            )}
          </div>

          {field('RSVP / Registration Link (optional)',
            <input className={inputCls} type="url" placeholder="https://forms.gle/..." value={form.rsvp_url}
              onChange={(e) => setForm((f) => ({ ...f, rsvp_url: e.target.value }))} />
          )}

          {field('Banner Image URL (optional)',
            <input className={inputCls} type="url" placeholder="https://images.unsplash.com/..." value={form.banner_url}
              onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))} />
          )}

          <div className="flex items-center justify-between p-3 bg-[#f9f9ff] rounded-xl border border-[#c2c6d5]/30">
            <div>
              <div className="text-xs font-bold text-[#191b22]">Publish to Public Landing Page</div>
              <div className="text-[10px] text-[#727785]">When enabled, this event is immediately visible to visitors</div>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: f.status === 'published' ? 'draft' : 'published' }))}
              className="cursor-pointer flex items-center gap-1.5"
            >
              {form.status === 'published' ? (
                <>
                  <ToggleRight className="w-8 h-8 text-[#006e2c]" />
                  <span className="text-xs font-bold text-[#006e2c]">Live</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-8 h-8 text-[#c2c6d5]" />
                  <span className="text-xs font-semibold text-[#727785]">Draft</span>
                </>
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#c2c6d5]/60 text-xs font-bold text-[#424753] hover:bg-[#f2f3fd] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#765700] text-white text-xs font-bold hover:bg-[#956e00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Submissions Drawer
// ─────────────────────────────────────────────

function SubmissionsDrawer({
  milestone,
  onClose,
}: {
  milestone: Milestone;
  onClose: () => void;
}) {
  const [submissions, setSubmissions] = useState<TeamSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminSvc.getMilestoneSubmissions(milestone.id).then((data) => {
      setSubmissions(data);
      setLoading(false);
    });
  }, [milestone.id]);

  const handleMarkReviewed = async (id: string) => {
    await adminSvc.markSubmissionReviewed(id);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, reviewed: true } : s)));
  };

  const reviewedCount = submissions.filter((s) => s.reviewed).length;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40 backdrop-blur-xs" />
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#191b22] px-6 py-5 flex items-center justify-between shrink-0 text-white">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Eye className="w-4 h-4 text-[#0058bd]" />
              <span className="font-bold text-sm">Team Submissions</span>
              <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-bold text-white/90">
                {submissions.length} Total ({reviewedCount} Reviewed)
              </span>
            </div>
            <p className="text-white/60 text-xs truncate max-w-md">{milestone.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#f9f9ff]">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-[#0058bd]" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-2xl border border-[#c2c6d5]/30 p-8">
              <div className="w-16 h-16 rounded-full bg-[#f2f3fd] flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#727785]" />
              </div>
              <p className="text-sm font-bold text-[#191b22]">No Submissions Received Yet</p>
              <p className="text-xs text-[#727785] max-w-sm">
                Approved teams have not submitted deliverables for this milestone yet.
              </p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div
                key={sub.id}
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  sub.reviewed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-[#c2c6d5]/40 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-sm text-[#191b22]">{sub.team_name}</div>
                    <div className="text-[11px] text-[#727785]">Submitted {formatDate(sub.submitted_at)}</div>
                  </div>
                  {sub.reviewed ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkReviewed(sub.id)}
                      className="px-3 py-1 bg-[#0058bd] text-white rounded-full text-[11px] font-bold hover:bg-[#2771df] transition-colors cursor-pointer shadow-xs"
                    >
                      Mark Reviewed
                    </button>
                  )}
                </div>

                {/* Deliverable Links Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {sub.github_url ? (
                    <a
                      href={sub.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl text-xs font-semibold text-[#0058bd] border border-[#c2c6d5]/40 hover:bg-[#0058bd] hover:text-white transition-all group"
                    >
                      <GitBranch className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate">GitHub Repository</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#f2f3fd] rounded-xl text-xs text-[#727785] border border-dashed border-[#c2c6d5]/50">
                      <GitBranch className="w-3.5 h-3.5 opacity-40" />
                      <span>No GitHub</span>
                    </div>
                  )}

                  {sub.figma_url ? (
                    <a
                      href={sub.figma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl text-xs font-semibold text-[#ba1a1a] border border-[#c2c6d5]/40 hover:bg-[#ba1a1a] hover:text-white transition-all group"
                    >
                      <Frame className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate">Figma Canvas</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#f2f3fd] rounded-xl text-xs text-[#727785] border border-dashed border-[#c2c6d5]/50">
                      <Frame className="w-3.5 h-3.5 opacity-40" />
                      <span>No Figma</span>
                    </div>
                  )}

                  {sub.live_demo_url ? (
                    <a
                      href={sub.live_demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl text-xs font-semibold text-[#006e2c] border border-[#c2c6d5]/40 hover:bg-[#006e2c] hover:text-white transition-all group"
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate">Live Deployment</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#f2f3fd] rounded-xl text-xs text-[#727785] border border-dashed border-[#c2c6d5]/50">
                      <Globe className="w-3.5 h-3.5 opacity-40" />
                      <span>No Live Demo</span>
                    </div>
                  )}

                  {sub.video_url ? (
                    <a
                      href={sub.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl text-xs font-semibold text-[#765700] border border-[#c2c6d5]/40 hover:bg-[#765700] hover:text-white transition-all group"
                    >
                      <Video className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate">Demo Video</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#f2f3fd] rounded-xl text-xs text-[#727785] border border-dashed border-[#c2c6d5]/50">
                      <Video className="w-3.5 h-3.5 opacity-40" />
                      <span>No Video</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────

type PageTab = 'milestones' | 'events';

export default function AdminEventsMilestonesPage() {
  const router = useRouter();
  const { profile: currentUser, loading: authLoading, logout } = useAuth();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<TeamSubmission[]>([]);
  const [approvedTeamsCount, setApprovedTeamsCount] = useState<number>(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<PageTab>('milestones');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editMilestone, setEditMilestone] = useState<Milestone | undefined>();
  const [showEventForm, setShowEventForm] = useState(false);
  const [editEvent, setEditEvent] = useState<ChapterEvent | undefined>();
  const [submissionsFor, setSubmissionsFor] = useState<Milestone | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ms, evs, pending, subs, allTeams] = await Promise.all([
      adminSvc.getAllMilestones(),
      adminSvc.getAllEvents(),
      adminSvc.getAllPendingSubmissions(),
      adminSvc.getAllSubmissions(),
      store.getAllTeams(),
    ]);

    setMilestones(ms);
    setEvents(evs);
    setPendingCount(pending.length);
    setAllSubmissions(subs);

    const approvedTeams = allTeams.filter((t) => t.status === 'approved');
    setApprovedTeamsCount(approvedTeams.length || allTeams.length || 1);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && currentUser) {
      if ((currentUser.role as string) !== 'admin') {
        router.replace('/dashboard');
      } else {
        loadData();
      }
    }
  }, [authLoading, currentUser, router, loadData]);

  const handleToggleMilestoneLock = async (m: Milestone) => {
    const newStatus = m.status === 'active' ? 'closed' : 'active';
    const res = await adminSvc.updateMilestone(m.id, { status: newStatus });
    if (res.success) {
      showToast(`Milestone "${m.title}" ${newStatus === 'closed' ? 'locked' : 'reopened'}.`);
      loadData();
    } else {
      showToast(res.error || 'Failed to update milestone lock status.');
    }
  };

  const handleDeleteMilestone = async (m: Milestone) => {
    if (!confirm(`Delete milestone "${m.title}"? This cannot be undone.`)) return;
    const res = await adminSvc.deleteMilestone(m.id);
    if (res.success) {
      showToast(`Milestone "${m.title}" deleted.`);
      loadData();
    } else {
      showToast(res.error || 'Failed to delete milestone.');
    }
  };

  const handleToggleEventPublish = async (ev: ChapterEvent) => {
    const newStatus = ev.status === 'published' ? 'draft' : 'published';
    const res = await adminSvc.updateEvent(ev.id, { status: newStatus });
    if (res.success) {
      showToast(
        `Event "${ev.title}" ${newStatus === 'published' ? 'is now LIVE on the landing page!' : 'moved to draft.'}`
      );
      loadData();
    } else {
      showToast(res.error || 'Failed to update event publish status.');
    }
  };

  const [seeding, setSeeding] = useState(false);

  const handleSeedDummyData = async () => {
    setSeeding(true);
    let count = 0;
    for (const ev of DUMMY_EVENTS) {
      await adminSvc.createEvent(ev);
      count++;
    }
    for (const ms of DUMMY_MILESTONES) {
      await adminSvc.createMilestone(ms);
      count++;
    }
    setSeeding(false);
    showToast(`Berhasil menambahkan ${count} Chapter Events & Milestones ke Firestore!`);
    loadData();
  };

  const handleDeleteEvent = async (ev: ChapterEvent) => {
    if (!confirm(`Delete event "${ev.title}"? This cannot be undone.`)) return;
    const res = await adminSvc.deleteEvent(ev.id);
    if (res.success) {
      showToast(`Event "${ev.title}" deleted.`);
      loadData();
    } else {
      showToast(res.error || 'Failed to delete event.');
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0058bd]" />
      </div>
    );
  }

  const activeMilestonesCount = milestones.filter((m) => m.status === 'active').length;
  const liveEventsCount = events.filter((e) => e.status === 'published').length;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#191b22] font-product antialiased">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-[#191b22] text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/10 animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-[#86f898]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Modals */}
      {(showMilestoneForm || editMilestone) && (
        <MilestoneFormModal
          initial={editMilestone}
          onClose={() => {
            setShowMilestoneForm(false);
            setEditMilestone(undefined);
          }}
          onSaved={loadData}
        />
      )}
      {(showEventForm || editEvent) && (
        <EventFormModal
          initial={editEvent}
          onClose={() => {
            setShowEventForm(false);
            setEditEvent(undefined);
          }}
          onSaved={loadData}
        />
      )}
      {submissionsFor && (
        <SubmissionsDrawer milestone={submissionsFor} onClose={() => setSubmissionsFor(null)} />
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop: Fixed w-64, Mobile: Drawer) */}
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
        <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
          <div>
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#727785] mb-1.5">
              Core Overview
            </div>
            <div className="space-y-1">
              <Link
                href="/admin"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-[#424753] hover:bg-white/80 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  <span className="text-xs">Overview</span>
                </div>
              </Link>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#727785] mb-1.5">
              Squads & Matchmaking
            </div>
            <div className="space-y-1">
              <Link
                href="/admin"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-[#424753] hover:bg-white/80 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#fbbc06]" />
                  <span className="text-xs">H3 Matchmaking Pool</span>
                </div>
              </Link>

              <Link
                href="/admin"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-[#424753] hover:bg-white/80 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span className="text-xs">Team Approvals</span>
                </div>
              </Link>

              <Link
                href="/admin"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-[#424753] hover:bg-white/80 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span className="text-xs">Members & Roles</span>
                </div>
              </Link>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#727785] mb-1.5">
              Program & Events
            </div>
            <div className="space-y-1">
              <Link
                href="/admin/events-milestones"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all bg-[#0058bd] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                  <span>Deadlines & Event Panel</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-white text-[#0058bd] text-[9px] font-extrabold">
                  ACTIVE
                </span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="p-3 border-t border-[#c2c6d5]/30 space-y-1 bg-[#ecedf7]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#424753] hover:text-[#0058bd] transition-colors rounded-xl hover:bg-white/80"
          >
            <span className="material-symbols-outlined text-[16px]">space_dashboard</span>
            <span>Member Dashboard</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#424753] hover:text-[#0058bd] transition-colors rounded-xl hover:bg-white/80"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Public Website</span>
          </Link>

          <button
            onClick={async () => {
              await logout();
              router.push('/auth');
            }}
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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-[#424753] hover:bg-[#f2f3fd] rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0058bd]">calendar_add_on</span>
              <span className="font-extrabold text-sm text-[#191b22]">Deadlines & Chapter Events Control</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 border-l border-[#c2c6d5]/30">
              <UserAvatar name={currentUser.name} size="sm" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#191b22] leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-[#0058bd] font-bold uppercase tracking-wider">Chapter Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with pt-16 to offset fixed header */}
        <main className="flex-1 pt-16">
          <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            
            {/* Header & Action Buttons */}
            <div className="bg-white rounded-[24px] border border-[#c2c6d5]/30 p-6 md:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-2 text-xs text-[#727785]">
                <Link href="/admin" className="flex items-center gap-1 hover:text-[#0058bd] transition-colors font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Admin Dashboard
                </Link>
                <ChevronRight className="w-3 h-3 opacity-50" />
                <span className="text-[#191b22] font-bold">Deadlines & Event Manager</span>
              </div>

          {/* Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191b22] tracking-tight">
                Project Deadlines & Chapter Events Manager
              </h1>
              <p className="text-sm text-[#424753] mt-1">
                Manage submission milestones, track deliverable progress, and curate upcoming events for the public landing page.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={handleSeedDummyData}
                disabled={seeding}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-[#f2f3fd] hover:bg-[#e8f0fe] text-[#0058bd] border border-[#0058bd]/30 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Populate 4 Chapter Events and 3 Milestones automatically"
              >
                <Sparkles className="w-4 h-4 text-[#fbbc06]" />
                <span>{seeding ? 'Generating Data...' : 'Auto-Generate Dummy Events & Deadlines'}</span>
              </button>

              <button
                onClick={() => {
                  setEditMilestone(undefined);
                  setShowMilestoneForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0058bd] text-white text-xs font-bold rounded-xl hover:bg-[#2771df] transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Milestone Deadline</span>
              </button>
              <button
                onClick={() => {
                  setEditEvent(undefined);
                  setShowEventForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#765700] text-white text-xs font-bold rounded-xl hover:bg-[#956e00] transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Upcoming Event</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <button
              onClick={() => setActiveTab('milestones')}
              className="bg-[#f9f9ff] rounded-2xl border border-[#c2c6d5]/30 p-4.5 flex items-center gap-4 hover:shadow-md transition-all text-left cursor-pointer group hover:border-[#0058bd]/40"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[#0058bd] bg-[#e8f0fe] shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#191b22]">{loading ? '—' : activeMilestonesCount}</div>
                <div className="text-xs font-bold text-[#424753] uppercase tracking-wider">Active Deadlines</div>
                <div className="text-[11px] text-[#727785]">Open submission milestones</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className="bg-[#f9f9ff] rounded-2xl border border-[#c2c6d5]/30 p-4.5 flex items-center gap-4 hover:shadow-md transition-all text-left cursor-pointer group hover:border-[#006e2c]/40"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[#006e2c] bg-[#e6f4ea] shrink-0 group-hover:scale-105 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#191b22]">{loading ? '—' : liveEventsCount}</div>
                <div className="text-xs font-bold text-[#424753] uppercase tracking-wider">Live Events</div>
                <div className="text-[11px] text-[#727785]">Visible on Public Landing Page</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className="bg-[#f9f9ff] rounded-2xl border border-[#c2c6d5]/30 p-4.5 flex items-center gap-4 hover:shadow-md transition-all text-left cursor-pointer group hover:border-[#ba1a1a]/40"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[#ba1a1a] bg-[#ffdad6] shrink-0 group-hover:scale-105 transition-transform">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#191b22]">{loading ? '—' : pendingCount}</div>
                <div className="text-xs font-bold text-[#424753] uppercase tracking-wider">Pending Submissions</div>
                <div className="text-[11px] text-[#727785]">Unreviewed team deliverables</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#c2c6d5]/30 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex gap-2">
          {([
            { key: 'milestones', label: 'Tab 1: Project Submissions & Milestones', icon: <Flag className="w-4 h-4" /> },
            { key: 'events', label: 'Tab 2: Chapter Event Manager (Live Sync)', icon: <Calendar className="w-4 h-4" /> },
          ] as { key: PageTab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === key
                  ? 'border-[#0058bd] text-[#0058bd] bg-[#f2f3fd]/50'
                  : 'border-transparent text-[#727785] hover:text-[#191b22] hover:bg-[#f9f9ff]'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* ── TAB 1: MILESTONES ── */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-[#191b22]">Project Milestones & Deliverables</h2>
                <p className="text-xs text-[#727785]">Track team progress, manage deadline cutoffs, and review submissions.</p>
              </div>
              <button
                onClick={() => {
                  setEditMilestone(undefined);
                  setShowMilestoneForm(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0058bd] text-white text-xs font-bold rounded-xl hover:bg-[#2771df] transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Milestone</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#0058bd]" />
              </div>
            ) : milestones.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#c2c6d5]/30 p-16 flex flex-col items-center gap-4 text-center shadow-xs">
                <div className="w-20 h-20 bg-[#e8f0fe] rounded-full flex items-center justify-center">
                  <Flag className="w-10 h-10 text-[#0058bd]" />
                </div>
                <h3 className="text-lg font-bold text-[#191b22]">No Milestones Created Yet</h3>
                <p className="text-sm text-[#727785] max-w-md">
                  Create project milestones with required submission links (GitHub, Figma, Live Demo, Video) to start tracking team deliverables.
                </p>
                <div className="flex items-center gap-2.5 flex-wrap justify-center">
                  <button
                    onClick={() => setShowMilestoneForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0058bd] text-white text-xs font-bold rounded-xl hover:bg-[#2771df] transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Milestone</span>
                  </button>
                  <button
                    onClick={handleSeedDummyData}
                    disabled={seeding}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#f2f3fd] hover:bg-[#e8f0fe] text-[#0058bd] border border-[#0058bd]/30 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-[#fbbc06]" />
                    <span>Auto-Populate Demo Milestones</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((m) => {
                  const countdown = getCountdown(m.due_date);
                  const isClosed = m.status === 'closed';
                  const requiredBadges = Object.entries(m.required_fields || {})
                    .filter(([, v]) => v)
                    .map(([k]) => k.replace('_url', '').replace('_', ' '));

                  const milestoneSubs = allSubmissions.filter((s) => s.milestone_id === m.id);
                  const submittedCount = milestoneSubs.length;
                  const totalTarget = Math.max(approvedTeamsCount, 1);
                  const progressPercent = Math.min(100, Math.round((submittedCount / totalTarget) * 100));

                  return (
                    <div
                      key={m.id}
                      className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
                        isClosed ? 'border-[#c2c6d5]/40 opacity-80' : 'border-[#c2c6d5]/40 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Status & Countdown Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isClosed
                                  ? 'bg-[#f2f3fd] text-[#727785] border-[#c2c6d5]/40'
                                  : 'bg-[#e8f0fe] text-[#0058bd] border-[#0058bd]/30'
                              }`}
                            >
                              {isClosed ? '🔒 Closed / Locked' : '✅ Active'}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${countdown.color}`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{countdown.label}</span>
                            </span>
                            {m.is_locked_after_due && (
                              <span className="px-2 py-0.5 bg-[#f9f9ff] text-[#727785] border border-[#c2c6d5]/40 rounded-full text-[10px] font-semibold">
                                Auto-lock after deadline
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-[#191b22] text-base mb-1">{m.title}</h3>
                          {m.description && (
                            <p className="text-xs text-[#727785] leading-relaxed mb-3">{m.description}</p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-[#424753] mb-3">
                            <Calendar className="w-3.5 h-3.5 text-[#727785]" />
                            <span>
                              Deadline: <strong className="text-[#191b22]">{formatDate(m.due_date)}</strong>
                            </span>
                          </div>

                          {/* Deliverables Badges */}
                          {requiredBadges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {requiredBadges.map((b) => (
                                <span
                                  key={b}
                                  className="px-2.5 py-0.5 bg-[#f2f3fd] border border-[#c2c6d5]/50 text-[#0058bd] rounded-lg text-[10px] font-bold capitalize flex items-center gap-1"
                                >
                                  <Link2 className="w-3 h-3" />
                                  <span>{b} Required</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Submission Progress Bar: X / Total Approved Teams Submitted */}
                          <div className="mt-3 pt-3 border-t border-[#c2c6d5]/20 max-w-xl">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold text-[#191b22] flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-[#0058bd]" />
                                Submission Progress
                              </span>
                              <span className="font-semibold text-[#424753]">
                                <strong className="text-[#0058bd] font-extrabold">{submittedCount}</strong> /{' '}
                                {totalTarget} Approved Teams Submitted ({progressPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#f2f3fd] h-2.5 rounded-full overflow-hidden border border-[#c2c6d5]/30">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progressPercent === 100
                                    ? 'bg-[#006e2c]'
                                    : progressPercent > 50
                                    ? 'bg-[#0058bd]'
                                    : 'bg-[#fbbc06]'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col gap-2 shrink-0 self-start">
                          <button
                            onClick={() => setSubmissionsFor(m)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f2f3fd] text-[#0058bd] text-xs font-bold rounded-xl hover:bg-[#0058bd] hover:text-white transition-all cursor-pointer border border-[#0058bd]/20"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Submissions ({submittedCount})</span>
                          </button>
                          <button
                            onClick={() => handleToggleMilestoneLock(m)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                              isClosed
                                ? 'bg-[#e6f4ea] text-[#006e2c] hover:bg-[#006e2c] hover:text-white border border-[#006e2c]/20'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200'
                            }`}
                          >
                            {isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{isClosed ? 'Reopen Submissions' : 'Lock Submissions'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditMilestone(m);
                              setShowMilestoneForm(false);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f2f3fd] text-[#424753] text-xs font-semibold rounded-xl hover:bg-[#191b22] hover:text-white transition-all cursor-pointer border border-[#c2c6d5]/30"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(m)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold rounded-xl hover:bg-[#ba1a1a] hover:text-white transition-all cursor-pointer border border-[#ba1a1a]/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: EVENTS (LIVE SYNC) ── */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-[#191b22]">Chapter Event Manager (Live Sync)</h2>
                <p className="text-xs text-[#727785]">
                  Events toggled to &quot;Live&quot; automatically appear in the Public Landing Page&apos;s &quot;Upcoming Events&quot; section.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditEvent(undefined);
                  setShowEventForm(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#765700] text-white text-xs font-bold rounded-xl hover:bg-[#956e00] transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Event</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#765700]" />
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#c2c6d5]/30 p-16 flex flex-col items-center gap-4 text-center shadow-xs">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-[#765700]" />
                </div>
                <h3 className="text-lg font-bold text-[#191b22]">No Chapter Events Created</h3>
                <p className="text-sm text-[#727785] max-w-md">
                  Publish workshops, study jams, and hackathons to immediately sync them with the public landing page.
                </p>
                <div className="flex items-center gap-2.5 flex-wrap justify-center">
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#765700] text-white text-xs font-bold rounded-xl hover:bg-[#956e00] transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Event</span>
                  </button>
                  <button
                    onClick={handleSeedDummyData}
                    disabled={seeding}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#fff8e1] hover:bg-[#ffecb3] text-[#765700] border border-[#765700]/30 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-[#fbbc06]" />
                    <span>Auto-Populate Demo Events</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {events.map((ev) => {
                  const catMeta = CATEGORY_META[ev.category] || CATEGORY_META['Workshop'];
                  const locMeta = LOCATION_META[ev.location_type] || LOCATION_META['offline'];
                  const isPublished = ev.status === 'published';

                  return (
                    <div
                      key={ev.id}
                      className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md flex flex-col ${
                        isPublished ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-[#c2c6d5]/40 shadow-xs'
                      }`}
                    >
                      {/* Banner Thumbnail */}
                      {ev.banner_url ? (
                        <div
                          className="w-full h-32 bg-cover bg-center"
                          style={{ backgroundImage: `url(${ev.banner_url})` }}
                        />
                      ) : (
                        <div
                          className={`w-full h-32 flex items-center justify-center ${
                            isPublished
                              ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100'
                              : 'bg-[#f2f3fd]'
                          }`}
                        >
                          <Calendar className={`w-10 h-10 ${isPublished ? 'text-emerald-500/60' : 'text-[#c2c6d5]'}`} />
                        </div>
                      )}

                      <div className="p-4.5 space-y-3 flex-1 flex flex-col">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.color}`}
                            >
                              {catMeta.icon}
                              <span>{catMeta.label}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f2f3fd] text-[#424753] border border-[#c2c6d5]/40">
                              {locMeta.icon}
                              <span>{locMeta.label}</span>
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              isPublished
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-[#f2f3fd] text-[#727785] border border-[#c2c6d5]/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPublished ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'
                              }`}
                            />
                            {isPublished ? 'Live On Landing Page' : 'Draft'}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-[#191b22] text-sm leading-snug">{ev.title}</h3>

                        <div className="text-xs text-[#727785] space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#0058bd] shrink-0" />
                            <span>
                              {formatDateShort(ev.date_start)} — {formatDateShort(ev.date_end)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#006e2c] shrink-0" />
                            <span className="truncate">{ev.venue_or_link}</span>
                          </div>
                          {ev.speaker_name && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[#765700] shrink-0" />
                              <span className="font-medium text-[#424753]">
                                {ev.speaker_name}
                                {ev.speaker_title ? ` · ${ev.speaker_title}` : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {ev.description && (
                          <p className="text-xs text-[#727785] line-clamp-2 leading-relaxed">{ev.description}</p>
                        )}

                        {/* Bottom Actions & Live Sync Toggle */}
                        <div className="mt-auto pt-3 border-t border-[#c2c6d5]/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleEventPublish(ev)}
                              className="flex items-center gap-1.5 cursor-pointer"
                              title={isPublished ? 'Move to draft' : 'Publish to landing page'}
                            >
                              {isPublished ? (
                                <ToggleRight className="w-8 h-8 text-[#006e2c]" />
                              ) : (
                                <ToggleLeft className="w-8 h-8 text-[#c2c6d5]" />
                              )}
                              <span
                                className={`text-[11px] font-bold ${
                                  isPublished ? 'text-[#006e2c]' : 'text-[#727785]'
                                }`}
                              >
                                {isPublished ? 'Live' : 'Draft'}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {ev.rsvp_url && (
                              <a
                                href={ev.rsvp_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-[#f2f3fd] rounded-lg text-[#0058bd] hover:bg-[#0058bd] hover:text-white transition-all"
                                title="Open RSVP Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setEditEvent(ev);
                                setShowEventForm(false);
                              }}
                              className="p-1.5 bg-[#f2f3fd] rounded-lg text-[#424753] hover:bg-[#191b22] hover:text-white transition-all cursor-pointer"
                              title="Edit Event"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev)}
                              className="p-1.5 bg-[#ffdad6] rounded-lg text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      </main>
    </div>
  </div>
);
}
