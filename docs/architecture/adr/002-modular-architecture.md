# ADR-002: Platform + Modules Architecture

## Status

Accepted

## Date

2026-01-09

## Context

DechBar App will offer multiple products (Studio, Challenges, Akademie, Game, AI Coach). We need an architecture that:

- Allows selling products individually
- Supports independent development of features
- Enables/disables features per user
- Scales as we add more products
- Minimizes code coupling
- Allows for future white-labeling

## Decision

Implement a **Platform + Modules** architecture where:

- **Platform** provides shared infrastructure (auth, membership, design system, payments)
- **Modules** are independent products that can be purchased separately
- Modules communicate ONLY through Platform API
- Each module can be enabled/disabled independently
- Module pricing and metadata stored in database (single source of truth)

## Consequences

### Positive

- **Independent pricing** - Each module sold separately (lifetime or subscription)
- **Flexible business model** - Can bundle, discount, or remove modules
- **Parallel development** - Team can work on different modules simultaneously
- **Performance** - Lazy loading means users only load modules they own
- **Maintainability** - Changes to one module don't affect others
- **Testing** - Modules can be tested in isolation
- **Exit strategy** - Can sell individual modules or entire platform

### Negative

- **Complexity** - More architectural overhead than monolith
- **Boilerplate** - Each module needs similar structure (manifest, routes, etc.)
- **Cross-module features** - Harder to implement features spanning multiple modules
- **Learning curve** - Developers must understand module boundaries

### Neutral

- **Module registry** - Need to maintain list of available modules
- **Platform API** - Must design stable API that modules depend on

## Alternatives Considered

### Alternative 1: Monolithic App

**Description:** Single unified app with feature flags.

**Pros:**
- Simpler architecture
- Easier to share code
- Faster initial development

**Cons:**
- User loads all code even if they don't own features
- Hard to price features individually
- Changes ripple across entire app
- Testing becomes harder as app grows

**Decision:** Rejected - Doesn't support business model of selling modules separately.

### Alternative 2: Micro-frontends

**Description:** Completely separate apps per module, integrated at runtime.

**Pros:**
- Maximum independence
- Different tech stacks possible
- True isolation

**Cons:**
- Much more complex
- Shared UI components difficult
- Performance overhead
- Overkill for our scale

**Decision:** Rejected - Too complex for current needs, can migrate later if needed.

### Alternative 3: Plugin Architecture

**Description:** Core app with plugins loaded dynamically.

**Pros:**
- Similar to our approach
- Third-party plugins possible

**Cons:**
- More complex plugin API needed
- Security concerns with third-party code
- Version compatibility issues

**Decision:** Rejected - We don't need third-party plugins (yet).

## Implementation Notes

### Platform Structure

```
src/platform/
├── auth/           - Authentication
├── membership/     - Module access control
├── components/     - Shared UI
├── layouts/        - App layouts
└── api/            - API layer
```

### Module Structure

```
src/modules/[module-id]/
├── MODULE_MANIFEST.json  - Module metadata
├── index.ts              - Public API
├── routes.tsx            - Routes
├── components/           - Module components
└── api/                  - Module data layer
```

### Module Loading

- Lazy loading using dynamic imports: `() => import('@/modules/studio')`
- Access control via `useModuleAccess(moduleId)` hook
- Pricing loaded from Supabase `modules` table

## Related Decisions

- [ADR-001: Supabase Backend](001-supabase-backend.md) - Supabase flexibility enables this architecture
- [ADR-003: Lazy Loading Modules](003-lazy-loading.md) - How modules are loaded

## References

- [Modular Architecture Patterns](https://martinfowler.com/articles/modularization.html)
- [Module System Documentation](../02_MODULES.md)
- [Platform API Documentation](../../api/PLATFORM_API.md)
