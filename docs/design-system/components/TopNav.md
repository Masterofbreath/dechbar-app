# TopNav Component

Minimalistický top navigation bar pro DechBar App.

**Status:** ✅ Production Ready  
**Since:** 2026-01-18

---

## Import

```tsx
import { TopNav } from '@/platform/components/navigation';
```

---

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| transparent | boolean | false | Transparent background (pro landing page) |
| className | string | '' | Additional CSS classes |

---

## Usage

### Basic Usage

```tsx
<TopNav />
```

### Transparent Variant

```tsx
<TopNav transparent />
```

### With Custom Class

```tsx
<TopNav className="my-custom-class" />
```

---

## Structure

```
TOP NAV (64px + safe area)
┌────────────────────────────────────┐
│ [Avatar]              [Settings]   │
│  40px                    24px       │
└────────────────────────────────────┘
```

### Left: Avatar Button
- Size: 40×40px (touch target 44×44px)
- Teal border ring (2px solid)
- Click: Opens Profile modal
- Fallback: User initial if no avatar image

### Right: Settings Button
- Icon size: 24×24px
- Touch target: 44×44px
- Click: Opens Settings modal
- Color: Secondary text (#A0A0A0)

---

## Design Tokens

```css
--color-primary: #2CBEC6    /* Teal ring */
--color-surface: #1E1E1E    /* Avatar placeholder */
--color-text-secondary: #A0A0A0  /* Settings icon */
```

---

## Behavior

### Avatar Click
Opens Profile modal (bottom sheet on mobile, centered on desktop).

### Settings Click
Opens Settings modal (bottom sheet on mobile, centered on desktop).

### Scroll Behavior
- Sticky position (always visible)
- Transparent background (no visual weight)

---

## Accessibility

- ✅ Keyboard: Tab navigation works
- ✅ Screen reader: aria-label on buttons
- ✅ Focus: Visible Teal outline
- ✅ Touch: Min 44×44px targets

---

## iOS/Android Native

### Safe Area Support
```css
padding-top: env(safe-area-inset-top);
```
Automatically handles iPhone notch.

### Status Bar
Configured in `capacitor.config.ts`:
```typescript
StatusBar: {
  style: 'DARK',
  backgroundColor: '#121212',
}
```

---

## Related Components

- [BottomNav](./BottomNav.md) - Bottom navigation
- [AppLayout](../layouts/AppLayout.md) - Layout wrapper
- [NavIcon](./NavIcon.md) - Icon system

---

**Last Updated:** 2026-01-18  
**Maintainer:** DechBar Team
