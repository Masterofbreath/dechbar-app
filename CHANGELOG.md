# Changelog

All notable changes to DechBar App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-01-14

### Changed (BREAKING)
- **Membership Plans Rebrand:**
  - `DECHBAR_HRA` → `SMART` (Inteligentní doporučení)
  - `AI_KOUC` → `AI_COACH` (Tvůj osobní AI trenér)
  - Database migration required
  - Better value proposition and Czech market fit

### Added
- Pricing cards now show annual pricing prominently
- Subtitle field for pricing tiers
- Enhanced savings display (no emoji, clear CZK amount)

### Migration Required
- Run `supabase db push` to apply membership plan updates
- Existing users automatically migrated to new plan names

## [0.2.0] - 2026-01-12

### Added
- **Landing Page Module** - Complete public-facing landing page
  - Premium dark-first design per Visual Brand Book 2.0
  - Hero section with animated teal waves background
  - Trust signals (1,150+ members, 100+ tracks, certification)
  - Pricing section with 3 tiers (ZDARMA, DechBar HRA, AI Průvodce)
  - Annual discount badges (50% savings)
  - Responsive 4-column footer
  - Sticky header with glassmorphism effect on scroll
- **Platform API Extension**
  - `usePublicStats()` hook for dynamic landing page stats
  - API resilience with fallback data
- **Routing Updates**
  - `/` → Landing page (public)
  - `/app` → Dashboard (auth required, Bluetooth-safe)
  - Smart redirect: logged-in users auto-redirect to /app
  - Legacy `/dashboard` → `/app` redirect
- **Module Architecture**
  - `public-web` module with proper manifest
  - Error boundary isolation (landing crash ≠ app crash)
  - Centralized design token usage
- **Animations**
  - CSS radial gradient waves (3 layers, 19s/14s/10s breathing cycles)
  - Hero fade-in with staggered delays
  - Pricing card hover lift effects
  - Scroll indicator bounce animation
  - Accessibility: prefers-reduced-motion support

### Changed
- **App.tsx** - Updated routing structure for landing page
- **Platform exports** - Added `usePublicStats` to public API
- **Globals CSS** - Import landing and animation styles

### Technical Details
- No linter errors
- No console errors
- WCAG AA compliant (all contrast ratios verified)
- Mobile-first responsive (390px, 768px, 1280px tested)
- Bluetooth-safe architecture (/app/* routes use client-side navigation only)

### Design Compliance
- ✓ Visual Brand Book 2.0 (dark-first, teal+gold, Inter font)
- ✓ 4 Temperaments design principles
- ✓ Logo without slogan (premium, clean)
- ✓ Centralized design tokens (single source of truth)

### Planned
- Studio module implementation
- Authentication flow
- Payment integration

### Added
- **🤖 Agent Qualification System** - Comprehensive onboarding for AI agents
  - Decision tree in `PROJECT_GUIDE.md` (50+ keywords)
  - 8 Study Guides for different component types
  - Automatic agent navigation based on task type
  - Template responses for structured feedback
  - "Refresh Mode" for experienced agents
- **WORKFLOW.md** - Complete Git workflow documentation (LOCAL → PREVIEW → PROD)
- Git security rules in `.cursorrules` (AI agents must ask before pushing)
- Updated `PROJECT_GUIDE.md` with workflow references and agent onboarding
- `docs/development/agent-tests/` structure:
  - `README.md` - Agent qualification overview
  - `components/UI_COMPONENTS.md` - Buttons, inputs, forms
  - `components/LAYOUT_COMPONENTS.md` - Cards, modals, layouts
  - `components/DATA_DISPLAY.md` - Tables, lists, charts
  - `components/MEDIA_COMPONENTS.md` - Audio/video players
  - `components/ANIMATIONS.md` - Transitions, effects
  - `components/NAVIGATION.md` - Menus, tabs, pagination
  - `components/FEEDBACK.md` - Toasts, alerts, notifications
  - `components/TYPOGRAPHY.md` - Text, headings, paragraphs

## [0.1.0] - 2026-01-09

### Added
- Initial project setup (React + TypeScript + Vite)
- Supabase integration
- Enterprise-ready folder structure
- Complete documentation system
  - Architecture docs (ADRs, overview, security)
  - Design system docs (standalone)
  - Development guides
  - Product documentation (VISION, ROADMAP, METRICS)
  - API documentation
- Config management (`src/config/`)
  - Environment variables (typed)
  - App constants
- Platform layer (`src/platform/`)
  - Authentication (`useAuth`)
  - Membership (`useMembership`, `useModuleAccess`)
  - Module system (`useModules`, `useModule`)
  - Public API exports
- Module system
  - Module manifest format (`MODULE_MANIFEST.json`)
  - Lazy loading support
  - Module registry
  - Studio module template
- Design tokens (standalone)
  - Colors, typography, spacing, breakpoints, shadows, effects
  - Organized in `src/styles/design-tokens/`
- Database schema (6 tables)
  - `profiles`, `modules`, `user_modules`, `memberships`, `roles`, `user_roles`
- Supabase CLI integration
- Tracking systems (CHANGELOG, BUGS, ADRs)

### Changed
- Version bumped to 0.1.0 (from 0.0.0)
- Removed FOUNDATION dependency (now standalone)
- Reorganized documentation structure
- Moved to mobile-first responsive design

### Architecture Decisions
- [ADR-001](docs/architecture/adr/001-supabase-backend.md) - Supabase as backend
- [ADR-002](docs/architecture/adr/002-modular-architecture.md) - Platform + Modules pattern
- [ADR-003](docs/architecture/adr/003-lazy-loading.md) - Lazy loading modules

---

## Version History

- **0.1.0** (2026-01-09) - Enterprise refactoring, foundation setup
- **0.0.0** (Initial) - Vite project creation
