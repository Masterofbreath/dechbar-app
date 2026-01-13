# Public Web Module

**Version:** 1.0.0  
**Type:** Public (no auth required)  
**Routes:** `/`, `/blog/*`

## Overview

Public-facing landing page and marketing website for DechBar App.

## Features

- Premium dark-first landing page
- Hero section with animated teal waves
- Pricing section (3 plans)
- Responsive design (mobile-first)
- AuthModal integration for login/register
- Error boundary isolation

## Architecture

This module is part of the DechBar App modular architecture:
- Uses Platform API (Logo, Button, Card components)
- Uses centralized design tokens (colors, typography, spacing)
- Isolated with ErrorBoundary (crash doesn't affect /app)
- Client-side routing only (Bluetooth-safe)

## Routes

- `/` - Landing page with hero, pricing, footer
- `/blog` - Blog list (future)
- `/blog/:slug` - Blog post detail (future)

## Dependencies

**Platform:**
- `@/platform/components` - Logo, Button, Card, Input
- `@/platform/api` - usePublicStats
- `@/components/auth` - AuthModal (reused)

**External:**
- None (static data for MVP)

## Development

```bash
# Start dev server
npm run dev

# Navigate to landing page
open http://localhost:5173/
```

## File Structure

```
src/modules/public-web/
├── MODULE_MANIFEST.json
├── README.md
├── CHANGELOG.md
├── index.ts
├── pages/
│   └── LandingPage.tsx
├── components/
│   └── landing/
│       ├── Header.tsx
│       ├── HeroSection.tsx
│       ├── AnimatedWaves.tsx
│       ├── TrustSignals.tsx
│       ├── PricingSection.tsx
│       ├── PricingCard.tsx
│       └── Footer.tsx
└── styles/
    ├── landing.css
    └── animations.css
```

## See Also

- [Platform API Documentation](../../platform/README.md)
- [Visual Brand Book](../../docs/brand/VISUAL_BRAND_BOOK.md)
- [Module System](../README.md)

---

**Last Updated:** 2026-01-12
