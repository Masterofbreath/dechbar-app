# Changelog

All notable changes to DechBar App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Studio module implementation
- Authentication flow
- Payment integration

### Added
- **WORKFLOW.md** - Complete Git workflow documentation (LOCAL → PREVIEW → PROD)
- Git security rules in `.cursorrules` (AI agents must ask before pushing)
- Updated `PROJECT_GUIDE.md` with workflow references

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
