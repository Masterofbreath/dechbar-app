# Typography - Brand Book 2.0 (Inter Font)

Complete typography system for DechBar App following Visual Brand Book 2.0.

---

## Font Family

### Primary: Inter

```css
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

**Why Inter?**
- Modern, clean, professional aesthetic
- Excellent readability at all sizes
- Open-source, self-hostable (via Fontsource)
- Variable font support
- Premium tech brand feel

**Installation:**
```bash
npm install @fontsource/inter
```

**Import (in globals.css):**
```css
@import '@fontsource/inter/400.css';  /* Regular */
@import '@fontsource/inter/500.css';  /* Medium */
@import '@fontsource/inter/600.css';  /* Semibold */
@import '@fontsource/inter/700.css';  /* Bold */
```

---

## Font Scale (Based on 4px Grid)

```css
--font-size-xs: 0.75rem;      /* 12px - Captions, labels */
--font-size-sm: 0.875rem;     /* 14px - Secondary text */
--font-size-base: 1rem;       /* 16px - Body text (default) */
--font-size-lg: 1.125rem;     /* 18px - Emphasized text */
--font-size-xl: 1.25rem;      /* 20px - Small headings */
--font-size-2xl: 1.5rem;      /* 24px - Section headings */
--font-size-3xl: 1.875rem;    /* 30px - Page headings */
--font-size-4xl: 2.25rem;     /* 36px - Hero text */
```

---

## Font Weights

```css
--font-weight-light: 300;      /* Rarely used */
--font-weight-regular: 400;    /* Body text (default) */
--font-weight-medium: 500;     /* Emphasis, buttons */
--font-weight-semibold: 600;   /* Subheadings */
--font-weight-bold: 700;       /* Headings */
--font-weight-extrabold: 800;  /* Rarely used */
```

---

## Letter Spacing (Premium Feel)

```css
--letter-spacing-tight: -0.02em;    /* Headlines, display text */
--letter-spacing-normal: 0;         /* Body text */
--letter-spacing-wide: 0.02em;      /* All-caps labels */
```

**Key Rule:** Headings and display text use **tight letter-spacing (-0.02em)** for a premium, refined look.

---

## Line Heights

```css
--line-height-tight: 1.25;     /* Headings, display text */
--line-height-snug: 1.375;     /* Subheadings */
--line-height-normal: 1.5;     /* Body text (default) */
--line-height-relaxed: 1.625;  /* Emphasized paragraphs */
--line-height-loose: 1.75;     /* Long-form content */
```

---

## Typography Patterns

### Headings

```tsx
<h1 className="text-4xl font-bold tracking-tighter text-text-primary">
  Hero Heading
</h1>

<h2 className="text-3xl font-bold tracking-tighter text-text-primary">
  Page Heading
</h2>

<h3 className="text-2xl font-semibold tracking-tighter text-text-primary">
  Section Heading
</h3>
```

**CSS:**
```css
h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-bold);         /* 700 */
  letter-spacing: var(--letter-spacing-tight);  /* -0.02em */
  line-height: var(--line-height-tight);        /* 1.25 */
  color: var(--color-text-primary);             /* #E0E0E0 */
}
```

---

### Body Text

```tsx
<p className="text-base text-text-primary">
  Regular body text with optimal readability.
</p>
```

**CSS:**
```css
body {
  font-size: var(--font-size-base);        /* 16px */
  font-weight: var(--font-weight-regular); /* 400 */
  line-height: var(--line-height-normal);  /* 1.5 */
  letter-spacing: var(--letter-spacing-tight); /* -0.02em premium body */
}
```

---

### Secondary Text

```tsx
<p className="text-sm text-text-secondary">
  Metadata, timestamps, secondary information
</p>
```

---

### Captions / Hints

```tsx
<p className="text-xs text-text-tertiary">
  Helper text, captions, fine print
</p>
```

---

### All-Caps Labels

```tsx
<span className="text-sm uppercase tracking-wider text-text-secondary font-semibold">
  Label
</span>
```

**CSS:**
```css
.label {
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);  /* 0.02em for readability */
  font-weight: var(--font-weight-semibold);    /* 600 */
}
```

---

## Typography Best Practices

1. **Body text:** Always 16px (1rem) for optimal readability
2. **Headings:** Use tight letter-spacing (-0.02em) for premium feel
3. **All caps:** Use wide letter-spacing (0.02em) for legibility
4. **Long-form:** Use relaxed or loose line-height (1.625-1.75)
5. **Dark backgrounds:** Use off-white text (#E0E0E0), never pure white
6. **Minimum size:** 12px (0.75rem) for accessibility
7. **Touch targets:** Buttons with 16px+ text for easy tapping

---

## Responsive Typography

Typography scales remain consistent across breakpoints (no fluid scaling). Use responsive classes for specific adjustments:

```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>
```

---

## Accessibility

- **Contrast:** All text colors meet WCAG AA minimum (4.5:1)
- **Size:** Body text never below 16px for readability
- **Line height:** 1.5 minimum for body text (WCAG recommended)
- **Touch targets:** Interactive text min 44x44px
- **Font smoothing:** Antialiased for crisp rendering

---

## Migration from Old System

| Old | New | Notes |
|-----|-----|-------|
| System fonts | Inter | Custom brand font |
| Normal spacing | Tight spacing (-0.02em) | Premium feel |
| N/A | Wide spacing for all-caps | Better readability |
| Same | Same font scale | No changes to sizes |

---

## Files

- **Design tokens:** `src/styles/design-tokens/typography.css`
- **Tailwind config:** `tailwind.config.js`
- **Font package:** `@fontsource/inter`
- **Brand documentation:** [Visual Brand Book](../brand/VISUAL_BRAND_BOOK.md)

---

**Last Updated:** 2026-01-12  
**Version:** 2.0.0 (Brand Book Inter Font)
