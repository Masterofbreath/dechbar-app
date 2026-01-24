/**
 * Toast Component - Global Toast Notifications
 * 
 * Zobrazuje krátké notifikace (success, error, info, warning).
 * Auto-hide po 3 sekundách.
 * 
 * Design: Apple premium style
 * - Bottom center (mobile) / Top right (desktop)
 * - Slide up + fade in animation
 * - BEZ EMOJI (custom SVG ikony)
 * 
 * @package DechBar_App
 * @subpackage Components/Shared
 * @since 0.3.0
 */

import { useToast } from '@/hooks/useToast';
import { NavIcon } from '@/platform/components/NavIcon';

/**
 * Get icon for toast variant
 */
function getToastIcon(variant: 'success' | 'error' | 'info' | 'warning') {
  switch (variant) {
    case 'success':
      return <NavIcon name="check" size={20} />;
    case 'error':
      return <NavIcon name="x" size={20} />;
    case 'info':
      return <NavIcon name="info" size={20} />;
    case 'warning':
      return <NavIcon name="x" size={20} />;
  }
}

/**
 * Toast component
 * 
 * Render v App.tsx (top level).
 * 
 * @example
 * // V App.tsx:
 * <Toast />
 * 
 * // V jakékoli komponentě:
 * const { showToast } = useToast();
 * showToast('Hotovo! KP uložena.', 'success');
 */
export function Toast() {
  const { toast, hideToast } = useToast();
  
  if (!toast) return null;
  
  return (
    <div 
      className={`toast toast--${toast.variant} ${toast.isVisible ? 'toast--visible' : ''}`}
      onClick={hideToast}
      role="alert"
      aria-live="polite"
    >
      <div className="toast__icon">
        {getToastIcon(toast.variant)}
      </div>
      <div className="toast__message">
        {toast.message}
      </div>
    </div>
  );
}
