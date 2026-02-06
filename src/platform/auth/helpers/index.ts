/**
 * Auth Helpers - Barrel Export
 * 
 * Helper functions for authentication and authorization.
 * 
 * @package DechBar_App
 * @subpackage Platform/Auth/Helpers
 */

export { loadUserRoles } from './loadUserRoles';
export { 
  hasRole, 
  hasAnyRole, 
  hasAllRoles, 
  hasMinLevel,
  isAdmin,
  isVip,
  isTeacher,
  getUserHighestRole
} from './roleHelpers';
