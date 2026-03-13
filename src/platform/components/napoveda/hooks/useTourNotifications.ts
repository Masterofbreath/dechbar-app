/**
 * useTourNotifications — Automatické notifikační triggery pro Tour
 *
 * Odpovídá za:
 * 1. tour_reminder (3 dny po odložení bez pokračování)
 *    → Push notifikace: "Dokončení průvodce ti zbývá X kroků"
 *    → Žárovička se opět rozsvítí (bulb_state: lit)
 *
 * 2. tour_reward_expiring (2 dny před expirací SMART členství ze Tour reward)
 *    → Push notifikace: "Tvůj SMART trial vyprší za 2 dny"
 *
 * 3. tour_reward_expired (po expiraci Trial SMART)
 *    → Žárovička přejde na dim
 *    → Push notifikace o možnosti pokračovat
 *
 * Implementace:
 * - Client-side: kontroluje stav při mount + při focus (app foreground)
 * - Push notifikace se posílají přes existující notifications API (Supabase Edge Function)
 * - Scheduling: DB row + Supabase cron / pg_cron (viz migration)
 *
 * Pro MVP: pouze client-side kontrola stavu a zobrazení in-app banneru.
 * Push notifikace (Edge Function) = Sprint 5 Phase 2.
 */

import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';

const REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 dny
const EXPIRY_WARN_DAYS = 2;

interface TourNotificationState {
  shouldShowReminder: boolean;
  daysUntilRewardExpiry: number | null;
  isRewardExpired: boolean;
}

async function fetchTourNotificationState(userId: string): Promise<TourNotificationState> {
  const [{ data: tourState }, { data: membership }] = await Promise.all([
    supabase
      .from('user_tour_state')
      .select('deferred_until, bulb_state, tour_completed_at')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('memberships')
      .select('expires_at, metadata, plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  const now = Date.now();

  // 1. Tour reminder — byl odložen před více než 3 dny
  const state = tourState as {
    deferred_until: string | null;
    bulb_state: string;
    tour_completed_at: string | null;
  } | null;

  const shouldShowReminder =
    !state?.tour_completed_at &&
    !!state?.deferred_until &&
    new Date(state.deferred_until).getTime() + REMINDER_DELAY_MS < now;

  // 2. Tour reward expiry check
  const mem = membership as {
    expires_at: string | null;
    metadata: { source?: string } | null;
    plan: string;
  } | null;

  const isTourReward = mem?.metadata?.source === 'tour_reward';
  let daysUntilRewardExpiry: number | null = null;
  let isRewardExpired = false;

  if (isTourReward && mem?.expires_at) {
    const expiryMs = new Date(mem.expires_at).getTime();
    const diffMs = expiryMs - now;
    daysUntilRewardExpiry = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    isRewardExpired = diffMs < 0;
  }

  return { shouldShowReminder, daysUntilRewardExpiry, isRewardExpired };
}

export function useTourNotifications() {
  const userId = useAuthStore((s) => s.user?.id);

  const { data: notifState } = useQuery({
    queryKey: ['tour-notifications', userId],
    queryFn: () => fetchTourNotificationState(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minut
    refetchOnWindowFocus: true,
  });

  // Automatické obnovení bulb_state po uplynutí deferred_until
  const resetDeferredBulb = useCallback(async () => {
    if (!userId || !notifState?.shouldShowReminder) return;

    await supabase
      .from('user_tour_state')
      .update({
        bulb_state: 'lit',
        deferred_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('bulb_state', 'dim');
  }, [userId, notifState?.shouldShowReminder]);

  useEffect(() => {
    void resetDeferredBulb();
  }, [resetDeferredBulb]);

  return {
    shouldShowReminder: notifState?.shouldShowReminder ?? false,
    daysUntilRewardExpiry: notifState?.daysUntilRewardExpiry ?? null,
    isRewardExpired: notifState?.isRewardExpired ?? false,
    // Shortcut: zobrazit warning banner?
    showExpiryWarning:
      notifState?.daysUntilRewardExpiry !== null &&
      notifState.daysUntilRewardExpiry !== undefined &&
      notifState.daysUntilRewardExpiry >= 0 &&
      notifState.daysUntilRewardExpiry <= EXPIRY_WARN_DAYS,
  };
}
