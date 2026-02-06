/**
 * AdminGuard Component
 * 
 * Security component that protects admin routes from unauthorized access.
 * Checks user role (admin or super_admin) and shows access denied page for non-admins.
 * 
 * @package DechBar_App
 * @subpackage Platform/Guards
 * @since 2.44.0
 */

import { ReactNode } from 'react';
import { useAuth, useIsAdmin } from '@/platform/auth';
import { Loader } from '@/platform/components';
import './AdminGuard.css';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading } = useAuth();
  const isAdmin = useIsAdmin();

  // Show loader while checking authentication
  if (isLoading) {
    return <Loader message="Ověřuji oprávnění..." />;
  }

  // Show access denied page if not admin
  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <div className="admin-access-denied__content">
          <svg 
            className="admin-access-denied__icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
          <h1 className="admin-access-denied__title">Přístup odepřen</h1>
          <p className="admin-access-denied__message">
            Nemáš admin oprávnění pro přístup k této sekci.
          </p>
          <a href="/app" className="admin-access-denied__button">
            Zpět do aplikace
          </a>
        </div>
      </div>
    );
  }

  // User is admin - render protected content
  return <>{children}</>;
}
