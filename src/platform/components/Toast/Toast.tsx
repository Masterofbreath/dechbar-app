/**
 * Toast Component
 * 
 * Bottom-anchored toast notification (Apple style).
 * Dark glassmorphism with auto-dismiss.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Toast
 */

import { useEffect } from 'react';
import { useHaptic } from '@/platform/services/haptic';
import type { ToastMessage } from './types';

export interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

/**
 * Toast - Single toast notification
 * 
 * @example
 * <Toast toast={message} onDismiss={handleDismiss} />
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  const { trigger } = useHaptic();
  
  useEffect(() => {
    // Haptic feedback when toast appears
    trigger('light');
    
    // Auto-dismiss timer
    const duration = toast.duration || 2000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onDismiss, trigger]);

  return (
    <div className="toast" role="status" aria-live="polite">
      {toast.icon && (
        <span className="toast__icon" aria-hidden="true">
          {toast.icon}
        </span>
      )}
      <span className="toast__message">{toast.message}</span>
    </div>
  );
}
