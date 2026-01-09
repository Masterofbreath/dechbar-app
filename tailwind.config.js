/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Modern effects classes (from modern-effects.css)
    'glass-card',
    'glass-card--subtle',
    'glass-card--strong',
    'button--gold',
    'card--elevated',
    'card--sangvinik',
    'card--cholerik',
    'card--melancholik',
    'card--flegmatik',
    'text--gold',
    'mesh-background',
    'skeleton',
    'ripple',
    'floating',
    'pulse',
    'scale-spring',
    'glow-on-hover',
    // Also safelist patterns for variants
    {
      pattern: /^(glass-card|button|card|text)--.*/,
    },
  ],
  theme: {
    extend: {
      // Breakpoints (from FOUNDATION)
      screens: {
        'xs': '320px',
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1440px',
        '2xl': '1920px',
      },
      
      // Colors - Clean Minimal Palette
      colors: {
        // Brand Gold (primary accent)
        'gold': {
          DEFAULT: '#F8CA00',
          dark: '#E5B800',
          light: '#FFD700',
        },
        
        // Neutral Grays (UI)
        'gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        
        // Base colors
        'black': '#1a1a1a',
        'white': '#ffffff',
        
        // Semantic (minimal)
        'success': '#10b981',
        'error': '#ef4444',
      },
      
      // Spacing (4px base unit from FOUNDATION)
      spacing: {
        '0': '0',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      
      // Font sizes (from FOUNDATION typography-scale.css)
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
      },
      
      // Font weights (from FOUNDATION)
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      
      // Box shadows (modern, clean)
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.05)',
        'md': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.08)',
        'lg': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12)',
        'xl': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 24px 48px rgba(0, 0, 0, 0.15)',
        '2xl': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.12), 0 24px 48px rgba(0, 0, 0, 0.15), 0 48px 96px rgba(0, 0, 0, 0.2)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        
        // Gold accent shadows (for CTA buttons, highlights)
        'gold': '0 4px 16px rgba(248, 202, 0, 0.3), 0 8px 32px rgba(248, 202, 0, 0.2)',
        'gold-lg': '0 4px 16px rgba(248, 202, 0, 0.4), 0 8px 32px rgba(248, 202, 0, 0.3)',
      },
      
      // Border radius (modern, rounded)
      borderRadius: {
        'none': '0',
        'sm': '4px',
        DEFAULT: '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        'full': '9999px',
      },
      
      // Backdrop blur (glassmorphism)
      backdropBlur: {
        'subtle': '10px',
        'glass': '20px',
        'strong': '30px',
      },
      
      backdropSaturate: {
        150: '1.5',
        180: '1.8',
        200: '2',
      },
      
      // Animation timing functions (from modern-effects.css)
      transitionTimingFunction: {
        'spring-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-smooth': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // Animation durations
      transitionDuration: {
        'fast': '150ms',
        DEFAULT: '250ms',
        'slow': '350ms',
      },
      
      // Z-index layers
      zIndex: {
        'player': '999',
        'bottom-nav': '1000',
        'top-nav': '1001',
        'ai-bubble': '1002',
        'modal': '10000',
        'toast': '10001',
      },
    },
  },
  plugins: [],
}
