/**
 * useAccountData - Account Data Hook
 *
 * Fetches the user's owned lifetime/subscription modules,
 * enriched with module name and price from the modules table.
 *
 * Membership (plan, status) comes from useUserState which is already loaded at login.
 * This hook only handles the `user_modules` table (purchased programs).
 *
 * Filters out membership modules (membership-smart, membership-ai-coach) —
 * those are covered by the memberships table and useUserState.
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

export interface OwnedModule {
  module_id: string;
  name: string;
  price_czk: number;
  purchase_type: 'lifetime' | 'subscription';
  purchased_at: string;
  current_period_end: string | null;
  /** Module accent color from DB (e.g. "#2CBEC6"). Fallback thumbnail background. */
  color: string | null;
  /** Module icon from DB — may be emoji, icon identifier, or null. Fallback thumbnail label. */
  icon: string | null;
  /** Cover image URL from akademie_programs table (CDN). Preferred over color+icon thumbnail. */
  cover_image_url: string | null;
}

// ============================================================
// Query key
// ============================================================

const accountKeys = {
  all: ['account'] as const,
  modules: (userId: string) => [...accountKeys.all, 'modules', userId] as const,
};

// ============================================================
// Fetch owned modules
// ============================================================

async function fetchOwnedModules(userId: string): Promise<OwnedModule[]> {
  // Step 1: Fetch user's owned modules with basic module info
  const { data, error } = await supabase
    .from('user_modules')
    .select(`
      module_id,
      purchase_type,
      purchased_at,
      current_period_end,
      modules!inner (
        name,
        price_czk,
        icon,
        color
      )
    `)
    .eq('user_id', userId)
    // Lifetime purchases: subscription_status IS NULL (no subscription cycle)
    // Active subscriptions: subscription_status = 'active'
    // Both are valid owned modules. Cancelled/expired subscriptions are excluded.
    .or('subscription_status.eq.active,and(subscription_status.is.null,purchase_type.eq.lifetime)')
    .not('module_id', 'like', 'membership-%')
    .order('purchased_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Step 2: Fetch cover images from akademie_programs for matching module_ids.
  // akademie_programs stores the CDN cover image per module — this is the
  // authoritative image source. Automatically picks up new programs as they're added.
  const moduleIds = data.map((r: Record<string, unknown>) => r.module_id as string);
  const { data: programs } = await supabase
    .from('akademie_programs')
    .select('module_id, cover_image_url')
    .in('module_id', moduleIds);

  const coverMap: Record<string, string> = {};
  for (const p of programs ?? []) {
    if (p.cover_image_url) {
      coverMap[p.module_id] = p.cover_image_url;
    }
  }

  return data.map((row: Record<string, unknown>) => {
    const mod = row.modules as Record<string, unknown> | null | undefined;
    return {
      module_id: row.module_id as string,
      name: mod?.name ?? row.module_id,
      price_czk: (mod?.price_czk as number) ?? 0,
      purchase_type: (row.purchase_type as 'lifetime' | 'subscription') ?? 'lifetime',
      purchased_at: row.purchased_at as string,
      current_period_end: (row.current_period_end as string | null) ?? null,
      color: (mod?.color as string | null) ?? null,
      icon: (mod?.icon as string | null) ?? null,
      cover_image_url: coverMap[row.module_id as string] ?? null,
    };
  });
}

// ============================================================
// Main hook
// ============================================================

export function useAccountData() {
  const { user } = useAuthStore();
  const userId = user?.id;

  const modulesQuery = useQuery({
    queryKey: accountKeys.modules(userId ?? ''),
    queryFn: () => fetchOwnedModules(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ownedModules: modulesQuery.data ?? [],
    isLoading: modulesQuery.isLoading,
    error: modulesQuery.error,
  };
}
