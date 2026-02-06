/**
 * Role Service
 * 
 * Centralized service for fetching and managing user roles.
 * Features:
 * - Cache-first strategy
 * - Deduplication (prevents duplicate requests)
 * - Background refresh for stale cache
 * - Error handling with fallbacks
 * 
 * @package DechBar_App
 * @subpackage Platform/Auth
 * @since 2.46.0
 */

import { supabase } from '@/platform/api/supabase';
import { roleCache } from './roleCache';

class RoleService {
  private fetchInProgress = new Map<string, Promise<string[]>>();

  /**
   * Fetch roles from Supabase
   * Includes deduplication to prevent multiple simultaneous requests
   */
  async fetchRoles(userId: string): Promise<string[]> {
    // Prevent duplicate requests
    if (this.fetchInProgress.has(userId)) {
      console.log(`⏳ RoleService: Request already in progress for user ${userId}`);
      return this.fetchInProgress.get(userId)!;
    }

    const promise = this._fetchRoles(userId);
    this.fetchInProgress.set(userId, promise);

    try {
      const roles = await promise;
      return roles;
    } finally {
      this.fetchInProgress.delete(userId);
    }
  }

  private async _fetchRoles(userId: string): Promise<string[]> {
    try {
      console.log(`🔄 RoleService: Fetching roles from DB for user ${userId}...`);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId);

      if (error) {
        console.error('RoleService: Supabase error', error);
        throw error;
      }

      const roles = data?.map(r => r.role_id) || [];

      // Cache for future use
      roleCache.set(userId, roles);

      console.log(`✅ RoleService: Fetched ${roles.length} roles for user ${userId}`);
      return roles;
    } catch (err) {
      console.error('RoleService: Failed to fetch roles', err);
      throw err;
    }
  }

  /**
   * Fetch with cache-first strategy
   * Returns cached roles if available, otherwise fetches from DB
   * Triggers background refresh if cache is stale
   */
  async fetchRolesWithCache(userId: string): Promise<string[]> {
    // Try cache first (synchronous!)
    const cached = roleCache.get(userId);
    
    if (cached !== null) {
      console.log(`✅ RoleService: Using cached roles (${cached.length} roles)`);
      
      // Check if cache is stale
      const timestamp = this.getCacheTimestamp(userId);
      if (timestamp && !roleCache.isFresh(timestamp)) {
        console.log('🔄 RoleService: Cache is stale, refreshing in background...');
        
        // Refresh in background (fire and forget)
        this.fetchRoles(userId).catch(err => {
          console.error('RoleService: Background refresh failed', err);
        });
      }
      
      return cached;
    }

    // Cache miss → fetch from DB
    console.log('🔄 RoleService: Cache miss, fetching from DB...');
    return this.fetchRoles(userId);
  }

  /**
   * Prefetch roles (fire and forget)
   * Useful for warming up cache
   */
  async prefetchRoles(userId: string): Promise<void> {
    try {
      await this.fetchRoles(userId);
    } catch (err) {
      // Silent fail (it's prefetch)
      console.warn('RoleService: Prefetch failed', err);
    }
  }

  /**
   * Force refresh roles from DB (bypass cache)
   */
  async refreshRoles(userId: string): Promise<string[]> {
    console.log(`🔄 RoleService: Force refreshing roles for user ${userId}...`);
    return this.fetchRoles(userId);
  }

  /**
   * Clear cache for user (call on logout or role change)
   */
  clearCache(userId?: string): void {
    if (userId) {
      roleCache.clear(userId);
    } else {
      roleCache.clearAll();
    }
  }

  /**
   * Get cache timestamp for user
   */
  private getCacheTimestamp(userId: string): number | null {
    try {
      const cached = localStorage.getItem(`user_roles_${userId}`);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      return data.timestamp;
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const roleService = new RoleService();
