/**
 * Unified Real-Time User State Sync Hook
 * 
 * Listens to changes in:
 * - user_roles (role changes)
 * - memberships (plan upgrades/downgrades)
 * - user_modules (module purchases)
 * 
 * Auto-refreshes userState → UI updates instantly (within 1 second)!
 * 
 * Usage: Call once in RootLayout.tsx after useInitializeAuth()
 * 
 * @package DechBar_App
 * @subpackage Platform/User
 * @since 2.47.0
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuth } from '@/platform/auth';
import { useUserState } from './userStateStore';

export function useRealtimeUserState() {
  const { user } = useAuth();
  const { refreshRoles, refreshMembership, refreshModules } = useUserState();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) {
      console.log('⏭️ Skipping real-time sync: No user logged in');
      return;
    }

    console.log(`🔌 Setting up unified real-time sync for user ${user.id}`);

    // ========================================
    // CHANNEL 1: User Roles Changes
    // ========================================
    const rolesChannel = supabase
      .channel(`user_roles:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔔 Real-time event: user_roles changed', {
            event: payload.eventType,
            old: payload.old,
            new: payload.new,
          });
          
          // Refresh roles from DB
          await refreshRoles();
          
          // Optional: Show toast notification
          if (payload.eventType === 'INSERT' && payload.new && 'role_id' in payload.new) {
            const roleId = (payload.new as Record<string, unknown>).role_id;
            console.log(`🎉 New role assigned: ${roleId}`);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time: user_roles channel active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time: user_roles channel failed to connect');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Real-time: user_roles channel timed out');
        }
      });

    // ========================================
    // CHANNEL 2: Membership Changes
    // ========================================
    const membershipChannel = supabase
      .channel(`memberships:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Membership is always UPDATE (not INSERT)
          schema: 'public',
          table: 'memberships',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔔 Real-time event: membership changed', {
            event: payload.eventType,
            old: payload.old,
            new: payload.new,
          });
          
          // Refresh membership from DB
          await refreshMembership();
          
          // Show toast notification for upgrades
          if (payload.new && 'plan' in payload.new) {
            const newPlan = (payload.new as Record<string, unknown>).plan;
            const oldPlan = payload.old && 'plan' in payload.old ? (payload.old as Record<string, unknown>).plan : null;
            
            if (newPlan !== oldPlan) {
              console.log(`🎉 Membership ${oldPlan ? 'upgraded' : 'changed'} to ${newPlan}!`);
              // TODO: Show toast notification to user
              // toast.success(`Gratulujeme! Máš nyní ${newPlan} membership!`);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time: memberships channel active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time: memberships channel failed to connect');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Real-time: memberships channel timed out');
        }
      });

    // ========================================
    // CHANNEL 3: Module Purchases
    // ========================================
    const modulesChannel = supabase
      .channel(`user_modules:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT (new purchase), UPDATE (renewal), DELETE (refund)
          schema: 'public',
          table: 'user_modules',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔔 Real-time event: user_modules changed', {
            event: payload.eventType,
            old: payload.old,
            new: payload.new,
          });
          
          // Refresh modules from DB
          await refreshModules();
          
          // Show toast notification for new purchases
          if (payload.eventType === 'INSERT' && payload.new && 'module_id' in payload.new) {
            const moduleId = (payload.new as Record<string, unknown>).module_id as string;
            const moduleNames: Record<string, string> = {
              studio: 'DechBar STUDIO',
              challenges: 'Výzvy',
              akademie: 'Akademie',
            };
            const moduleName = moduleNames[moduleId] || moduleId;
            
            console.log(`🎉 New module purchased: ${moduleName}!`);
            // TODO: Show toast notification to user
            // toast.success(`${moduleName} je nyní k dispozici!`);
          } else if (payload.eventType === 'DELETE') {
            console.log('⚠️ Module access removed (refund or expiration)');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time: user_modules channel active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time: user_modules channel failed to connect');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Real-time: user_modules channel timed out');
        }
      });

    // ========================================
    // CHANNEL 4: Profile Changes
    // Propagates full_name / nickname edits (e.g. from /muj-ucet) to the app
    // without requiring a full page reload.
    // Invalidates: useProfile React Query cache → ['profile', userId]
    // ========================================
    const profileChannel = supabase
      .channel(`profiles:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('🔔 Real-time event: profile changed → invalidating profile cache');
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time: profiles channel active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time: profiles channel failed to connect');
        }
      });

    // ========================================
    // CHANNEL 5: Notification Changes
    // New notifications appear instantly — no manual refresh needed.
    // Invalidates: useNotifications React Query cache → ['notifications', userId]
    // ========================================
    const notificationsChannel = supabase
      .channel(`user_notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT (new notification), UPDATE (read status), DELETE (soft-delete)
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('🔔 Real-time event: notification changed → invalidating notifications cache');
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time: user_notifications channel active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time: user_notifications channel failed to connect');
        }
      });

    console.log('✅ Unified real-time sync setup complete (5 channels)');

    // Cleanup all channels on unmount or user change
    return () => {
      console.log('🔌 Cleaning up unified real-time sync (unsubscribing from 5 channels)');
      
      rolesChannel.unsubscribe();
      membershipChannel.unsubscribe();
      modulesChannel.unsubscribe();
      profileChannel.unsubscribe();
      notificationsChannel.unsubscribe();
      
      console.log('✅ Real-time channels unsubscribed');
    };
  }, [user?.id, refreshRoles, refreshMembership, refreshModules, queryClient]);
}
