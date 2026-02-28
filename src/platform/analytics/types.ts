/**
 * DechBar Analytics System v1.0 — Type Definitions
 *
 * Central type file for the analytics module.
 * All database insert shapes, hook interfaces, and domain types.
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

// ============================================================
// Domain Enums / Literal Types
// ============================================================

export type AudioEventType =
  | 'play_started'
  | 'paused'
  | 'resumed'
  | 'seeked'
  | 'completed'
  | 'closed'
  | 'position_snapshot';

export type SessionType = 'preset' | 'custom' | 'smart' | 'daily_challenge';

export type Platform = 'web' | 'ios' | 'android';

export type ActivityPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

// ============================================================
// Audio Session Context
// Derived from Track object in StickyPlayer
// ============================================================

export interface AudioSessionContext {
  lessonId: string;
  lessonTitle: string;
  seriesId?: string;
  seriesTitle?: string;
  programId?: string;
  programTitle?: string;
  categorySlug: string;
  categoryTitle: string;
  audioDurationSeconds: number;
}

// ============================================================
// Database Insert Shapes
// ============================================================

export interface AudioSessionInsert {
  session_id: string;
  user_id: string;
  lesson_id: string;
  lesson_title?: string;
  series_id?: string;
  series_title?: string;
  program_id?: string;
  program_title?: string;
  category_slug: string;
  category_title?: string;
  started_at: string;
  ended_at?: string;
  audio_duration_seconds?: number;
  unique_listen_seconds: number;
  completion_percent: number;
  is_completed: boolean;
  was_abandoned?: boolean;
  seek_count: number;
  pause_count: number;
  platform?: Platform;
}

export interface AudioEventInsert {
  session_id: string;
  user_id: string;
  lesson_id: string;
  event_type: AudioEventType;
  position_seconds?: number;
  listen_percent?: number;
  seek_from_seconds?: number;
  seek_to_seconds?: number;
}

export interface ActivityLogInsert {
  user_id: string;
  event_type: 'app_open';
  platform?: Platform;
}

// ============================================================
// Streak State
// ============================================================

export interface ActivityStreakState {
  userId: string;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string | null;   // ISO date string YYYY-MM-DD
  graceDayUsed: boolean;
  streakStartedAt: string | null;  // ISO date string
}

// ============================================================
// Admin Dashboard Data
// ============================================================

export interface DailyKpis {
  date: string;            // YYYY-MM-DD
  dauL1: number;           // opened app
  dauL2: number;           // started activity
  dauL3: number;           // completed activity
  newRegistrations: number;
  totalMinutesBeathed: number;
  totalAudioSessions: number;
  completedAudioSessions: number;
  totalExerciseSessions: number;
  completedExerciseSessions: number;
}

export interface TopContentItem {
  lessonId: string;
  lessonTitle: string;
  programTitle: string | null;
  categorySlug: string;
  playCount: number;
  completionRate: number;  // 0-100 %
  favoriteCount: number;
}

export interface AdminDashboardData {
  period: 'yesterday' | '7days' | '30days';
  kpis: DailyKpis[];
  topContent: TopContentItem[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================
// User Pokrok (Progress) Stats
// ============================================================

export interface ActivityDayData {
  date: string;           // YYYY-MM-DD
  minutes: number;        // total minutes active
  activityCount: number;  // number of sessions
}

export interface UserPokrokStats {
  period: ActivityPeriod;
  totalMinutes: number;
  totalActivities: number;
  activeDays: number;
  averageMinutesPerDay: number;
  periodDays: number;              // actual elapsed days used as divisor
  registeredAt: string | null;     // ISO date — for "member X days" display
  // Previous period comparison (null for 'all' or year in 2026 — no meaningful prev period)
  prevTotalMinutes: number | null;
  prevTotalActivities: number | null;
  prevActiveDays: number | null;
  prevAverageMinutesPerDay: number | null;
  streak: ActivityStreakState | null;
  activityGraph: ActivityDayData[];  // last 84 days (12 weeks)
  isLoading: boolean;
  error: string | null;
}
