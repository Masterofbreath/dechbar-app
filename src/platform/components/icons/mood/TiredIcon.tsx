/**
 * TiredIcon - Sleep/Moon Icon
 * 
 * Custom SVG icon for tired mood state.
 * Outline style, 2px stroke, currentColor.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Icons/Mood
 */

export interface TiredIconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * TiredIcon - Crescent moon with zzz
 */
export function TiredIcon({ 
  size = 24, 
  color = 'currentColor', 
  className = '' 
}: TiredIconProps) {
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
      className={`mood-icon mood-icon--tired ${className}`}
      aria-hidden="true"
    >
      {/* Crescent moon */}
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      
      {/* ZZZ sleep symbols */}
      <path d="M3 5h3l-3 3h3" opacity="0.6" />
      <path d="M5 2h2l-2 2h2" opacity="0.4" />
    </svg>
  );
}
