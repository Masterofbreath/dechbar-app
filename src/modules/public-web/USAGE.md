# Public Web Module - Usage Guide

**Version:** 1.0.0  
**Last Updated:** 2026-01-12

---

## Overview

Public-facing landing page for DechBar App. Accessible at `dechbar.cz/`.

---

## Quick Start

```bash
# Start dev server
npm run dev

# Visit landing page
open http://localhost:5173/
```

---

## Editing Content

### Change Headline or Subheading

Edit [`src/modules/public-web/components/landing/HeroSection.tsx`](components/landing/HeroSection.tsx):

```tsx
<h1 className="landing-hero__title">
  Tvůj dechový průvodce v kapse.  {/* ← Edit here */}
</h1>

<p className="landing-hero__subtitle">
  Přes 100 dechových tréninků. AI průvodce. Komunita 1,150+ lidí.  {/* ← Edit here */}
</p>
```

---

### Change Pricing

Edit [`src/modules/public-web/components/landing/PricingSection.tsx`](components/landing/PricingSection.tsx):

```tsx
const PRICING_PLANS = [
  {
    title: 'ZDARMA',
    price: '0 Kč',  // ← Change price
    features: [
      '10 dechových tréninků',  // ← Edit features
    ],
  },
  // ...
];
```

**Note:** Pricing should eventually come from database via `useModules()` hook for consistency.

---

### Update Trust Signals

Stats are fetched via `usePublicStats()` hook.

**For MVP:** Edit static data in [`src/platform/api/usePublicStats.ts`](../../platform/api/usePublicStats.ts):

```typescript
return {
  total_users: 1150,          // ← Update count
  total_audio_tracks: 100,    // ← Update count
  community_members: 1150,
  certification_valid: true,
};
```

**For production:** Connect to Supabase Edge Function for real-time stats.

---

### Change Footer Links

Edit [`src/modules/public-web/components/landing/Footer.tsx`](components/landing/Footer.tsx):

```tsx
<ul className="landing-footer__links">
  <li><a href="#pricing">Ceník</a></li>  {/* ← Edit link */}
  <li><a href="/app">Funkce</a></li>
  <li><a href="/about">O nás</a></li>
</ul>
```

---

## Styling Changes

### Global Design Tokens

**All colors, spacing, typography are centralized** in:
- `src/styles/design-tokens/colors.css`
- `src/styles/design-tokens/typography.css`
- `src/styles/design-tokens/spacing.css`

**Example:** Change primary color:

```css
/* src/styles/design-tokens/colors.css */
--color-primary: #2CBEC6;  /* ← Change teal to any color */
```

**Result:** All teal elements update (checkmarks, links, focus rings, etc.)

---

### Landing-Specific Styles

Edit [`src/modules/public-web/styles/landing.css`](styles/landing.css):

```css
/* Change hero title size */
.landing-hero__title {
  font-size: 48px;  /* ← Edit size */
}

/* Change pricing grid gap */
.landing-pricing__grid {
  gap: var(--spacing-6);  /* ← Change to var(--spacing-8) */
}
```

**Important:** Always use design tokens (var(--spacing-X)), never hardcode values!

---

### Wave Animation

Edit [`src/modules/public-web/styles/animations.css`](styles/animations.css):

```css
/* Change wave opacity */
.hero-waves {
  opacity: 0.12;  /* ← 0.05 (more subtle) or 0.2 (stronger) */
}

/* Change animation speed */
.hero-waves__layer--1 {
  animation: wave-breathe-slow 19s ease-in-out infinite;  /* ← Change 19s */
}
```

---

## Adding Sections

### Add New Section (e.g., Features)

1. Create component:

```tsx
// src/modules/public-web/components/landing/FeaturesSection.tsx

export function FeaturesSection() {
  return (
    <section className="landing-features">
      <h2>Features</h2>
      {/* Content */}
    </section>
  );
}
```

2. Import in LandingPage:

```tsx
// src/modules/public-web/pages/LandingPage.tsx

import { FeaturesSection } from '../components/landing/FeaturesSection';

export function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <HeroSection />
      <FeaturesSection />  {/* ← Add here */}
      <PricingSection />
      <Footer />
    </div>
  );
}
```

3. Add styles to `landing.css`:

```css
.landing-features {
  padding: var(--spacing-20) var(--spacing-4);
}
```

---

## Screenshots & Assets

### Add Real App Screenshot

Replace placeholder in [`src/modules/public-web/components/landing/HeroSection.tsx`](components/landing/HeroSection.tsx):

```tsx
<div className="app-mockup__screen">
  {/* Replace this: */}
  <div className="screenshot-placeholder">...</div>
  
  {/* With: */}
  <img 
    src="/assets/screenshots/app-dashboard.png" 
    alt="DechBar App Dashboard"
    loading="lazy"
  />
</div>
```

**Recommended size:** 750x1624px (iPhone 14 Pro resolution)

---

## Testing

### Responsive Testing

```bash
# Test at different viewports
- 390px (Mobile): Header stacks, 1 column
- 768px (Tablet): 2 columns, adjusted spacing
- 1280px (Desktop): Full 2-column hero, 3-column pricing
```

### Functionality Testing

- [ ] Click "Přihlásit" → Login modal opens
- [ ] Click "Začít zdarma" → Register modal opens
- [ ] Click pricing CTA → Register modal opens
- [ ] Scroll down → Header glassmorphism activates
- [ ] ESC key → Modal closes
- [ ] Logo click → Navigate to home

### Accessibility

- [ ] Tab through all elements → Focus visible
- [ ] Screen reader → Proper labels
- [ ] Contrast → Meets WCAG AA
- [ ] Reduced motion → Animations stop

---

## Deployment

### Build for Production

```bash
npm run build
```

Landing page will be included in the main build (eager loaded).

### Vercel Deployment

```bash
git add .
git commit -m "feat: Add landing page module"
git push origin test  # Deploy to test environment first!
```

**Preview URL:** Auto-generated by Vercel  
**Production:** Merge to `main` after testing

---

## Troubleshooting

### AuthModal Not Opening

Check imports in `Header.tsx`:

```tsx
import { AuthModal } from '@/components/auth/AuthModal';  // ✓ Correct path
```

### Styles Not Applied

Verify globals.css imports landing styles:

```css
@import '../modules/public-web/styles/landing.css';
@import '../modules/public-web/styles/animations.css';
```

### Logo Not Showing

Check logo path in platform:

```tsx
import { Logo } from '@/platform';  // ✓ From platform, not shared
<Logo variant="off-white" />
```

### Waves Not Animating

Check if reduced-motion is enabled:

```bash
# macOS System Preferences
System Preferences → Accessibility → Display → Reduce motion (OFF)
```

Or check browser DevTools → Rendering → Emulate prefers-reduced-motion

---

## FAQ

**Q: Can I change the wave color?**  
A: Yes, edit `animations.css`:

```css
background: radial-gradient(
  ellipse at center,
  rgba(44, 190, 198, 0.4) 0%,  /* ← Change RGB values */
  ...
);
```

**Q: How do I add more pricing tiers?**  
A: Add to `PRICING_PLANS` array in `PricingSection.tsx`:

```tsx
const PRICING_PLANS = [
  // Existing plans...
  {
    title: 'NEW PLAN',
    price: '999 Kč',
    // ...
  },
];
```

**Q: Can I remove the screenshot mockup?**  
A: Yes, remove `.landing-hero__visual` div in `HeroSection.tsx` for text-only hero.

**Q: How do I change header height?**  
A: Edit `landing.css`:

```css
.landing-header {
  padding: var(--spacing-4) var(--spacing-6);  /* ← Change spacing */
}
```

---

## Support

**Questions?**
- Check: [PROJECT_GUIDE.md](../../PROJECT_GUIDE.md)
- Check: [Visual Brand Book](../../docs/brand/VISUAL_BRAND_BOOK.md)
- Check: [Module README](README.md)

---

**Last Updated:** 2026-01-12  
**Maintained by:** DechBar Team
