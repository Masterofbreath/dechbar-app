/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Modern effects classes (from effects.css)
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
      /* ===================================== */
      /* BREAKPOINTS (Brand Book 2.0 - 4 levels) */
      /* ===================================== */
      screens: {
        'sm': '390px',   // iPhone 14 Pro / Mobile
        'md': '768px',   // iPad Portrait / Tablet
        'lg': '1024px',  // iPad Landscape / Desktop
        'xl': '1280px',  // Desktop Wide
        // REMOVED: xs (320px), 2xl (1920px)
      },
      
      /* ===================================== */
      /* COLORS (Brand Book 2.0 - Dark-First) */
      /* Reference CSS custom properties for single source of truth */
      /* ===================================== */
      colors: {
        // Primary: Teal (brand identity, focus, links)
        'primary': {
          DEFAULT: 'var(--color-primary)',      // #2CBEC6
          light: 'var(--color-primary-light)',  // #6ADBE0
          dark: 'var(--color-primary-dark)',    // #15939A
        },
        
        // Accent: Gold (CTAs, highlights, achievements)
        'accent': {
          DEFAULT: 'var(--color-accent)',       // #D6A23A
          light: 'var(--color-accent-light)',   // #F0C76A
          dark: 'var(--color-accent-dark)',     // #B8892F
        },
        
        // Backgrounds (dark mode)
        'background': 'var(--color-background)',  // #121212
        'surface': {
          DEFAULT: 'var(--color-surface)',        // #1E1E1E
          elevated: 'var(--color-surface-elevated)', // #2A2A2A
        },
        
        // Text colors (off-white hierarchy)
        'text': {
          primary: 'var(--color-text-primary)',    // #E0E0E0
          secondary: 'var(--color-text-secondary)', // #A0A0A0
          tertiary: 'var(--color-text-tertiary)',   // #707070
        },
        
        // Semantic colors
        'success': 'var(--color-success)',  // #10B981
        'error': 'var(--color-error)',      // #EF4444
        'warning': 'var(--color-warning)',  // #F59E0B
        'info': 'var(--color-info)',        // Teal (same as primary)
        
        // Neutral grays (Material Design dark palette)
        'gray': {
          50: 'var(--color-gray-50)',    // #FAFAFA
          100: 'var(--color-gray-100)',  // #F5F5F5
          200: 'var(--color-gray-200)',  // #EEEEEE
          300: 'var(--color-gray-300)',  // #E0E0E0
          400: 'var(--color-gray-400)',  // #BDBDBD
          500: 'var(--color-gray-500)',  // #9E9E9E
          600: 'var(--color-gray-600)',  // #757575
          700: 'var(--color-gray-700)',  // #616161
          800: 'var(--color-gray-800)',  // #424242
          900: 'var(--color-gray-900)',  // #212121
        },
        
        // Legacy compatibility (temporary - maps old gold to new accent)
        'gold': {
          DEFAULT: 'var(--color-accent)',      // Maps to new gold #D6A23A
          dark: 'var(--color-accent-dark)',
          light: 'var(--color-accent-light)',
        },
        
        // Base colors (kept for flexibility)
        'black': '#1a1a1a',
        'white': '#ffffff',
      },
      
      /* ===================================== */
      /* TYPOGRAPHY (Brand Book 2.0 - Inter) */
      /* ===================================== */
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'monospace'],
      },
      
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
      
      fontWeight: {
        light: 300,
        normal: 400,      // Regular - body text
        medium: 500,      // Emphasis, buttons
        semibold: 600,    // Subheadings
        bold: 700,        // Headings
        extrabold: 800,
      },
      
      letterSpacing: {
        tighter: 'var(--letter-spacing-tight)',   // -0.02em (premium headings)
        normal: 'var(--letter-spacing-normal)',   // 0 (body text)
        wider: 'var(--letter-spacing-wide)',      // 0.02em (all-caps)
      },
      
      /* ===================================== */
      /* SPACING (4px base unit system) */
      /* ===================================== */
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
      
      /* ===================================== */
      /* SHADOWS (Dark mode optimized) */
      /* ===================================== */
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)',
        'lg': '0 12px 24px rgba(0, 0, 0, 0.4), 0 16px 32px rgba(0, 0, 0, 0.3)',
        'xl': '0 24px 48px rgba(0, 0, 0, 0.5), 0 32px 64px rgba(0, 0, 0, 0.4)',
        '2xl': '0 48px 96px rgba(0, 0, 0, 0.6)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        
        // Gold accent shadows (for CTAs, highlights)
        'gold': '0 4px 16px rgba(214, 162, 58, 0.3), 0 8px 32px rgba(214, 162, 58, 0.2)',
        'gold-lg': '0 8px 24px rgba(214, 162, 58, 0.4), 0 16px 48px rgba(214, 162, 58, 0.3)',
      },
      
      /* ===================================== */
      /* BORDER RADIUS (Rounded, modern) */
      /* ===================================== */
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
      
      /* ===================================== */
      /* BACKDROP EFFECTS (Glassmorphism) */
      /* ===================================== */
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
      
      /* ===================================== */
      /* ANIMATIONS (Premium feel) */
      /* ===================================== */
      transitionTimingFunction: {
        'spring-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-smooth': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      transitionDuration: {
        'fast': '150ms',
        DEFAULT: '250ms',
        'slow': '350ms',
      },
      
      /* ===================================== */
      /* Z-INDEX LAYERS */
      /* ===================================== */
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
