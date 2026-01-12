/**
 * Logo Configuration
 * 
 * Central configuration for DechBar logo system.
 * Single source of truth for all logo-related constants.
 * 
 * @see docs/brand/LOGO_MANUAL.md
 */

export const LOGO_CONFIG = {
  basePath: '/assets/brand/logo',
  
  filePrefix: {
    default: 'dechbar-logo',
    marketing: 'dechbar-logo-marketing',
  },
  
  variants: {
    'off-white': {
      cssVar: 'var(--color-text-primary)',
      hex: '#E0E0E0',
      usage: 'Dark mode (primary)',
    },
    'warm-black': {
      cssVar: 'var(--color-background)',
      hex: '#121212',
      usage: 'Light backgrounds (primary)',
    },
    'white': {
      hex: '#FFFFFF',
      usage: 'External (fallback)',
    },
    'black': {
      hex: '#000000',
      usage: 'Print (fallback)',
    },
  } as const,
  
  sizes: {
    mobile: { width: 150, height: 47, breakpoint: 768 },
    desktop: { width: 200, height: 63 },
  },
  
  retina: { '1x': 1, '2x': 2, '3x': 3 },
  
  defaults: {
    variant: 'off-white' as const,
    format: 'svg' as const,
    withSlogan: false,
  },
} as const;

export type LogoVariant = keyof typeof LOGO_CONFIG.variants;
export type LogoFormat = 'svg' | 'png' | 'webp';
export type LogoSize = 'mobile' | 'desktop';
export type LogoRetina = '1x' | '2x' | '3x';
