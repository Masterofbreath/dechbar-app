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
  name: 'home' | 'dumbbell' | 'graduation-cap' | 'chart-line' | 'settings' | 'bell' | 
        'sun' | 'refresh' | 'moon' | 'lightbulb' | 'sparkles' | 'chevron-right' |
        'close' | 'user' | 'credit-card' | 'info' | 'logout' | 'lock' |
        'clock' | 'edit' | 'trash' | 'x' | 'wind' | 'layers' | 'bar-chart' | 'target' | 
        'zap' | 'circle' | 'check' | 'file-text' | 'chevron-up' | 'chevron-down';
  
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
    
    // Smart Exercise Button
    'sparkles': (
      <>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'chevron-right': (
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    ),
    
    // Settings Drawer icons
    'close': (
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    ),
    
    'user': (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    
    'credit-card': (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </>
    ),
    
    'info': (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
        <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" />
      </>
    ),
    
    'logout': (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    
    'lock': (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    
    // Exercise system icons
    'clock': (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'edit': (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'trash': (
      <>
        <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'x': (
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'wind': (
      <>
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'layers': (
      <>
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'bar-chart': (
      <>
        <line x1="12" y1="20" x2="12" y2="10" strokeLinecap="round" />
        <line x1="18" y1="20" x2="18" y2="4" strokeLinecap="round" />
        <line x1="6" y1="20" x2="6" y2="16" strokeLinecap="round" />
      </>
    ),
    'target': (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
    'zap': (
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'circle': (
      <circle cx="12" cy="12" r="10" />
    ),
    'check': (
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'file-text': (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'chevron-up': (
      <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'chevron-down': (
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
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
