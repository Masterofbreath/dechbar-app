/**
 * DechBar Analytics System v1.0 — Public Exports
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

export { useAppSession } from './hooks/useAppSession';
export { useAudioSessionTracking } from './hooks/useAudioSessionTracking';
export {
  useAdminDashboard, useTopContent, useUserPokrokStats,
  useTotalUsers, useAllTimeMinutes, useAdminLast7DaysKpis,
  usePrimeTime, useDayOfWeek, useProtocolStats, useChurnRisk,
  usePersonalRecords, useRetention, useOnboardingFunnel,
  useUniqueActiveUsers, useAvgMinutesPerActiveUserDay,
  getDaysSinceRegistration, analyticsKeys,
  useToolsStats, useToolsLevelStats,
} from './hooks/useAnalyticsDashboard';
export type {
  DashboardPeriod, PrimeTimeSlot, DayOfWeekSlot, ProtocolStat, ChurnRiskUser,
  PersonalRecords, RetentionStats, RetentionBucket, OnboardingFunnel,
  ToolsStats, ToolsLevelStats, ToolSessionGroup, LevelDistribution, TopExercise,
} from './hooks/useAnalyticsDashboard';

export type { AudioSessionContext, UserPokrokStats, AdminDashboardData, ActivityPeriod, ActivityStreakState } from './types';

export { logAppOpen, upsertAudioSession, logAudioEvent, updateStreakOnActivity } from './client';
export { updateStreak } from './utils/streak';
export { secondsToMinutes, formatMinutes, getActivityLevel, toIsoDateString } from './utils/time';

export { useKPAdminStats } from './hooks/useKPAdminStats';
export type { KPBucket, KPCoverage } from './hooks/useKPAdminStats';
