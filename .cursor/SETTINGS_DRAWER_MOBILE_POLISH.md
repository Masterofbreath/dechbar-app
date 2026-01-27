# 🔧 Settings Drawer - Mobile UX Polish

**Date:** 2026-01-26  
**Status:** ✅ IMPLEMENTED  
**Testing:** Live on ngrok + mobile device

---

## 🐛 PROBLÉMY IDENTIFIKOVANÉ

### #1: Settings Button "Svítí" Po Otevření
**Příčina:** `:hover` state persistence
- Kliknutí na gear icon aktivuje hover (teal + rotation)
- Hover zůstává aktivní dokud se prst/kurzor nepohne
- Na mobile ještě horší - hover často "visí" až do dalšího touch eventu

**Viditelné efekty:**
- ✅ Settings ikona svítí teal barvou
- ✅ SVG gear rotované o 45°
- ✅ Hover state se nevypne dokud neklikneš jinam

### #2: `.top-nav__right` Pill Svítí Po Zavření Settings
**Příčina:** Container hover state persistence
- `.top-nav__right` (bell + settings pill) má hover effect
- Po zavření Settings drawer prst/kurzor stále nad pillou
- Hover state zůstává aktivní

**Viditelné efekty:**
- ✅ Teal border (`rgba(44, 190, 198, 0.2)`)
- ✅ Teal background glow (`rgba(44, 190, 198, 0.05)`)
- ✅ Gear icon animace
- ✅ Screenshot potvrzuje tento problém!

### #3: Chybějící Swipe-to-Close Gesture
**Stav:** Žádný swipe gesture implementován
- Pouze click na overlay nebo close button
- Uživatel očekává swipe right (zleva doprava = zpět)

---

## ✅ IMPLEMENTOVANÁ ŘEŠENÍ

### Fix #1+#2: Disable TopNav Hover States

**Body Class Management:**
```typescript
// SettingsDrawer.tsx
useEffect(() => {
  if (isSettingsOpen) {
    document.body.classList.add('settings-open'); // ✅ NEW
    if (window.innerWidth <= 768) {
      document.body.classList.add('immersive-mode');
    }
  }
  return () => {
    document.body.classList.remove('settings-open');
    document.body.classList.remove('immersive-mode');
  };
}, [isSettingsOpen]);
```

**CSS Override:**
```css
/* top-nav.css */

/* Disable .top-nav__right pill hover */
body.settings-open .top-nav__right,
body.settings-open .top-nav__right:hover {
  background: rgba(30, 30, 30, 0.03); /* Reset */
  border-color: rgba(255, 255, 255, 0.1); /* Reset */
}

/* Disable settings button hover */
body.settings-open .top-nav__settings-button,
body.settings-open .top-nav__settings-button:hover {
  color: var(--color-text-secondary); /* Gray */
  pointer-events: none; /* No further clicks */
}

/* Reset gear rotation */
body.settings-open .top-nav__settings-button svg,
body.settings-open .top-nav__settings-button:hover svg {
  transform: rotate(0deg) !important; /* Neutral */
}

/* Disable bell button hover */
body.settings-open .top-nav__bell-button,
body.settings-open .top-nav__bell-button:hover {
  color: var(--color-text-secondary);
}

/* Stop bell animation */
body.settings-open .top-nav__bell-button:hover svg {
  animation: none !important;
}
```

**Výsledek:**
- ✅ Gear icon immediately neutral (no teal, no rotation)
- ✅ Pill border/background immediately neutral (no teal glow)
- ✅ Bell icon neutral
- ✅ Žádné "stuck hover" states!

---

### Fix #3: Swipe-to-Close Gesture

**Touch Event Handlers:**
```typescript
// SettingsDrawer.tsx

// State
const [touchStart, setTouchStart] = useState<number | null>(null);
const [touchEnd, setTouchEnd] = useState<number | null>(null);
const [isDragging, setIsDragging] = useState(false);
const [dragOffset, setDragOffset] = useState(0);
const MIN_SWIPE_DISTANCE = 50; // 50px threshold

// Handlers
const handleTouchStart = (e: React.TouchEvent) => {
  setTouchEnd(null);
  setTouchStart(e.targetTouches[0].clientX);
  setIsDragging(true);
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!touchStart) return;
  const currentTouch = e.targetTouches[0].clientX;
  const diff = currentTouch - touchStart;
  
  // Only allow swipe RIGHT (left → right = close)
  if (diff > 0) {
    setDragOffset(diff);
    setTouchEnd(currentTouch);
  }
};

const handleTouchEnd = () => {
  if (!touchStart || !touchEnd) {
    setIsDragging(false);
    setDragOffset(0);
    return;
  }
  
  const distance = touchEnd - touchStart;
  const isRightSwipe = distance > MIN_SWIPE_DISTANCE;
  
  if (isRightSwipe) {
    handleClose(); // Close drawer
  }
  
  // Reset
  setIsDragging(false);
  setDragOffset(0);
  setTouchStart(null);
  setTouchEnd(null);
};
```

**JSX Integration:**
```tsx
<div 
  className={`settings-drawer ${isClosing ? 'settings-drawer--closing' : ''}`}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  style={{
    // Visual feedback during drag
    transform: isDragging && dragOffset > 0 
      ? `translateX(${dragOffset}px)` 
      : undefined,
    transition: isDragging ? 'none' : 'transform 0.3s ease',
  }}
>
```

**CSS Optimization:**
```css
/* settings-drawer.css */

.settings-drawer {
  /* ... existing styles ... */
  touch-action: pan-y; /* Allow vertical scroll, track horizontal */
}

/* Swipe hint indicator (visual cue) */
.settings-drawer::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 8px;
  width: 4px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  opacity: 0.5;
}

/* Hide on desktop */
@media (min-width: 769px) {
  .settings-drawer::before {
    display: none;
  }
}
```

**Výsledek:**
- ✅ Swipe right (left → right) > 50px = close drawer
- ✅ Visual feedback (drawer jede s prstem)
- ✅ Smooth animation zpět pokud < 50px
- ✅ Vertical scroll nezasažen
- ✅ 50px threshold = žádné accidental closes

---

## 📋 SOUBORY UPRAVENY

1. ✅ `src/platform/components/SettingsDrawer.tsx`
   - `settings-open` body class
   - Touch event handlers (swipe gesture)
   - Inline transform style for drag feedback

2. ✅ `src/styles/components/top-nav.css`
   - `body.settings-open` CSS overrides
   - Disable hover states (pill, buttons, icons)
   - Force neutral gear rotation

3. ✅ `src/styles/components/settings-drawer.css`
   - `touch-action: pan-y` for swipe detection
   - Swipe hint indicator (::before)
   - Mobile-only styling

---

## 🧪 TESTING CHECKLIST

### Fix #1: Settings Button Hover
- [ ] Otevři Settings (klikni na gear icon)
- [ ] Gear icon **immediately neutral** (gray, 0° rotation) ✅
- [ ] Žádná teal barva ✅
- [ ] Žádná rotace ✅

### Fix #2: Pill Container Hover
- [ ] Otevři Settings
- [ ] `.top-nav__right` pill **immediately neutral** ✅
- [ ] Žádný teal border ✅
- [ ] Žádný teal background glow ✅
- [ ] Zavři Settings → vše se vrátí normal ✅

### Fix #3: Swipe Gesture
- [ ] **Swipe left** (doprava → doleva) = NIC ✅
- [ ] **Swipe right < 50px** = drawer se vrátí zpět ✅
- [ ] **Swipe right > 50px** = drawer se zavře ✅
- [ ] Visual feedback (drawer jede s prstem) ✅
- [ ] Vertical scroll settings menu funguje ✅
- [ ] Swipe hint indicator viditelný (levý okraj) ✅

### Cross-Platform:
- [ ] Desktop (>768px): Žádný swipe (funguje normálně) ✅
- [ ] Mobile (<768px): Swipe + hover fixes aktivní ✅

---

## 🎯 TECHNICKÉ DETAILY

### Proč `body.settings-open` Class?
- **Global scope control** - ovlivní všechny TopNav elementy
- **Clean separation** - Settings drawer vlastní svůj state
- **Consistent pattern** - stejný jako `immersive-mode`

### Proč 50px Threshold?
- **iOS standard** - konzistentní s native apps
- **Accidental prevention** - žádné náhodné zavření
- **Comfortable distance** - ani moc dlouhé, ani krátké

### Proč `touch-action: pan-y`?
- **Vertical scroll preserved** - settings menu scrollable
- **Horizontal tracking** - detekuje swipe
- **Performance** - browser optimization

---

**Fixy implementovány! Auto-refresh za ~200ms!** 🚀
