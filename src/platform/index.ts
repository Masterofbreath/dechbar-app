/**
 * Platform Public API
 * 
 * All platform exports that modules can use.
 * This is the ONLY way modules should access platform functionality.
 */

// Authentication
export { useAuth } from './auth';
export type { User, SignInCredentials, SignUpCredentials } from './auth';

// Membership
export { useMembership, useModuleAccess } from './membership';

// Module System
export { useModules, useModule, useUserModules } from './modules';
export type { Module, UserModule, ModuleManifest } from './modules';

// API
export { supabase } from './api/supabase';

// Types (re-export from types folder)
export type * from './types';
