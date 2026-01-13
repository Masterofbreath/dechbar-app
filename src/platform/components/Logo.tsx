import { LOGO_CONFIG } from '@/config/logo';
import { buildLogoPath, useLogoBreakpoint, getLogoDimensions, type LogoVariant } from '@/utils/logo';

export interface LogoProps {
  /**
   * Logo color variant
   * - off-white: #E0E0E0 (primary for dark mode)
   * - warm-black: #121212 (primary for light backgrounds)
   * - white: #FFFFFF (fallback for external use)
   * - black: #000000 (fallback for print)
   */
  variant?: LogoVariant;
  
  /**
   * Whether to use marketing logo (with slogan)
   * Default: false (logo without slogan)
   */
  withSlogan?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Click handler (for navigation)
   */
  onClick?: () => void;
}

/**
 * DechBar Logo Component (v2.0 - Refactored)
 * 
 * Renders the DechBar logo with automatic responsive sizing.
 * Uses centralized config, design tokens, and utility functions.
 * 
 * All dimensions, breakpoints, and paths are now managed through:
 * - src/config/logo.ts (configuration)
 * - src/styles/design-tokens/logo.css (CSS tokens)
 * - src/utils/logo.ts (utilities)
 * 
 * @example
 * ```tsx
 * // Dark mode navbar
 * <Logo variant="off-white" />
 * 
 * // Light background
 * <Logo variant="warm-black" />
 * 
 * // Marketing (with slogan)
 * <Logo variant="off-white" withSlogan />
 * ```
 */
export function Logo({ 
  variant = LOGO_CONFIG.defaults.variant,
  withSlogan = LOGO_CONFIG.defaults.withSlogan,
  className = '',
  onClick 
}: LogoProps) {
  const isMobile = useLogoBreakpoint();
  const size = isMobile ? 'mobile' : 'desktop';
  const { width, height } = getLogoDimensions(isMobile);
  
  const logoPath = buildLogoPath({
    variant,
    size,
    format: 'svg',
    withSlogan,
  });

  return (
    <img
      src={logoPath}
      alt="DechBar"
      width={width}
      height={height}
      className={`logo ${className}`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        display: 'block'
      }}
      loading="lazy"
    />
  );
}
