# Design System Overview - Brand Book 2.0

## Brand Book 2.0: Dark-First Premium Tech-Wellbeing

DechBar's design system follows the **Visual Brand Book 2.0** principles:

- **Dark-First:** Premium dark mode (#121212) as default
- **Calm by Default:** Minimal UI, slow animations, soothing colors
- **One Strong CTA:** Gold (#D6A23A) for primary actions only
- **Teal Identity:** Primary brand color (#2CBEC6) for focus, links, brand elements
- **Premium Feel:** Inter font, tight letter-spacing (-0.02em), glassmorphism

**See:** [Complete Visual Brand Book](../brand/VISUAL_BRAND_BOOK.md)

## Philosophy

DechBar's design system is built on the principle of **designing for all 4 temperaments** - ensuring every user finds the app intuitive and enjoyable regardless of their personality type.

See [01_PHILOSOPHY.md](01_PHILOSOPHY.md) for detailed explanation.

## Design Tokens (Single Source of Truth)

All design values are centralized in `src/styles/design-tokens/`:

- **[Colors](02_COLORS.md)** - Teal primary, Gold accent, dark backgrounds
- **[Typography](03_TYPOGRAPHY.md)** - Inter font, sizes, weights, letter-spacing
- **[Spacing](04_SPACING.md)** - 4px base unit system
- **[Breakpoints](05_BREAKPOINTS.md)** - Simplified 4-level mobile-first system
- **[Components](06_COMPONENTS.md)** - Reusable UI components
- **[Icons](07_ICONS.md)** - Custom SVG icon system
- **[Animations](08_ANIMATIONS.md)** - Motion and transitions

## Component Development

For detailed guide on creating and documenting Platform components:

📚 **[Component Architecture Guide](../development/AI_AGENT_COMPONENT_GUIDE.md)** - Complete step-by-step process

📁 **[Component Library Reference](./components/README.md)** - API documentation for all components

📝 **[Implementation Logs](../development/implementation-logs/README.md)** - History of component implementations

## Quick Reference (Brand Book 2.0)

### Colors

```css
/* PRIMARY: Teal (brand identity, focus, links) */
--color-primary: #2CBEC6        /* Main teal */
--color-primary-light: #6ADBE0  /* Lighter variant */
--color-primary-dark: #15939A   /* Darker variant */

/* ACCENT: Gold (CTAs, achievements, highlights) */
--color-accent: #D6A23A         /* Main gold */
--color-accent-light: #F0C76A   /* Lighter variant */
--color-accent-dark: #B8892F    /* Darker variant */

/* BACKGROUNDS (dark mode default) */
--color-background: #121212      /* Main app background */
--color-surface: #1E1E1E         /* Cards, panels */
--color-surface-elevated: #2A2A2A /* Modals, popovers */

/* TEXT (off-white hierarchy) */
--color-text-primary: #E0E0E0    /* 87% white - main text */
--color-text-secondary: #A0A0A0  /* 60% white - secondary */
--color-text-tertiary: #707070   /* 38% white - hints */
```

### Typography

```css
--font-family-base: 'Inter', -apple-system, sans-serif;
--letter-spacing-tight: -0.02em;  /* Premium headings */
```

### Breakpoints (Simplified)

```css
sm: 390px   /* iPhone 14 Pro / Mobile */
md: 768px   /* iPad Portrait / Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Wide Desktop */
/* REMOVED: xs (320px), 2xl (1920px) */
```

### Spacing Scale (4px base)

```
1 = 4px
2 = 8px
4 = 16px
6 = 24px
8 = 32px
12 = 48px
```

## Usage

### In Tailwind Classes

```tsx
<Button className="px-6 py-3 bg-gold text-black rounded-xl shadow-gold">
  Click me
</Button>
```

### In CSS

```css
.custom-component {
  color: var(--color-gold);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
}
```

## Platform Components

See [06_COMPONENTS.md](06_COMPONENTS.md) for full component library.

Available components:
- Button (primary, secondary, ghost)
- Card (elevated, flat, glass)
- Modal (fullscreen, centered, bottom-sheet)
- Input (text, number, textarea)
- Layout (container, grid, stack)

## Modern Effects

### Glassmorphism

```tsx
<div className="glass-card">
  Content with frosted glass effect
</div>
```

### Shadows

```css
shadow-sm, shadow-md, shadow-lg, shadow-xl
shadow-gold  /* For premium features */
```

### Animations

```css
transition-spring-bounce  /* Button press */
transition-apple          /* iOS-like smooth */
```

## Accessibility

All components include:
- Keyboard navigation
- Screen reader support
- Focus indicators
- Sufficient color contrast (WCAG AA)
- Touch targets ≥44px

## Mobile-First

All design tokens are optimized for mobile:
- Touch-friendly sizes (min 44px)
- Safe area handling (iOS notch)
- Responsive typography
- Haptic feedback support

## Related Documentation

- [Philosophy (4 Temperaments)](01_PHILOSOPHY.md)
- [Component Library](06_COMPONENTS.md)
- [Icon System](07_ICONS.md)
