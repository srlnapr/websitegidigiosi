import { NextResponse } from 'next/server';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const ADMIN_USER = {
  name: 'Rizqi Pratama (Lead Admin)',
  email: 'admin@gdgpurwokerto.com',
  password: 'AdminGDG2026!',
  role: 'admin',
  student_id: '20102001',
  h3_role: 'Hustler',
  matchmaking_status: 'idle',
};

const MEMBER_USERS = [
  {
    name: 'Budi Santoso (Hacker)',
    email: 'budi.hacker@gdgpurwokerto.com',
    password: 'Hacker123!',
    role: 'member',
    student_id: '20102045',
    h3_role: 'Hacker',
    matchmaking_status: 'waiting',
  },
  {
    name: 'Siti Aisyah (Hipster)',
    email: 'siti.hipster@gdgpurwokerto.com',
    password: 'Hipster123!',
    role: 'member',
    student_id: '20102078',
    h3_role: 'Hipster',
    matchmaking_status: 'waiting',
  },
  {
    name: 'Dimas Arya (Hustler)',
    email: 'dimas.hustler@gdgpurwokerto.com',
    password: 'Hustler123!',
    role: 'member',
    student_id: '20102092',
    h3_role: 'Hustler',
    matchmaking_status: 'waiting',
  },
  {
    name: 'Nadia Putri',
    email: 'nadia.dev@gdgpurwokerto.com',
    password: 'Member123!',
    role: 'member',
    student_id: '20102110',
    h3_role: 'Hacker',
    matchmaking_status: 'idle',
  },
];

const DUMMY_EVENTS = [
  {
    title: 'Google Solution Challenge 2026 Kickoff & Ideation',
    category: 'Hackathon',
    date_start: '2026-09-15T09:00:00Z',
    date_end: '2026-09-15T15:00:00Z',
    location_type: 'Hybrid',
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
    location_type: 'Offline',
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
    location_type: 'Online',
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
    location_type: 'Offline',
    venue_or_link: 'Coworking Space Telkom Purwokerto',
    speaker_name: 'Core Chapter Leads GDG Telkom',
    description: 'Temu komunitas developer, perkenalan roadmap program semester ini, dan networking bareng tech enthusiast.',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    rsvp_url: 'https://gdg.community.dev/events/details/developer-student-clubs-telkom-university-purwokerto-presents-info-session/',
  },
];

const DUMMY_MILESTONES = [
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

async function getOrCreateUser(u: { email: string; password: string; name: string; role: string; student_id?: string; h3_role?: string; matchmaking_status?: string }) {
  let uid = '';
  try {
    const res = await createUserWithEmailAndPassword(auth, u.email, u.password);
    uid = res.user.uid;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/email-already-in-use') {
      const login = await signInWithEmailAndPassword(auth, u.email, u.password);
      uid = login.user.uid;
    } else {
      throw err;
    }
  }

  if (uid) {
    await setDoc(
      doc(db, 'users', uid),
      {
        name: u.name,
        email: u.email,
        role: u.role,
        student_id: u.student_id || '',
        h3_role: u.h3_role || 'Hacker',
        matchmaking_status: u.matchmaking_status || 'idle',
        team_id: null,
        created_at: serverTimestamp(),
      },
      { merge: true }
    );
  }
  return uid;
}

export async function GET() {
  const results = {
    usersCreated: [] as string[],
    eventsCreated: [] as string[],
    milestonesCreated: [] as string[],
    errors: [] as string[],
  };

  try {
    // 1. Create/Login as Admin first
    await getOrCreateUser(ADMIN_USER);
    results.usersCreated.push(`${ADMIN_USER.name} (${ADMIN_USER.email}) [Password: ${ADMIN_USER.password}]`);

    // Ensure Admin is actively signed in for Firestore writes
    await signInWithEmailAndPassword(auth, ADMIN_USER.email, ADMIN_USER.password);

    // 2. Create Events (as admin)
    for (const ev of DUMMY_EVENTS) {
      try {
        await addDoc(collection(db, 'events'), {
          ...ev,
          created_at: new Date().toISOString(),
        });
        results.eventsCreated.push(ev.title);
      } catch (err: unknown) {
        results.errors.push(`Event "${ev.title}": ${(err as Error).message}`);
      }
    }

    // 3. Create Milestones (as admin)
    for (const ms of DUMMY_MILESTONES) {
      try {
        await addDoc(collection(db, 'milestones'), {
          ...ms,
          created_at: new Date().toISOString(),
        });
        results.milestonesCreated.push(ms.title);
      } catch (err: unknown) {
        results.errors.push(`Milestone "${ms.title}": ${(err as Error).message}`);
      }
    }

    // 4. Create Member Users
    for (const u of MEMBER_USERS) {
      try {
        await getOrCreateUser(u);
        results.usersCreated.push(`${u.name} (${u.email}) [Password: ${u.password}]`);
      } catch (err: unknown) {
        results.errors.push(`User ${u.email}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dummy accounts, events, and milestones created successfully!',
      results,
      allUsers: [ADMIN_USER, ...MEMBER_USERS].map((u) => ({
        name: u.name,
        role: u.role,
        h3_role: u.h3_role,
        email: u.email,
        password: u.password,
      })),
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error occurred while seeding.' },
      { status: 500 }
    );
  }
}
