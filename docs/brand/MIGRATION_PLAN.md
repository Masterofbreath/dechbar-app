# Migration Plan: Brand Book 2.0 Implementation

Step-by-step guide for migrating DechBar App to Brand Book 2.0 (dark-first design).

---

## Overview

**Goal:** Transform DechBar App from light-first to dark-first premium tech-wellbeing aesthetic.

**Approach:** "Big Bang" migration - update design tokens simultaneously, cascade changes throughout app.

**Duration:** 3-4 hours total

**Risk Level:** Low (well-structured design tokens, testable on localhost)

---

## Pre-Migration Checklist

Before starting:

- [x] Read [VISUAL_BRAND_BOOK.md](VISUAL_BRAND_BOOK.md)
- [x] Review [BRAND_COLORS.md](BRAND_COLORS.md)  
- [x] Understand [COMPARISON.md](COMPARISON.md) (old vs. new)
- [ ] Backup current `main` branch (create migration branch)
- [ ] Ensure dev server runs (`npm run dev`)
- [ ] Have design tools ready (contrast checker, browser DevTools)

---

## Phase 1: Documentation (30 min)

### ✅ Create Brand Documentation

Create `/docs/brand/` folder with:

```bash
mkdir -p docs/brand
```

Files to create:
1. `VISUAL_BRAND_BOOK.md` - Complete brand guidelines
2. `BRAND_COLORS.md` - Detailed color specifications
3. `COMPARISON.md` - Old vs. new comparison
4. `MIGRATION_PLAN.md` - This document

### ✅ Update Design System Docs

Update existing docs to reference Brand Book:

**Files to update:**
- `docs/design-system/00_OVERVIEW.md` - Add Brand Book references
- `docs/design-system/02_COLORS.md` - Rewrite for teal/gold dark palette
- `docs/design-system/03_TYPOGRAPHY.md` - Update for Inter font

**Files to keep:**
- `docs/design-system/01_PHILOSOPHY.md` - 4 Temperaments unchanged

---

## Phase 2: Install Inter Font (15 min)

### Install Fontsource Package

```bash
cd dechbar-app
npm install @fontsource/inter
```

**Why Fontsource?**
- Offline-first (no CDN dependency)
- Version controlled (in package.json)
- GDPR-friendly (no tracking)
- Build-optimized (Vite handles subsetting)

### Verify Installation

Check `package.json`:
```json
{
  "dependencies": {
    "@fontsource/inter": "^5.0.0"
  }
}
```

---

## Phase 3: Update Design Tokens (60 min)

This is the core of the migration. All changes cascade from here.

### 3.1 Colors (`src/styles/design-tokens/colors.css`)

**Replace entire file with:**

```css
/**
 * Design Tokens: Colors - DechBar Brand Book 2.0
 * Dark-First Premium Tech-Wellbeing
 */

/* ===================================== */
/* LIGHT MODE (fallback) */
/* ===================================== */
:root {
  /* Primary: Teal (main brand color) */
  --color-primary: #2CBEC6;
  --color-primary-light: #6ADBE0;
  --color-primary-dark: #15939A;
  
  /* Accent: Gold (highlights, CTAs) */
  --color-accent: #D6A23A;
  --color-accent-light: #F0C76A;
  --color-accent-dark: #B8892F;
  
  /* Backgrounds (light mode fallback) */
  --color-background: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-surface-elevated: #FFFFFF;
  
  /* Text (light mode fallback) */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  
  /* Borders */
  --color-border: #E5E7EB;
  --color-border-focus: var(--color-primary);
}

/* ===================================== */
/* DARK MODE (default per Brand Book) */
/* ===================================== */
:root,
[data-theme="dark"] {
  /* Backgrounds (dark mode - Brand Book #121212) */
  --color-background: #121212;
  --color-surface: #1E1E1E;
  --color-surface-elevated: #2A2A2A;
  
  /* Text (off-white per Material Design) */
  --color-text-primary: #E0E0E0;      /* 87% white */
  --color-text-secondary: #A0A0A0;    /* 60% white */
  --color-text-tertiary: #707070;     /* 38% white */
  
  /* Borders (subtle in dark mode) */
  --color-border: #2A2A2A;
  --color-border-focus: var(--color-primary);
  
  /* Primary & Accent stay same (work in dark) */
}

/* ===================================== */
/* SEMANTIC COLORS (work in both modes) */
/* ===================================== */
:root {
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-info: var(--color-primary);
}

/* ===================================== */
/* NEUTRAL GRAYS (Material Design dark palette) */
/* ===================================== */
:root {
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
}
```

**Key Changes:**
- Old gold (#F8CA00) → Teal (#2CBEC6) as primary
- New gold (#D6A23A) as accent
- Dark backgrounds (#121212, #1E1E1E, #2A2A2A)
- Off-white text (#E0E0E0, #A0A0A0, #707070)

### 3.2 Typography (`src/styles/design-tokens/typography.css`)

**Update file with:**

```css
/**
 * Design Tokens: Typography - Inter Font (Brand Book)
 */

/* Import Inter font weights */
@import '@fontsource/inter/400.css';  /* Regular */
@import '@fontsource/inter/500.css';  /* Medium */
@import '@fontsource/inter/600.css';  /* Semibold */
@import '@fontsource/inter/700.css';  /* Bold */

:root {
  /* Font Family */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Font Sizes (Brand Book scale) */
  --font-size-xs: 0.75rem;      /* 12px */
  --font-size-sm: 0.875rem;     /* 14px */
  --font-size-base: 1rem;       /* 16px */
  --font-size-lg: 1.125rem;     /* 18px */
  --font-size-xl: 1.25rem;      /* 20px */
  --font-size-2xl: 1.5rem;      /* 24px */
  --font-size-3xl: 1.875rem;    /* 30px */
  --font-size-4xl: 2.25rem;     /* 36px */
  
  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Letter Spacing (Brand Book - tighter for premium feel) */
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.02em;
  
  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}

/* Apply to body */
body {
  font-family: var(--font-family-base);
  letter-spacing: var(--letter-spacing-tight);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Key Changes:**
- Add Inter font imports
- Update --font-family-base to 'Inter'
- Add letter-spacing variables
- Apply tight spacing to body

### 3.3 Breakpoints (`src/styles/design-tokens/breakpoints.css`)

**Update file with:**

```css
/**
 * Design Tokens: Breakpoints
 * Simplified mobile-first system (4 levels)
 */

:root {
  /* Mobile-First Breakpoints */
  --breakpoint-sm: 390px;   /* iPhone 14 Pro / Mobile */
  --breakpoint-md: 768px;   /* iPad Portrait / Tablet */
  --breakpoint-lg: 1024px;  /* iPad Landscape / Desktop */
  --breakpoint-xl: 1280px;  /* Desktop Wide */
}

/* Media Query Helpers */
@custom-media --sm (min-width: 390px);
@custom-media --md (min-width: 768px);
@custom-media --lg (min-width: 1024px);
@custom-media --xl (min-width: 1280px);
```

**Key Changes:**
- Remove xs (320px) and 2xl (1920px)
- Update sm from 480px to 390px (iPhone 14 Pro)
- Keep md, lg, xl with new values

---

## Phase 4: Tailwind Configuration (30 min)

### Update `tailwind.config.js`

**Replace colors section:**

```js
colors: {
  // Brand colors (referencing CSS variables)
  'primary': {
    DEFAULT: 'var(--color-primary)',      // Teal #2CBEC6
    light: 'var(--color-primary-light)',
    dark: 'var(--color-primary-dark)',
  },
  'accent': {
    DEFAULT: 'var(--color-accent)',       // Gold #D6A23A
    light: 'var(--color-accent-light)',
    dark: 'var(--color-accent-dark)',
  },
  
  // Backgrounds
  'background': 'var(--color-background)',  // Dark #121212
  'surface': {
    DEFAULT: 'var(--color-surface)',        // #1E1E1E
    elevated: 'var(--color-surface-elevated)', // #2A2A2A
  },
  
  // Text colors
  'text': {
    primary: 'var(--color-text-primary)',    // #E0E0E0
    secondary: 'var(--color-text-secondary)', // #A0A0E0
    tertiary: 'var(--color-text-tertiary)',   // #707070
  },
  
  // Semantic
  'success': 'var(--color-success)',
  'error': 'var(--color-error)',
  'warning': 'var(--color-warning)',
  'info': 'var(--color-info)',
  
  // Neutrals (keep existing gray scale)
  'gray': {
    50: 'var(--color-gray-50)',
    100: 'var(--color-gray-100)',
    200: 'var(--color-gray-200)',
    300: 'var(--color-gray-300)',
    400: 'var(--color-gray-400)',
    500: 'var(--color-gray-500)',
    600: 'var(--color-gray-600)',
    700: 'var(--color-gray-700)',
    800: 'var(--color-gray-800)',
    900: 'var(--color-gray-900)',
  },
  
  // Keep old 'gold' and 'black/white' for backward compatibility (temporary)
  'gold': {
    DEFAULT: 'var(--color-accent)',  // Maps to new gold
    dark: 'var(--color-accent-dark)',
    light: 'var(--color-accent-light)',
  },
  'black': '#1a1a1a',
  'white': '#ffffff',
}
```

**Update screens (breakpoints):**

```js
screens: {
  'sm': '390px',   // iPhone 14 Pro (mobile)
  'md': '768px',   // iPad Portrait (tablet)
  'lg': '1024px',  // iPad Landscape / Desktop
  'xl': '1280px',  // Desktop Wide
},
```

**Update fontFamily:**

```js
fontFamily: {
  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
},
```

**Add letterSpacing:**

```js
letterSpacing: {
  tighter: 'var(--letter-spacing-tight)',    // -0.02em
  normal: 'var(--letter-spacing-normal)',    // 0
  wider: 'var(--letter-spacing-wide)',       // 0.02em
},
```

---

## Phase 5: Component Refactoring (90 min)

### 5.1 Button Component (`src/styles/components/button.css`)

**Update primary button:**

```css
.dechbar-button--primary {
  background: var(--color-accent);         /* Gold #D6A23A */
  color: var(--color-background);          /* Dark #121212 */
  border: none;
}

.dechbar-button--primary:hover {
  background: var(--color-accent-light);   /* #F0C76A */
}

.dechbar-button--primary:active {
  background: var(--color-accent-dark);    /* #B8892F */
}
```

**Update secondary button:**

```css
.dechbar-button--secondary {
  background: var(--color-surface);        /* #1E1E1E */
  color: var(--color-text-primary);        /* #E0E0E0 */
  border: 1px solid var(--color-border);   /* #2A2A2A */
}

.dechbar-button--secondary:hover {
  background: var(--color-surface-elevated); /* #2A2A2A */
}
```

**Update ghost button:**

```css
.dechbar-button--ghost {
  background: transparent;
  color: var(--color-primary);             /* Teal #2CBEC6 */
  border: none;
}

.dechbar-button--ghost:hover {
  background: rgba(44, 190, 198, 0.1);     /* Teal with opacity */
}
```

### 5.2 Input Component (`src/styles/components/input.css`)

**Update input styling:**

```css
.dechbar-input {
  background: var(--color-surface);        /* #1E1E1E */
  color: var(--color-text-primary);        /* #E0E0E0 */
  border: 1px solid var(--color-border);   /* #2A2A2A */
}

.dechbar-input::placeholder {
  color: var(--color-text-tertiary);       /* #707070 */
}

.dechbar-input:focus {
  border-color: var(--color-primary);      /* Teal #2CBEC6 */
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 5.3 Checkbox Component (`src/styles/components/checkbox.css`)

**Update checkbox:**

```css
.dechbar-checkbox {
  border-color: var(--color-border);       /* #2A2A2A */
  background: var(--color-surface);        /* #1E1E1E */
}

.dechbar-checkbox:checked {
  background: var(--color-primary);        /* Teal #2CBEC6 */
  border-color: var(--color-primary);
}

.dechbar-checkbox:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 5.4 Auth Modals (`src/styles/auth.css`)

**Update modal overlay:**

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.85);         /* Darker overlay */
}
```

**Update modal card:**

```css
.modal-card {
  background: var(--color-surface-elevated); /* #2A2A2A */
  color: var(--color-text-primary);          /* #E0E0E0 */
}

.modal-title {
  color: var(--color-text-primary);
}

.modal-subtitle {
  color: var(--color-text-secondary);        /* #A0A0A0 */
}
```

---

## Phase 6: Global Styles (15 min)

### Update `src/styles/globals.css`

**Add Inter font imports at top:**

```css
/* Import Inter font */
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';

/* Import design tokens */
@import './design-tokens/colors.css';
@import './design-tokens/typography.css';
@import './design-tokens/spacing.css';
@import './design-tokens/breakpoints.css';
@import './design-tokens/shadows.css';
@import './design-tokens/effects.css';

/* Tailwind CSS imports */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Update body styles:**

```css
body {
  background: var(--color-background);    /* #121212 */
  color: var(--color-text-primary);       /* #E0E0E0 */
  font-family: var(--font-family-base);   /* Inter */
  letter-spacing: var(--letter-spacing-tight);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Phase 7: Testing & QA (45 min)

### 7.1 Visual Testing

Start dev server:
```bash
npm run dev
```

Open http://localhost:5173

**Checklist:**
- [ ] Background is dark (#121212), not pure black
- [ ] Text is off-white (#E0E0E0), not pure white
- [ ] Primary CTA buttons are gold (#D6A23A)
- [ ] Focus rings are teal (#2CBEC6)
- [ ] Font is Inter (check DevTools)
- [ ] Letter-spacing is tight on headings

### 7.2 Component Testing

Test each auth component:

**RegisterView:**
- [ ] Dark background
- [ ] Gold "Pokračovat s emailem →" button
- [ ] Teal focus on email input
- [ ] Off-white text
- [ ] OAuth buttons styled correctly

**LoginView:**
- [ ] Title "Vítej v DechBaru"
- [ ] Dark modal background
- [ ] Teal focus rings
- [ ] Gold "Přihlásit se →" button

**ForgotPasswordView:**
- [ ] Dark styling
- [ ] Teal focus
- [ ] Proper contrast

### 7.3 Responsive Testing

Test at each breakpoint:

```bash
# Use browser DevTools responsive mode
```

- [ ] 390px (iPhone 14 Pro)
- [ ] 768px (iPad Portrait)
- [ ] 1024px (Desktop)
- [ ] 1280px (Wide Desktop)

### 7.4 Accessibility Testing

**Contrast Ratios (use WebAIM Contrast Checker):**

- [ ] Text primary (#E0E0E0) on background (#121212) = 11.6:1 ✓ AAA
- [ ] Text secondary (#A0A0A0) on background (#121212) = 7.2:1 ✓ AA
- [ ] Gold button text (#121212) on gold (#D6A23A) = 6.8:1 ✓ AA
- [ ] Teal (#2CBEC6) on dark (#121212) = 7.2:1 ✓ AA

**Focus indicators:**
- [ ] All interactive elements have visible focus rings
- [ ] Focus rings are 2px teal, offset 2px
- [ ] Keyboard navigation works

**Touch targets:**
- [ ] All buttons are min 44x44px

### 7.5 Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

### 7.6 Console Errors

- [ ] No console errors
- [ ] No 404s for fonts
- [ ] No CSS warnings

---

## Phase 8: Documentation Updates (30 min)

### 8.1 Update README.md

Add to design system section:

```md
## 🎨 Design System

DechBar follows the **Visual Brand Book 2.0** - a dark-first, premium tech-wellbeing aesthetic.

### Key Characteristics:
- **Colors**: Teal primary (#2CBEC6), Gold accent (#D6A23A)
- **Typography**: Inter font family
- **Theme**: Dark mode default (#121212 background)
- **Philosophy**: Calm by Default, One Strong CTA, Less is More

### Documentation:
- Complete guidelines: [`/docs/brand/VISUAL_BRAND_BOOK.md`](docs/brand/VISUAL_BRAND_BOOK.md)
- Color specifications: [`/docs/brand/BRAND_COLORS.md`](docs/brand/BRAND_COLORS.md)
- Migration history: [`/docs/brand/COMPARISON.md`](docs/brand/COMPARISON.md)

### Design Tokens:
All visual values are centralized in `/src/styles/design-tokens/`:
- `colors.css` - Brand colors, semantic colors
- `typography.css` - Font families, sizes, weights
- `spacing.css` - 4px base unit system
- `breakpoints.css` - Mobile-first responsive

**Single source of truth:** Change design token → entire app updates.
```

### 8.2 Update Design System Overview

Edit `docs/design-system/00_OVERVIEW.md`:

```md
# Design System Overview - Brand Book 2.0

DechBar's design system follows the **Visual Brand Book 2.0** principles.

## Core Principles

1. **Dark-First**: Premium dark mode (#121212) as default
2. **Calm by Default**: Minimal UI, slow animations, soothing colors
3. **One Strong CTA**: Gold (#D6A23A) for primary actions only
4. **Teal Identity**: Primary brand color (#2CBEC6) for focus, links
5. **Premium Feel**: Inter font, tight letter-spacing, glassmorphism

## Quick Reference

### Colors
```css
--color-primary: #2CBEC6        /* Teal - focus, links */
--color-accent: #D6A23A         /* Gold - CTAs */
--color-background: #121212     /* Dark canvas */
--color-text-primary: #E0E0E0   /* Off-white text */
```

### Typography
```css
--font-family-base: 'Inter', -apple-system, sans-serif;
--letter-spacing-tight: -0.02em;  /* Headlines */
```

### Breakpoints
```css
sm: 390px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Wide */
```

For complete guidelines, see [Visual Brand Book](../brand/VISUAL_BRAND_BOOK.md).
```

---

## Post-Migration Checklist

### Final Verification

- [ ] All tests pass (visual, component, responsive, a11y)
- [ ] No console errors
- [ ] Inter font loads correctly
- [ ] Dark mode displays properly
- [ ] Colors match Brand Book specifications
- [ ] Documentation is complete and accurate
- [ ] Git status is clean (no unintended changes)

### Git Commit

```bash
git add .
git commit -m "feat: migrate to Brand Book 2.0 (dark-first, teal+gold, Inter font)

- Add Brand Book documentation (VISUAL_BRAND_BOOK.md, BRAND_COLORS.md, COMPARISON.md)
- Update design tokens: teal primary (#2CBEC6), gold accent (#D6A23A)
- Implement dark-first design (#121212 background, off-white text)
- Add Inter font family via Fontsource
- Simplify breakpoints from 6 to 4 levels
- Refactor components for dark mode styling
- Update Tailwind config to reference CSS variables
- Ensure WCAG AA accessibility compliance

BREAKING CHANGE: Visual redesign from light-first to dark-first.
Old gold (#F8CA00) replaced with teal primary + new gold accent."
```

### Deployment (After Testing)

```bash
# After thorough testing on localhost:
git push origin feature/brand-book-2.0

# Create PR for review
# Merge to main after approval
# Deploy to production
```

---

## Troubleshooting

### Inter Font Not Loading

**Problem:** Font falls back to system fonts

**Solutions:**
1. Check browser Network tab - font files loading?
2. Verify `@import` statements in `typography.css`
3. Check `package.json` - `@fontsource/inter` installed?
4. Clear browser cache (Cmd+Shift+R)
5. Restart dev server

### Colors Not Updating

**Problem:** Still seeing old colors

**Solutions:**
1. Check `colors.css` - variables defined in `:root`?
2. Verify `globals.css` imports `colors.css`
3. Check `tailwind.config.js` - colors reference CSS vars?
4. Clear Tailwind cache: `rm -rf node_modules/.cache`
5. Restart dev server

### Dark Background Missing

**Problem:** Background still white

**Solutions:**
1. Check `globals.css` - body has `background: var(--color-background)`?
2. Verify `:root` sets `--color-background: #121212`
3. Check for conflicting styles (search for `background: #fff` in codebase)
4. Inspect element in DevTools - what's overriding?

### Focus Rings Not Teal

**Problem:** Focus rings still gold or missing

**Solutions:**
1. Check `globals.css` - `*:focus-visible` has `outline: 2px solid var(--color-primary)`?
2. Verify `--color-primary: #2CBEC6` in `colors.css`
3. Component-specific overrides? Search for `outline` in component CSS
4. Browser default styles? Add `!important` temporarily to debug

---

## Success Criteria

Migration is complete when:

1. ✅ App displays with dark background (#121212)
2. ✅ Primary color is teal (#2CBEC6) for focus/links
3. ✅ CTA buttons are gold (#D6A23A)
4. ✅ Font is Inter across all text
5. ✅ All components work in dark mode
6. ✅ No console errors
7. ✅ WCAG AA contrast compliance verified
8. ✅ Documentation reflects Brand Book
9. ✅ Single source of truth (design tokens) functional
10. ✅ Code committed with descriptive message

---

## Next Steps (Future Enhancements)

After Brand Book 2.0 is stable:

1. **Light Mode Toggle** (user setting)
   - Implement theme switcher
   - Light mode CSS variables
   - Persist user preference

2. **Advanced Glassmorphism** (premium features)
   - Glass cards for premium content
   - Frosted overlays
   - Subtle animations

3. **Micro-interactions** (polish)
   - Button press springs
   - Input focus animations
   - Success celebrations

4. **Custom Themes** (premium feature)
   - User-selected accent colors
   - Seasonal themes
   - Event-specific branding

All enabled by **single source of truth** design token architecture!

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-12  
**Status:** Active Migration Guide
