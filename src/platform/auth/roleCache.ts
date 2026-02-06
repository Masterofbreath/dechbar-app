/**
 * Role Cache Manager
 * 
 * Manages localStorage-based caching for user roles.
 * Features:
 * - Thread-safe operations
 * - Automatic expiration (24h TTL)
 * - Cache versioning
 * - Corruption recovery
 * 
 * @package DechBar_App
 * @subpackage Platform/Auth
 * @since 2.46.0
 */

const CACHE_KEY_PREFIX = 'user_roles_';
const CACHE_VERSION = 'v1';
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour (was 24h)

interface CachedRoles {
  version: string;
  userId: string;
  roles: string[];
  timestamp: number;
}

export class RoleCache {
  private getCacheKey(userId: string): string {
    return `${CACHE_KEY_PREFIX}${userId}`;
  }

  /**
   * Get cached roles for user (synchronous)
   * Returns null if cache miss, expired, or corrupted
   */
  get(userId: string): string[] | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(userId));
      if (!cached) return null;

      const data: CachedRoles = JSON.parse(cached);

      // Version check
      if (data.version !== CACHE_VERSION) {
        console.warn(`RoleCache: Version mismatch (expected ${CACHE_VERSION}, got ${data.version})`);
        this.clear(userId);
        return null;
      }

      // Validate structure
      if (!Array.isArray(data.roles)) {
        console.error('RoleCache: Invalid cache format (roles is not array)');
        this.clear(userId);
        return null;
      }

      // TTL check
      if (!this.isFresh(data.timestamp)) {
        console.log(`RoleCache: Cache expired for user ${userId}`);
        this.clear(userId);
        return null;
      }

      console.log(`✅ RoleCache: Cache hit for user ${userId} (${data.roles.length} roles)`);
      return data.roles;
    } catch (err) {
      console.error('RoleCache: Error reading cache', err);
      this.clear(userId);
      return null;
    }
  }

  /**
   * Set roles to cache
   */
  set(userId: string, roles: string[]): void {
    try {
      const data: CachedRoles = {
        version: CACHE_VERSION,
        userId,
        roles,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.getCacheKey(userId), JSON.stringify(data));
      console.log(`✅ RoleCache: Cached ${roles.length} roles for user ${userId}`);
    } catch (err) {
      console.error('RoleCache: Error writing cache', err);
    }
  }

  /**
   * Clear cache for user
   */
  clear(userId: string): void {
    localStorage.removeItem(this.getCacheKey(userId));
    console.log(`🗑️ RoleCache: Cleared cache for user ${userId}`);
  }

  /**
   * Clear all cached roles
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ RoleCache: Cleared all role caches');
    } catch (err) {
      console.error('RoleCache: Error clearing all caches', err);
    }
  }

  /**
   * Check if cache is fresh (within TTL)
   */
  isFresh(timestamp?: number): boolean {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  }

  /**
   * Get timestamp of cached roles (PUBLIC method)
   * Used by authStore for freshness checks
   */
  getTimestamp(userId: string): number | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(userId));
      if (!cached) return null;

      const data: CachedRoles = JSON.parse(cached);
      return data.timestamp;
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const roleCache = new RoleCache();
