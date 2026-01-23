/**
 * Toast Types
 * 
 * Type definitions for toast notification system.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Toast
 */

export type ToastIcon = '🔒' | 'ℹ️' | '✅' | '❌';

export interface ToastMessage {
  id: string;
  message: string;
  icon?: ToastIcon;
  duration?: number; // milliseconds, default 2000
}

export interface ToastContextValue {
  show: (message: string, options?: { icon?: ToastIcon; duration?: number }) => void;
  hide: (id: string) => void;
  clear: () => void;
}
