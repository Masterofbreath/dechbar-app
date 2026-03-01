/**
 * useManageSubscription Hook
 *
 * Manages subscription lifecycle actions for /muj-ucet:
 *   - cancelSubscription:    schedule cancel at period end
 *   - reactivateSubscription: undo cancellation
 *   - fetchInvoices:          lazy-fetch last 5 paid invoices
 *
 * After cancel/reactivate, syncs global userStateStore (refreshMembership)
 * so the app-side UcetPage and other consumers stay in sync.
 *
 * @package DechBar/Platform/Payments
 * @since 2026-03-01
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useUserState } from '@/platform/user/userStateStore';
import { useAuthStore } from '@/platform/auth/authStore';

// ============================================================
// Types (exported for use in MujUcetPage)
// ============================================================

export interface Invoice {
  id: string;
  date: string;           // ISO string
  amount_czk: number;
  description: string;
  pdf_url: string | null;
  status: string;
}

export type ActionState = 'idle' | 'loading' | 'success' | 'error';

export interface UseManageSubscriptionReturn {
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  invoices: Invoice[];
  isLoadingInvoices: boolean;
  fetchInvoices: () => Promise<void>;
  cancelState: ActionState;
  reactivateState: ActionState;
  error: string | null;
  clearError: () => void;
}

// React Query key — used by MujUcetPage to invalidate after mutation
export const MEMBERSHIP_QUERY_KEY = (userId: string) =>
  ['muj-ucet', 'membership', userId] as const;

// ============================================================
// Hook
// ============================================================

export function useManageSubscription(): UseManageSubscriptionReturn {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  const [cancelState, setCancelState] = useState<ActionState>('idle');
  const [reactivateState, setReactivateState] = useState<ActionState>('idle');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ── Cancel subscription ───────────────────────────────────
  const cancelSubscription = useCallback(async () => {
    setCancelState('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<{
        success: boolean;
        newStatus: string;
        error?: string;
      }>('manage-subscription', {
        body: { action: 'cancel' },
      });

      if (fnError) throw new Error(fnError.message || 'Nepodařilo se zrušit předplatné');
      if (!data?.success) throw new Error(data?.error || 'Nepodařilo se zrušit předplatné');

      setCancelState('success');

      // Sync global state (app-side components)
      await useUserState.getState().refreshMembership();

      // Invalidate local membership query (MujUcetPage re-fetches)
      if (userId) {
        queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY(userId) });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se zrušit předplatné';
      setError(message);
      setCancelState('error');
    }
  }, [userId, queryClient]);

  // ── Reactivate subscription ───────────────────────────────
  const reactivateSubscription = useCallback(async () => {
    setReactivateState('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<{
        success: boolean;
        newStatus: string;
        error?: string;
      }>('manage-subscription', {
        body: { action: 'reactivate' },
      });

      if (fnError) throw new Error(fnError.message || 'Nepodařilo se obnovit předplatné');
      if (!data?.success) throw new Error(data?.error || 'Nepodařilo se obnovit předplatné');

      setReactivateState('success');

      // Sync global state
      await useUserState.getState().refreshMembership();

      // Invalidate local membership query
      if (userId) {
        queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY(userId) });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se obnovit předplatné';
      setError(message);
      setReactivateState('error');
    }
  }, [userId, queryClient]);

  // ── Fetch invoices (lazy — called explicitly) ─────────────
  const fetchInvoices = useCallback(async () => {
    if (isLoadingInvoices) return;
    setIsLoadingInvoices(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<{
        invoices: Invoice[];
      }>('manage-subscription', {
        body: { action: 'get_invoices' },
      });

      if (fnError) {
        console.warn('[useManageSubscription] fetchInvoices error (non-blocking):', fnError.message);
        setInvoices([]);
        return;
      }

      setInvoices(data?.invoices ?? []);
    } catch (err) {
      // Non-blocking — invoice fetch failure should not surface as error to user
      console.warn('[useManageSubscription] fetchInvoices exception (non-blocking):', err);
      setInvoices([]);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [isLoadingInvoices]);

  return {
    cancelSubscription,
    reactivateSubscription,
    invoices,
    isLoadingInvoices,
    fetchInvoices,
    cancelState,
    reactivateState,
    error,
    clearError,
  };
}
