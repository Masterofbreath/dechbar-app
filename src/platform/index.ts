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
export { supabase, usePublicStats } from './api';
export type { PublicStats } from './api';

// Hooks
export { useScrollLock, useNavigation, useFocusTrap } from './hooks';
export type { NavTab } from './hooks';

// Components
export { 
  Button, 
  IconButton, 
  TextLink, 
  Input, 
  Checkbox, 
  Card,
  Logo,
  NavIcon
} from './components';
export type { 
  ButtonProps, 
  IconButtonProps, 
  TextLinkProps, 
  InputProps, 
  CheckboxProps, 
  CardProps,
  LogoProps,
  NavIconProps
} from './components';

// Navigation
export { TopNav, BottomNav } from './components/navigation';
export type { TopNavProps } from './components/navigation';

// Layouts
export { AppLayout } from './layouts';
export type { AppLayoutProps } from './layouts';

// Types (re-export from types folder)
export type * from './types';
