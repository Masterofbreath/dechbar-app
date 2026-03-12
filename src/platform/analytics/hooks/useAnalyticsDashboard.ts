/**
 * useAnalyticsDashboard — Admin Analytics Query Hooks
 *
 * Provides React Query hooks for the admin analytics dashboard.
 *
 * Periods:
 *   'today'     → LIVE queries (audio_sessions, exercise_sessions, user_activity_log)
 *   'yesterday' → LIVE queries for yesterday date range
 *   'week'      → LIVE queries for Mon–yesterday + today from live hook
 *   'month'     → LIVE queries for 1st–yesterday + today from live hook
 *   'year'      → LIVE queries for Jan1–yesterday + today from live hook
 *
 * NOTE: platform_daily_stats (cron-based) is bypassed. All periods use direct
 * raw-table queries. Set up pg_cron `aggregate-daily-stats` to optimise large
 * date ranges in the future.
 *
 * Access control: Admin/CEO role enforced at DB level (RLS).
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { secondsToMinutes, toIsoDateString } from '../utils/time';
import type { AdminDashboardData, DailyKpis, TopContentItem } from '../types';

// ============================================================
// Query Keys
// ============================================================

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (period: string) => ['analytics', 'dashboard', period] as const,
  topContent: (limit: number) => ['analytics', 'topContent', limit] as const,
  totalUsers: ['analytics', 'totalUsers'] as const,
};

// ============================================================
// Helpers
// ============================================================

function daysBack(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ============================================================
// useAdminDashboardToday — Real-time live queries for today
// ============================================================

function useAdminDashboardToday() {
  return useQuery({
    queryKey: analyticsKeys.dashboard('today'),
    queryFn: async (): Promise<DailyKpis[]> => {
      const start = todayStart();
      const today = new Date().toISOString().slice(0, 10);

      // Parallel queries
      const [activityLog, audioSessions, exerciseSessions, newProfiles] = await Promise.all([
        supabase
          .from('user_activity_log')
          .select('user_id')
          .gte('created_at', start)
          .eq('event_type', 'app_open'),
        supabase
          .from('audio_sessions')
          .select('user_id, unique_listen_seconds, is_completed, started_at')
          .gte('started_at', start),
        supabase
          .from('exercise_sessions')
          .select('user_id, started_at, completed_at, was_completed')
          .gte('started_at', start),
        // Use RPC for reliable admin count bypassing RLS
        supabase.rpc('get_new_registrations_in_range', {
          from_ts: start,
          to_ts: new Date().toISOString(),
        }),
      ]);

      const dauL1 = new Set((activityLog.data ?? []).map((r) => r.user_id)).size;

      const dauL2Set = new Set([
        ...(audioSessions.data ?? []).map((r) => r.user_id),
        ...(exerciseSessions.data ?? []).map((r) => r.user_id),
      ]);
      const dauL2 = dauL2Set.size;

      const dauL3Set = new Set([
        ...(audioSessions.data ?? []).filter((r) => r.is_completed).map((r) => r.user_id),
        ...(exerciseSessions.data ?? []).filter((r) => r.was_completed).map((r) => r.user_id),
      ]);
      const dauL3 = dauL3Set.size;

      const audioMinutes = (audioSessions.data ?? []).reduce(
        (sum, r) => sum + secondsToMinutes(r.unique_listen_seconds ?? 0),
        0
      );
      const exerciseMinutes = (exerciseSessions.data ?? []).reduce((sum, r) => {
        const durationSec = r.completed_at && r.started_at
          ? (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000
          : 0;
        return sum + secondsToMinutes(Math.max(0, durationSec));
      }, 0);

      return [{
        date: today,
        dauL1,
        dauL2,
        dauL3,
        newRegistrations: (newProfiles.data as number) ?? 0,
        totalMinutesBeathed: Math.round((audioMinutes + exerciseMinutes) * 10) / 10,
        totalAudioSessions: (audioSessions.data ?? []).length,
        completedAudioSessions: (audioSessions.data ?? []).filter((r) => r.is_completed).length,
        totalExerciseSessions: (exerciseSessions.data ?? []).length,
        completedExerciseSessions: (exerciseSessions.data ?? []).filter((r) => r.was_completed).length,
      }];
    },
    staleTime: 60 * 1000, // 1 minute — live data
    refetchInterval: 2 * 60 * 1000, // auto-refresh every 2 min
  });
}

// ============================================================
// useAdminDashboard — Main hook
// Combines today's live data with cron historical data.
// ============================================================

export type DashboardPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year';

/** Returns ISO date string for the start of the admin dashboard period. */
function getAdminPeriodStart(period: DashboardPeriod): string {
  const now = new Date();
  switch (period) {
    case 'yesterday': {
      const d = new Date(now); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0);
      return toIsoDateString(d);
    }
    case 'week': {
      // Monday of current week
      const dow = now.getDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      const mon = new Date(now); mon.setDate(mon.getDate() + diff); mon.setHours(0, 0, 0, 0);
      return toIsoDateString(mon);
    }
    case 'month': {
      return toIsoDateString(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    case 'year': {
      // Use app launch date as year start — prevents phantom data from Jan–Feb
      // test sessions that predate the actual launch. Next year we'll switch to Jan 1.
      const launchDate = new Date('2026-02-28T00:00:00.000Z');
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return toIsoDateString(yearStart > launchDate ? yearStart : launchDate);
    }
    default: return toIsoDateString(now); // 'today' handled separately
  }
}

/**
 * Returns { from, to } date strings for the FULL previous admin period.
 *
 * Admin logic: compare current partial period against the COMPLETE previous period.
 * Goal: "How many users do I need to match/beat last week's total?"
 *
 * Examples (today = Wed Mar 4):
 *   today     → yesterday (full day)
 *   yesterday → day-before-yesterday (full day)
 *   week      → last FULL week Mon Feb 24 – Sun Mar 2  (not elapsed window)
 *   month     → last FULL month Feb 1 – Feb 28
 *   year      → last full year (only from 2027+)
 */
function getAdminPrevPeriodRange(period: DashboardPeriod): { from: string; to: string } | null {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      const s = toIsoDateString(d);
      return { from: s, to: s };
    }
    case 'yesterday': {
      const d = new Date(now); d.setDate(d.getDate() - 2);
      const s = toIsoDateString(d);
      return { from: s, to: s };
    }
    case 'week': {
      // Last FULL week: Mon–Sun before this week
      const dow = now.getDay();
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      const thisMonday = new Date(now);
      thisMonday.setDate(thisMonday.getDate() + mondayOffset);
      thisMonday.setHours(0, 0, 0, 0);
      const lastSunday  = new Date(thisMonday); lastSunday.setDate(lastSunday.getDate() - 1);
      const lastMonday  = new Date(thisMonday); lastMonday.setDate(lastMonday.getDate() - 7);
      return { from: toIsoDateString(lastMonday), to: toIsoDateString(lastSunday) };
    }
    case 'month': {
      // Last FULL calendar month: 1st to last day
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastOfLastMonth  = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toIsoDateString(firstOfLastMonth), to: toIsoDateString(lastOfLastMonth) };
    }
    case 'year': {
      if (now.getFullYear() <= 2026) return null;
      const firstOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const lastOfLastYear  = new Date(now.getFullYear() - 1, 11, 31);
      return { from: toIsoDateString(firstOfLastYear), to: toIsoDateString(lastOfLastYear) };
    }
    default: return null;
  }
}

/**
 * Queries raw tables (audio_sessions, exercise_sessions, user_activity_log)
 * for a date range and returns per-day DailyKpis[].
 *
 * Replaces platform_daily_stats / fetchCronKpis which relied on a nightly
 * cron job that was never set up in production.
 *
 * @param fromDate  ISO date string, e.g. '2026-03-01'
 * @param toDate    ISO date string (inclusive). Defaults to fromDate.
 */
async function fetchLiveKpisByRange(fromDate: string, toDate?: string): Promise<DailyKpis[]> {
  const endDate = toDate ?? fromDate;

  // Guard: avoid reversed range (e.g. week starting today = only today data)
  if (fromDate > endDate) return [];

  const startISO = `${fromDate}T00:00:00.000Z`;
  const endISO   = `${endDate}T23:59:59.999Z`;

  const [audioRes, exerciseRes, activityRes, profilesRes] = await Promise.all([
    supabase
      .from('audio_sessions')
      .select('user_id, unique_listen_seconds, is_completed, started_at')
      .gte('started_at', startISO)
      .lte('started_at', endISO)
      .limit(10000),
    supabase
      .from('exercise_sessions')
      .select('user_id, started_at, completed_at, was_completed')
      .gte('started_at', startISO)
      .lte('started_at', endISO)
      .limit(10000),
    supabase
      .from('user_activity_log')
      .select('user_id, created_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .eq('event_type', 'app_open')
      .limit(10000),
    // New registrations via SECURITY DEFINER RPC (bypasses RLS on auth.users)
    supabase.rpc('get_daily_new_registrations', {
      from_ts: startISO,
      to_ts: endISO,
    }),
  ]);

  if (audioRes.error) throw new Error(audioRes.error.message);
  if (exerciseRes.error) throw new Error(exerciseRes.error.message);

  // Build per-day registration map from RPC result (may return [] if RPC missing)
  const regByDay = new Map<string, number>();
  for (const row of ((profilesRes.data ?? []) as Array<{ reg_date: string; count: number }>)) {
    regByDay.set(row.reg_date, Number(row.count));
  }

  // Generate all calendar dates in range
  const days: string[] = [];
  const fromMs = new Date(`${fromDate}T12:00:00.000Z`).getTime();
  const toMs   = new Date(`${endDate}T12:00:00.000Z`).getTime();
  for (let ms = fromMs; ms <= toMs; ms += 86_400_000) {
    days.push(new Date(ms).toISOString().slice(0, 10));
  }

  return days.map((date) => {
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd   = `${date}T23:59:59.999Z`;
    const inDay    = (ts: string | null) => !!ts && ts >= dayStart && ts <= dayEnd;

    const dayAudio    = (audioRes.data ?? []).filter((r) => inDay(r.started_at));
    const dayExercise = (exerciseRes.data ?? []).filter((r) => inDay(r.started_at));
    const dayActivity = (activityRes.data ?? []).filter((r) => inDay(r.created_at));

    const dauL1 = new Set(dayActivity.map((r) => r.user_id)).size;
    const dauL2Set = new Set([
      ...dayAudio.map((r) => r.user_id),
      ...dayExercise.map((r) => r.user_id),
    ]);
    const dauL3Set = new Set([
      ...dayAudio.filter((r) => r.is_completed).map((r) => r.user_id),
      ...dayExercise.filter((r) => r.was_completed).map((r) => r.user_id),
    ]);

    const audioMinutes = dayAudio.reduce(
      (sum, r) => sum + secondsToMinutes(r.unique_listen_seconds ?? 0), 0,
    );
    const exerciseMinutes = dayExercise.reduce((sum, r) => {
      const dur = r.completed_at && r.started_at
        ? (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000
        : 0;
      return sum + secondsToMinutes(Math.max(0, dur));
    }, 0);

    return {
      date,
      dauL1,
      dauL2: dauL2Set.size,
      dauL3: dauL3Set.size,
      newRegistrations: regByDay.get(date) ?? 0,
      totalMinutesBeathed: Math.round((audioMinutes + exerciseMinutes) * 10) / 10,
      totalAudioSessions: dayAudio.length,
      completedAudioSessions: dayAudio.filter((r) => r.is_completed).length,
      totalExerciseSessions: dayExercise.length,
      completedExerciseSessions: dayExercise.filter((r) => r.was_completed).length,
    };
  });
}

export function useAdminDashboard(
  period: DashboardPeriod = 'today'
): AdminDashboardData & { prevKpis: DailyKpis[] } {
  const isTodayPeriod = period === 'today';
  const fromDate = period !== 'today' ? getAdminPeriodStart(period) : daysBack(0);
  const prevRange = getAdminPrevPeriodRange(period);
  const prevFromDate = prevRange?.from ?? daysBack(1);
  const prevToDate = prevRange?.to ?? daysBack(1);

  // Real-time today — always mounted
  const todayQuery = useAdminDashboardToday();

  // Historical live data (always queries raw tables, not cron cache)
  // For multi-day periods we fetch from period start to YESTERDAY — today is
  // always added separately from the live hook to avoid double-counting.
  const histToDate = daysBack(1);
  const { data: cronData, isLoading, error } = useQuery({
    // Include histToDate in key so cache invalidates when the calendar day changes
    queryKey: [...analyticsKeys.dashboard(period), histToDate] as const,
    enabled: !isTodayPeriod,
    queryFn: () => fetchLiveKpisByRange(fromDate, histToDate),
    staleTime: 2 * 60 * 1000,
  });

  // Previous period — for comparison deltas
  const { data: prevData } = useQuery({
    queryKey: [...analyticsKeys.dashboard(period), 'prev'],
    enabled: !isTodayPeriod && !!prevRange,
    queryFn: () => fetchLiveKpisByRange(prevFromDate, prevToDate),
    staleTime: 5 * 60 * 1000,
  });

  // For today: compare against yesterday (live query)
  const { data: yesterdayData } = useQuery({
    queryKey: analyticsKeys.dashboard('yesterday'),
    enabled: isTodayPeriod,
    queryFn: () => fetchLiveKpisByRange(daysBack(1), daysBack(1)),
    staleTime: 2 * 60 * 1000,
  });

  if (isTodayPeriod) {
    return {
      period,
      kpis: todayQuery.data ?? [],
      prevKpis: yesterdayData ?? [],
      topContent: [],
      isLoading: todayQuery.isLoading,
      error: todayQuery.error ? (todayQuery.error as Error).message : null,
    };
  }

  // For multi-day periods: combine today's live data with cron history (exclude yesterday-only)
  const todayKpis = todayQuery.data ?? [];
  const combinedKpis = period !== 'yesterday'
    ? [...todayKpis, ...(cronData ?? [])]
    : (cronData ?? []);

  return {
    period,
    kpis: combinedKpis,
    prevKpis: prevData ?? [],
    topContent: [],
    isLoading: isLoading || todayQuery.isLoading,
    error: error ? (error as Error).message : null,
  };
}

// ============================================================
// useUniqueActiveUsers — DISTINCT users with ≥1 session in a period
//
// Fixes the "dauL2 summing" bug: for multi-day periods (week/month/year)
// sumKpi(kpis, 'dauL2') sums per-day values which double-counts the same
// user across multiple days. This hook calls get_unique_active_users_in_range
// RPC which returns COUNT(DISTINCT user_id) across both audio + exercise
// sessions for the entire range — always a correct unique count.
// ============================================================

export function useUniqueActiveUsers(
  period: DashboardPeriod,
): { count: number; prevCount: number; isLoading: boolean } {
  const now = new Date();

  // Compute [fromISO, toISO] for current period
  const { fromISO, toISO } = (() => {
    const todayEnd = now.toISOString();
    if (period === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      return { fromISO: start.toISOString(), toISO: todayEnd };
    }
    if (period === 'yesterday') {
      const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setDate(e.getDate() - 1); e.setHours(23, 59, 59, 999);
      return { fromISO: s.toISOString(), toISO: e.toISOString() };
    }
    const periodStart = getAdminPeriodStart(period);
    return { fromISO: `${periodStart}T00:00:00.000Z`, toISO: todayEnd };
  })();

  // Compute [prevFromISO, prevToISO] for comparison delta
  const prevRange = getAdminPrevPeriodRange(period);
  const prevFromISO = prevRange ? `${prevRange.from}T00:00:00.000Z` : null;
  const prevToISO   = prevRange ? `${prevRange.to}T23:59:59.999Z`   : null;

  const { data: count, isLoading } = useQuery({
    queryKey: ['analytics', 'uniqueActive', period, fromISO] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unique_active_users_in_range', {
        from_ts: fromISO,
        to_ts: toISO,
      });
      if (error) throw new Error(error.message);
      return (data as number) ?? 0;
    },
    staleTime: period === 'today' ? 60 * 1000 : 2 * 60 * 1000,
    refetchInterval: period === 'today' ? 2 * 60 * 1000 : undefined,
  });

  const { data: prevCount } = useQuery({
    queryKey: ['analytics', 'uniqueActive', period, 'prev', prevFromISO] as const,
    enabled: !!prevFromISO,
    queryFn: async () => {
      if (!prevFromISO || !prevToISO) return 0;
      const { data, error } = await supabase.rpc('get_unique_active_users_in_range', {
        from_ts: prevFromISO,
        to_ts: prevToISO,
      });
      if (error) throw new Error(error.message);
      return (data as number) ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { count: count ?? 0, prevCount: prevCount ?? 0, isLoading };
}

// ============================================================
// useAvgMinutesPerActiveUserDay — avg min/user on active days
//
// "On days when a user trains, how many minutes do they spend on average?"
// Uses get_avg_minutes_per_active_user_day RPC which calculates:
//   AVG of (sum of minutes per user per calendar day) across all user-day pairs.
// Respects the selected dashboard period (today/week/month/year).
// ============================================================

export function useAvgMinutesPerActiveUserDay(
  period: DashboardPeriod,
): { avgMinutes: number; prevAvgMinutes: number; isLoading: boolean } {
  const now = new Date();

  const { fromISO, toISO } = (() => {
    const todayEnd = now.toISOString();
    if (period === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      return { fromISO: start.toISOString(), toISO: todayEnd };
    }
    if (period === 'yesterday') {
      const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setDate(e.getDate() - 1); e.setHours(23, 59, 59, 999);
      return { fromISO: s.toISOString(), toISO: e.toISOString() };
    }
    const periodStart = getAdminPeriodStart(period);
    return { fromISO: `${periodStart}T00:00:00.000Z`, toISO: todayEnd };
  })();

  const prevRange = getAdminPrevPeriodRange(period);
  const prevFromISO = prevRange ? `${prevRange.from}T00:00:00.000Z` : null;
  const prevToISO   = prevRange ? `${prevRange.to}T23:59:59.999Z`   : null;

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'avgMinPerActiveDay', period, fromISO] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_avg_minutes_per_active_user_day', {
        from_ts: fromISO,
        to_ts: toISO,
      });
      if (error) throw new Error(error.message);
      return Number(data) || 0;
    },
    staleTime: period === 'today' ? 60 * 1000 : 5 * 60 * 1000,
    refetchInterval: period === 'today' ? 2 * 60 * 1000 : undefined,
  });

  const { data: prevData } = useQuery({
    queryKey: ['analytics', 'avgMinPerActiveDay', period, 'prev', prevFromISO] as const,
    enabled: !!prevFromISO,
    queryFn: async () => {
      if (!prevFromISO || !prevToISO) return 0;
      const { data, error } = await supabase.rpc('get_avg_minutes_per_active_user_day', {
        from_ts: prevFromISO,
        to_ts: prevToISO,
      });
      if (error) throw new Error(error.message);
      return Number(data) || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { avgMinutes: data ?? 0, prevAvgMinutes: prevData ?? 0, isLoading };
}

// ============================================================
// useTotalUsers — Total registered users (all time)
// ============================================================

export function useTotalUsers(): { count: number; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: analyticsKeys.totalUsers,
    queryFn: async () => {
      // Use SECURITY DEFINER RPC — bypasses RLS entirely for reliable count
      const { data, error } = await supabase.rpc('get_total_profiles_count');
      if (error) throw new Error(error.message);
      return (data as number) ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
  return { count: data ?? 0, isLoading };
}

// ============================================================
// useAllTimeMinutes — Total minutes breathed since launch
// ============================================================

/** Returns KPIs for the last 7 calendar days — used by BarChart for Dnes/Včera/Týden periods */
export function useAdminLast7DaysKpis(): { kpis: DailyKpis[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'last7days'] as const,
    queryFn: () => fetchLiveKpisByRange(daysBack(6), daysBack(0)),
    staleTime: 2 * 60 * 1000,
  });
  return { kpis: data ?? [], isLoading };
}

export function useAllTimeMinutes(): { minutes: number; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'allTimeMinutes'] as const,
    queryFn: async () => {
      // Uses SECURITY DEFINER RPC — bypasses RLS so ALL users' minutes are counted,
      // not just the currently logged-in user's own data.
      // fetchLiveKpisByRange would be filtered by RLS for non-admin users.
      const { data, error } = await supabase.rpc('get_all_time_minutes');
      if (error) throw new Error(error.message);
      return Math.round((Number(data) || 0) * 10) / 10;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  return { minutes: data ?? 0, isLoading };
}

// ============================================================
// usePrimeTime — hour-of-day distribution of all sessions
// ============================================================

// Minimum session duration to count as "genuine training" (not an accidental tap/open)
const MIN_GENUINE_SESSION_SEC = 120; // 2 minutes

export interface PrimeTimeSlot {
  hour: number;           // 0-23
  label: string;          // "06:00"
  totalCount: number;     // all sessions started in this hour (incl. abandoned)
  genuineCount: number;   // sessions ≥ 2 min (actual training)
  totalMinutes: number;   // sum of minutes from genuine sessions
  avgMinutes: number;     // average minutes per genuine session
  score: number;          // weighted score = totalMinutes × completionRate (0–100, bars are based on this)
  pct: number;            // score as % of peak hour score (for bar height)
}

export function usePrimeTime(): { slots: PrimeTimeSlot[]; peakHour: number | null; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'primeTime'] as const,
    queryFn: async () => {
      const thirtyDaysAgo = daysBack(30);
      const [audioRes, exerciseRes] = await Promise.all([
        supabase.from('audio_sessions').select('started_at, unique_listen_seconds').gte('started_at', thirtyDaysAgo),
        supabase.from('exercise_sessions').select('started_at, completed_at').gte('started_at', thirtyDaysAgo),
      ]);

      const totalCounts = new Array(24).fill(0);
      const genuineCounts = new Array(24).fill(0);
      const minutes = new Array(24).fill(0);

      for (const r of (audioRes.data ?? [])) {
        if (!r.started_at) continue;
        const h = new Date(r.started_at).getHours();
        const sec = r.unique_listen_seconds ?? 0;
        totalCounts[h]++;
        if (sec >= MIN_GENUINE_SESSION_SEC) {
          genuineCounts[h]++;
          minutes[h] += secondsToMinutes(sec);
        }
      }
      for (const r of (exerciseRes.data ?? [])) {
        if (!r.started_at) continue;
        const h = new Date(r.started_at).getHours();
        totalCounts[h]++;
        if (r.completed_at) {
          const dur = (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000;
          if (dur >= MIN_GENUINE_SESSION_SEC) {
            genuineCounts[h]++;
            minutes[h] += secondsToMinutes(Math.min(dur, 7200));
          }
        }
      }

      // Weighted score = totalMinutes × completionRate
      // completionRate = genuineSessions / totalSessions (penalises hours with many abandoned sessions)
      const scores = totalCounts.map((total, h) => {
        if (total === 0) return 0;
        const completionRate = genuineCounts[h] / total;
        return minutes[h] * completionRate;
      });
      const maxScore = Math.max(...scores, 1);

      return scores.map((score, hour) => ({
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        totalCount: totalCounts[hour],
        genuineCount: genuineCounts[hour],
        totalMinutes: Math.round(minutes[hour]),
        avgMinutes: genuineCounts[hour] > 0 ? Math.round(minutes[hour] / genuineCounts[hour]) : 0,
        score: Math.round(score * 10) / 10,
        pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  // Peak hour = highest weighted score (not just session count)
  const peakHour = data
    ? data.reduce((max, s) => s.score > (data[max]?.score ?? 0) ? s.hour : max, 0)
    : null;

  return { slots: data ?? [], peakHour, isLoading };
}

// ============================================================
// useProtocolStats — protocol type completion rates
// ============================================================

export interface ProtocolStat {
  type: string;        // 'rano' | 'klid' | 'vecer' | other
  label: string;       // 'Ráno' | 'Klid' | 'Večer'
  started: number;     // počet spuštěných (=total)
  completed: number;
  completionRate: number;
}

// exercises.subcategory values (NOT exercise_type — that column doesn't exist)
const PROTOCOL_LABELS: Record<string, string> = {
  morning: 'Ráno',
  evening: 'Večer',
  stress:  'Klid',
  focus:   'Fokus',
  // Legacy fallback aliases (kept for safety)
  rano:  'Ráno',
  klid:  'Klid',
  vecer: 'Večer',
};

export function useProtocolStats(period: DashboardPeriod = 'today'): { stats: ProtocolStat[]; isLoading: boolean } {
  const periodStart = getAdminPeriodStart(period);
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'protocolStats', period] as const,
    queryFn: async () => {
      // Filtrujeme exercise_sessions podle periody
      let query = supabase
        .from('exercise_sessions')
        .select('exercise_id, was_completed, started_at');

      if (period === 'today') {
        query = query.gte('started_at', `${periodStart}T00:00:00.000Z`);
      } else if (period === 'yesterday') {
        query = query
          .gte('started_at', `${periodStart}T00:00:00.000Z`)
          .lt('started_at', `${toIsoDateString(new Date(new Date(periodStart).getTime() + 86400000))}T00:00:00.000Z`);
      } else {
        query = query.gte('started_at', `${periodStart}T00:00:00.000Z`);
      }

      const { data: rows, error } = await query;
      if (error) throw new Error(error.message);

      const { data: exercises } = await supabase
        .from('exercises')
        .select('id, subcategory, name')
        .in('id', [...new Set((rows ?? []).map((r) => r.exercise_id).filter(Boolean))]);

      // Map exercise id → subcategory ('morning', 'evening', 'stress', 'focus', …)
      const typeMap = new Map<string, string>(
        (exercises ?? []).map((e) => [e.id, (e as { id: string; subcategory: string | null }).subcategory ?? 'other'])
      );

      const counts = new Map<string, { started: number; completed: number }>();
      for (const row of rows ?? []) {
        const type = typeMap.get(row.exercise_id) ?? 'other';
        const existing = counts.get(type) ?? { started: 0, completed: 0 };
        existing.started++;
        if (row.was_completed) existing.completed++;
        counts.set(type, existing);
      }

      return Array.from(counts.entries())
        .filter(([type]) => type !== 'other')
        .map(([type, { started, completed }]) => ({
          type,
          label: PROTOCOL_LABELS[type] ?? type,
          started,
          completed,
          completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
        }))
        .sort((a, b) => b.started - a.started);
    },
    staleTime: 5 * 60 * 1000,
  });
  return { stats: data ?? [], isLoading };
}

// ============================================================
// useChurnRisk — users active 5+ days then silent for 3+ days
// ============================================================

export interface ChurnRiskUser {
  userId: string;
  lastActiveDate: string;
  daysSilent: number;
  activeDaysBefore: number;
}

export function useChurnRisk(): { users: ChurnRiskUser[]; count: number; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'churnRisk'] as const,
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // look back 30 days

      const { data: rows, error } = await supabase
        .from('audio_sessions')
        .select('user_id, started_at')
        .gte('started_at', cutoffDate.toISOString())
        .order('started_at', { ascending: false });
      if (error) throw new Error(error.message);

      // Also get exercise sessions
      const { data: exRows } = await supabase
        .from('exercise_sessions')
        .select('user_id, started_at')
        .gte('started_at', cutoffDate.toISOString())
        .order('started_at', { ascending: false });

      const allRows = [
        ...(rows ?? []).map((r) => ({ userId: r.user_id, date: r.started_at.slice(0, 10) })),
        ...(exRows ?? []).map((r) => ({ userId: r.user_id, date: r.started_at.slice(0, 10) })),
      ];

      // Group by user → set of active dates
      const userDates = new Map<string, Set<string>>();
      for (const r of allRows) {
        const existing = userDates.get(r.userId) ?? new Set<string>();
        existing.add(r.date);
        userDates.set(r.userId, existing);
      }

      const today = new Date().toISOString().slice(0, 10);
      const result: ChurnRiskUser[] = [];

      for (const [userId, dates] of userDates.entries()) {
        const sorted = Array.from(dates).sort();
        const lastDate = sorted[sorted.length - 1];
        const daysSilent = Math.floor(
          (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        // Churn signal: 5+ active days in last 30d, then 3+ days silent
        if (sorted.length >= 5 && daysSilent >= 3) {
          result.push({
            userId,
            lastActiveDate: lastDate,
            daysSilent,
            activeDaysBefore: sorted.length,
          });
        }
      }

      return result.sort((a, b) => b.daysSilent - a.daysSilent);
    },
    staleTime: 15 * 60 * 1000,
  });
  return { users: data ?? [], count: data?.length ?? 0, isLoading };
}

// ============================================================
// useDayOfWeek — day-of-week distribution (same weighted logic as usePrimeTime)
// ============================================================

export interface DayOfWeekSlot {
  day: number;          // 0=Mon … 6=Sun (ISO week order)
  label: string;        // 'Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'
  totalCount: number;   // all sessions on this weekday
  genuineCount: number; // sessions ≥ 2 min
  totalMinutes: number; // sum of minutes from genuine sessions
  avgMinutes: number;   // avg minutes per genuine session
  score: number;        // weighted: totalMinutes × completionRate
  pct: number;          // % of peak day score (for bar height)
}

const DOW_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const DOW_FULL_LABELS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];

export function useDayOfWeek(): { slots: DayOfWeekSlot[]; peakDay: number | null; peakDayLabel: string | null; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'dayOfWeek'] as const,
    queryFn: async () => {
      // 28 days = exactly 4× 7 days → every weekday represented equally
      const twentyEightDaysAgo = daysBack(28);
      const [audioRes, exerciseRes] = await Promise.all([
        supabase.from('audio_sessions').select('started_at, unique_listen_seconds').gte('started_at', twentyEightDaysAgo),
        supabase.from('exercise_sessions').select('started_at, completed_at').gte('started_at', twentyEightDaysAgo),
      ]);

      const totalCounts = new Array(7).fill(0);
      const genuineCounts = new Array(7).fill(0);
      const minutes = new Array(7).fill(0);

      // Convert JS getDay() (0=Sun) → ISO (0=Mon)
      const toIsoDay = (d: Date) => (d.getDay() + 6) % 7;

      for (const r of (audioRes.data ?? [])) {
        if (!r.started_at) continue;
        const dow = toIsoDay(new Date(r.started_at));
        const sec = r.unique_listen_seconds ?? 0;
        totalCounts[dow]++;
        if (sec >= MIN_GENUINE_SESSION_SEC) {
          genuineCounts[dow]++;
          minutes[dow] += secondsToMinutes(sec);
        }
      }
      for (const r of (exerciseRes.data ?? [])) {
        if (!r.started_at) continue;
        const dow = toIsoDay(new Date(r.started_at));
        totalCounts[dow]++;
        if (r.completed_at) {
          const dur = (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000;
          if (dur >= MIN_GENUINE_SESSION_SEC) {
            genuineCounts[dow]++;
            minutes[dow] += secondsToMinutes(Math.min(dur, 7200));
          }
        }
      }

      const scores = totalCounts.map((total, d) => {
        if (total === 0) return 0;
        return minutes[d] * (genuineCounts[d] / total);
      });
      const maxScore = Math.max(...scores, 1);

      return scores.map((score, day) => ({
        day,
        label: DOW_LABELS[day],
        totalCount: totalCounts[day],
        genuineCount: genuineCounts[day],
        totalMinutes: Math.round(minutes[day]),
        avgMinutes: genuineCounts[day] > 0 ? Math.round(minutes[day] / genuineCounts[day]) : 0,
        score: Math.round(score * 10) / 10,
        pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      }));
    },
    staleTime: 15 * 60 * 1000,
  });

  const peakDay = data
    ? data.reduce((max, s) => s.score > (data[max]?.score ?? 0) ? s.day : max, 0)
    : null;

  const peakDayLabel = peakDay !== null ? DOW_FULL_LABELS[peakDay] : null;
  return { slots: data ?? [], peakDay, peakDayLabel, isLoading };
}

// ============================================================
// usePersonalRecords — best stats ever achieved by user
// ============================================================

export interface PersonalRecords {
  longestStreak: number;       // days — from user_activity_streaks
  bestDayMinutes: number;      // most minutes in one calendar day (all time)
  bestSessionMinutes: number;  // longest single audio session (all time)
}

export function usePersonalRecords(userId: string | undefined): { records: PersonalRecords | null; isLoading: boolean } {
  const { data: bestAudioSec, isLoading: audioLoading } = useQuery({
    queryKey: ['analytics', 'records', 'bestAudio', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_sessions')
        .select('unique_listen_seconds')
        .eq('user_id', userId!)
        .order('unique_listen_seconds', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.unique_listen_seconds ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: bestDayMin, isLoading: dayLoading } = useQuery({
    queryKey: ['analytics', 'records', 'bestDay', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [audioRes, exerciseRes] = await Promise.all([
        supabase.from('audio_sessions').select('started_at, unique_listen_seconds').eq('user_id', userId!),
        supabase.from('exercise_sessions').select('started_at, completed_at').eq('user_id', userId!),
      ]);
      const dayMap = new Map<string, number>();
      for (const r of (audioRes.data ?? [])) {
        if (!r.started_at) continue;
        const day = r.started_at.slice(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + secondsToMinutes(r.unique_listen_seconds ?? 0));
      }
      for (const r of (exerciseRes.data ?? [])) {
        if (!r.started_at || !r.completed_at) continue;
        const day = r.started_at.slice(0, 10);
        const dur = (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000;
        dayMap.set(day, (dayMap.get(day) ?? 0) + secondsToMinutes(Math.min(Math.max(0, dur), 7200)));
      }
      return dayMap.size > 0 ? Math.max(...Array.from(dayMap.values())) : 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['analytics', 'records', 'streak', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_activity_streaks')
        .select('longest_streak_days')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.longest_streak_days ?? 0;
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = audioLoading || dayLoading || streakLoading;
  if (isLoading || bestAudioSec === undefined || bestDayMin === undefined || streakData === undefined) {
    return { records: null, isLoading };
  }
  return {
    records: {
      longestStreak: streakData,
      bestDayMinutes: Math.round(bestDayMin),
      bestSessionMinutes: Math.round(secondsToMinutes(bestAudioSec)),
    },
    isLoading,
  };
}

// ============================================================
// useRetention — D7 / D30 retention rates for admin
// ============================================================

export interface RetentionBucket { retained: number; total: number; rate: number }
export interface RetentionStats {
  d7:   RetentionBucket;
  d30:  RetentionBucket;
  d90:  RetentionBucket;  // cíl: >20%
  d180: RetentionBucket;
}

export function useRetention(): { stats: RetentionStats | null; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'retention'] as const,
    queryFn: async () => {
      // Each cohort: registered in [2×window, window] ago → active in last [window] days
      const [d7Users, d30Users, d90Users, d180Users, allActivity] = await Promise.all([
        supabase.from('profiles').select('user_id').gte('created_at', daysBack(14)).lte('created_at', daysBack(7)),
        supabase.from('profiles').select('user_id').gte('created_at', daysBack(60)).lte('created_at', daysBack(30)),
        supabase.from('profiles').select('user_id').gte('created_at', daysBack(180)).lte('created_at', daysBack(90)),
        supabase.from('profiles').select('user_id').gte('created_at', daysBack(360)).lte('created_at', daysBack(180)),
        // Fetch 180 days of activity — covers all cohort windows
        // user_activity_log uses created_at (timestamptz), not activity_date
        supabase.from('user_activity_log').select('user_id, created_at').gte('created_at', daysBack(180)),
      ]);

      const activityByUser = new Map<string, string[]>();
      for (const r of allActivity.data ?? []) {
        const arr = activityByUser.get(r.user_id) ?? [];
        // Normalize to YYYY-MM-DD for date comparison with daysBack()
        arr.push((r.created_at as string).slice(0, 10));
        activityByUser.set(r.user_id, arr);
      }

      function calcBucket(users: { user_id: string }[] | null, windowDays: number): RetentionBucket {
        const total = users?.length ?? 0;
        const cutoff = daysBack(windowDays);
        const retained = (users ?? []).filter((u) =>
          (activityByUser.get(u.user_id) ?? []).some((d) => d >= cutoff)
        ).length;
        return { retained, total, rate: total > 0 ? Math.round((retained / total) * 100) : 0 };
      }

      return {
        d7:   calcBucket(d7Users.data,   7),
        d30:  calcBucket(d30Users.data,  30),
        d90:  calcBucket(d90Users.data,  90),
        d180: calcBucket(d180Users.data, 180),
      };
    },
    staleTime: 15 * 60 * 1000,
  });
  return { stats: data ?? null, isLoading };
}

// ============================================================
// useOnboardingFunnel — % of new users who start first session
// ============================================================

export interface OnboardingFunnel {
  registered: number;
  steps: { days: number; label: string; count: number; pct: number }[];
  neverStarted: number;
  neverStartedPct: number;
}

// App launch date — only real users registered from this date onwards.
// Pre-launch testers (profiles.created_at before this date) are excluded from the funnel
// to avoid "Nikdy nezačali" inflation from test accounts.
const APP_LAUNCH_DATE = '2026-02-28T00:00:00.000Z';

export function useOnboardingFunnel(): { funnel: OnboardingFunnel | null; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'onboardingFunnel'] as const,
    queryFn: async () => {
      // Use RPC — bypasses RLS. Filter from launch date (not daysBack(30)) to exclude
      // 387 pre-launch testers whose profiles.created_at predates the launch.
      const { data: users, error: usersErr } = await supabase
        .rpc('get_profiles_in_range', { from_ts: APP_LAUNCH_DATE, to_ts: new Date().toISOString() });
      if (usersErr) throw new Error(usersErr.message);
      if (!users || users.length === 0) {
        return { registered: 0, steps: [], neverStarted: 0, neverStartedPct: 0 };
      }

      const userIds = users.map((u) => u.user_id);
      const [audioRes, exerciseRes] = await Promise.all([
        supabase.from('audio_sessions').select('user_id, started_at').in('user_id', userIds),
        supabase.from('exercise_sessions').select('user_id, started_at').in('user_id', userIds),
      ]);

      // Build map: userId → earliest session date
      const firstSession = new Map<string, Date>();
      for (const r of [...(audioRes.data ?? []), ...(exerciseRes.data ?? [])]) {
        if (!r.started_at) continue;
        const d = new Date(r.started_at);
        const existing = firstSession.get(r.user_id);
        if (!existing || d < existing) firstSession.set(r.user_id, d);
      }

      // For each user: hours between registration and first session.
      // Pre-launch testers have profiles.created_at = Feb 28 (updated), but their
      // first session might predate that → negative hours. Clamp to 0 so they count
      // as "activated on launch day" (0–24h bucket), not as "never started".
      const hoursToFirst: number[] = [];
      let neverStarted = 0;
      for (const user of users) {
        const first = firstSession.get(user.user_id);
        if (!first) { neverStarted++; continue; }
        const raw = (first.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60);
        hoursToFirst.push(Math.max(0, raw)); // clamp: pre-launch sessions count as day-0
      }

      const total = users.length;
      // Exclusive time windows: each user counted only ONCE in their actual window
      const windows = [
        { days: 1,  label: '1. aktivita 0–24 h',   from: 0,         to: 24 },
        { days: 3,  label: '1. aktivita 24–72 h',  from: 24,        to: 72 },
        { days: 7,  label: '1. aktivita 3–7 dní',  from: 72,        to: 24 * 7 },
        { days: 14, label: '1. aktivita 8–14 dní', from: 24 * 7,    to: 24 * 14 },
        { days: 21, label: '1. aktivita 15–21 dní',from: 24 * 14,   to: 24 * 21 },
        { days: 28, label: '1. aktivita 22–28 dní',from: 24 * 21,   to: 24 * 28 },
      ];

      const steps = windows.map(({ days, label, from, to }) => {
        // Exclusive window: user falls in this bucket if first session is within [from, to)
        const count = hoursToFirst.filter((h) => h >= from && h < to).length;
        return { days, label, count, pct: Math.round((count / total) * 100) };
      });

      return {
        registered: total,
        steps,
        neverStarted,
        neverStartedPct: Math.round((neverStarted / total) * 100),
      };
    },
    staleTime: 30 * 60 * 1000,
  });
  return { funnel: data ?? null, isLoading };
}

// ============================================================
// useTopContent
// ============================================================

export function useTopContent(
  limit = 5,
  period: DashboardPeriod | 'all' = 'all',
): { data: TopContentItem[]; isLoading: boolean; error: string | null } {
  // Compute [startISO, endISO) for the selected period
  const { periodStartISO, periodEndISO } = (() => {
    if (period === 'all') return { periodStartISO: null, periodEndISO: null };

    const now = new Date();
    const todayStart = `${toIsoDateString(now)}T00:00:00.000Z`;

    if (period === 'today') {
      return { periodStartISO: todayStart, periodEndISO: null }; // up to now
    }

    if (period === 'yesterday') {
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      return {
        periodStartISO: `${toIsoDateString(yesterday)}T00:00:00.000Z`,
        periodEndISO: todayStart, // strictly BEFORE today
      };
    }

    // week / month / year — from period start to now (end = null means "up to now")
    const periodStart = getAdminPeriodStart(period as DashboardPeriod);
    return { periodStartISO: `${periodStart}T00:00:00.000Z`, periodEndISO: null };
  })();

  const { data, isLoading, error } = useQuery({
    queryKey: [...analyticsKeys.topContent(limit), period],
    queryFn: async (): Promise<TopContentItem[]> => {
      // Aggregate audio_sessions by lesson_id (incl. user_id pro unique users)
      let q = supabase
        .from('audio_sessions')
        .select('lesson_id, lesson_title, program_title, category_slug, is_completed, unique_listen_seconds, user_id')
        .order('created_at', { ascending: false })
        .limit(5000);
      if (periodStartISO) q = q.gte('started_at', periodStartISO);
      if (periodEndISO)   q = q.lt('started_at', periodEndISO);  // strict < (excludes today when 'yesterday')
      const { data: rows, error: err } = await q;

      if (err) throw new Error(err.message);

      // Client-side aggregation (avoids complex RPC for now)
      const map = new Map<string, {
        lessonId: string;
        lessonTitle: string;
        programTitle: string | null;
        categorySlug: string;
        playCount: number;
        completedCount: number;
        totalListenSeconds: number;
        userIds: Set<string>;
      }>();

      for (const row of rows ?? []) {
        const key = row.lesson_id;
        const existing = map.get(key);
        if (existing) {
          existing.playCount += 1;
          if (row.is_completed) existing.completedCount += 1;
          existing.totalListenSeconds += row.unique_listen_seconds ?? 0;
          if (row.user_id) existing.userIds.add(row.user_id);
        } else {
          map.set(key, {
            lessonId: row.lesson_id,
            lessonTitle: row.lesson_title ?? '',
            programTitle: row.program_title ?? null,
            categorySlug: row.category_slug ?? '',
            playCount: 1,
            completedCount: row.is_completed ? 1 : 0,
            totalListenSeconds: row.unique_listen_seconds ?? 0,
            userIds: new Set(row.user_id ? [row.user_id] : []),
          });
        }
      }

      // Sort by play count, take top N
      return Array.from(map.values())
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit)
        .map((item) => ({
          lessonId: item.lessonId,
          lessonTitle: item.lessonTitle,
          programTitle: item.programTitle,
          categorySlug: item.categorySlug,
          playCount: item.playCount,
          uniqueUsers: item.userIds.size,
          completionRate: item.playCount > 0
            ? Math.round((item.completedCount / item.playCount) * 100)
            : 0,
          favoriteCount: 0, // Populated separately if needed
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data ?? [],
    isLoading,
    error: error ? (error as Error).message : null,
  };
}

// ============================================================
// useUserPokrokStats
// ============================================================

import type { UserPokrokStats, ActivityPeriod, ActivityDayData } from '../types';

const GRAPH_DAYS = 168; // 24 weeks

/**
 * Converts a Date to a LOCAL date string YYYY-MM-DD (not UTC).
 * Used for graph/heatmap bucketing so that sessions started just
 * after midnight CET (= before midnight UTC) land on the correct local day.
 *
 * Example: 2026-03-01T23:30:00Z for a CET user = 2026-03-02 locally → '2026-03-02'
 */
function toLocalDateStr(dateOrStr: Date | string): string {
  const d = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns the START timestamp for each period.
 * Uses CALENDAR periods (not rolling windows):
 *   day   = start of today (00:00)
 *   week  = Monday of current week (CZ: Mon = first day)
 *   month = 1st of current month
 *   year  = January 1st of current year
 *   all   = epoch start
 *
 * This ensures the divisor (elapsed days) always matches the data range.
 */
function getPeriodStartDate(period: ActivityPeriod): string {
  const now = new Date();
  switch (period) {
    case 'day': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case 'week': {
      // Monday of current week (Sunday=0, so offset: Sun→-6, Mon→0, Tue→-1, ...)
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      const dow = d.getDay(); // 0=Sun
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      d.setDate(d.getDate() + mondayOffset);
      return d.toISOString();
    }
    case 'month': {
      // 1st of current month
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    case 'year': {
      // January 1st of current year
      return new Date(now.getFullYear(), 0, 1).toISOString();
    }
    case 'all':
    default:
      return '2020-01-01T00:00:00.000Z';
  }
}

/**
 * Returns elapsed CALENDAR days for the period (used as avg divisor).
 * Always reflects "days that have actually passed" — never inflated.
 *
 *   day   → 1 (always)
 *   week  → Mon=1, Tue=2, ..., Sun=7
 *   month → today's day-of-month (Feb 28 → 28, not 30)
 *   year  → day-of-year (Feb 28 → 59, not 365)
 *   all   → days since user registered
 */
function getElapsedPeriodDays(period: ActivityPeriod, registeredAt?: string): number {
  const now = new Date();
  const daysSinceReg = registeredAt
    ? Math.max(1, Math.floor((now.getTime() - new Date(registeredAt).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  switch (period) {
    case 'day':
      return 1;
    case 'week': {
      const dow = now.getDay(); // 0=Sun
      const daysSinceMon = dow === 0 ? 6 : dow - 1; // Mon=0, Tue=1, ..., Sun=6
      const elapsed = daysSinceMon + 1; // today counts
      return daysSinceReg != null ? Math.min(elapsed, daysSinceReg) : elapsed;
    }
    case 'month': {
      const elapsed = now.getDate(); // day-of-month, 1-based
      return daysSinceReg != null ? Math.min(elapsed, daysSinceReg) : elapsed;
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const elapsed = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return daysSinceReg != null ? Math.min(elapsed, daysSinceReg) : elapsed;
    }
    case 'all':
      return daysSinceReg ?? 1;
    default:
      return 1;
  }
}

/** Returns start/end ISO strings for the PREVIOUS equivalent calendar period. */
/**
 * Returns start/end for the PREVIOUS equivalent elapsed period.
 * Key rule: if current period is Mon–Wed (3 days), prev must also be Mon–Wed of last week (3 days).
 * This ensures avg/day comparisons are apples-to-apples.
 */
function getPreviousPeriodRange(period: ActivityPeriod): { start: string; end: string } | null {
  const now = new Date();
  switch (period) {
    case 'day': {
      // Today 00:00 to now → compare with yesterday 00:00 to same time
      const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setDate(e.getDate() - 1);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    case 'week': {
      // Current: this Monday 00:00 → now
      // Previous equivalent: last Monday 00:00 → (now − 7 days)  ← same elapsed count
      const dow = now.getDay();
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      const thisMonday = new Date(now);
      thisMonday.setDate(thisMonday.getDate() + mondayOffset);
      thisMonday.setHours(0, 0, 0, 0);
      const prevStart = new Date(thisMonday); prevStart.setDate(prevStart.getDate() - 7);
      const prevEnd = new Date(now); prevEnd.setDate(prevEnd.getDate() - 7);
      return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
    }
    case 'month': {
      // Current: 1st to today (day N)
      // Previous equivalent: 1st of last month to day N of last month (capped at last day)
      const dayOfMonth = now.getDate();
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      const cappedDay = Math.min(dayOfMonth, lastDayOfPrevMonth);
      const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, cappedDay, 23, 59, 59, 999);
      return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
    }
    case 'year': {
      // Only from 2027 onwards — before that no meaningful previous year
      if (now.getFullYear() <= 2026) return null;
      // Current: Jan 1 to today → previous: Jan 1 of last year to same calendar day last year
      const prevStart = new Date(now.getFullYear() - 1, 0, 1);
      const prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
    }
    default: return null; // 'all' — no meaningful previous period
  }
}

// getPrevPeriodDays removed — after fixing getPreviousPeriodRange to use equivalent elapsed
// periods, both current and previous always have the same number of elapsed days.
// prevAverageMinutesPerDay now uses periodDays (current elapsed) as divisor for both.

/** Returns number of days since registration (for display in UI). */
export function getDaysSinceRegistration(registeredAt?: string): number {
  if (!registeredAt) return 0;
  return Math.max(1, Math.floor((Date.now() - new Date(registeredAt).getTime()) / (1000 * 60 * 60 * 24)));
}

export function useUserPokrokStats(
  userId: string | undefined,
  period: ActivityPeriod = 'all'
): UserPokrokStats {
  const periodStart = getPeriodStartDate(period);
  const graphStart = daysBack(GRAPH_DAYS);
  const prevRange = getPreviousPeriodRange(period);

  // Audio sessions query
  const { data: audioData, isLoading: audioLoading, error: audioError } = useQuery({
    queryKey: ['analytics', 'pokrok', 'audio', userId, period],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_sessions')
        .select('started_at, unique_listen_seconds, is_completed')
        .eq('user_id', userId!)
        .gte('started_at', periodStart);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Audio graph query (always last 84 days regardless of period)
  const { data: audioGraphData } = useQuery({
    queryKey: ['analytics', 'pokrok', 'audioGraph', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_sessions')
        .select('started_at, unique_listen_seconds')
        .eq('user_id', userId!)
        .gte('started_at', `${graphStart}T00:00:00.000Z`);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Exercise sessions query
  // Note: exercise_sessions has no actual_duration_seconds — derive from started_at + completed_at
  const { data: exerciseData, isLoading: exerciseLoading, error: exerciseError } = useQuery({
    queryKey: ['analytics', 'pokrok', 'exercise', userId, period],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_sessions')
        .select('started_at, completed_at, was_completed')
        .eq('user_id', userId!)
        .gte('started_at', periodStart);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Exercise graph query (always last 84 days)
  const { data: exerciseGraphData } = useQuery({
    queryKey: ['analytics', 'pokrok', 'exerciseGraph', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_sessions')
        .select('started_at, completed_at')
        .eq('user_id', userId!)
        .gte('started_at', `${graphStart}T00:00:00.000Z`);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Previous period queries — for motivational delta comparison
  const { data: prevAudioData } = useQuery({
    queryKey: ['analytics', 'pokrok', 'prevAudio', userId, period],
    enabled: !!userId && !!prevRange,
    queryFn: async () => {
      if (!prevRange) return [];
      const { data, error } = await supabase
        .from('audio_sessions')
        .select('started_at, unique_listen_seconds')
        .eq('user_id', userId!)
        .gte('started_at', prevRange.start)
        .lte('started_at', prevRange.end);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: prevExerciseData } = useQuery({
    queryKey: ['analytics', 'pokrok', 'prevExercise', userId, period],
    enabled: !!userId && !!prevRange,
    queryFn: async () => {
      if (!prevRange) return [];
      const { data, error } = await supabase
        .from('exercise_sessions')
        .select('started_at, completed_at')
        .eq('user_id', userId!)
        .gte('started_at', prevRange.start)
        .lte('started_at', prevRange.end);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Registration date — needed for avg divisor calculation in all periods
  const { data: profileData } = useQuery({
    queryKey: ['analytics', 'pokrok', 'profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1h — registration date never changes
  });

  // Streak query
  const { data: streakData } = useQuery({
    queryKey: ['analytics', 'streak', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_activity_streaks')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Aggregate stats
  const audioMinutes = (audioData ?? []).reduce(
    (sum, r) => sum + secondsToMinutes(r.unique_listen_seconds ?? 0),
    0
  );
  const exerciseMinutes = (exerciseData ?? []).reduce((sum, r) => {
    const durationSec = r.completed_at && r.started_at
      ? (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000
      : 0;
    return sum + secondsToMinutes(Math.max(0, durationSec));
  }, 0);
  const totalMinutes = Math.round((audioMinutes + exerciseMinutes) * 10) / 10;

  const totalActivities =
    (audioData?.length ?? 0) + (exerciseData?.length ?? 0);

  // Distinct active LOCAL days — must use toLocalDateStr (same as activityGraph/heatmap)
  // otherwise a CET session at 00:21 would count as UTC-yesterday (different day than heatmap shows).
  const activeDaysSet = new Set<string>();
  for (const r of audioData ?? []) {
    if (r.started_at) activeDaysSet.add(toLocalDateStr(r.started_at));
  }
  for (const r of exerciseData ?? []) {
    if (r.started_at) activeDaysSet.add(toLocalDateStr(r.started_at));
  }
  const activeDays = activeDaysSet.size;
  // Average: divide by elapsed calendar days — always accurate
  const periodDays = getElapsedPeriodDays(period, profileData?.created_at ?? undefined);
  const averageMinutesPerDay = periodDays > 0
    ? Math.round((totalMinutes / periodDays) * 10) / 10
    : 0;

  // Build activity graph (last 168 days) — using LOCAL dates to avoid timezone-bucketing bug.
  // Without this, sessions started just after midnight CET (= before midnight UTC) would
  // appear on the wrong calendar day in the graph (e.g. March-02 session at 00:21 CET
  // is stored as UTC March-01, so it would appear under Sunday instead of Monday).
  const dayMinutesMap = new Map<string, number>();
  for (const r of audioGraphData ?? []) {
    const day = toLocalDateStr(r.started_at);
    dayMinutesMap.set(day, (dayMinutesMap.get(day) ?? 0) + secondsToMinutes(r.unique_listen_seconds ?? 0));
  }
  for (const r of exerciseGraphData ?? []) {
    const day = toLocalDateStr(r.started_at);
    const durationSec = r.completed_at && r.started_at
      ? (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000
      : 0;
    dayMinutesMap.set(day, (dayMinutesMap.get(day) ?? 0) + secondsToMinutes(Math.max(0, durationSec)));
  }

  // Always override TODAY with live period data (audioData + exerciseData are always fresher
  // than the cached graph queries — fixes heatmap/weekly-dots not showing today's activity).
  const todayLocal = toLocalDateStr(new Date()); // LOCAL today date — avoids CET/UTC boundary bug
  const liveTodayAudioMin = (audioData ?? [])
    .filter((r) => r.started_at && toLocalDateStr(r.started_at) === todayLocal)
    .reduce((s, r) => s + secondsToMinutes(r.unique_listen_seconds ?? 0), 0);
  const liveTodayExMin = (exerciseData ?? [])
    .filter((r) => r.started_at && toLocalDateStr(r.started_at) === todayLocal)
    .reduce((s, r) => {
      const dur = r.completed_at && r.started_at
        ? (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000
        : 0;
      return s + secondsToMinutes(Math.max(0, dur));
    }, 0);
  const liveTodayTotal = liveTodayAudioMin + liveTodayExMin;
  // Set today's entry using live data (overrides stale graph cache)
  if (liveTodayTotal > 0 || dayMinutesMap.has(todayLocal)) {
    dayMinutesMap.set(todayLocal, Math.max(liveTodayTotal, dayMinutesMap.get(todayLocal) ?? 0));
  }

  // Track days with ANY session (regardless of unique_listen_seconds) for heatmap.
  // Sessions with 0 listen seconds (closed without explicit end) still count as "active day"
  // — without this, the heatmap wouldn't show a square even though the user did exercise.
  const touchedDaysSet = new Set<string>();
  for (const r of audioGraphData ?? []) {
    if (r.started_at) touchedDaysSet.add(toLocalDateStr(r.started_at));
  }
  for (const r of exerciseGraphData ?? []) {
    if (r.started_at) touchedDaysSet.add(toLocalDateStr(r.started_at));
  }
  // Also mark today as touched if there's live data (in case audioGraphData cache is stale)
  if (liveTodayAudioMin > 0 || liveTodayExMin > 0) {
    touchedDaysSet.add(todayLocal);
  }

  // Build activityGraph using LOCAL dates (matches dayMinutesMap keys)
  const activityGraph: ActivityDayData[] = [];
  const today = new Date();
  for (let i = GRAPH_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = toLocalDateStr(d); // LOCAL date — consistent with dayMinutesMap keys
    const rawMinutes = dayMinutesMap.get(dayStr) ?? 0;
    // Days with sessions but 0 measured seconds still show as level-1 in heatmap.
    // Uses 0.01 sentinel — getActivityLevel(0.01) → 1. Tooltip shows "žádná aktivita"
    // for truly 0-min days, which is fine (tooltip rounds to 0).
    const minutes = rawMinutes > 0 ? Math.round(rawMinutes * 10) / 10
      : touchedDaysSet.has(dayStr) ? 0.01 : 0;
    activityGraph.push({
      date: dayStr,
      minutes,
      activityCount: touchedDaysSet.has(dayStr) ? 1 : 0,
    });
  }

  // Previous period totals (null when 'all' period — no prev range)
  const prevTotalMinutes = prevRange != null
    ? Math.round((
        (prevAudioData ?? []).reduce((s, r) => s + secondsToMinutes(r.unique_listen_seconds ?? 0), 0) +
        (prevExerciseData ?? []).reduce((s, r) => {
          if (!r.completed_at || !r.started_at) return s;
          const dur = (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000;
          return s + secondsToMinutes(Math.max(0, dur));
        }, 0)
      ) * 10) / 10
    : null;

  const prevTotalActivities = prevRange != null
    ? (prevAudioData?.length ?? 0) + (prevExerciseData?.length ?? 0)
    : null;

  // prevActiveDays — distinct days with activity in the previous period
  const prevActiveDays = prevRange != null
    ? (() => {
        const set = new Set<string>();
        for (const r of prevAudioData ?? []) if (r.started_at) set.add(r.started_at.slice(0, 10));
        for (const r of prevExerciseData ?? []) if (r.started_at) set.add(r.started_at.slice(0, 10));
        return set.size;
      })()
    : null;

  // Both periods now have the same elapsed days → use same periodDays divisor for both averages
  const prevAverageMinutesPerDay = prevRange != null && prevTotalMinutes !== null && periodDays > 0
    ? Math.round((prevTotalMinutes / periodDays) * 10) / 10
    : null;

  const isLoading = audioLoading || exerciseLoading;
  const error = audioError || exerciseError
    ? ((audioError || exerciseError) as Error).message
    : null;

  const streak = streakData ? {
    userId: streakData.user_id,
    currentStreakDays: streakData.current_streak_days,
    longestStreakDays: streakData.longest_streak_days,
    lastActiveDate: streakData.last_active_date,
    graceDayUsed: streakData.grace_day_used,
    streakStartedAt: streakData.streak_started_at,
  } : null;

  return {
    period,
    totalMinutes,
    totalActivities,
    activeDays,
    averageMinutesPerDay,
    periodDays,
    registeredAt: profileData?.created_at ?? null,
    prevTotalMinutes,
    prevTotalActivities,
    prevActiveDays,
    prevAverageMinutesPerDay,
    streak,
    activityGraph,
    isLoading,
    error,
  };
}
