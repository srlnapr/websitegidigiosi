import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Milestone, ChapterEvent, TeamSubmission } from '@/types/admin';

// ─────────────────────────────────────────────
// DEFAULT DUMMY DATA FALLBACKS
// (Used when Firestore collections are empty or offline)
// ─────────────────────────────────────────────

export const DEFAULT_DUMMY_EVENTS: ChapterEvent[] = [
  {
    id: 'default-event-1',
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
    created_at: '2026-08-30T10:00:00Z',
  },
  {
    id: 'default-event-2',
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
    created_at: '2026-08-30T10:00:00Z',
  },
  {
    id: 'default-event-3',
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
    created_at: '2026-08-30T10:00:00Z',
  },
  {
    id: 'default-event-4',
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
    created_at: '2026-08-30T10:00:00Z',
  },
];

export const DEFAULT_DUMMY_MILESTONES: Milestone[] = [
  {
    id: 'default-milestone-1',
    title: 'Milestone 1: Problem Definition & Wireframe Prototype',
    description: 'Submit problem statement aligning with UN SDGs and interactive Figma wireframe prototype.',
    due_date: '2026-09-20T23:59:00Z',
    required_fields: { github_url: false, figma_url: true, live_demo_url: false, video_url: false },
    is_locked_after_due: false,
    status: 'active',
    created_at: '2026-08-30T10:00:00Z',
  },
  {
    id: 'default-milestone-2',
    title: 'Milestone 2: MVP Architecture & Core Frontend/Backend Repository',
    description: 'Submit working code repository on GitHub and public deployed URL demo.',
    due_date: '2026-10-10T23:59:00Z',
    required_fields: { github_url: true, figma_url: false, live_demo_url: true, video_url: false },
    is_locked_after_due: false,
    status: 'active',
    created_at: '2026-08-30T10:00:00Z',
  },
  {
    id: 'default-milestone-3',
    title: 'Milestone 3: Final Pitch Video & Solution Submission',
    description: 'Complete deliverable bundle: GitHub code, live web/app URL, and YouTube demo video (max 3 min).',
    due_date: '2026-10-30T23:59:00Z',
    required_fields: { github_url: true, figma_url: true, live_demo_url: true, video_url: true },
    is_locked_after_due: false,
    status: 'active',
    created_at: '2026-08-30T10:00:00Z',
  },
];

// ─────────────────────────────────────────────
// MILESTONES
// ─────────────────────────────────────────────

export async function createMilestone(
  data: Omit<Milestone, 'id' | 'created_at'>
): Promise<{ success: boolean; milestone?: Milestone; error?: string }> {
  try {
    const docRef = await addDoc(collection(db, 'milestones'), {
      ...data,
      created_at: new Date().toISOString(),
    });
    return {
      success: true,
      milestone: { id: docRef.id, created_at: new Date().toISOString(), ...data },
    };
  } catch (err) {
    console.error('createMilestone error:', err);
    return { success: false, error: 'Failed to create milestone.' };
  }
}

export async function updateMilestone(
  id: string,
  data: Partial<Milestone>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'milestones', id), data as Record<string, unknown>);
    return { success: true };
  } catch (err) {
    console.error('updateMilestone error:', err);
    return { success: false, error: 'Failed to update milestone.' };
  }
}

export async function deleteMilestone(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'milestones', id));
    return { success: true };
  } catch (err) {
    console.error('deleteMilestone error:', err);
    return { success: false, error: 'Failed to delete milestone.' };
  }
}

export async function getActiveMilestones(): Promise<Milestone[]> {
  try {
    const snap = await getDocs(collection(db, 'milestones'));
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Milestone));
    if (list.length === 0) {
      list = DEFAULT_DUMMY_MILESTONES;
    }
    return list
      .filter((m) => m.status === 'active')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  } catch (err) {
    console.error('getActiveMilestones error:', err);
    return DEFAULT_DUMMY_MILESTONES.filter((m) => m.status === 'active');
  }
}

export async function getAllMilestones(): Promise<Milestone[]> {
  try {
    const snap = await getDocs(collection(db, 'milestones'));
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Milestone));
    if (list.length === 0) {
      list = DEFAULT_DUMMY_MILESTONES;
    }
    return list.sort(
      (a, b) => new Date(b.created_at || b.due_date).getTime() - new Date(a.created_at || a.due_date).getTime()
    );
  } catch (err) {
    console.error('getAllMilestones error:', err);
    return DEFAULT_DUMMY_MILESTONES;
  }
}

// ─────────────────────────────────────────────
// CHAPTER EVENTS
// ─────────────────────────────────────────────

export async function createEvent(
  data: Omit<ChapterEvent, 'id' | 'created_at'>
): Promise<{ success: boolean; event?: ChapterEvent; error?: string }> {
  try {
    const docRef = await addDoc(collection(db, 'events'), {
      ...data,
      created_at: new Date().toISOString(),
    });
    return {
      success: true,
      event: { id: docRef.id, created_at: new Date().toISOString(), ...data },
    };
  } catch (err) {
    console.error('createEvent error:', err);
    return { success: false, error: 'Failed to create event.' };
  }
}

export async function updateEvent(
  id: string,
  data: Partial<ChapterEvent>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'events', id), data as Record<string, unknown>);
    return { success: true };
  } catch (err) {
    console.error('updateEvent error:', err);
    return { success: false, error: 'Failed to update event.' };
  }
}

export async function deleteEvent(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'events', id));
    return { success: true };
  } catch (err) {
    console.error('deleteEvent error:', err);
    return { success: false, error: 'Failed to delete event.' };
  }
}

export async function getPublishedEvents(): Promise<ChapterEvent[]> {
  try {
    const snap = await getDocs(collection(db, 'events'));
    let events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChapterEvent));
    if (events.length === 0) {
      events = DEFAULT_DUMMY_EVENTS;
    }
    return events
      .filter((e) => e.status === 'published')
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
  } catch (err) {
    console.error('getPublishedEvents error:', err);
    return DEFAULT_DUMMY_EVENTS.filter((e) => e.status === 'published');
  }
}

export async function getAllEvents(): Promise<ChapterEvent[]> {
  try {
    const snap = await getDocs(collection(db, 'events'));
    let events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChapterEvent));
    if (events.length === 0) {
      events = DEFAULT_DUMMY_EVENTS;
    }
    return events.sort(
      (a, b) => new Date(b.created_at || b.date_start).getTime() - new Date(a.created_at || a.date_start).getTime()
    );
  } catch (err) {
    console.error('getAllEvents error:', err);
    return DEFAULT_DUMMY_EVENTS;
  }
}

// ─────────────────────────────────────────────
// TEAM SUBMISSIONS
// ─────────────────────────────────────────────

export async function getMilestoneSubmissions(
  milestoneId: string
): Promise<TeamSubmission[]> {
  try {
    const snap = await getDocs(collection(db, 'submissions'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as TeamSubmission))
      .filter((s) => s.milestone_id === milestoneId)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  } catch (err) {
    console.error('getMilestoneSubmissions error:', err);
    return [];
  }
}

export async function getAllPendingSubmissions(): Promise<TeamSubmission[]> {
  try {
    const snap = await getDocs(collection(db, 'submissions'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as TeamSubmission))
      .filter((s) => s.reviewed === false);
  } catch (err) {
    console.error('getAllPendingSubmissions error:', err);
    return [];
  }
}

export async function getAllSubmissions(): Promise<TeamSubmission[]> {
  try {
    const snap = await getDocs(collection(db, 'submissions'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamSubmission));
  } catch (err) {
    console.error('getAllSubmissions error:', err);
    return [];
  }
}

export async function markSubmissionReviewed(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'submissions', submissionId), { reviewed: true });
    return { success: true };
  } catch (err) {
    console.error('markSubmissionReviewed error:', err);
    return { success: false, error: 'Failed to mark as reviewed.' };
  }
}

export { Timestamp };
