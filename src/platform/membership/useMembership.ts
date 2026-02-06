/**
 * useMembership Hook
 * 
 * Access user's membership plan and status.
 * Now reads from unified user state store (real-time synced).
 * 
 * @package DechBar_App
 * @subpackage Platform/Membership
 * @since Original
 * @updated 2.47.0 - Use unified user state store (no React Query!)
 */

import { useUserState } from '@/platform/user/userStateStore';
import type { UserMembership } from '@/platform/user/userStateStore';

interface UseMembershipReturn {
  membership: UserMembership | null;
  plan: 'ZDARMA' | 'SMART' | 'AI_COACH';
  isPremium: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Get user's active membership
 * 
 * No userId parameter needed - reads from current logged-in user
 */
export function useMembership(): UseMembershipReturn {
  // ✅ NEW: Read from unified store (real-time synced!)
  const membership = useUserState((state) => state.membership);
  const plan = useUserState((state) => state.membership?.plan || 'ZDARMA');
  const isPremium = useUserState((state) => state.isPremium);
  const isLoading = useUserState((state) => state.isLoading);

  return {
    membership,
    plan,
    isPremium,
    isLoading,
    error: null, // No errors in unified store (handled internally)
  };
}
