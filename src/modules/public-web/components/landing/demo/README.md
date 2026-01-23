# Interactive Demo Mockup

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2026-01-22

---

## Overview

Interactive demo of DechBar app embedded inside phone mockup on landing page.

**Purpose:** Convert visitors to registered users by letting them experience the app before signup.

**Key Features:**
- 2 active views: Dnes, Cvičit
- 6 free exercises (3 protocols + 3 exercises)
- Personalized conversion modal
- Google OAuth first
- Analytics tracking
- Auto-sync with MVp0 (shared constants)

---

## Architecture

### Component Tree

```
HeroMockup (SVG Frame)
└─ Intersection Observer (lazy load trigger)
   └─ DemoApp (orchestrator)
      ├─ DemoDnesView
      │  ├─ Greeting (Jakub_rozdycha_cesko, KP 39)
      │  ├─ 3x PresetProtocolButton (RÁNO, RESET, NOC)
      │  └─ DailyTipWidget
      │
      ├─ DemoCvicitView
      │  └─ 3x ExerciseCard (BOX, Calm, Coherence)
      │
      ├─ DemoBottomNav (4 tabs: 2 active, 2 disabled)
      │
      └─ LockedExerciseModal (conversion modal)
         ├─ Google OAuth button (primary)
         └─ Email form (secondary)
```

### Data Flow

```
Shared Constants (/src/shared/exercises/presets.ts)
  ├─> MVp0 app (real app)
  └─> Demo mockup (landing page)
  
= Auto-sync! Change in shared → updates both
```

---

## Files

### Components
- `DemoApp.tsx` - Main orchestrator (state, analytics)
- `views/DemoDnesView.tsx` - Dnes dashboard view
- `views/DemoCvicitView.tsx` - Cvičit exercise library
- `components/DemoBottomNav.tsx` - Bottom navigation
- `components/LockedExerciseModal.tsx` - Conversion modal

### Data
- `data/demoUser.ts` - Fake user (Jakub_rozdycha_cesko, KP 39)
- `data/demoExercises.ts` - Filtered exercises (6 total)
- `data/demoConfig.ts` - Feature flags, A/B variants

### Hooks
- `hooks/useDemoAnalytics.ts` - Analytics tracking
- `hooks/useIntersectionLoad.ts` - Lazy load trigger

### Styles
- `/src/styles/components/demo-app.css` - Container styles
- `/src/styles/components/demo-bottom-nav.css` - Navigation styles
- `/src/styles/components/locked-exercise-modal.css` - Modal styles

---

## Usage

### Import Demo

```typescript
import { DemoApp } from '@/modules/public-web/components/landing/demo';

// Inside HeroMockup SVG
<foreignObject x="20" y="20" width="260" height="560">
  <div className="demo-app-container">
    <DemoApp />
  </div>
</foreignObject>
```

### Update Exercise Data

Edit `/src/shared/exercises/presets.ts`:

```typescript
// Change duration
{ name: 'RÁNO', duration: 480 } // 8 min (was 7 min)

// Change description
{ description: 'Nový popis ranního protokolu' }

// Add tags
{ tags: ['morning', 'energy', 'new-tag'] }
```

**Result:** Auto-syncs to both MVp0 and Demo!

---

## Analytics Events

Tracked events (Google Analytics):

```typescript
// Tab switching
gtag('event', 'demo_interaction', {
  action: 'tab_switch',
  view: 'cvicit',
});

// Exercise click
gtag('event', 'demo_interaction', {
  action: 'exercise_click',
  exercise_name: 'BOX breathing',
  view: 'cvicit',
});

// Modal open
gtag('event', 'demo_interaction', {
  action: 'modal_open',
  exercise_name: 'BOX breathing',
});

// Registration start
gtag('event', 'demo_interaction', {
  action: 'registration_start',
  method: 'google',
  exercise_name: 'BOX breathing',
});
```

---

## Performance

### Optimization Techniques

1. **Lazy Loading:**
   - Intersection Observer triggers load when mockup visible
   - React.lazy() code splits demo bundle
   - Suspense with loading skeleton

2. **Bundle Size:**
   - Demo bundle: ~20 KB (gzipped)
   - Total impact: Minimal (lazy loaded)

3. **Rendering:**
   - 60 FPS scrolling (CSS transform)
   - No layout shift (fixed dimensions)

### Benchmarks

- Lighthouse Performance: 90+
- First Contentful Paint: <1.5s
- Time to Interactive: <2.5s
- Cumulative Layout Shift: 0

---

## Responsive Design

### Desktop (1024px+)
- Full mockup scale (260px width in SVG)
- Transform scale: 0.693 (375px → 260px)

### Tablet (768px - 1023px)
- Phone mockup scaled: 0.8

### Mobile (480px - 767px)
- Phone mockup scaled: 0.7

### Small Mobile (<480px)
- Phone mockup scaled: 0.6

---

## Tone of Voice

### Modal Messaging (Personalized)

```typescript
// BOX breathing clicked:
"Chceš zkusit BOX breathing?"
"5 minut tě čeká. Stačí jeden klik."

// RÁNO clicked:
"Chceš zkusit RÁNO?"
"7 minut tě čeká. Stačí jeden klik."
```

### Trust Signals

```
🔒 Zdarma • ⚡ 30 sekund • ✓ 1150+ členů
```

### Benefits

```
✓ {exercise name} ({duration} min) ready
✓ 150+ dalších cvičení zdarma
✓ BOLT tracking pro pokrok
```

---

## Future Enhancements

### Phase 2 (Week 2-3)
- [ ] A/B test modal headlines
- [ ] Track conversion by exercise
- [ ] Exit-intent modal
- [ ] Social proof (live member count)

### Phase 3 (Week 4+)
- [ ] Add Pokrok view (charts preview)
- [ ] Add Akademie view (course preview)
- [ ] Real OAuth integration
- [ ] Direct to exercise redirect

---

## Troubleshooting

### Demo not loading?

1. Check console for errors
2. Verify Intersection Observer triggered
3. Check React.lazy() import path

### Type errors?

Shared Exercise type is compatible with MVp0 Exercise.
If adding new fields to MVp0 Exercise:
- Add as **optional** in shared type
- Update demo components if needed

### Styling issues?

All styles use design tokens (CSS variables).
Demo inherits from:
- `dnes-page` styles (reused)
- `cvicit-page` styles (reused)
- `exercise-card` styles (reused)

---

## Maintenance

### Adding New Exercise

1. Edit `/src/shared/exercises/presets.ts`
2. Add to PRESET_EXERCISES array
3. Build + test
4. **Done!** Auto-syncs to demo

### Changing Modal Copy

1. Edit `/src/modules/public-web/components/landing/demo/components/LockedExerciseModal.tsx`
2. Update headline, benefits, or CTA text
3. Deploy

### A/B Testing Variant

1. Edit `/src/modules/public-web/components/landing/demo/data/demoConfig.ts`
2. Change `variant.modal` or `variant.cta`
3. Deploy
4. Monitor analytics

---

**Questions?** Check [PROJECT_GUIDE.md](../../../../../../PROJECT_GUIDE.md) or [Visual Brand Book](../../../../../../docs/brand/VISUAL_BRAND_BOOK.md).
