# Changelog

All notable changes to DechBar App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Documentation
- 🧹 **Major Documentation Cleanup (4.2.2026)**
  - Reduced ROOT .md files from 70 to 10 (86% reduction)
  - Deleted 60 version logs & historical summaries (preserved in git)
  - Created universal AI agent onboarding (docs/development/AI_AGENT_ONBOARDING.md)
  - Reorganized Ecomail docs: 4 core docs with verified data (docs/marketing/ecomail/)
  - Moved HMR guide to docs/development/HMR_GUIDE.md
  - Result: Cleaner structure, faster agent onboarding (40 min vs 3 hours)

### Added
- **Premium Pricing Cards UI with Stripe Checkout Integration**
  - Glassmorphism pricing cards with multi-layer shadows and gold accents
  - Billing toggle component (Monthly ↔ Annual) with animated gold slider
  - Dynamic pricing display based on billing interval
  - Savings badges for annual plans ("Ušetříš X Kč ročně")
  - Premium visual effects: hover animations, spring transitions, pulse effects
  - Responsive grid layout (1 col mobile → 3 cols desktop)
  - Mobile-optimized text labels ("Měsíčně" → "Měsíc" on narrow screens)
  - Gold glow effect on SMART "OBLÍBENÉ" card
  - Loading states during checkout initialization
  - Error handling with inline error messages
  - Accessibility: keyboard navigation, screen reader support, WCAG AA contrast
  - Reduced motion support for animations

- **Stripe Payment Integration - Subscription Checkout**
  - Edge Functions: `create-checkout-session` and `stripe-webhooks`
  - Platform Payments Layer: `useCheckout` hook, types, constants, utilities
  - Checkout Success page with "Co dál?" onboarding steps and confetti-ready design
  - Checkout Cancel page with empathetic messaging and FAQ section
  - Price formatting utilities (`formatPrice`, `formatPriceWithInterval`)
  - Savings calculation (`calculateSavings`, `formatSavingsBadge`)
  - Full webhook handling (subscription lifecycle: created, updated, deleted, payment succeeded/failed)
  - Test Mode ready with comprehensive testing guide
  - Support for monthly and annual billing intervals
  - Automatic membership updates via Stripe webhooks
  - Routes for `/checkout/success` and `/checkout/cancel` pages

- **Centralized CSS Design System**
  - New design tokens: `pricing.css` (pricing-specific variables)
  - Extended `effects.css` with pricing glassmorphism effects
  - Component CSS: `pricing-card.css` and `billing-toggle.css`
  - All values reference centralized design tokens (no hardcoded values)
  - BEM-like naming convention for maintainability

- **Deployment & Environment Setup**
  - `.env.local.example` template for environment variables
  - `deploy-edge-functions.sh` script for automated Edge Function deployment
  - `setup-stripe-env.sh` script for Stripe environment setup in Supabase
  - Comprehensive testing checklist in `STRIPE_TESTING_GUIDE.md`

### Changed
- **PricingSection Component**: Refactored to use BillingToggle and Stripe checkout
  - Removed auth modal for paid tiers (replaced with Stripe checkout)
  - Added dynamic Price ID selection based on billing interval
  - Integrated real Stripe Price IDs from database
  - Monthly: SMART 249 Kč, AI COACH 490 Kč
  - Annual: SMART 1,500 Kč (125 Kč/měsíc), AI COACH 2,940 Kč (245 Kč/měsíc)

- **PricingCard Component**: Enhanced with Stripe integration
  - Added `priceId`, `moduleId`, and `billingInterval` props
  - Integrated `useCheckout` hook for payment initiation
  - Loading states and error handling
  - Separate handling for free tier (auth modal) vs paid tiers (Stripe)

- **App.tsx**: Added checkout routes
  - `/checkout/success` for successful payments
  - `/checkout/cancel` for cancelled checkouts

- **globals.css**: Added imports for new pricing design tokens and component CSS

- Platform index.ts: Added payments exports to Platform API
- Supabase database: Price IDs synced for SMART and AI_COACH memberships

### Documentation
- **Updated `STRIPE_TESTING_GUIDE.md`** with:
  - Pricing Cards UI testing checklist (6 sections, 40+ test cases)
  - Stripe checkout flow testing scenarios (6 scenarios)
  - Success/Cancel pages verification checklist
  - Responsive breakpoints testing guide
  - Accessibility testing requirements
  - Database verification queries

- **Added deployment scripts**:
  - `scripts/deploy-edge-functions.sh` with automated deployment
  - `scripts/setup-stripe-env.sh` for environment setup

- Environment setup instructions for `.env.local`
- Webhook configuration guide (local + production)
- Test scenarios for all subscription flows

### Fixed
- N/A (new feature implementation)

### Deprecated
- N/A

### Removed
- Auth modal trigger from paid tier pricing cards (replaced with Stripe checkout)

### Security
- All Stripe API keys stored in environment variables (never hardcoded)
- Webhook signature verification in Edge Functions
- PCI DSS compliant payment processing via Stripe
- No payment data stored in application database

## [0.3.0] - 2026-01-19

### Added
- **DechBar Studio MVP1 - Multi-Phase Breathing Exercise System**
  - 6 preset protocols: BOX Breathing, Calm, Coherence, RÁNO (7-phase), RESET (7-phase), NOC (5-phase)
  - Multi-phase protocol support (phases with different breathing patterns)
  - Tier-based custom exercise creation (3 for ZDARMA, unlimited for SMART)
  - Exercise history tracking (7 days for ZDARMA, 90 days for SMART, unlimited for AI_COACH)
  - Safety questionnaire (first-time users)
  - Safety disclaimers with DechBar Tone of Voice
  - Soft delete for exercises (preserve session history)
- **Session Engine Modal**
  - JS+RAF breathing circle animation (cubic-bezier easing)
  - Real-time phase countdown timer
  - Phase indicator (3/7)
  - Bell audio cues on phase transitions
  - NO PAUSE (uninterrupted flow for focus)
  - Completion celebration with mood check
  - Session history tracking
- **CvicitPage - Exercise Library**
  - Tabbed interface (Presets / Custom / History)
  - Tier-aware exercise display
  - Upgrade prompts for FREE users
  - Exercise card with metadata (duration, phases, difficulty, tags)
  - Edit/Delete actions for custom exercises
- **Database Tables**
  - `exercises` table (hybrid PostgreSQL + JSONB for breathing patterns)
  - `exercise_sessions` table (history with mood tracking)
  - `profiles.safety_flags` JSONB column (safety questionnaire responses)
  - RLS policies for user data protection
  - Admin bypass policies (CEO/admin roles can manage all exercises)
  - 7 GIN and B-tree indexes for performance
- **TypeScript Types**
  - Complete type system for exercises, phases, sessions, safety flags
  - API payload types for mutations
  - UI component prop types
- **API Hooks**
  - `useExercises()` - Fetch all available exercises
  - `useExercise(id)` - Fetch single exercise
  - `useCustomExerciseCount()` - Tier limit tracking
  - `useCreateExercise()` - Create with tier enforcement
  - `useUpdateExercise()` - Update with ownership check
  - `useDeleteExercise()` - Soft delete
  - `useExerciseSessions()` - History with tier filtering
  - `useCompleteSession()` - Save session with mood
  - `useSafetyFlags()` - Get user safety flags
  - `useUpdateSafetyFlags()` - Save questionnaire
- **NavIcon Extensions**
  - Added 11 new icons: clock, edit, trash, x, wind, layers, bar-chart, target, zap, circle, check
  - Total 29 icons in system

### Changed
- **CvicitPage** - Replaced EmptyState placeholder with full exercise library
- **MODULE_MANIFEST.json** - Updated api.tables and features for exercise system
- **Platform Components** - Exported LoadingSkeleton for module use

### Migration Required
- Run `supabase db push` to apply exercises system migration
- New tables: exercises, exercise_sessions
- Profile column: safety_flags (JSONB)

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
