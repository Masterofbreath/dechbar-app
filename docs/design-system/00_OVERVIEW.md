# Design System Overview

## Philosophy

DechBar's design system is built on the principle of **designing for all 4 temperaments** - ensuring every user finds the app intuitive and enjoyable regardless of their personality type.

See [01_PHILOSOPHY.md](01_PHILOSOPHY.md) for detailed explanation.

## Design Tokens

All design values are centralized in `src/styles/design-tokens/`:

- **[Colors](02_COLORS.md)** - Brand gold, neutrals, semantic colors
- **[Typography](03_TYPOGRAPHY.md)** - Font scales, weights, line heights
- **[Spacing](04_SPACING.md)** - 4px base unit system
- **[Breakpoints](05_BREAKPOINTS.md)** - Mobile-first responsive system
- **[Components](06_COMPONENTS.md)** - Reusable UI components
- **[Icons](07_ICONS.md)** - Custom SVG icon system
- **[Animations](08_ANIMATIONS.md)** - Motion and transitions

## Quick Reference

### Colors

```css
--color-gold: #F8CA00        /* Primary brand */
--color-black: #1a1a1a       /* Text */
--color-white: #ffffff       /* Background */
--color-gray-*: ...          /* Neutrals (50-900) */
```

### Breakpoints

```css
xs: 320px   /* Narrow mobile */
sm: 480px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1440px  /* Wide desktop */
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
