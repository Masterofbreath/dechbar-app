/**
 * Toast Context
 * 
 * Global toast notification system with queue management.
 * Max 1 toast visible at a time.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Toast
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Toast } from './Toast';
import type { ToastMessage, ToastContextValue } from './types';

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider - Wraps app to provide toast functionality
 * 
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [queue, setQueue] = useState<ToastMessage[]>([]);
  const [current, setCurrent] = useState<ToastMessage | null>(null);

  const show = useCallback((message: string, options?: { icon?: typeof queue[0]['icon']; duration?: number }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      id,
      message,
      icon: options?.icon,
      duration: options?.duration,
    };

    setQueue(prev => [...prev, newToast]);
  }, []);

  const hide = useCallback((id: string) => {
    setCurrent(null);
    // Process next in queue after a brief delay
    setTimeout(() => {
      setQueue(prev => {
        const filtered = prev.filter(t => t.id !== id);
        if (filtered.length > 0 && !current) {
          setCurrent(filtered[0]);
          return filtered.slice(1);
        }
        return filtered;
      });
    }, 100);
  }, [current]);

  const clear = useCallback(() => {
    setCurrent(null);
    setQueue([]);
  }, []);

  // Auto-show next toast from queue
  useCallback(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [current, queue])();

  return (
    <ToastContext.Provider value={{ show, hide, clear }}>
      {children}
      {current && <Toast toast={current} onDismiss={hide} />}
    </ToastContext.Provider>
  );
}

/**
 * useToast - Access toast notifications
 * 
 * @example
 * const { show } = useToast();
 * show('Profile locked', { icon: '🔒' });
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
