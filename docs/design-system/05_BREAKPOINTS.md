# Responsive Breakpoints

## Mobile-First Approach

All styles start mobile and scale up.

## Breakpoints

| Name | Min Width | Device | Usage |
|------|-----------|--------|-------|
| xs | 320px | Narrow mobile | iPhone SE |
| sm | 480px | Mobile | Standard phones |
| md | 768px | Tablet | iPad, tablets |
| lg | 1024px | Desktop | Laptops |
| xl | 1440px | Wide desktop | Large monitors |
| 2xl | 1920px | Ultra-wide | Very large displays |

## Usage in Tailwind

```tsx
<div className="
  text-base     {/* Mobile: 16px */}
  md:text-lg    {/* Tablet: 18px */}
  lg:text-xl    {/* Desktop: 20px */}
">
  Responsive text
</div>

<div className="
  grid 
  grid-cols-1   {/* Mobile: 1 column */}
  md:grid-cols-2 {/* Tablet: 2 columns */}
  lg:grid-cols-3 {/* Desktop: 3 columns */}
">
  Responsive grid
</div>
```

## Testing Viewports

Test at these widths:
- 375px (iPhone)
- 768px (iPad)
- 1280px (MacBook)
- 1920px (Desktop)

## Files

- Implementation: `src/styles/design-tokens/breakpoints.css`
- Tailwind config: `tailwind.config.js`
