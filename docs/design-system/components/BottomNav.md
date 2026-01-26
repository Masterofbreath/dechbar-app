# BottomNav Component

4-tab navigace s dynamickým FAB stylingem pro DechBar App.

**Status:** ✅ Production Ready  
**Since:** 2026-01-18  
**Last Updated:** 2026-01-25

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

| Position | Name | Icon | Description |
|----------|------|------|-------------|
| 1 | Dnes | Home (domeček) | Dashboard (preset protocols) |
| 2 | Cvičit | Dumbbell (činka) | Exercise library |
| 3 | Akademie | Graduation cap (čepice) | Education + modules |
| 4 | Pokrok | Chart line (graf) | Progress & stats |

---

## Dynamic FAB System

**Koncept:** Aktivní tab dostává gold FAB treatment (zlatý kruh, elevation, větší ikona).

### Aktivní Tab (Gold FAB)

- **Size:** 56×56px kruh
- **Color:** Gold (#D6A23A)
- **Elevation:** -24px above nav (floating)
- **Shadow:** 0 8px 16px rgba(214, 162, 58, 0.4)
- **Icon:** 28×28px, dark text (#121212)
- **Label:** Gold color (#D6A23A), weight 600

### Neaktivní Taby

- **Size:** 24×24px icon (bez kruhu)
- **Color:** Gray (#A0A0A0)
- **Label:** Gray (#A0A0A0), weight 500

---

## Behavior

### Active State (FAB Treatment)
- Gold circle background
- Elevated position (-24px)
- Larger icon (28px vs 24px)
- Gold label
- Gold shadow glow

### Inactive State
- No circle
- Normal position
- Smaller icon (24px)
- Gray label
- No shadow

### Hover (Inactive Tabs)
- Icon + label preview gold
- Icon translateY(-2px)

### Hover (Active Tab)
- Enhanced shadow (0 12px 24px)

### Press Animation
- **Inactive:** scale(0.92)
- **Active:** icon wrapper scale(0.95)

---

## Design Tokens

```css
/* Navigation */
--color-surface: #1E1E1E         /* Nav background */
--color-border: #2A2A2A          /* Top border */
--color-accent: #D6A23A          /* Active FAB (Gold) */
--color-text-secondary: #A0A0A0  /* Inactive labels */
--color-background: #121212      /* Icon color on gold */

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
- ✅ **Focus:** Gold outline (2px) - konzistentní s active state
- ✅ **Touch:** Min 44×44px targets
- ✅ **Screen reader:** Announces tab name + active state

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
- Smooth elevation transition between tabs

---

## Responsive Behavior

### Standard (375px+)
- Default sizing (56px active, 24px inactive icons)
- 72px nav height

### Very Narrow (< 375px)
- Min-width: 56px per tab
- Font size: 10px labels
- Tighter padding (8px)

---

## Visual Examples

### Kdy je aktivní "Dnes":
```
[🟡 Dnes]  [Cvičit]  [Akademie]  [Pokrok]
 ↑ gold     ↑ gray    ↑ gray      ↑ gray
   elevated  normal    normal      normal
   28px      24px      24px        24px
```

### Kdy je aktivní "Cvičit":
```
[Dnes]  [🟡 Cvičit]  [Akademie]  [Pokrok]
 ↑ gray  ↑ gold       ↑ gray      ↑ gray
  normal   elevated    normal      normal
  24px     28px        24px        24px
```

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

**Last Updated:** 2026-01-25  
**Maintainer:** DechBar Team  
**Version:** 2.0 (Dynamic FAB System)
