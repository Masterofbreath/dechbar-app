/**
 * StressedIcon - Tension/Alert Icon
 * 
 * Custom SVG icon for stressed mood state.
 * Outline style, 2px stroke, currentColor.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Icons/Mood
 */

export interface StressedIconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * StressedIcon - Alert triangle with waves
 */
export function StressedIcon({ 
  size = 24, 
  color = 'currentColor', 
  className = '' 
}: StressedIconProps) {
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
      className={`mood-icon mood-icon--stressed ${className}`}
      aria-hidden="true"
    >
      {/* Alert/tension waves */}
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <circle cx="12" cy="16" r="0.5" fill={color} />
      
      {/* Tension lines */}
      <path d="M16 8l2-2" opacity="0.4" />
      <path d="M8 8l-2-2" opacity="0.4" />
      <path d="M18 12l2 0" opacity="0.4" />
      <path d="M6 12l-2 0" opacity="0.4" />
    </svg>
  );
}
