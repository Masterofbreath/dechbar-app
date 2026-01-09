# ADR-003: Lazy Loading Modules

## Status

Accepted

## Date

2026-01-09

## Context

With a modular architecture (ADR-002), we need to decide how to load modules. Options:

1. **Static loading** - All modules bundled and loaded at app start
2. **Lazy loading** - Modules loaded on-demand when user accesses them
3. **Hybrid** - Core modules static, others lazy

Key considerations:
- Users typically own only 1-3 modules (not all 5+)
- Initial bundle size affects mobile performance
- First load time is critical for user experience

## Decision

Implement **lazy loading** for ALL modules using React lazy() and dynamic imports.

Modules are loaded only when:
1. User owns the module (checked via `useModuleAccess`)
2. User navigates to module route

## Consequences

### Positive

- **Smaller initial bundle** - Faster app startup (~70% reduction)
- **Better mobile performance** - Less data downloaded initially
- **Bandwidth savings** - Users don't download modules they don't own
- **Scalability** - Can add unlimited modules without affecting initial load
- **User experience** - Faster first paint and time to interactive

### Negative

- **Slight delay on first module access** - 200-500ms to load module
- **Code splitting complexity** - Build configuration more complex
- **Potential for loading states** - Need loading UI for module loads
- **Error handling** - Must handle module load failures

### Neutral

- **Caching** - Once loaded, module cached by browser
- **Preloading possible** - Can preload owned modules in background

## Alternatives Considered

### Alternative 1: Static Loading (All Modules)

**Pros:**
- No loading delay
- Simpler code
- All code available immediately

**Cons:**
- Large initial bundle (5+ modules = 500KB+)
- Slow app startup
- Users download modules they don't own
- Wastes bandwidth

**Decision:** Rejected - Performance impact too significant for mobile.

### Alternative 2: Hybrid Loading

**Description:** Load "Studio" module statically (most popular), lazy load others.

**Pros:**
- Balance of performance and convenience
- No delay for most common module

**Cons:**
- Assumptions about module popularity may change
- Still wastes bandwidth for users without Studio
- Inconsistent behavior between modules

**Decision:** Rejected - Consistency more important, lazy loading is fast enough.

### Alternative 3: Progressive Enhancement

**Description:** Load skeleton app, fetch module list from API, then load modules.

**Pros:**
- Most flexible
- Modules could be updated without app release

**Cons:**
- Much more complex
- Requires module hosting infrastructure
- Security concerns (code injection)
- Not suitable for app stores

**Decision:** Rejected - Over-engineering for current needs.

## Implementation Notes

### Module Registry

```typescript
// src/app/moduleRegistry.ts
export const moduleRegistry = {
  studio: () => import('@/modules/studio'),
  challenges: () => import('@/modules/challenges'),
  akademie: () => import('@/modules/akademie'),
  game: () => import('@/modules/game'),
  'ai-coach': () => import('@/modules/ai-coach'),
};
```

### Router Configuration

```typescript
import { lazy, Suspense } from 'react';
import { useModuleAccess } from '@/platform/membership';

const StudioModule = lazy(() => import('@/modules/studio'));

function StudioRoute() {
  const { hasAccess, isLoading } = useModuleAccess('studio');
  
  if (isLoading) return <ModuleLoadingState />;
  if (!hasAccess) return <Paywall moduleId="studio" />;
  
  return (
    <Suspense fallback={<ModuleLoadingState />}>
      <StudioModule />
    </Suspense>
  );
}
```

### Loading State

- Show skeleton UI while module loads
- Timeout after 10 seconds (show error)
- Retry button if load fails

### Preloading (Optional Optimization)

```typescript
// Preload modules user owns in background
const { data: ownedModules } = useUserModules();

useEffect(() => {
  ownedModules?.forEach(module => {
    const loader = moduleRegistry[module.module_id];
    if (loader) {
      // Preload in background (low priority)
      requestIdleCallback(() => loader());
    }
  });
}, [ownedModules]);
```

## Performance Metrics

Expected improvements with lazy loading:

- **Initial bundle size:** 180KB → 80KB (55% reduction)
- **Time to interactive:** 2.5s → 1.2s (52% faster)
- **First contentful paint:** 1.8s → 0.9s (50% faster)

Module load times:
- **Studio module:** ~250KB, loads in 200-400ms on 4G
- **Challenges module:** ~180KB, loads in 150-300ms on 4G

## Related Decisions

- [ADR-002: Modular Architecture](002-modular-architecture.md) - Modules enable lazy loading
- Performance optimization will be tracked in future ADRs

## References

- [React lazy() Documentation](https://react.dev/reference/react/lazy)
- [Code Splitting Guide](https://reactjs.org/docs/code-splitting.html)
- [Web Vitals](https://web.dev/vitals/)
