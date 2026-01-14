# Loader

Global loading indicator with breathing animation for smooth auth transitions.

## Import

```tsx
import { Loader } from '@/platform/components';
```

## Overview

Loader component provides smooth transition between unauthenticated and authenticated states with DechBar's signature breathing animation (1.5 cycles @ 3000ms). Prevents harsh/instant redirects (Calm by Default principle).

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'logo-pulse' \| 'spinner' | 'logo-pulse' | Loading indicator variant |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Size of loader |
| message | string | undefined | Custom message below loader |
| showBreathingFact | boolean | false | Show random breathing fact (educational tip) |
| fullScreen | boolean | true | Render as fullscreen overlay |

## Variants

### Logo Pulse (Default)

DechBar icon with breathing animation (2s cycle).

```tsx
<Loader showBreathingFact />
```

### Spinner

Generic circular spinner (fallback).

```tsx
<Loader variant="spinner" size="sm" fullScreen={false} />
```

## Usage Examples

### With Random Breathing Fact

```tsx
// Login screen - educational tip
<Loader showBreathingFact />
// Shows: "Navy SEALs používají 'Box breathing' před misemi..."
```

### With Custom Message

```tsx
// Protected route check
<Loader message="Dýchej s námi..." />
```

### Inline Loading

```tsx
// Small inline loader
<Loader variant="spinner" size="sm" fullScreen={false} />
```

## Design Tokens

### Timing

- Duration: 2000ms (1 breathing cycle)
- Scale max: 1.08 (8% growth)
- Opacity min: 0.85 (soft fade)

### Colors

- Uses Brand Book 2.0 design tokens
- Background: `--color-background` (#121212)
- Text: `--color-text-secondary` (#A0A0A0)

## Breathing Facts

15 curated educational facts about breathing:
- Scientific (physiology, statistics)
- Practical (techniques like 4-7-8, Box breathing)
- Cultural (Japanese "Kokyu", Pranayama)
- Inspiring (Navy SEALs, freedivers)

Facts are randomly selected on each component mount.

## Accessibility

- Keyboard accessible (no interaction needed)
- Screen reader friendly (alt text for icon)
- Reduced motion support (`prefers-reduced-motion`)
- WCAG AA contrast (7.2:1 for text)

## 4 Temperaments Compliance

- **Sangvinik:** Fun animation, educational facts (engagement)
- **Cholerik:** 3000ms reasonable (not excessive), preloading = instant dashboard
- **Melancholik:** Premium design, quality facts, attention to detail
- **Flegmatik:** Calm breathing, smooth transition, no pressure

## Related Components

- [Button](./Button.md)
- [Input](./Input.md)
- [ProtectedRoute](../../architecture/AUTH.md)

## Implementation Details

- **Location:** `src/platform/components/Loader.tsx`
- **Styles:** `src/styles/components/loader.css`
- **Facts:** `src/config/messages.ts` (breathingFacts array)

## Status

**Status:** ✅ Production Ready  
**Since:** 2026-01-14  
**Version:** 1.0
