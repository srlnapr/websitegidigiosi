export interface MilestoneSubmissionField {
  github_url: boolean;
  figma_url: boolean;
  live_demo_url: boolean;
  video_url: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string; // ISO String (e.g. 2026-09-15T23:59:00Z)
  required_fields: MilestoneSubmissionField;
  is_locked_after_due: boolean;
  status: 'active' | 'closed';
  created_at: string;
}

export type EventCategory = 'Workshop' | 'Info Session' | 'Hackathon' | 'Study Jam';
export type LocationType = 'offline' | 'online' | 'hybrid';
export type EventStatus = 'draft' | 'published';

export interface ChapterEvent {
  id: string;
  title: string;
  category: EventCategory;
  banner_url?: string;
  date_start: string; // ISO String
  date_end: string;   // ISO String
  location_type: LocationType;
  venue_or_link: string;
  description: string;
  speaker_name?: string;
  speaker_title?: string;
  rsvp_url?: string;
  status: EventStatus;
  created_at: string;
}

export interface TeamSubmission {
  id: string;
  team_id: string;
  team_name: string;
  milestone_id: string;
  github_url?: string;
  figma_url?: string;
  live_demo_url?: string;
  video_url?: string;
  submitted_at: string;
  reviewed: boolean;
}
