/**
 * NavIcon Component - Universal UI Icon System
 * 
 * Outline-style SVG icons for navigation and UI elements.
 * All icons: 24x24 viewBox, 2px stroke, currentColor.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.2.0
 */

import type { JSX } from 'react';

export interface NavIconProps {
  /**
   * Icon name
   */
  name: 'home' | 'dumbbell' | 'graduation-cap' | 'chart-line' | 'settings' | 'bell' | 'sun' | 'refresh' | 'moon' | 'lightbulb';
  
  /**
   * Size in pixels
   * @default 24
   */
  size?: number;
  
  /**
   * Color (use CSS custom property or hex)
   * @default 'currentColor'
   */
  color?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * NavIcon - Universal UI icon component
 * 
 * @example
 * <NavIcon name="home" size={24} />
 * <NavIcon name="dumbbell" color="var(--color-primary)" />
 */
export function NavIcon({ 
  name, 
  size = 24, 
  color = 'currentColor',
  className = ''
}: NavIconProps) {
  
  // Icon path definitions (outline style, 2px stroke)
  const icons: Record<NavIconProps['name'], JSX.Element> = {
    // Navigation icons
    'home': (
      <path 
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    'dumbbell': (
      <>
        {/* Levá závaží */}
        <rect x="2" y="9" width="3" height="6" rx="1" />
        {/* Levý úchyt */}
        <rect x="5" y="10" width="2" height="4" rx="0.5" />
        {/* Střední tyč */}
        <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2.5" strokeLinecap="round" />
        {/* Pravý úchyt */}
        <rect x="17" y="10" width="2" height="4" rx="0.5" />
        {/* Pravá závaží */}
        <rect x="19" y="9" width="3" height="6" rx="1" />
      </>
    ),
    'graduation-cap': (
      <>
        <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 14v7" strokeLinecap="round" />
        <path d="M7 11.5v5.5c0 1.5 2 3 5 3s5-1.5 5-3v-5.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'chart-line': (
      <>
        {/* Osy */}
        <line x1="3" y1="20" x2="21" y2="20" strokeLinecap="round" />
        <line x1="3" y1="20" x2="3" y2="4" strokeLinecap="round" />
        {/* Sloupce (rostoucí trend) */}
        <rect x="6" y="15" width="3" height="5" rx="0.5" />
        <rect x="11" y="11" width="3" height="9" rx="0.5" />
        <rect x="16" y="7" width="3" height="13" rx="0.5" />
      </>
    ),
    
    // TOP NAV icons
    'settings': (
      <>
        {/* Gear/Cog icon - jednodušší verze */}
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12" strokeLinecap="round" />
      </>
    ),
    'bell': (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    
    // Preset protocol icons
    'sun': (
      <>
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
      </>
    ),
    'refresh': (
      <>
        <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'moon': (
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    ),
    
    // Info/Tips icon
    'lightbulb': (
      <>
        {/* Skleněná část žárovky */}
        <path d="M9 18h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 22h4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Vlákno + světlo */}
        <path 
          d="M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path d="M9 11v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Závit */}
        <path d="M9 18a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  };
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
      className={`nav-icon ${className}`}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
