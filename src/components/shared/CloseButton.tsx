/**
 * CloseButton Component
 * 
 * Global standardized close button for modals, dialogs, and dismissible UI elements.
 * Ensures consistent styling, positioning, and behavior across the entire application.
 * 
 * Design: Brand Book 2.0 compliant
 * - Teal hover effect (#2CBEC6 at 10% opacity)
 * - Top-right positioning
 * - 24x24px icon size (default)
 * - Smooth transitions
 * 
 * @package DechBar_App
 * @subpackage Components/Shared
 */

interface CloseButtonProps {
  /** Click handler for close action */
  onClick: () => void;
  /** Accessibility label (default: "Zavřít") */
  ariaLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Icon size (default: 24) */
  size?: 16 | 20 | 24 | 32;
}

export function CloseButton({ 
  onClick, 
  ariaLabel = 'Zavřít',
  className = '',
  size = 24
}: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`close-button ${className}`}
      aria-label={ariaLabel}
    >
      <svg 
        className="close-button__icon" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  );
}
