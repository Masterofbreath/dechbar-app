/**
 * ConfirmModal - Brand Book Compliant Confirmation Dialog
 * 
 * Universal confirmation modal for destructive or important actions.
 * Supports multiple variants (danger, warning, info) for different contexts.
 * 
 * Design: Visual Brand Book 2.0
 * - Dark elevated surface (#2A2A2A)
 * - Variant-based colors (danger = red, warning = yellow, info = teal)
 * - Smooth animations
 * - Touch-friendly buttons (min 44px)
 * 
 * @package DechBar_App
 * @subpackage Components/Shared
 * @since 0.3.0
 */

interface ConfirmModalProps {
  /** Modal visibility state */
  isOpen: boolean;
  /** Close handler (cancel action) */
  onClose: () => void;
  /** Confirm handler (proceed action) */
  onConfirm: () => void;
  /** Modal title */
  title: string;
  /** Descriptive message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Visual variant for context */
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Potvrdit',
  cancelText = 'Zrušit',
  variant = 'info'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Icon SVG per variant (custom SVG, no emoji)
  const iconSVG = {
    danger: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
      </svg>
    ),
    warning: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
      </svg>
    ),
    info: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    )
  }[variant];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`confirm-modal confirm-modal--${variant}`}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className="confirm-modal__icon" aria-hidden="true">
          {iconSVG}
        </div>
        
        <h2 id="confirm-title" className="confirm-modal__title">
          {title}
        </h2>
        
        <p id="confirm-message" className="confirm-modal__message">
          {message}
        </p>
        
        <div className="confirm-modal__actions">
          <button 
            className="confirm-modal__button confirm-modal__button--cancel"
            onClick={onClose}
            type="button"
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-modal__button confirm-modal__button--confirm confirm-modal__button--${variant}`}
            onClick={handleConfirm}
            type="button"
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
