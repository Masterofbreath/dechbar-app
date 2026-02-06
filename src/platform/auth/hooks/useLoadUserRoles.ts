/**
 * useLoadUserRoles Hook
 * 
 * Background refresh of user roles from database.
 * Non-blocking - uses cache-first strategy for instant access.
 * 
 * Usage: Call once in RootLayout.tsx after useInitializeAuth()
 * 
 * @package DechBar_App
 * @subpackage Platform/Auth/Hooks
 * @since 2.46.0
 */

import { useEffect } from 'react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../authStore';
import { roleService } from '../roleService';

export function useLoadUserRoles() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Prefetch roles in background (non-blocking)
    // This warms up the cache and ensures fresh data
    roleService.prefetchRoles(user.id).then(() => {
      // Update authStore with freshly fetched roles
      roleService.fetchRolesWithCache(user.id).then(roles => {
        const currentUser = useAuthStore.getState().user;
        
        // Only update if user is still logged in
        if (currentUser?.id === user.id) {
          useAuthStore.getState()._setUser({
            ...currentUser,
            roles,
          });
          console.log('✅ useLoadUserRoles: Updated roles in authStore');
        }
      }).catch(err => {
        console.error('useLoadUserRoles: Failed to update roles', err);
      });
    });
  }, [user?.id]);
}
