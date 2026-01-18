# BottomNav Component

4-tab navigace s FAB (Floating Action Button) pro DechBar App.

**Status:** ✅ Production Ready  
**Since:** 2026-01-18

---

## Import

```tsx
import { BottomNav } from '@/platform/components/navigation';
```

---

## API

### Props

BottomNav nemá props - řídí se přes `useNavigation` hook.

---

## Usage

```tsx
import { AppLayout } from '@/platform/layouts';

<AppLayout>
  <YourContent />
</AppLayout>
// BottomNav je automaticky součástí AppLayout
```

---

## Structure

```
BOTTOM NAV (72px + safe area)
┌────────────────────────────────────┐
│ [🏠]  [💪]  [🎓]  [📈]            │
│ Dnes Cvičit Akademie Pokrok        │
└────────────────────────────────────┘
```

### 4 Tabs

| Position | Name | Icon | Type | Description |
|----------|------|------|------|-------------|
| 1 | Dnes | Home (domeček) | Regular | Dashboard (preset protocols) |
| 2 | Cvičit | Dumbbell (činka) | **FAB** | Exercise library (PRIMARY CTA) |
| 3 | Akademie | Graduation cap (čepice) | Regular | Education + modules |
| 4 | Pokrok | Chart line (graf) | Regular | Progress & stats |

---

## FAB (Floating Action Button)

### Specifikace

- **Size:** 56×56px
- **Color:** Gold (#D6A23A)
- **Elevation:** -24px above nav (floating)
- **Shadow:** 0 8px 16px rgba(214, 162, 58, 0.4)
- **Icon:** Dumbbell (28×28px, dark text)
- **Label:** "Cvičit" (gold color, weight 600)

### Behavior

- **Hover:** Larger shadow
- **Press:** Scale 0.95 + reduced shadow
- **Active:** Gold label stays (ne Teal)

---

## Active States

### Regular Tabs
- **Inactive:** Secondary text color (#A0A0A0)
- **Active:** Primary color (#2CBEC6 Teal)

### FAB
- **Always gold** (active i inactive)
- **Active:** Label zůstává zlatý (ne Teal)

---

## Design Tokens

```css
/* Navigation */
--color-surface: #1E1E1E         /* Nav background */
--color-border: #2A2A2A          /* Top border */
--color-primary: #2CBEC6         /* Active state */
--color-accent: #D6A23A          /* FAB */
--color-text-secondary: #A0A0A0  /* Inactive labels */

/* Sizing */
--spacing-2: 8px
--spacing-4: 16px
--radius-lg: 12px

/* Safe area */
env(safe-area-inset-bottom)
```

---

## Navigation State

Kontrolováno přes Zustand:

```tsx
import { useNavigation } from '@/platform/hooks';

const { currentTab, setCurrentTab } = useNavigation();

// Změna tabu
setCurrentTab('dnes');  // 'dnes' | 'cvicit' | 'akademie' | 'pokrok'
```

---

## Accessibility

- ✅ **Keyboard:** Tab navigation mezi tabs
- ✅ **ARIA:** aria-label, aria-current="page"
- ✅ **Focus:** Teal outline (2px)
- ✅ **Touch:** Min 44×44px targets
- ✅ **Screen reader:** Announces tab name

---

## iOS/Android Native

### Safe Area Support
```css
padding-bottom: env(safe-area-inset-bottom);
```
Handles iPhone home indicator automatically.

### Touch Feedback
- Scale animation on press
- Native-like responsiveness
- No web-like delays

---

## Tone of Voice

Tab labels use:
- ✅ Tykání (informal Czech)
- ✅ Short, clear words
- ✅ Action-oriented ("Cvičit" - imperativ)

---

## Related Components

- [TopNav](./TopNav.md) - Top navigation
- [AppLayout](../layouts/AppLayout.md) - Layout wrapper
- [NavIcon](./NavIcon.md) - Icon system

---

**Last Updated:** 2026-01-18  
**Maintainer:** DechBar Team
