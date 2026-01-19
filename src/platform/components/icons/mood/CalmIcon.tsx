/**
 * CalmIcon - Peace/Zen Icon
 * 
 * Custom SVG icon for calm mood state.
 * Outline style, 2px stroke, currentColor.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Icons/Mood
 */

export interface CalmIconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * CalmIcon - Zen circle with gentle waves
 */
export function CalmIcon({ 
  size = 24, 
  color = 'currentColor', 
  className = '' 
}: CalmIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mood-icon mood-icon--calm ${className}`}
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      
      {/* Inner peaceful waves */}
      <path d="M8 12c1-1 2-1 3 0s2 1 3 0" />
      <path d="M8 15c1-1 2-1 3 0s2 1 3 0" opacity="0.6" />
      <path d="M8 9c1-1 2-1 3 0s2 1 3 0" opacity="0.6" />
    </svg>
  );
}
