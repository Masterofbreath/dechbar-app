/**
 * Logo Utilities
 * 
 * Utility functions for logo path building and responsive breakpoint detection.
 * 
 * @see docs/brand/LOGO_MANUAL.md
 */

import { useState, useEffect } from 'react';
import { LOGO_CONFIG, type LogoVariant, type LogoFormat, type LogoSize, type LogoRetina } from '@/config/logo';

/**
 * Build logo file path from configuration
 * 
 * @example
 * buildLogoPath({ variant: 'off-white', size: 'desktop', format: 'svg' })
 * // Returns: '/assets/brand/logo/svg/dechbar-logo-desktop-off-white.svg'
 */
export function buildLogoPath({
  variant = LOGO_CONFIG.defaults.variant,
  size = 'desktop',
  format = LOGO_CONFIG.defaults.format,
  retina = '1x',
  withSlogan = LOGO_CONFIG.defaults.withSlogan,
}: {
  variant?: LogoVariant;
  size?: LogoSize;
  format?: LogoFormat;
  retina?: LogoRetina;
  withSlogan?: boolean;
}): string {
  const prefix = withSlogan 
    ? LOGO_CONFIG.filePrefix.marketing 
    : LOGO_CONFIG.filePrefix.default;
  
  const retinaText = format === 'svg' ? '' : `@${retina}`;
  const folder = withSlogan ? 'marketing/' : '';
  
  return `${LOGO_CONFIG.basePath}/${folder}${format}/${prefix}-${size}-${variant}${retinaText}.${format}`;
}

/**
 * Get logo dimensions based on breakpoint
 */
export function getLogoDimensions(isMobile: boolean) {
  return isMobile 
    ? LOGO_CONFIG.sizes.mobile 
    : LOGO_CONFIG.sizes.desktop;
}

/**
 * React hook for responsive logo breakpoint detection
 * 
 * @returns true if mobile breakpoint (<768px), false otherwise
 */
export function useLogoBreakpoint(): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' 
      ? window.innerWidth < LOGO_CONFIG.sizes.mobile.breakpoint
      : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < LOGO_CONFIG.sizes.mobile.breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// Re-export types for convenience
export { LOGO_CONFIG, type LogoVariant, type LogoFormat, type LogoSize, type LogoRetina };
