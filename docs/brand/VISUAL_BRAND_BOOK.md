# Visual Brand Book: DechBar 2.0

**Dark-First, Premium Tech-Wellbeing**

Version: 2.0  
Last Updated: 2026-01-12

---

## Table of Contents

1. [North Star Visual Principles](#north-star-visual-principles)
2. [Brand Colors](#brand-colors)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Effects & Interactions](#effects--interactions)
7. [Accessibility](#accessibility)
8. [Implementation Guidelines](#implementation-guidelines)

---

## North Star Visual Principles

DechBar 2.0 follows five core principles that ensure consistent, premium design:

### 1. Calm by Default

**Definition:** UI should feel calming and uncluttered. Visual elements should soothe, not stimulate.

**Example:**
- Minimal home screen with one clear CTA
- Dark background (#121212) with muted teal accents
- Slow, fluid animations (breathing bubble)

**Anti-Pattern:**
- Cluttered dashboard with blinking notifications
- Multiple competing animated elements
- Bright, jarring colors

### 2. One Strong CTA

**Definition:** Each view has ONE primary action that visually dominates. Secondary actions are subdued.

**Example:**
- Gold "Start Practice" button dominates the screen
- Settings is just an icon/text link
- Primary button uses accent gold, secondary uses surface colors

**Anti-Pattern:**
- Three equally-styled buttons competing for attention
- Everything is equally prominent = nothing stands out

### 3. Less is More

**Definition:** Minimalist execution increases clarity. Every element must have a purpose. Remove everything unnecessary.

**Example:**
- Daily tip section: short text + info icon only
- Limited color palette (teal primary, gold accent, neutrals)
- Concise copy, no jargon

**Anti-Pattern:**
- Profile screen with decorative background images
- Unnecessary icons everywhere
- Long explanatory paragraphs
- Duplicate buttons

### 4. Consistent & Intuitive

**Definition:** Consistency across all screens and platforms. Same components look and behave identically everywhere.

**Example:**
- Input fields always have teal underline on focus
- All icons are outline style, 2px stroke, rounded corners
- Gold highlight on active navigation items (iOS, Android, web)

**Anti-Pattern:**
- Inconsistent iconography (some solid, some outline, different weights)
- Buttons with different corner radii on different screens
- Form elements styled differently across views

### 5. Accessible Contrast

**Definition:** Visual must be clear in all conditions. Sufficient contrast, readable fonts, clear state indicators.

**Example:**
- Text on dark background: #E0E0E0 (87% white), not pure white
- Dark background: #121212 (not #000000) - avoids extreme contrast fatigue
- All text meets WCAG AA (min 4.5:1 contrast ratio)
- Focus indicators: 2px teal outline, clearly visible

**Anti-Pattern:**
- Pure white text on pure black background (too harsh)
- Low contrast text (#666 on #888)
- No visible focus states

---

## Brand Colors

### Color System Overview

```
Primary: Teal (brand identity, focus, links)
Accent: Gold (CTAs, highlights, success moments)
Background: Dark neutrals (calm, premium)
Text: Off-white shades (readable, not harsh)
```

### Primary - Teal

```css
--color-primary: #2CBEC6;        /* Main teal */
--color-primary-light: #6ADBE0;  /* Lighter variant */
--color-primary-dark: #15939A;   /* Darker variant */
```

**Usage:**
- Focus rings on inputs
- Active navigation states
- Links and interactive text
- Brand elements (logo primary color)

**Contrast Ratios:**
- #2CBEC6 on #121212 = 7.2:1 ✓ (WCAG AA)
- #2CBEC6 on #1E1E1E = 6.8:1 ✓ (WCAG AA)

### Accent - Gold

```css
--color-accent: #D6A23A;         /* Main gold */
--color-accent-light: #F0C76A;   /* Lighter variant */
--color-accent-dark: #B8892F;    /* Darker variant */
```

**Usage:**
- Primary CTA buttons
- Success states
- Premium features highlights
- Achievements, rewards

**Contrast Ratios:**
- #D6A23A with dark text (#121212) = 6.8:1 ✓ (WCAG AA)
- Readable and warm

### Background - Dark Palette

```css
--color-background: #121212;          /* Main app background */
--color-surface: #1E1E1E;             /* Cards, panels */
--color-surface-elevated: #2A2A2A;    /* Modals, popovers */
```

**Why #121212 instead of #000000?**
- Material Design best practice
- Allows subtle shadows and elevation
- Reduces eye strain (not extreme contrast)
- Premium, modern aesthetic

### Text - Off-White Hierarchy

```css
--color-text-primary: #E0E0E0;    /* 87% white - main text */
--color-text-secondary: #A0A0A0;  /* 60% white - secondary text */
--color-text-tertiary: #707070;   /* 38% white - hints, captions */
```

**Why off-white instead of pure white?**
- Material Design recommendation
- Reduces visual vibration on dark backgrounds
- More comfortable for extended reading
- Professional, refined appearance

### Semantic Colors

```css
--color-success: #10B981;   /* Green - success states */
--color-error: #EF4444;     /* Red - errors, warnings */
--color-warning: #F59E0B;   /* Orange - caution */
--color-info: #2CBEC6;      /* Teal (same as primary) */
```

### Border Colors

```css
--color-border: #2A2A2A;              /* Subtle borders */
--color-border-focus: var(--color-primary);  /* Teal on focus */
```

### Neutral Grays (Material Design Dark Palette)

```css
--color-gray-50: #FAFAFA;
--color-gray-100: #F5F5F5;
--color-gray-200: #EEEEEE;
--color-gray-300: #E0E0E0;
--color-gray-400: #BDBDBD;
--color-gray-500: #9E9E9E;
--color-gray-600: #757575;
--color-gray-700: #616161;
--color-gray-800: #424242;
--color-gray-900: #212121;
```

---

## 🎨 Logo Design System

### Logo Tokens

DechBar logo system uses centralized design tokens for scalability and consistency.

**Configuration:**
- Config: [`src/config/logo.ts`](../../src/config/logo.ts)
- Tokens: [`src/styles/design-tokens/logo.css`](../../src/styles/design-tokens/logo.css)
- Utils: [`src/utils/logo.ts`](../../src/utils/logo.ts)
- Component: [`src/platform/components/Logo.tsx`](../../src/platform/components/Logo.tsx)

**Dimensions:**
```css
--logo-width-desktop: 200px;
--logo-height-desktop: 63px;
--logo-width-mobile: 150px;
--logo-height-mobile: 47px;
```

**Color Variants:**
- `off-white` → `var(--color-text-primary)` (#E0E0E0)
- `warm-black` → `var(--color-background)` (#121212)
- `white` → #FFFFFF (fallback)
- `black` → #000000 (fallback)

**Usage:**
```tsx
import { Logo } from '@/platform';

// Primary (dark mode)
<Logo variant="off-white" />

// Light backgrounds
<Logo variant="warm-black" />
```

**Platform Integration:**

Logo is now part of the Platform Layer, making it available to all modules through the Platform API. This ensures consistency and proper architectural separation.

See complete documentation: [`docs/brand/LOGO_MANUAL.md`](LOGO_MANUAL.md)

---

## Typography

### Font Family

**Primary:** Inter

```css
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

**Why Inter?**
- Modern, clean, professional
- Excellent readability at all sizes
- Open-source, self-hostable
- Variable font support
- Premium tech aesthetic

### Font Scale

```css
--font-size-xs: 0.75rem;      /* 12px - captions */
--font-size-sm: 0.875rem;     /* 14px - secondary text */
--font-size-base: 1rem;       /* 16px - body text */
--font-size-lg: 1.125rem;     /* 18px - emphasized */
--font-size-xl: 1.25rem;      /* 20px - small headings */
--font-size-2xl: 1.5rem;      /* 24px - section headings */
--font-size-3xl: 1.875rem;    /* 30px - page headings */
--font-size-4xl: 2.25rem;     /* 36px - hero text */
```

### Font Weights

```css
--font-weight-regular: 400;    /* Body text */
--font-weight-medium: 500;     /* Emphasis */
--font-weight-semibold: 600;   /* Subheadings */
--font-weight-bold: 700;       /* Headings */
```

### Letter Spacing (Premium Feel)

```css
--letter-spacing-tight: -0.02em;    /* Headlines, premium feel */
--letter-spacing-normal: 0;         /* Body text */
--letter-spacing-wide: 0.02em;      /* All caps labels */
```

**Key Rule:** Headings and display text use tight letter-spacing (-0.02em) for a premium, refined look.

### Line Heights

```css
--line-height-tight: 1.25;     /* Headlines */
--line-height-normal: 1.5;     /* Body text */
--line-height-relaxed: 1.75;   /* Long-form content */
```

### Typography Best Practices

1. **Body text:** 16px (1rem), regular weight (400), normal line-height (1.5)
2. **Headings:** Use tight letter-spacing (-0.02em)
3. **All caps:** Use wide letter-spacing (0.02em)
4. **Long-form:** Use relaxed line-height (1.75)
5. **Dark backgrounds:** Always use off-white text (#E0E0E0), never pure white

---

## Spacing & Layout

### Spacing Scale (4px base unit)

```css
--spacing-0: 0;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
--spacing-20: 80px;
--spacing-24: 96px;
```

### Breakpoints (Mobile-First)

```css
--breakpoint-sm: 390px;   /* iPhone 14 Pro / Mobile */
--breakpoint-md: 768px;   /* iPad Portrait / Tablet */
--breakpoint-lg: 1024px;  /* iPad Landscape / Desktop */
--breakpoint-xl: 1280px;  /* Desktop Wide */
```

**Why only 4 breakpoints?**
- Simplicity and efficiency (Less is More principle)
- Based on real device usage
- Easier maintenance
- Faster development

### Border Radius

```css
--radius-sm: 4px;      /* Small elements */
--radius-md: 8px;      /* Default buttons, inputs */
--radius-lg: 12px;     /* Cards */
--radius-xl: 16px;     /* Modals */
--radius-2xl: 20px;    /* Large containers */
--radius-full: 9999px; /* Pills, avatars */
```

---

## Components

### Buttons

**Primary (Gold CTA):**
```css
background: var(--color-accent);      /* Gold #D6A23A */
color: var(--color-background);       /* Dark text #121212 */
padding: 12px 24px;
border-radius: var(--radius-md);
font-weight: var(--font-weight-medium);
```

**Secondary:**
```css
background: var(--color-surface);
color: var(--color-text-primary);
border: 1px solid var(--color-border);
padding: 12px 24px;
border-radius: var(--radius-md);
```

**Ghost:**
```css
background: transparent;
color: var(--color-primary);         /* Teal */
padding: 12px 24px;
```

**Sizing:**
- Small: padding 8px 16px, font-size 14px
- Medium (default): padding 12px 24px, font-size 16px
- Large: padding 16px 32px, font-size 18px

**Minimum touch target:** 44x44px (accessibility requirement)

### Inputs

```css
background: var(--color-surface);      /* #1E1E1E */
color: var(--color-text-primary);      /* #E0E0E0 */
border: 1px solid var(--color-border); /* #2A2A2A */
border-radius: var(--radius-md);       /* 8px */
padding: 12px 16px;
font-size: 16px;
```

**Focus state:**
```css
border-color: var(--color-primary);   /* Teal */
outline: 2px solid var(--color-primary);
outline-offset: 2px;
```

### Cards

**Default:**
```css
background: var(--color-surface);
border-radius: var(--radius-lg);
padding: 24px;
```

**Elevated (Modal):**
```css
background: var(--color-surface-elevated);
border-radius: var(--radius-xl);
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
```

**Glass (Glassmorphism):**
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## Effects & Interactions

### Shadows

**Elevation levels:**
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.4);
--shadow-xl: 0 24px 48px rgba(0, 0, 0, 0.5);
```

**Gold glow (for CTAs):**
```css
--shadow-gold: 0 4px 16px rgba(214, 162, 58, 0.3);
```

### Animations

**Timing functions:**
```css
--timing-spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--timing-spring-smooth: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--timing-apple: cubic-bezier(0.25, 0.1, 0.25, 1);
```

**Durations:**
```css
--duration-fast: 150ms;    /* Small interactions */
--duration-normal: 250ms;  /* Default */
--duration-slow: 350ms;    /* Large movements */
```

**Best practices:**
- Use slow, fluid animations for breathing exercises
- Fast snappy feedback for button clicks
- Respect `prefers-reduced-motion`

### Glassmorphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

**Use sparingly** - reserve for premium features, modals, overlays.

---

## Accessibility

### Contrast Requirements

**WCAG AA Compliance (minimum 4.5:1 for normal text):**

✓ Text primary (#E0E0E0) on background (#121212) = 11.6:1  
✓ Text secondary (#A0A0A0) on background (#121212) = 7.2:1  
✓ Gold button text (#121212) on gold (#D6A23A) = 6.8:1  
✓ Teal on dark (#2CBEC6 on #121212) = 7.2:1

### Focus Indicators

All interactive elements must have visible focus states:

```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Touch Targets

Minimum 44x44px for all interactive elements (buttons, links, checkboxes).

### Screen Readers

- Use semantic HTML
- Provide alt text for images
- ARIA labels for icon-only buttons

---

## Implementation Guidelines

### File Structure

```
/src/styles/
  ├── design-tokens/
  │   ├── colors.css       ← Define all color variables
  │   ├── typography.css   ← Font families, sizes, weights
  │   ├── spacing.css      ← Spacing scale
  │   ├── effects.css      ← Shadows, animations
  │   └── breakpoints.css  ← Responsive breakpoints
  ├── components/
  │   ├── button.css       ← Button styles using tokens
  │   ├── input.css        ← Input styles using tokens
  │   └── ...
  └── globals.css          ← Import all tokens + Tailwind
```

### Single Source of Truth

**Rule:** Never hardcode values in components. Always reference design tokens.

**Bad:**
```css
.button {
  background: #D6A23A;  /* Hardcoded! */
}
```

**Good:**
```css
.button {
  background: var(--color-accent);  /* References token */
}
```

### Tailwind Integration

Extend Tailwind config to reference CSS variables:

```js
// tailwind.config.js
colors: {
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  background: 'var(--color-background)',
  // ...
}
```

Benefits:
- Change token value = entire app updates
- Consistent across Tailwind utilities and custom CSS
- Easy theme switching (future light mode)

### Component Pattern

```tsx
// Component uses Tailwind classes
<Button className="bg-accent text-background" />

// Which references CSS variables
// bg-accent → background: var(--color-accent) → #D6A23A
```

---

## Design Principles Summary

1. **Dark-First:** Default to dark mode (#121212), optimized for nighttime use
2. **Teal Identity:** Primary brand color (#2CBEC6) for focus, links, brand elements
3. **Gold CTAs:** Accent color (#D6A23A) for primary actions, highlights
4. **Inter Typography:** Modern, clean, professional font family
5. **Premium Feel:** Tight letter-spacing, glassmorphism, refined details
6. **Calm by Default:** Minimal UI, slow animations, soothing colors
7. **One Strong CTA:** Clear hierarchy, one primary action per screen
8. **Accessible:** WCAG AA compliant, off-white text on dark backgrounds
9. **Consistent:** Single source of truth (design tokens)
10. **Scalable:** Mobile-first, 4 breakpoints, modular components

---

## Resources

- [Material Design Dark Theme](https://m2.material.io/design/color/dark-theme.html)
- [Inter Font](https://rsms.me/inter/)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Glassmorphism Best Practices](https://www.nngroup.com/articles/glassmorphism/)

---

**Version History:**
- 2.0 (2026-01-12): Initial Brand Book 2.0 - Dark-first, Teal+Gold, Inter font
