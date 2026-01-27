# BreathingCircle Component

Shared breathing circle visualization pro KP measurement a Session Engine.

**Status:** ✅ Production Ready  
**Since:** 2026-01-19  
**Last Updated:** 2026-01-26

---

## Import

```tsx
import { BreathingCircle } from '@/components/shared';
```

---

## API

### Props

```typescript
interface BreathingCircleProps {
  /**
   * Velikost kruhu (px)
   * @default 280 (desktop), 220 (mobile)
   */
  size?: number;
  
  /**
   * Obsah uvnitř kruhu
   */
  children?: React.ReactNode;
  
  /**
   * Animovaný režim (pro Session Engine)
   * @default false
   */
  animated?: boolean;
  
  /**
   * CSS class pro custom styling
   */
  className?: string;
}
```

---

## Usage

### Static Circle (KP Measurement)

```tsx
import { BreathingCircle } from '@/components/shared';

<BreathingCircle size={220}>
  <span className="kp-center__timer">28s</span>
</BreathingCircle>
```

### Animated Circle (Session Engine)

```tsx
import { BreathingCircle } from '@/components/shared';

<BreathingCircle animated size={240}>
  <span className="session-phase">NÁDECH</span>
</BreathingCircle>
```

---

## Visual Structure

```
      ┌─────────────────────┐
      │   Outer Glow (3x)   │  ← 3-layer shadow
      │  ┌───────────────┐  │
      │  │  Teal Border  │  │  ← 2px stroke
      │  │ ┌───────────┐ │  │
      │  │ │   Radial  │ │  │  ← Gradient fill
      │  │ │  Gradient │ │  │
      │  │ │           │ │  │
      │  │ │  CONTENT  │ │  │  ← children (timer, phase)
      │  │ │           │ │  │
      │  │ └───────────┘ │  │
      │  └───────────────┘  │
      └─────────────────────┘
```

---

## Modes

### 1. Static Circle (KP)

**Purpose:** Zobrazení KP hodnoty (timer, průměr, poslední skóre).

**Features:**
- ✅ No animation
- ✅ Fixed size (220px mobile, 280px desktop)
- ✅ Display content: timer, value + label
- ✅ Radial gradient + teal glow

**Example:**
```tsx
<BreathingCircle size={220}>
  <div className="kp-center__timer">14s</div>
</BreathingCircle>
```

---

### 2. Animated Circle (Session Engine)

**Purpose:** Breathing guidance (inhale/exhale visualization).

**Features:**
- ✅ RAF (requestAnimationFrame) animation
- ✅ Scale 1.0 ↔ 1.5 (cubic-bezier easing)
- ✅ Phase-based content (NÁDECH, VÝDECH, ZADRŽENÍ)
- ✅ Smooth 60fps animation

**Example:**
```tsx
<BreathingCircle animated size={240}>
  <div className="session-phase">NÁDECH</div>
  <div className="session-duration">4s</div>
</BreathingCircle>
```

**Animation Control:**
```tsx
import { useBreathingAnimation } from '@/modules/mvp0/hooks';

const { circleRef, animateBreathingCircle, cleanup } = useBreathingAnimation();

// Start animation
animateBreathingCircle(
  5000,  // duration (ms)
  'inhale'  // type: 'inhale' | 'exhale' | 'hold'
);

// Cleanup on unmount
useEffect(() => cleanup, []);
```

---

## Design

### Visual Style

**Radial Gradient:**
```css
background: radial-gradient(
  circle at center,
  rgba(44, 190, 198, 0.15) 0%,
  rgba(44, 190, 198, 0.05) 50%,
  transparent 100%
);
```

**Border:**
```css
border: 2px solid var(--color-primary);  /* Teal #2CBEC6 */
border-radius: 50%;
```

**3-Layer Glow:**
```css
box-shadow: 
  0 0 20px rgba(44, 190, 198, 0.3),   /* Inner glow */
  0 0 40px rgba(44, 190, 198, 0.2),   /* Mid glow */
  0 0 60px rgba(44, 190, 198, 0.1);   /* Outer glow */
```

### Responsive Sizes

| Breakpoint | Size | Usage |
|------------|------|-------|
| Mobile (≤768px) | 220px | KP measurement, Session Engine |
| Tablet (769-1279px) | 260px | KP measurement |
| Desktop (≥1280px) | 280px | KP measurement, Session Engine |

**CSS Variable:**
```css
--circle-size: 280px;  /* Desktop default */

@media (max-width: 768px) {
  --circle-size: 220px;  /* Mobile */
}
```

---

## Mobile & PWA Behavior (v2.41.6+)

### Fixed Position Centering

Na mobile je circle **fixed position** pro TRUE viewport centering:

```css
@media (max-width: 768px) {
  .breathing-circle-container {
    position: fixed !important;
    top: 50vh !important;
    left: 50vw !important;
    transform: translate(-50%, -50%) !important;
    z-index: 2 !important;
  }
}
```

**Proč fixed?**
- ✅ Centrování relativně k **viewportu**, ne parent containeru
- ✅ Respektuje safe area padding v parent
- ✅ Konzistence mezi KP a Session Engine

### Safe Area Considerations

**Parent Container Padding:**

Parent (`.kp-center__measurement-area` nebo `.session-states-wrapper`) má symetrický padding:

```css
padding: 
  max(34px, env(safe-area-inset-top))
  max(20px, env(safe-area-inset-right))
  max(34px, env(safe-area-inset-bottom))   /* ✅ SHODNÝ s top! */
  max(20px, env(safe-area-inset-left));
```

**Circle Fixed Position:**

Fixed position circle **ignoruje parent padding** a centruje se přímo k viewportu:

```
Viewport
┌─────────────────────────────┐
│  Safe area top (47px)       │  ← iOS notch
│                              │
│  Parent padding (34px)      │
│                              │
│         ┌───────┐           │
│         │ 50vh  │←──────────┼─── Circle centered here
│         └───────┘           │
│                              │
│  Parent padding (34px)      │
│                              │
│  Safe area bottom (34px)    │  ← iOS home indicator
└─────────────────────────────┘
```

**Výsledek:** Circle TRUE centered i na iOS PWA! ✅

---

## Content Patterns

### KP Timer (Measuring)

```tsx
<BreathingCircle size={220}>
  <span className="kp-center__timer">14s</span>
</BreathingCircle>
```

**CSS:**
```css
.kp-center__timer {
  font-size: 56px !important;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}
```

---

### KP Result (Final Average)

```tsx
<BreathingCircle size={220}>
  <div className="kp-center__final">
    <div className="kp-center__final-value">28 s</div>
    <div className="kp-center__final-label">Průměr</div>
  </div>
</BreathingCircle>
```

**CSS:**
```css
.kp-center__final-value {
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
}

.kp-center__final-label {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}
```

---

### Session Engine Phase

```tsx
<BreathingCircle animated size={240}>
  <div className="session-phase">NÁDECH</div>
  <div className="session-duration">4s</div>
</BreathingCircle>
```

**CSS:**
```css
.session-phase {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.session-duration {
  font-size: 48px;
  font-weight: 700;
  margin-top: 8px;
}
```

---

## Animation Details

### RAF Animation Loop

```typescript
function animateBreathingCircle(
  duration: number,
  type: 'inhale' | 'exhale' | 'hold'
) {
  const startTime = performance.now();
  const scaleRange = { min: 1.0, max: 1.5 };
  
  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Cubic-bezier easing
    const easing = cubicBezier(0.4, 0, 0.2, 1)(progress);
    
    // Scale calculation
    const scale = type === 'inhale'
      ? scaleRange.min + (scaleRange.max - scaleRange.min) * easing
      : scaleRange.max - (scaleRange.max - scaleRange.min) * easing;
    
    // Apply transform
    circleRef.current.style.transform = `scale(${scale})`;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}
```

### Performance

- ✅ **60fps** target (16.67ms per frame)
- ✅ Hardware-accelerated (`transform: scale`)
- ✅ Cleanup on unmount (cancel RAF)
- ✅ `will-change: transform` hint

---

## Accessibility

- ✅ **ARIA:** aria-label on container
- ✅ **Screen reader:** Content announced (timer, phase)
- ✅ **Reduced motion:** Disable animation if `prefers-reduced-motion: reduce`

```css
@media (prefers-reduced-motion: reduce) {
  .breathing-circle--animated {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Design Tokens

```css
/* Circle */
--circle-size: 280px;                    /* Desktop */
--circle-size-mobile: 220px;             /* Mobile */
--circle-border: 2px solid #2CBEC6;      /* Teal */

/* Glow */
--circle-glow-inner: 0 0 20px rgba(44, 190, 198, 0.3);
--circle-glow-mid: 0 0 40px rgba(44, 190, 198, 0.2);
--circle-glow-outer: 0 0 60px rgba(44, 190, 198, 0.1);

/* Animation */
--animation-duration: 5000ms;            /* Default breath cycle */
--animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Testing Checklist

### Desktop
- [ ] Circle centered (280px)?
- [ ] Glow visible (3 layers)?
- [ ] Content readable inside?
- [ ] Animation smooth (if animated)?

### Mobile (≤768px)
- [ ] Circle TRUE centered (not below)?
- [ ] Size 220px?
- [ ] Fixed position working?
- [ ] Safe areas respected?

### iOS PWA
- [ ] Circle centered (ignore notch/home indicator)?
- [ ] Animation 60fps?
- [ ] No jank on phase transitions?

---

## Related Components

- [KPCenter](./KPCenter.md) - KP measurement modal (uses static circle)
- [SessionEngineModal](../../modules/mvp0/components/session-engine/README.md) - Session Engine (uses animated circle)
- [CloseButton](./CloseButton.md) - Close button

---

## Related Documentation

- [PWA iOS Fixes](../../../PWA_IOS_FIXES_v2.41.6.md) - Mobile centering fix
- [Session Engine Spec](../../features/SESSION_ENGINE_SPEC.md) - Animation details
- [Visual Brand Book](../../brand/VISUAL_BRAND_BOOK.md) - Design system

---

## Changelog

### v2.41.6 (2026-01-26) - PWA iOS Fixes
- ✅ Fixed position centering (TRUE viewport center)
- ✅ Safe area awareness (parent padding respected)
- ✅ Mobile optimization (220px size)

### v2.0 (2026-01-23) - KP Flow v3
- ✅ Timer format: "XXs" (scalable beyond 99s)
- ✅ Font size consistency (56px)

### v1.0 (2026-01-19) - Initial Release
- ✅ Static mode (KP measurement)
- ✅ Animated mode (Session Engine)
- ✅ RAF animation (60fps)
- ✅ 3-layer glow effect

---

**Last Updated:** 2026-01-26  
**Maintainer:** DechBar Team  
**Version:** 2.1 (PWA Optimized)
