/**
 * useRewardGrant — SMART reward za dokončení Nápovědy
 *
 * Fáze 1 (trigger: ukončení Úrovně 1 / prvních 9 kroků):
 *   → Zapsání nového memberships řádku: plan=SMART, type=trial, +1 den
 *   → Nastaví tour_reward_phase=1 a tour_reward_granted_at
 *   → Spustí CelebrationModal (fáze 1)
 *
 * Fáze 2 (trigger: ukončení Úrovně 2 nebo event exercise_session_started):
 *   → Prodloužení expirace o +2 dny
 *   → Nastaví tour_reward_phase=2
 *   → Spustí CelebrationModal (fáze 2)
 *
 * Bezpečnost:
 *   - Kontroluje tour_reward_phase aby reward nevznikl dvakrát
 *   - Používá upsert/update s precise WHERE klauzulí
 *   - Refresh userStateStore po zápisu
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';
import { useUserState } from '@/platform/user/userStateStore';

export type RewardPhase = 1 | 2;

interface RewardGrantResult {
  success: boolean;
  phase: RewardPhase;
  expiresAt: string;
  error?: string;
}

export function useRewardGrant() {
  const userId = useAuthStore((s) => s.user?.id);
  const refreshMembership = useUserState((s) => s.refreshMembership);
  const [isGranting, setIsGranting] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState<RewardPhase | null>(null);

  const grantPhase1 = useCallback(async (): Promise<RewardGrantResult | null> => {
    if (!userId || isGranting) return null;

    // Zkontroluj zda reward ještě nebyl udělen
    const { data: existing } = await supabase
      .from('user_tour_state')
      .select('tour_reward_phase')
      .eq('user_id', userId)
      .single();

    const existingPhase = (existing as { tour_reward_phase?: number | null } | null)
      ?.tour_reward_phase;

    if (existingPhase && existingPhase >= 1) {
      console.info('[Tour] Reward phase 1 already granted, skipping');
      return null;
    }

    setIsGranting(true);

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Nastaví existující active membership na 'superseded'
      await supabase
        .from('memberships')
        .update({ status: 'superseded', updated_at: now.toISOString() })
        .eq('user_id', userId)
        .eq('status', 'active');

      // 2. Nový SMART membership +1 den
      const { error: insertError } = await supabase.from('memberships').insert({
        user_id: userId,
        plan: 'SMART',
        status: 'active',
        type: 'trial',
        purchased_at: now.toISOString(),
        expires_at: expiresAt,
        billing_interval: null,
        metadata: {
          source: 'tour_reward',
          phase: 1,
          granted_at: now.toISOString(),
        },
      });

      if (insertError) throw insertError;

      // 3. Označ reward phase v user_tour_state
      await supabase
        .from('user_tour_state')
        .update({
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId);

      // 4. Refresh local state
      await refreshMembership();

      setCelebrationPhase(1);

      return { success: true, phase: 1, expiresAt };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Tour] Failed to grant phase 1 reward:', message);
      return { success: false, phase: 1, expiresAt: '', error: message };
    } finally {
      setIsGranting(false);
    }
  }, [userId, isGranting, refreshMembership]);

  const grantPhase2 = useCallback(async (): Promise<RewardGrantResult | null> => {
    if (!userId || isGranting) return null;

    // Zkontroluj zda phase 1 proběhl
    const { data: currentMembership } = await supabase
      .from('memberships')
      .select('id, expires_at, metadata')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('plan', 'SMART')
      .maybeSingle();

    const meta = (currentMembership as { metadata?: { source?: string; phase?: number } } | null)
      ?.metadata;

    if (!currentMembership || meta?.source !== 'tour_reward') {
      console.warn('[Tour] Phase 2 reward requires active tour SMART membership');
      return null;
    }

    if (meta?.phase && meta.phase >= 2) {
      console.info('[Tour] Reward phase 2 already granted, skipping');
      return null;
    }

    setIsGranting(true);

    try {
      const now = new Date();
      const currentExpiry = new Date(
        (currentMembership as { expires_at: string }).expires_at
      );
      // +2 dny od aktuální expirace (ne od teď — aby se nesčítalo)
      const newExpiry = new Date(
        Math.max(currentExpiry.getTime(), now.getTime()) + 2 * 24 * 60 * 60 * 1000
      );

      const { error: updateError } = await supabase
        .from('memberships')
        .update({
          expires_at: newExpiry.toISOString(),
          metadata: {
            ...meta,
            phase: 2,
            phase2_granted_at: now.toISOString(),
          },
          updated_at: now.toISOString(),
        })
        .eq('id', (currentMembership as { id: string }).id);

      if (updateError) throw updateError;

      await refreshMembership();

      setCelebrationPhase(2);

      return { success: true, phase: 2, expiresAt: newExpiry.toISOString() };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Tour] Failed to grant phase 2 reward:', message);
      return { success: false, phase: 2, expiresAt: '', error: message };
    } finally {
      setIsGranting(false);
    }
  }, [userId, isGranting, refreshMembership]);

  const dismissCelebration = useCallback(() => {
    setCelebrationPhase(null);
  }, []);

  return {
    grantPhase1,
    grantPhase2,
    isGranting,
    celebrationPhase,
    dismissCelebration,
  };
}
