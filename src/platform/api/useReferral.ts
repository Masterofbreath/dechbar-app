/**
 * useReferral - Referral Code & Stats Hook
 *
 * Fetches the user's 6-digit referral code and aggregated stats
 * (total referred users, total value generated for DechBar).
 *
 * Provides copyCode() and shareCode() utilities for the UI.
 *
 * @package DechBar_App
 * @subpackage Platform/API
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuthStore } from '@/platform/auth/authStore';

// ============================================================
// Types
// ============================================================

export interface ReferralData {
  code: string | null;
  totalReferred: number;
  totalValueCzk: number;
}

/** Base URL for referral links — always points to public registration page */
const REFERRAL_BASE_URL = 'https://www.dechbar.cz';

/**
 * Returns the full referral link for a given code.
 * @example getReferralLink('847293') → 'https://www.dechbar.cz/?ref=847293'
 */
export function getReferralLink(code: string): string {
  return `${REFERRAL_BASE_URL}/?ref=${code}`;
}

// ============================================================
// Query key
// ============================================================

const referralKeys = {
  all: ['referral'] as const,
  detail: (userId: string) => [...referralKeys.all, userId] as const,
};

// ============================================================
// Fetch referral data
// ============================================================

async function fetchReferralData(userId: string): Promise<ReferralData> {
  const [codeResult, eventsResult] = await Promise.allSettled([
    supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),

    supabase
      .from('referral_events')
      .select('event_type, amount_czk')
      .eq('referrer_user_id', userId),
  ]);

  const code =
    codeResult.status === 'fulfilled' && codeResult.value.data
      ? (codeResult.value.data as { code: string }).code
      : null;

  const events =
    eventsResult.status === 'fulfilled' && eventsResult.value.data
      ? (eventsResult.value.data as { event_type: string; amount_czk: number }[])
      : [];

  const totalReferred = events.filter((e) => e.event_type === 'registration').length;
  const totalValueCzk = events.reduce((sum, e) => sum + (e.amount_czk ?? 0), 0);

  return { code, totalReferred, totalValueCzk };
}

// ============================================================
// Format referral code for display: "847293" → "847 293"
// ============================================================

export function formatReferralCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return code;
}

// ============================================================
// Main hook
// ============================================================

export function useReferral() {
  const { user } = useAuthStore();
  const userId = user?.id;

  const query = useQuery({
    queryKey: referralKeys.detail(userId ?? ''),
    queryFn: () => fetchReferralData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const data = query.data ?? { code: null, totalReferred: 0, totalValueCzk: 0 };

  // Full referral link for this user
  const referralLink = data.code ? getReferralLink(data.code) : null;

  // Copy the FULL referral link to clipboard (not just the bare code)
  const copyCode = async (): Promise<void> => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      // Fallback for older browsers / Capacitor webview
      const el = document.createElement('textarea');
      el.value = referralLink;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  // Share via Web Share API if available, otherwise full-link clipboard fallback
  const shareCode = async (): Promise<void> => {
    if (!data.code || !referralLink) return;

    const shareText = `Zkus dechová cvičení v DechBaru. Zaregistruj se přes můj odkaz a získej přístup k dechovým cvičením: ${referralLink}`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'DechBar — dechová cvičení',
          text: shareText,
          url: referralLink,
        });
        return;
      } catch {
        // User cancelled or share failed → fall through to clipboard
      }
    }

    // Clipboard fallback — copies the full link
    await copyCode();
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return {
    code: data.code,
    formattedCode: data.code ? formatReferralCode(data.code) : null,
    /** Full referral link: https://www.dechbar.cz/?ref=XXXXXX — ready to copy/share */
    referralLink,
    totalReferred: data.totalReferred,
    totalValueCzk: data.totalValueCzk,
    isLoading: query.isLoading,
    error: query.error,
    copyCode,
    shareCode,
    canShare,
  };
}
