/**
 * ProtectedRoute Component
 * 
 * Route wrapper that requires authentication
 * Shows auth modal for unauthenticated users
 * 
 * @package DechBar_App
 * @subpackage Components
 */

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/platform/auth';
import { AuthModal } from './auth/AuthModal';
import { Loader } from '@/platform/components';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isLoggingOut } = useAuth(); // ✅ USE isLoggingOut FLAG
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // If not loading and no user, show auth modal
    // ✅ BUT: Don't show if logging out (prevents LoginView flash during redirect)
    if (!isLoading && !user && !isLoggingOut) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, isLoading, isLoggingOut]); // ✅ ADD isLoggingOut DEPENDENCY

  // Show loading while checking authentication
  if (isLoading) {
    return <Loader message="Dýchej s námi..." />;
  }

  // ✅ NEW: If logging out, show loader (NOT LoginView)
  // This prevents the flash of LoginView during web logout redirect
  if (isLoggingOut) {
    return <Loader message="Dýchej s námi..." />;
  }

  // If no user, show auth modal
  if (!user) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          // User can't close modal on protected routes (must login)
          // But we keep the handler for flexibility
        }}
        defaultView="login"
      />
    );
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}
