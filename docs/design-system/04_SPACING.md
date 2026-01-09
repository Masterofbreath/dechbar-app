# Spacing System

## 4px Base Unit

All spacing follows 4px increments for consistency:

| Token | Value | Usage |
|-------|-------|-------|
| 0 | 0px | Reset |
| 1 | 4px | Tight spacing |
| 2 | 8px | Compact spacing |
| 3 | 12px | Small spacing |
| 4 | 16px | Default spacing |
| 5 | 20px | Medium spacing |
| 6 | 24px | Large spacing |
| 8 | 32px | Extra large |
| 10 | 40px | Section spacing |
| 12 | 48px | Major sections |
| 16 | 64px | Large gaps |
| 20 | 80px | Very large gaps |
| 24 | 96px | Huge gaps |

## Usage

```tsx
// Padding
<div className="p-4">16px padding</div>
<div className="px-6 py-3">24px horizontal, 12px vertical</div>

// Margin
<div className="mt-8 mb-4">32px top, 16px bottom</div>

// Gap (for flex/grid)
<div className="flex gap-2">8px gap between items</div>
```

## Files

- Implementation: `src/styles/design-tokens/spacing.css`
- Tailwind config: `tailwind.config.js`
