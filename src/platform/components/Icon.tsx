/**
 * DechBar Icon Component
 * 
 * Circular icon (2 water drops - teal + gold)
 * Used for: Loaders, favicons, app icons
 * 
 * Design: Simplified version of full logo (icon-only, no text)
 * Perfect for breathing animation due to circular shape
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.2.0
 */

export interface IconProps {
  /**
   * Color variant
   * - off-white: #E0E0E0 (primary for dark mode)
   * - warm-black: #121212 (for light backgrounds)
   * - colored: Teal + Gold (brand colors)
   */
  variant?: 'off-white' | 'warm-black' | 'colored';
  
  /**
   * Size in pixels
   * Default: 64
   */
  size?: number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function Icon({ 
  variant = 'off-white',
  size = 64,
  className = ''
}: IconProps) {
  
  // Color mapping based on variant
  const colors = {
    'off-white': {
      drop1: '#E0E0E0',
      drop2: '#E0E0E0',
    },
    'warm-black': {
      drop1: '#121212',
      drop2: '#121212',
    },
    'colored': {
      drop1: '#2CBEC6', // Teal (primary)
      drop2: '#D6A23A', // Gold (accent)
    },
  };
  
  const { drop1, drop2 } = colors[variant];
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`dechbar-icon ${className}`}
      aria-hidden="true"
    >
      {/* Left drop (Teal) - Water drop shape */}
      <path
        d="M 30 50 
           C 30 35, 20 25, 20 25
           C 20 25, 10 35, 10 50
           C 10 62, 18 70, 30 70
           C 38 70, 45 65, 48 58
           C 50 54, 48 50, 45 48
           C 42 46, 38 46, 35 48
           C 32 50, 30 52, 30 50 Z"
        fill={drop1}
        opacity="0.95"
      />
      
      {/* Right drop (Gold) - Water drop shape */}
      <path
        d="M 70 50
           C 70 35, 80 25, 80 25
           C 80 25, 90 35, 90 50
           C 90 62, 82 70, 70 70
           C 62 70, 55 65, 52 58
           C 50 54, 52 50, 55 48
           C 58 46, 62 46, 65 48
           C 68 50, 70 52, 70 50 Z"
        fill={drop2}
        opacity="0.95"
      />
      
      {/* Intersection glow (optional subtle effect) */}
      <ellipse
        cx="50"
        cy="55"
        rx="12"
        ry="8"
        fill="url(#icon-glow)"
        opacity="0.15"
      />
      
      {/* Gradient definition for subtle glow */}
      <defs>
        <radialGradient id="icon-glow">
          <stop offset="0%" stopColor={variant === 'colored' ? '#FFFFFF' : drop1} stopOpacity="0.6" />
          <stop offset="100%" stopColor={variant === 'colored' ? '#FFFFFF' : drop1} stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
