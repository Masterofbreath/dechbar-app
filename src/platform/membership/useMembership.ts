/**
 * useMembership Hook
 * 
 * Access user's membership plan and status
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';

interface Membership {
  id: string;
  user_id: string;
  plan: 'ZDARMA' | 'DECHBAR_HRA' | 'AI_KOUC';
  status: 'active' | 'cancelled' | 'expired';
  type: 'lifetime' | 'subscription';
  purchased_at: string;
  expires_at: string | null;
}

interface UseMembershipReturn {
  membership: Membership | null;
  plan: 'ZDARMA' | 'DECHBAR_HRA' | 'AI_KOUC';
  isPremium: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Get user's active membership
 * 
 * @param userId - User ID
 */
export function useMembership(userId?: string): UseMembershipReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['membership', userId],
    queryFn: async (): Promise<Membership | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching membership:', error);
        throw error;
      }

      return data as Membership | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const membership = data || null;
  const plan = membership?.plan || 'ZDARMA';
  const isPremium = plan !== 'ZDARMA';

  return {
    membership,
    plan,
    isPremium,
    isLoading,
    error: error as Error | null,
  };
}
