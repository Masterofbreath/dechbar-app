/**
 * CelebrationIcon - Success/Completion Icon
 * 
 * Custom SVG icon for celebration moments.
 * Outline style, 2px stroke, currentColor.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Icons/Mood
 */

export interface CelebrationIconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * CelebrationIcon - Party popper / celebration
 */
export function CelebrationIcon({ 
  size = 24, 
  color = 'currentColor', 
  className = '' 
}: CelebrationIconProps) {
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
      className={`mood-icon mood-icon--celebration ${className}`}
      aria-hidden="true"
    >
      {/* Party popper cone */}
      <path d="M5.5 2.5l-1 6 6-1-5-5z" />
      <path d="M10.5 7.5l5 5" />
      <path d="M15.5 12.5l3-3" />
      
      {/* Confetti */}
      <circle cx="18" cy="5" r="1" fill={color} />
      <circle cx="14" cy="3" r="1" fill={color} />
      <circle cx="20" cy="8" r="1" fill={color} />
      <path d="M16 10l2-2" />
      <path d="M19 13l2-2" />
      
      {/* Sparkles */}
      <path d="M8 16l1 1-1 1-1-1 1-1z" />
      <path d="M19 19l1.5 1.5-1.5 1.5-1.5-1.5 1.5-1.5z" />
      <path d="M12 21l1 1-1 1-1-1 1-1z" />
    </svg>
  );
}
