# Platform Layer Changelog

## [0.1.0] - 2026-01-09

### Added
- Authentication module (`useAuth` hook)
- Membership module (`useMembership`, `useModuleAccess` hooks)
- Module registry (`useModules`, `useModule`, `useUserModules` hooks)
- Platform public API exports (`src/platform/index.ts`)
- Single Source of Truth for module pricing (loaded from database)

### Structure
- Created organized platform folder structure
- Separated concerns: auth, membership, modules, components, layouts
- Public API pattern (modules use platform exports only)
