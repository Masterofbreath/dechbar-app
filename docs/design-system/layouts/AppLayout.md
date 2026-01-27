# AppLayout Component

Main application layout wrapper s TopNav, Content area a BottomNav pro DechBar App.

**Status:** ✅ Production Ready  
**Since:** 2026-01-18  
**Last Updated:** 2026-01-26

---

## Import

```tsx
import { AppLayout } from '@/platform/layouts';
```

---

## API

### Props

```typescript
interface AppLayoutProps {
  /**
   * Page content
   */
  children: ReactNode;
  
  /**
   * Transparent TOP NAV (for special screens)
   * @default false
   */
  transparentTopNav?: boolean;
  
  /**
   * Hide bottom navigation (for fullscreen modals)
   * @default false
   */
  hideBottomNav?: boolean;
}
```

### Usage

```tsx
import { AppLayout } from '@/platform/layouts';

<AppLayout>
  <DnesPage />
</AppLayout>

// With transparent top nav
<AppLayout transparentTopNav>
  <LandingPage />
</AppLayout>

// Without bottom nav
<AppLayout hideBottomNav>
  <OnboardingPage />
</AppLayout>
```

---

## Structure

```
┌────────────────────────────────────┐
│ TopNav (64px + safe area)          │  ← Fixed top
├────────────────────────────────────┤
│                                     │
│                                     │
│  Content (scrollable)              │  ← flex: 1
│                                     │
│                                     │
├────────────────────────────────────┤
│ BottomNav (72px + safe area)       │  ← Fixed bottom (mobile)
└────────────────────────────────────┘
```

### Layout Hierarchy

```tsx
<div className="app-layout">
  <TopNav />                    {/* position: relative (desktop), fixed (mobile) */}
  
  <main className="app-layout__content">
    {children}                  {/* flex: 1, scrollable */}
  </main>
  
  {!hideBottomNav && <BottomNav />}  {/* position: relative (desktop), fixed (mobile) */}
</div>
```

---

## Desktop Behavior (> 768px)

### Layout

```css
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-background);
  overflow: hidden;
}
```

**Flexbox Structure:**
- `TopNav`: flex-shrink: 0 (fixed height)
- `Content`: flex: 1 (grows to fill)
- `BottomNav`: flex-shrink: 0 (fixed height)

### Content Padding

```css
.app-layout__content {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Space for TopNav */
  padding-top: calc(
    64px +                              /* TopNav height */
    env(safe-area-inset-top)           /* iOS notch */
  );
  
  /* Breathing space */
  padding-bottom: 16px;
}
```

---

## Mobile Behavior (≤ 768px) - **PWA Optimized** 🎯

### Fixed Navigation

Na mobile jsou **TopNav i BottomNav fixed position**:

```css
@media (max-width: 768px) {
  .top-nav {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 101 !important;
  }
  
  .bottom-nav {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 100 !important;
  }
}
```

**Proč fixed?**
- ✅ Always visible navigation
- ✅ iOS PWA support (`100dvh` issue)
- ✅ Smooth scroll content (only middle area)

### Content Padding (Mobile)

```css
@media (max-width: 768px) {
  .app-layout__content {
    /* Space for FIXED TopNav */
    padding-top: calc(
      64px +                              /* TopNav height */
      env(safe-area-inset-top)           /* iOS notch ~47px */
    ) !important;
    
    /* Space for FIXED BottomNav */
    padding-bottom: calc(
      72px +                              /* BottomNav height */
      env(safe-area-inset-bottom) +      /* iOS home indicator ~34px */
      16px                                /* Breathing space */
    ) !important;
  }
}
```

**iOS Example (iPhone 13 mini):**
- Top padding: 64px + 47px = **111px**
- Bottom padding: 72px + 34px + 16px = **122px**

---

## iOS Safe Areas

### Safe Area Insets

```css
/* Global safe area padding */
@supports (padding: max(0px)) {
  body {
    padding: 
      env(safe-area-inset-top)
      env(safe-area-inset-right)
      env(safe-area-inset-bottom)
      env(safe-area-inset-left);
  }
}
```

**Inset Values (iPhone 13 mini):**
| Area | Value | Element |
|------|-------|---------|
| Top | ~47px | Notch + status bar |
| Bottom | ~34px | Home indicator |
| Left | 0px | No notch |
| Right | 0px | No notch |

### TopNav Safe Area

```css
.top-nav {
  padding-top: max(8px, env(safe-area-inset-top));
  height: calc(64px + env(safe-area-inset-top));
}
```

### BottomNav Safe Area

```css
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(72px + env(safe-area-inset-bottom));
}
```

---

## Viewport Height Issues (PWA)

### The Problem

```css
/* ❌ PROBLÉM: Na iOS PWA s 100dvh */
.app-layout {
  min-height: 100dvh;  /* Dynamic viewport height */
}
```

**Issue:**
- `100dvh` = celá obrazovka **včetně safe areas**
- Body padding push content out of view
- Bottom Nav mimo viewport (scrolled out)

### The Solution (v2.41.6+)

```css
/* ✅ FIX: Fixed position navigation */
@media (max-width: 768px) {
  .top-nav, .bottom-nav {
    position: fixed !important;
  }
}
```

**Výsledek:**
- ✅ Navigation vždy visible
- ✅ Content scrollable (with padding)
- ✅ PWA = Browser experience

---

## Z-Index Hierarchy

```css
/* Layer stack (bottom to top) */
--z-content: 1;              /* Page content */
--z-nav: 100;                /* Bottom Nav */
--z-nav-top: 101;            /* Top Nav */
--z-modals: 10000;           /* Settings, Profile */
--z-fullscreen: 10002;       /* KP, Session Engine */
```

### Why TopNav > BottomNav?

- TopNav má **active notifications** (badge, pulse)
- TopNav překrývá content při scroll
- BottomNav je statičtější (jen tab switch)

---

## Content Area

### Scrolling

```css
.app-layout__content {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;  /* Smooth scroll iOS */
}
```

### Scroll Lock (Modals Open)

```css
body.modal-open {
  overflow: hidden;  /* Prevent background scroll */
}
```

---

## Responsive Breakpoints

| Breakpoint | Layout Behavior |
|------------|----------------|
| **≤ 768px** | Fixed nav (mobile), fullscreen modals |
| **769-1279px** | Relative nav (tablet), centered modals |
| **≥ 1280px** | Relative nav (desktop), max-width content |

---

## Modal Behavior

### Settings & Profile (Drawer Style)

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.85);
}
```

**Behavior:**
- Desktop: Centered modal (600px max-width)
- Mobile: Bottom sheet (slide up)

### KP & Session Engine (Fullscreen)

```css
@media (max-width: 768px) {
  .kp-center,
  .session-engine-modal__content {
    position: fixed !important;
    inset: 0 !important;
    z-index: 10002 !important;
  }
}
```

**Behavior:**
- Mobile: Fullscreen (immersive)
- Desktop: Centered modal (600px max-width)

---

## Accessibility

- ✅ **Keyboard:** Skip to content link
- ✅ **ARIA:** Landmarks (nav, main)
- ✅ **Focus:** Trap focus in modals
- ✅ **Screen reader:** Announce navigation changes

```tsx
<nav aria-label="Top navigation">
  <TopNav />
</nav>

<main role="main" id="main-content">
  {children}
</main>

<nav aria-label="Bottom navigation">
  <BottomNav />
</nav>
```

---

## Testing Checklist

### Desktop
- [ ] TopNav visible (64px height)?
- [ ] BottomNav visible (72px height)?
- [ ] Content scrollable (between navs)?
- [ ] Modals centered (600px max-width)?

### Mobile (≤768px)
- [ ] TopNav fixed (always visible)?
- [ ] BottomNav fixed (always visible)?
- [ ] Content padding correct (no overlap)?
- [ ] Smooth scroll (touch optimized)?

### iOS PWA
- [ ] Safe areas respected (notch, home indicator)?
- [ ] TopNav padding correct (~47px top)?
- [ ] BottomNav padding correct (~34px bottom)?
- [ ] Content visible (not cut off)?
- [ ] Fullscreen modals immersive?

---

## Related Components

- [TopNav](../components/TopNav.md) - Top navigation
- [BottomNav](../components/BottomNav.md) - Bottom navigation
- [KPCenter](../components/KPCenter.md) - KP measurement modal
- [SessionEngineModal](../../modules/mvp0/components/session-engine/README.md) - Session Engine

---

## Related Documentation

- [PWA iOS Fixes](../../../PWA_IOS_FIXES_v2.41.6.md) - Mobile fixes
- [Code Structure](../../architecture/CODE_STRUCTURE.md) - Architecture
- [Platform API](../../api/PLATFORM_API.md) - API reference

---

## Changelog

### v2.41.6 (2026-01-26) - PWA iOS Fixes
- ✅ Fixed position navigation on mobile
- ✅ Content padding accounting for fixed nav
- ✅ Safe area handling documented

### v2.0 (2026-01-25) - Dynamic FAB
- ✅ Bottom Nav refactored (gold FAB system)
- ✅ Layout shift prevention

### v1.0 (2026-01-18) - Initial Release
- ✅ 3-part layout (Top + Content + Bottom)
- ✅ Flexbox structure
- ✅ Modal overlays
- ✅ Safe area support

---

**Last Updated:** 2026-01-26  
**Maintainer:** DechBar Team  
**Version:** 2.1 (PWA Optimized)
