# Icon System

## Custom SVG Icons Only

**Never use:**
- Emoji (🎮, 💡) - inconsistent across platforms
- Icon fonts (Font Awesome) - accessibility issues

**Always use:**
- Custom SVG icons - consistent, accessible

## Icon Guidelines

### Style
- **Type:** Outline (not filled)
- **Stroke:** 2px width
- **Color:** `currentColor` (inherits from parent)
- **ViewBox:** 24x24 (for consistency)

### Sizes
- 16px - Small (inline text)
- 20px - Regular (buttons)
- 24px - Default (UI elements)
- 32px - Large (feature icons)
- 48px - Hero (landing pages)

## Usage

```tsx
// Inline SVG
<svg 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
>
  <path d="M..." />
</svg>

// As component
import { HeartIcon } from '@/platform/components/icons';

<HeartIcon size={24} className="text-gold" />
```

## Creating New Icons

1. Design in 24x24 grid
2. Use 2px stroke
3. Export as SVG
4. Set `stroke="currentColor"`
5. Remove hardcoded colors
6. Test at all sizes

## Icon Storage

Store icons in organized folders:
- `src/assets/icons/ui/` - UI icons
- `src/assets/icons/nav/` - Navigation
- `src/assets/icons/feature/` - Feature-specific

## Accessibility

Always include:
```tsx
<svg aria-label="Heart icon" role="img">
  ...
</svg>

// Or for decorative icons:
<svg aria-hidden="true">
  ...
</svg>
```
