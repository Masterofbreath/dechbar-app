/**
 * Unified User State Store
 * 
 * Single source of truth for all user-related data:
 * - Roles (admin, ceo, member...)
 * - Membership (ZDARMA, SMART, AI_COACH)
 * - Modules (studio, challenges, akademie...)
 * 
 * Benefits:
 * - Real-time sync via Supabase Realtime
 * - Zero manual cache invalidation
 * - Instant UI updates on purchases/changes
 * - Single state management (no React Query needed)
 * 
 * @package DechBar_App
 * @subpackage Platform/User
 * @since 2.47.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/platform/api/supabase';

/**
 * User Membership Data
 */
export interface UserMembership {
  plan: 'ZDARMA' | 'SMART' | 'AI_COACH';
  status: 'active' | 'cancelled' | 'expired';
  type: 'lifetime' | 'subscription';
  purchasedAt: string;
  expiresAt: string | null;
}

/**
 * User State Interface
 */
export interface UserState {
  // User ID (from auth)
  userId: string | null;
  
  // Roles (from user_roles table)
  roles: string[];
  isAdmin: boolean;
  
  // Membership (from memberships table)
  membership: UserMembership | null;
  isPremium: boolean;
  
  // Modules (from user_modules table)
  ownedModules: string[];
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  fetchUserState: (userId: string) => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshMembership: () => Promise<void>;
  refreshModules: () => Promise<void>;
  clearUserState: () => void;
  
  // Internal setters (private by convention)
  _setRoles: (roles: string[]) => void;
  _setMembership: (membership: UserMembership | null) => void;
  _setOwnedModules: (modules: string[]) => void;
}

/**
 * Unified User State Store
 */
export const useUserState = create<UserState>()(
  devtools(
    (set, get) => ({
      // ============================================================
      // INITIAL STATE
      // ============================================================
      userId: null,
      roles: [],
      isAdmin: false,
      membership: null,
      isPremium: false,
      ownedModules: [],
      isLoading: false,
      
      // ============================================================
      // INTERNAL SETTERS (Private by convention)
      // ============================================================
      _setRoles: (roles) => {
        const isAdmin = roles.includes('admin') || roles.includes('ceo');
        set({ roles, isAdmin }, false, 'setRoles');
        console.log(`✅ Roles set: [${roles.join(', ')}], isAdmin: ${isAdmin}`);
      },
      
      _setMembership: (membership) => {
        const isPremium = membership ? membership.plan !== 'ZDARMA' : false;
        set({ membership, isPremium }, false, 'setMembership');
        console.log(`✅ Membership set: ${membership?.plan || 'null'}, isPremium: ${isPremium}`);
      },
      
      _setOwnedModules: (ownedModules) => {
        set({ ownedModules }, false, 'setOwnedModules');
        console.log(`✅ Owned modules set: [${ownedModules.join(', ')}]`);
      },
      
      // ============================================================
      // ACTIONS
      // ============================================================
      
      /**
       * Fetch all user state (roles + membership + modules)
       * Called on login/page load
       */
      fetchUserState: async (userId: string) => {
        console.log(`🔄 Fetching user state for user ${userId}...`);
        set({ isLoading: true, userId });
        
        try {
          // Fetch all in parallel for performance
          const [rolesResult, membershipResult, modulesResult] = await Promise.allSettled([
            // 1. Fetch roles
            supabase
              .from('user_roles')
              .select('role_id')
              .eq('user_id', userId),
            
            // 2. Fetch membership
            supabase
              .from('memberships')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            
            // 3. Fetch owned modules
            supabase
              .from('user_modules')
              .select('module_id')
              .eq('user_id', userId)
              .eq('subscription_status', 'active'),
          ]);
          
          // 1. Process roles
          if (rolesResult.status === 'fulfilled' && rolesResult.value.data) {
            const roles = rolesResult.value.data.map((r: Record<string, unknown>) => r.role_id as string);
            get()._setRoles(roles);
          } else {
            console.warn('⚠️ Failed to fetch roles:', rolesResult);
            get()._setRoles([]);
          }
          
          // 2. Process membership
          if (membershipResult.status === 'fulfilled' && membershipResult.value.data) {
            const m = membershipResult.value.data;
            get()._setMembership({
              plan: m.plan,
              status: m.status,
              type: m.type,
              purchasedAt: m.purchased_at,
              expiresAt: m.expires_at,
            });
          } else {
            // 'fulfilled' with null data = no membership row → user is on ZDARMA plan (expected)
            // 'rejected' = actual DB error → also default to ZDARMA safely
            if (membershipResult.status === 'rejected') {
              console.warn('⚠️ Failed to fetch membership (DB error):', membershipResult.reason);
            }
            get()._setMembership({
              plan: 'ZDARMA',
              status: 'active',
              type: 'lifetime',
              purchasedAt: new Date().toISOString(),
              expiresAt: null,
            });
          }
          
          // 3. Process modules
          if (modulesResult.status === 'fulfilled' && modulesResult.value.data) {
            const modules = modulesResult.value.data.map((m: Record<string, unknown>) => m.module_id as string);
            get()._setOwnedModules(modules);
          } else {
            console.warn('⚠️ Failed to fetch modules:', modulesResult);
            get()._setOwnedModules([]);
          }
          
          console.log('✅ User state fetched successfully');
        } catch (err) {
          console.error('❌ Failed to fetch user state:', err);
        } finally {
          set({ isLoading: false });
        }
      },
      
      /**
       * Refresh only roles (called by real-time listener)
       */
      refreshRoles: async () => {
        const userId = get().userId;
        if (!userId) {
          console.warn('⚠️ Cannot refresh roles: No user ID');
          return;
        }
        
        console.log('🔄 Refreshing roles...');
        
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', userId);
          
          if (error) throw error;
          
          const roles = data?.map((r: Record<string, unknown>) => r.role_id as string) || [];
          get()._setRoles(roles);
          console.log('✅ Roles refreshed successfully');
        } catch (err) {
          console.error('❌ Failed to refresh roles:', err);
        }
      },
      
      /**
       * Refresh only membership (called by real-time listener)
       */
      refreshMembership: async () => {
        const userId = get().userId;
        if (!userId) {
          console.warn('⚠️ Cannot refresh membership: No user ID');
          return;
        }
        
        console.log('🔄 Refreshing membership...');
        
        try {
          const { data, error } = await supabase
            .from('memberships')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (error) throw error;
          
          if (data) {
            get()._setMembership({
              plan: data.plan,
              status: data.status,
              type: data.type,
              purchasedAt: data.purchased_at,
              expiresAt: data.expires_at,
            });
            console.log('✅ Membership refreshed successfully');
          } else {
            console.warn('⚠️ No active membership found, defaulting to ZDARMA');
            get()._setMembership({
              plan: 'ZDARMA',
              status: 'active',
              type: 'lifetime',
              purchasedAt: new Date().toISOString(),
              expiresAt: null,
            });
          }
        } catch (err) {
          console.error('❌ Failed to refresh membership:', err);
        }
      },
      
      /**
       * Refresh only modules (called by real-time listener)
       */
      refreshModules: async () => {
        const userId = get().userId;
        if (!userId) {
          console.warn('⚠️ Cannot refresh modules: No user ID');
          return;
        }
        
        console.log('🔄 Refreshing modules...');
        
        try {
          const { data, error } = await supabase
            .from('user_modules')
            .select('module_id')
            .eq('user_id', userId)
            .eq('subscription_status', 'active');
          
          if (error) throw error;
          
          const modules = data?.map((m: Record<string, unknown>) => m.module_id as string) || [];
          get()._setOwnedModules(modules);
          console.log('✅ Modules refreshed successfully');
        } catch (err) {
          console.error('❌ Failed to refresh modules:', err);
        }
      },
      
      /**
       * Clear all user state (called on logout)
       */
      clearUserState: () => {
        set({
          userId: null,
          roles: [],
          isAdmin: false,
          membership: null,
          isPremium: false,
          ownedModules: [],
          isLoading: false,
        }, false, 'clearUserState');
        console.log('🗑️ User state cleared');
      },
    }),
    { name: 'user-state' } // Redux DevTools name
  )
);
