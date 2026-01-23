/**
 * useToast - Toast Notification Store
 * 
 * Zustand store pro globální toast notifications.
 * 
 * @package DechBar_App
 * @subpackage Hooks
 * @since 0.3.0
 */

import { create } from 'zustand';

/**
 * Toast variant types
 */
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast state interface
 */
export interface ToastState {
  message: string;
  variant: ToastVariant;
  isVisible: boolean;
}

/**
 * Toast store interface
 */
interface ToastStore {
  toast: ToastState | null;
  showToast: (message: string, variant?: ToastVariant) => void;
  hideToast: () => void;
}

/**
 * Auto-hide timeout ref (stored outside component)
 */
let autoHideTimeout: NodeJS.Timeout | null = null;

/**
 * Toast store
 * 
 * @example
 * const { showToast } = useToast();
 * showToast('Hotovo! KP uložena.', 'success');
 */
export const useToast = create<ToastStore>((set) => ({
  toast: null,
  
  /**
   * Show toast notification
   * 
   * Auto-hide po 3 sekundách.
   */
  showToast: (message: string, variant: ToastVariant = 'info') => {
    // Clear existing timeout
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout);
    }
    
    // Show toast
    set({
      toast: {
        message,
        variant,
        isVisible: true,
      },
    });
    
    // Auto-hide po 3s
    autoHideTimeout = setTimeout(() => {
      set({ toast: null });
      autoHideTimeout = null;
    }, 3000);
  },
  
  /**
   * Hide toast immediately
   */
  hideToast: () => {
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout);
      autoHideTimeout = null;
    }
    set({ toast: null });
  },
}));
