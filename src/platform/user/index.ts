/**
 * User State Management
 * 
 * Unified state store for user data (roles + membership + modules)
 * with real-time sync via Supabase Realtime.
 * 
 * @package DechBar_App
 * @subpackage Platform/User
 * @since 2.47.0
 */

export { useUserState } from './userStateStore';
export { useRealtimeUserState } from './useRealtimeUserState';
export type { UserState, UserMembership } from './userStateStore';
