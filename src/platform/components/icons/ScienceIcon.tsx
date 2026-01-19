/**
 * ScienceIcon Component
 * 
 * Inline SVG icons for science pillars on landing page
 * Uses currentColor to inherit color from parent (GOLD accent)
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Icons
 */

interface ScienceIconProps {
  type: 'moon' | 'lightning' | 'chart';
  className?: string;
}

export function ScienceIcon({ type, className = '' }: ScienceIconProps) {
  const icons = {
    moon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    lightning: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    chart: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 17l-5-5-3 3-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };
  
  return <div className={className}>{icons[type]}</div>;
}
