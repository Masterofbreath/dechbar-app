/**
 * Profile Role Helpers
 *
 * Utilities for displaying user roles in the UI.
 * Roles come from Supabase user_roles table via useUserState.
 *
 * Role hierarchy (highest → lowest):
 *   ceo > admin > teacher > student > member
 *
 * Special case: vip_member is shown as an avatar badge, NOT as the primary text role.
 *
 * @package DechBar_App
 * @subpackage Utils/Profile
 */

/**
 * Role IDs as they exist in the `roles` DB table.
 * Order: highest privilege first (for getDisplayRole).
 */
const ROLE_HIERARCHY = ['ceo', 'admin', 'teacher', 'student', 'member'] as const;

/**
 * Czech display names for each role_id.
 */
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  ceo: 'CEO DechBaru',
  admin: 'Administrátor',
  teacher: 'Lektor DechBaru',
  student: 'Student DechBaru',
  member: 'Člen DechBaru',
};

/**
 * Returns the Czech display name for the highest role the user holds,
 * excluding vip_member (which is shown as an avatar badge separately).
 *
 * Returns null when user has no displayable roles yet.
 *
 * @example
 * getDisplayRole(['member', 'vip_member']) // → 'Člen DechBaru'
 * getDisplayRole(['teacher', 'vip_member']) // → 'Lektor DechBaru'
 * getDisplayRole(['ceo', 'admin']) // → 'CEO DechBaru'
 * getDisplayRole([]) // → null
 */
export function getDisplayRole(roles: string[]): string | null {
  for (const role of ROLE_HIERARCHY) {
    if (roles.includes(role)) {
      return ROLE_DISPLAY_NAMES[role] ?? null;
    }
  }
  return null;
}

/**
 * Returns true if the user currently holds the vip_member role.
 * Used to show the gold VIP badge on the avatar.
 *
 * @example
 * isVIPMember(['member', 'vip_member']) // → true
 * isVIPMember(['member']) // → false
 */
export function isVIPMember(roles: string[]): boolean {
  return roles.includes('vip_member');
}
