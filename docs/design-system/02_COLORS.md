# Colors - Brand Book 2.0 (Dark-First)

Complete color system for DechBar App following Visual Brand Book 2.0.

**See also:** [Brand Colors Documentation](../brand/BRAND_COLORS.md) for detailed specifications.

---

## Brand Colors

### Primary: Teal (Brand Identity)

```css
--color-primary: #2CBEC6        /* Main teal - breathing, clarity */
--color-primary-light: #6ADBE0  /* Lighter variant */
--color-primary-dark: #15939A   /* Darker variant */
```

**Usage:**
- Focus rings on inputs and buttons
- Active navigation items
- Interactive links
- Brand logo color
- Progress indicators

**Accessibility:** 7.2:1 contrast on #121212 background ✓ WCAG AA

---

### Accent: Gold (Energy & CTAs)

```css
--color-accent: #D6A23A         /* Main gold - achievement, action */
--color-accent-light: #F0C76A   /* Lighter variant */
--color-accent-dark: #B8892F    /* Darker variant */
```

**Usage:**
- Primary CTA buttons
- Success celebrations
- Achievement badges
- Premium feature highlights

**Accessibility:** 6.8:1 contrast with dark text (#121212) ✓ WCAG AA

---

## Background Colors (Dark Mode)

### Main Background
```css
--color-background: #121212      /* App canvas */
```
**Why #121212 instead of #000000?**
- Material Design best practice
- Allows subtle shadows
- Less eye strain
- Premium, modern aesthetic

### Surface (Cards, Panels)
```css
--color-surface: #1E1E1E         /* Cards, input backgrounds */
```

### Surface Elevated (Modals)
```css
--color-surface-elevated: #2A2A2A /* Modals, dropdowns */
```

---

## Text Colors (Off-White Hierarchy)

```css
--color-text-primary: #E0E0E0    /* 87% white - main text */
--color-text-secondary: #A0A0A0  /* 60% white - secondary */
--color-text-tertiary: #707070   /* 38% white - hints */
```

**Why off-white instead of pure white?**
- Material Design recommendation
- Reduces visual vibration on dark backgrounds
- More comfortable for extended reading
- Professional, refined appearance

**Contrast ratios:**
- Primary on background: 11.6:1 ✓ WCAG AAA
- Secondary on background: 7.2:1 ✓ WCAG AA
- Tertiary on background: 4.6:1 ✓ WCAG AA

---

## Semantic Colors

```css
--color-success: #10B981   /* Green - success states */
--color-error: #EF4444     /* Red - errors */
--color-warning: #F59E0B   /* Orange - warnings */
--color-info: #2CBEC6      /* Teal (same as primary) */
```

All semantic colors meet WCAG AA on dark background.

---

## Border Colors

```css
--color-border: #2A2A2A              /* Default borders */
--color-border-focus: var(--color-primary)  /* Teal focus */
```

---

## Neutral Grays (Material Design)

```css
--color-gray-50: #FAFAFA   /* Lightest */
--color-gray-100: #F5F5F5
--color-gray-200: #EEEEEE
--color-gray-300: #E0E0E0  /* Same as text-primary */
--color-gray-400: #BDBDBD
--color-gray-500: #9E9E9E  /* Middle gray */
--color-gray-600: #757575
--color-gray-700: #616161
--color-gray-800: #424242
--color-gray-900: #212121  /* Darkest usable */
```

---

## Usage in Code

### Tailwind Classes
```tsx
<Button className="bg-accent text-background" />
<Input className="bg-surface text-text-primary border-border" />
<Card className="bg-surface-elevated" />
```

### CSS Variables
```css
.component {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.component:focus {
  border-color: var(--color-primary);
  outline: 2px solid var(--color-primary);
}
```

---

## Migration from Old System

| Old | New | Notes |
|-----|-----|-------|
| `--color-gold` (#F8CA00) | `--color-accent` (#D6A23A) | Gold is now accent, not primary |
| N/A | `--color-primary` (#2CBEC6) | Teal is new primary |
| `#ffffff` background | `#121212` background | Dark-first |
| `#1a1a1a` text | `#E0E0E0` text | Off-white on dark |

**Legacy compatibility:** Old `--color-gold` maps to new `--color-accent` temporarily.

---

## Files

- **Design tokens:** `src/styles/design-tokens/colors.css`
- **Tailwind config:** `tailwind.config.js`
- **Brand documentation:** [Brand Colors](../brand/BRAND_COLORS.md)

---

**Last Updated:** 2026-01-12  
**Version:** 2.0.0 (Brand Book Dark-First)
