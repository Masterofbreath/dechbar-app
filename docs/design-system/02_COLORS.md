# Colors

## Brand Colors

### Gold (Primary)
- Default: `#F8CA00`
- Dark: `#E5B800`
- Light: `#FFD700`

### Black & White
- Black: `#1a1a1a` (text)
- White: `#ffffff` (backgrounds)

## Neutral Grays

Grayscale from 50 (lightest) to 900 (darkest):
- 50: `#f9fafb`
- 100: `#f3f4f6`
- 200: `#e5e7eb`
- 300: `#d1d5db`
- 400: `#9ca3af`
- 500: `#6b7280`
- 600: `#4b5563`
- 700: `#374151`
- 800: `#1f2937`
- 900: `#111827`

## Semantic Colors

- Success: `#10b981` (green)
- Error: `#ef4444` (red)

## Usage in Code

```tsx
// Tailwind classes
<div className="bg-gold text-black" />

// CSS variables
<div style={{ color: 'var(--color-gold)' }} />
```

## Files

- Implementation: `src/styles/design-tokens/colors.css`
- Tailwind config: `tailwind.config.js`
