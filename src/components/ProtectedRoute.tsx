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

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // If not loading and no user, show auth modal
    if (!isLoading && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-[#F8CA00] mx-auto mb-4" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600">Načítám...</p>
        </div>
      </div>
    );
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
