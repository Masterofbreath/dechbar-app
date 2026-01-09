# Typography

## Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
```

## Font Scale

Based on 4px grid:

| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| xs | 12px | 16px | Captions, labels |
| sm | 14px | 20px | Secondary text |
| base | 16px | 24px | Body text |
| lg | 18px | 28px | Emphasized text |
| xl | 20px | 28px | Small headings |
| 2xl | 24px | 32px | Section headings |
| 3xl | 30px | 36px | Page headings |
| 4xl | 36px | 40px | Hero text |
| 5xl | 48px | 1 | Large display |

## Font Weights

- Light: 300
- Normal: 400 (default)
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800

## Usage

```tsx
<h1 className="text-4xl font-bold">Heading</h1>
<p className="text-base font-normal">Body text</p>
<span className="text-sm text-gray-600">Caption</span>
```

## Files

- Implementation: `src/styles/design-tokens/typography.css`
- Tailwind config: `tailwind.config.js`
