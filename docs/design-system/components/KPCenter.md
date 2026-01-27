# KPCenter Component

Kontrolní pauza (KP) measurement modal s multi-view flow pro DechBar App.

**Status:** ✅ Production Ready  
**Since:** 2026-01-23  
**Last Updated:** 2026-01-26

---

## Import

```tsx
import { KPCenter } from '@/platform/components';
```

---

## API

### Props

```typescript
interface KPCenterProps {
  isOpen?: boolean;         // Default: true
  onClose: () => void;      // Callback when modal closes
}
```

### Usage

```tsx
import { KPCenter } from '@/platform/components';

<KPCenter
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

---

## Flow Overview

```
READY ────> MEASURING ────> RESULT
  │            │              │
  │            └──> INSTRUCTIONS (side modal)
  │
  └──> INSTRUCTIONS (fullscreen)
```

### 4 Views

| View | Purpose | Actions |
|------|---------|---------|
| **Ready** | Initial state - zobrazení posledního KP skóre | "Začít měření", "Jak měřit?" |
| **Measuring** | Aktivní měření (3 pokusy) | "Zastavit měření", "Jak měřit?" |
| **Instructions** | Jak měřit KP (6 kroků + MiniTip) | "Zpět k měření" |
| **Result** | Výsledek + průměr všech pokusů | "Hotovo", "Měřit znovu" |

---

## View Components

### 1. KPReady (Initial State)

**Purpose:** Úvodní obrazovka s posledním KP skóre.

**Layout:**
```
┌────────────────────────────────┐
│ [×] Kontrolní pauza            │  ← Title + CloseButton
│                                 │
│     ┌─────────────┐            │
│     │             │            │  ← Breathing Circle
│     │   32 s      │  ← Poslední KP (nebo "-- s")
│     │             │            │
│     └─────────────┘            │
│                                 │
│  [Začít měření]                │  ← Primary CTA
│  [Jak měřit?]                  │  ← TextLink
│                                 │
└────────────────────────────────┘
```

**Elements:**
- `.kp-center__title` - "Kontrolní pauza"
- `.kp-center__description` - "Změř svou dechovou kondici..."
- `<BreathingCircle>` - Static circle s posledním KP
- `.button--primary` - "Začít měření"
- `.text-link` - "Jak měřit?"

---

### 2. KPMeasuring (Active Measurement)

**Purpose:** Aktivní měření (stopky běží).

**Layout:**
```
┌────────────────────────────────┐
│ [×] Kontrolní pauza            │
│     Měření 1/3          ←─────────┐  ← Progress indicator
│                                 │  │
│     ┌─────────────┐            │  │
│     │             │            │  │  ← Circle s timerem
│     │    14s      │  ← Real-time timer
│     │             │            │  │
│     └─────────────┘            │  │
│                                 │  │
│  [Zastavit měření]             │  │  ← Primary CTA
│  [Jak měřit?]                  │  │  ← TextLink
│                                 │  │
└────────────────────────────────┘  │
```

**Elements:**
- `.kp-center__progress-indicator` - "Měření 1/3"
- `<BreathingCircle>` - Static circle s live timerem
- `.kp-center__timer` - Real-time formát (např. "14s")
- `.button--primary` - "Zastavit měření"
- `.text-link` - "Jak měřit?"

**Timer Format:**
```tsx
import { formatTimerSeconds } from '@/utils/kp/formatting';

formatTimerSeconds(14000);  // "14s"
formatTimerSeconds(127000); // "127s"  (scales beyond 99s)
```

---

### 3. KPInstructions (How to Measure)

**Purpose:** Detailní instrukce pro měření KP (6 kroků).

**Layout (Mobile Fullscreen):**
```
┌────────────────────────────────┐
│ [×] Kontrolní pauza - jak měřit? │  ← Title + CloseButton
│                                 │
│ 1. Sedni si pohodlně          │
│ 2. Normálně vdechu a vydechu  │
│ 3. Po výdechu zavři ústa      │
│ 4. Čekej na první signál...   │  ← Shortened text!
│    (Kopnutí bránice, potřeba  │
│     polknout či myšlenka...)  │
│ 5. Zapni časovač při začátku  │
│                                 │
│ 6. Kontrola: První nádech po  │
│    zádrži by měl být tichý    │
│                                 │
│  💡 Tip: Měř KP hned po       │  ← MiniTip
│     probuzení...               │
│                                 │
│  [Zpět k měření]               │  ← Primary CTA
│                                 │
└────────────────────────────────┘
```

**Key Changes (v2.41.5):**
- ✅ Title left-aligned (same line as CloseButton)
- ✅ Progress indicator moved to result position
- ✅ Text optimized: "...potřeby nádechu" (fits 1 line)
- ✅ Aggressive spacing (80px top, 140px bottom)
- ✅ MiniTip visible with room to breathe
- ✅ Separator line removed (between 5 and 6)
- ✅ Consistent spacing (8px between items)

**Elements:**
- `.kp-center__instructions-list` - Numbered list (1-5)
- `.kp-center__instructions-detail` - Gray sub-text
- `.kp-center__instructions-check` - Point 6 (validation)
- `.mini-tip` - Pro-tip (morning measurement)
- `.button--primary` - "Zpět k měření"

---

### 4. KPResult (Measurement Complete)

**Purpose:** Zobrazení výsledku + průměr všech pokusů.

**Layout:**
```
┌────────────────────────────────┐
│ [×] Kontrolní pauza            │
│     Máš změřeno!        ←─────────┐  ← Result message
│                                 │  │
│     ┌─────────────┐            │  │
│     │             │            │  │  ← Circle s průměrem
│     │    28 s     │  ← Average KP
│     │   Průměr    │            │  │
│     └─────────────┘            │  │
│                                 │  │
│  [Hotovo]                      │  │  ← Primary CTA
│  [Měřit znovu]                 │  │  ← Ghost button
│                                 │  │
└────────────────────────────────┘  │
```

**Elements:**
- `.kp-center__result-title` - "Máš změřeno!"
- `<BreathingCircle>` - Static circle s průměrem
- `.kp-center__final-value` - "28 s" (large, 64px)
- `.kp-center__final-label` - "Průměr" (below value)
- `.button--primary` - "Hotovo"
- `.button--ghost` - "Měřit znovu"

---

## Mobile & PWA Behavior (v2.41.6+)

### Fullscreen Immersive Mode

```css
@media (max-width: 768px) {
  .kp-center {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 10002 !important;
  }
}
```

### iOS Safe Area Padding

**Symetrický padding** pro TRUE vertical centering:

```css
.kp-center__measurement-area {
  padding: 
    max(34px, env(safe-area-inset-top))      /* ✅ Top */
    max(20px, env(safe-area-inset-right))
    max(34px, env(safe-area-inset-bottom))   /* ✅ Bottom - SHODNÝ! */
    max(20px, env(safe-area-inset-left)) !important;
  justify-content: center;  /* ✅ TRUE center now */
}
```

**Proč symetrický?**
- iOS: top ~47px (notch), bottom ~34px (home indicator)
- Asymetrie → Circle ~6px níže
- **Fix:** max(34px, ...) pro obě strany
- **Výsledek:** Circle TRUE centered ✅

### CloseButton Positioning

Centralizováno v `fullscreen-modal-mobile.css`:

```css
.kp-center .close-button {
  position: fixed !important;
  top: max(16px, env(safe-area-inset-top)) !important;
  right: max(16px, env(safe-area-inset-right)) !important;
  z-index: 20 !important;
}
```

### Title Alignment (Mobile)

```css
.kp-center__title {
  position: fixed !important;
  top: max(16px, env(safe-area-inset-top)) !important;
  left: max(16px, env(safe-area-inset-left)) !important;
  right: max(60px, env(safe-area-inset-right) + 44px) !important;
  text-align: left !important;  /* ✅ Left-aligned */
  height: 44px !important;
}
```

### Instructions View (Mobile)

```css
.kp-center__instructions-fullscreen {
  /* Varianta D - Aggressive Spacing */
  padding:
    max(80px, env(safe-area-inset-top) + 64px)   /* ✅ Z 50px → 80px */
    max(20px, env(safe-area-inset-right))
    max(140px, env(safe-area-inset-bottom) + 120px)  /* ✅ +40px pro MiniTip */
    max(20px, env(safe-area-inset-left)) !important;
}

.kp-center__instructions-list li {
  padding: 8px 0 !important;  /* ✅ Consistent spacing */
}
```

---

## Measurement Engine

### Hook: useKPMeasurementEngine

```tsx
import { useKPMeasurementEngine } from '@/hooks/kp';

const engine = useKPMeasurementEngine({
  onMeasurementComplete: (result) => console.log('KP:', result.average),
});

// Start measurement
engine.startMeasurement();

// Stop measurement
engine.stopMeasurement();

// Current state
console.log(engine.elapsed);        // 14000 (ms)
console.log(engine.currentAttempt); // 1
console.log(engine.isRunning);      // true
```

### State Flow

```
IDLE
  └─> startMeasurement()
        └─> RUNNING (attempt 1)
              └─> stopMeasurement()
                    └─> IDLE (save result)
                          └─> startMeasurement() (attempt 2)
                                └─> ... (repeat for 3 attempts)
```

---

## Design Tokens

```css
/* Circle */
--circle-size: 220px;           /* Mobile size */
--circle-glow: 0 0 40px rgba(44, 190, 198, 0.3);

/* Timer inside circle */
--font-size-timer: 56px;        /* KP timer (consistent!) */

/* Safe areas */
env(safe-area-inset-top)        /* ~47px (notch) */
env(safe-area-inset-bottom)     /* ~34px (home indicator) */
env(safe-area-inset-left)       /* ~0px */
env(safe-area-inset-right)      /* ~0px */

/* Spacing */
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-6: 24px;
```

---

## Accessibility

- ✅ **Keyboard:** Esc closes modal, Tab navigation
- ✅ **ARIA:** aria-label, aria-live for timer
- ✅ **Focus:** Trap focus within modal
- ✅ **Touch:** Min 48×48px targets (iOS standard)
- ✅ **Screen reader:** Announces measurement state

---

## Testing Checklist

### Desktop
- [ ] Modal centered (600px max-width)?
- [ ] CloseButton accessible (top-right)?
- [ ] Circle centered vertically?
- [ ] Timer updates smoothly?
- [ ] Instructions readable?

### Mobile (≤768px)
- [ ] Fullscreen (no top/bottom nav)?
- [ ] Circle TRUE centered (not below)?
- [ ] Title left-aligned (same line as CloseButton)?
- [ ] Progress indicator below title?
- [ ] Instructions spacing comfortable?
- [ ] MiniTip visible (not cut off)?
- [ ] Primary buttons ~75% width?

### iOS PWA
- [ ] Safe areas respected (notch, home indicator)?
- [ ] Circle centered (not affected by safe areas)?
- [ ] CloseButton accessible (not hidden by notch)?
- [ ] Smooth animations (60fps)?

---

## Related Components

- [BreathingCircle](./BreathingCircle.md) - Shared breathing circle
- [MiniTip](./MiniTip.md) - Pro-tip component
- [CloseButton](./CloseButton.md) - Close button
- [AppLayout](../layouts/AppLayout.md) - Layout wrapper

---

## Related Documentation

- [KP Measurements API](../../api/KP_MEASUREMENTS_API.md) - API contract
- [KP Data Contract](../../api/KP_DATA_CONTRACT.md) - Database schema
- [Implementation Logs](../../development/implementation-logs/2026-01-23-kp-flow-v3.1.md) - History

---

## Changelog

### v2.41.6 (2026-01-26) - PWA iOS Fixes
- ✅ Symetrický safe area padding (34px top/bottom)
- ✅ Circle TRUE centered on iOS PWA
- ✅ Fixed CloseButton positioning architecture

### v2.41.5 (2026-01-25) - Instructions Spacing
- ✅ Title left-aligned (same line as CloseButton)
- ✅ Progress indicator repositioned
- ✅ Text optimized ("potřeby nádechu")
- ✅ Aggressive spacing (80px top, 140px bottom)
- ✅ Separator removed, consistent 8px spacing

### v2.41.3 (2026-01-24) - Mobile UX
- ✅ Timer format changed to "XXs"
- ✅ Primary buttons ~75% width
- ✅ MiniTip repositioned

---

**Last Updated:** 2026-01-26  
**Maintainer:** DechBar Team  
**Version:** 3.1 (Multi-attempt Flow + PWA Optimized)
