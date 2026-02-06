/**
 * Role Helper Utilities
 * 
 * Reusable functions for role checking across the application.
 * Provides clean API for role-based access control.
 * 
 * @package DechBar_App
 * @subpackage Platform/Auth/Helpers
 * @since 0.3.0
 */

import type { User } from '../types';

/**
 * Check if user has specific role
 * 
 * @param user - User object
 * @param role - Role ID to check (e.g., 'admin', 'ceo')
 * @returns boolean
 * 
 * @example
 * if (hasRole(user, 'admin')) {
 *   console.log('User is admin');
 * }
 */
export function hasRole(user: User | null | undefined, role: string): boolean {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 * 
 * @param user - User object
 * @param roles - Array of role IDs to check
 * @returns boolean
 * 
 * @example
 * if (hasAnyRole(user, ['admin', 'ceo'])) {
 *   console.log('User is admin or CEO');
 * }
 */
export function hasAnyRole(user: User | null | undefined, roles: string[]): boolean {
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles!.includes(role));
}

/**
 * Check if user has all of the specified roles
 * 
 * @param user - User object
 * @param roles - Array of role IDs to check
 * @returns boolean
 * 
 * @example
 * if (hasAllRoles(user, ['member', 'teacher'])) {
 *   console.log('User is both member and teacher');
 * }
 */
export function hasAllRoles(user: User | null | undefined, roles: string[]): boolean {
  if (!user || !user.roles) return false;
  return roles.every(role => user.roles!.includes(role));
}

/**
 * Check if user has minimum role level
 * 
 * Role levels (from roles table):
 * - member: 1
 * - vip_member: 2
 * - teacher: 3
 * - admin: 4
 * - ceo: 5
 * 
 * @param user - User object
 * @param minLevel - Minimum required level
 * @returns boolean
 * 
 * @example
 * if (hasMinLevel(user, 4)) {
 *   console.log('User is admin or higher (ceo)');
 * }
 */
export function hasMinLevel(user: User | null | undefined, minLevel: number): boolean {
  if (!user || user.level === undefined) return false;
  return user.level >= minLevel;
}

/**
 * Check if user is admin or CEO
 * Common check used across the app
 * 
 * @param user - User object
 * @returns boolean
 * 
 * @example
 * if (isAdmin(user)) {
 *   console.log('Show admin features');
 * }
 */
export function isAdmin(user: User | null | undefined): boolean {
  // #region agent log
  const result = hasAnyRole(user, ['admin', 'ceo']);
  fetch('http://127.0.0.1:7242/ingest/cf73e82f-4e01-47cc-8646-0d686e20f797',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'roleHelpers.ts:101',message:'isAdmin check',data:{result,hasUser:!!user,hasRoles:!!(user?.roles),roles:user?.roles||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2_H3'})}).catch(()=>{});
  // #endregion
  return result;
}

/**
 * Check if user is VIP (vip_member or higher)
 * 
 * @param user - User object
 * @returns boolean
 */
export function isVip(user: User | null | undefined): boolean {
  return hasMinLevel(user, 2); // vip_member = level 2
}

/**
 * Check if user is teacher or higher
 * 
 * @param user - User object
 * @returns boolean
 */
export function isTeacher(user: User | null | undefined): boolean {
  return hasMinLevel(user, 3); // teacher = level 3
}

/**
 * Get user's highest role name
 * 
 * @param user - User object
 * @returns string - Highest role name or 'guest'
 * 
 * @example
 * const roleName = getUserHighestRole(user); // 'admin'
 */
export function getUserHighestRole(user: User | null | undefined): string {
  if (!user || !user.roles || user.roles.length === 0) {
    return 'guest';
  }
  
  // Role hierarchy (highest first)
  const roleHierarchy = ['ceo', 'admin', 'teacher', 'vip_member', 'student', 'member'];
  
  for (const role of roleHierarchy) {
    if (user.roles.includes(role)) {
      return role;
    }
  }
  
  return user.roles[0]; // Fallback: first role
}
