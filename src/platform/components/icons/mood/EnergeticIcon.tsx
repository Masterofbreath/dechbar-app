/**
 * EnergeticIcon - Energy/Lightning Icon
 * 
 * Custom SVG icon for energized mood state.
 * Outline style, 2px stroke, currentColor.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Icons/Mood
 */

export interface EnergeticIconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * EnergeticIcon - Lightning bolt for energy
 */
export function EnergeticIcon({ 
  size = 24, 
  color = 'currentColor', 
  className = '' 
}: EnergeticIconProps) {
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
      className={`mood-icon mood-icon--energetic ${className}`}
      aria-hidden="true"
    >
      {/* Lightning bolt */}
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
