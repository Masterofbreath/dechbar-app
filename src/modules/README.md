# Module System

## What is a Module?

A module is an **independent product** that users can purchase separately.

Examples:
- **Studio** - Exercise builder (990 Kč lifetime)
- **Challenges** - 21-day programs (490 Kč/pack lifetime)
- **AI Coach** - Personal AI coach (490 Kč/month)

## Key Principles

1. **Independent** - Can work without other modules
2. **Lazy loaded** - Only loaded when user accesses it
3. **Access controlled** - Requires ownership to access
4. **Self-contained** - All code in module folder

## Module Structure (MANDATORY)

Every module MUST follow this structure:

```
src/modules/[module-id]/
├── MODULE_MANIFEST.json   ← Module definition (REQUIRED)
├── README.md               ← Module documentation
├── CHANGELOG.md            ← Module-specific changes
├── index.ts                ← Public API exports
├── routes.tsx              ← Route definitions
├── components/             ← Module-specific components
├── hooks/                  ← Module-specific hooks
├── api/                    ← Supabase queries for this module
└── types.ts                ← Module types
```

## MODULE_MANIFEST.json Format

Every module MUST have this file:

```json
{
  "id": "studio",
  "name": "DechBar STUDIO",
  "version": "1.0.0",
  "description": "Build custom breathing exercises",
  "pricing": {
    "source": "database",
    "table": "modules",
    "id": "studio"
  },
  "dependencies": {
    "platform": ["auth", "membership"],
    "modules": []
  },
  "api": {
    "routes": ["/studio/*"],
    "tables": ["exercises", "exercise_sessions"]
  },
  "permissions": ["create_exercise", "edit_exercise", "delete_exercise"]
}
```

## Creating a New Module

### Step 1: Create folder structure

```bash
mkdir -p src/modules/my-module/{components,hooks,api}
```

### Step 2: Create MODULE_MANIFEST.json

Copy template from existing module and update values.

### Step 3: Create index.ts (Public API)

```typescript
// src/modules/my-module/index.ts

// Export components
export { MyComponent } from './components/MyComponent';

// Export hooks
export { useMyFeature } from './hooks/useMyFeature';

// Export types
export type { MyType } from './types';

// Export routes
export { routes } from './routes';
```

### Step 4: Create routes.tsx

```typescript
// src/modules/my-module/routes.tsx
import { MyModuleHome } from './components/MyModuleHome';

export const routes = [
  {
    path: '/my-module',
    element: <MyModuleHome />,
  },
];
```

### Step 5: Implement features

Build your module features in `components/`, `hooks/`, etc.

### Step 6: Add to module registry

```typescript
// src/app/moduleRegistry.ts
export const moduleRegistry = {
  studio: () => import('@/modules/studio'),
  'my-module': () => import('@/modules/my-module'), // Add this
};
```

### Step 7: Add to database

```sql
-- In Supabase SQL Editor
INSERT INTO public.modules (id, name, description, price_czk, price_type, sort_order)
VALUES ('my-module', 'My Module Name', 'Description', 990, 'lifetime', 10);
```

### Step 8: Update CHANGELOG.md

Log the new module in global `CHANGELOG.md` and module's own `CHANGELOG.md`.

## Module Access Control

Always check access in your module's entry point:

```typescript
// src/modules/my-module/index.tsx
import { useModuleAccess } from '@/platform/membership';
import { useAuth } from '@/platform/auth';

export function MyModule() {
  const { user } = useAuth();
  const { hasAccess, isLoading } = useModuleAccess('my-module', user?.id);

  if (isLoading) return <LoadingState />;
  if (!hasAccess) return <Paywall moduleId="my-module" />;

  return <MyModuleContent />;
}
```

## Module Communication

### ✅ CORRECT: Through Platform API

```typescript
import { useAuth, useMembership } from '@/platform';
```

### ❌ WRONG: Direct Import from Another Module

```typescript
// DON'T DO THIS!
import { SomeComponent } from '@/modules/other-module';
```

### Future: Event Bus

For cross-module communication, we'll implement event bus:

```typescript
// Emit event
emit('exercise_completed', { exerciseId, duration });

// Listen in another module
on('exercise_completed', (data) => {
  // Handle event
});
```

## Module Lazy Loading

Modules load on-demand for performance:

```typescript
// User doesn't own module = not loaded
// User owns module → clicks link → module loads (200-400ms)
// Module cached after first load
```

Benefits:
- Smaller initial app bundle (faster startup)
- Users don't download modules they don't own
- Better mobile performance

## Testing Modules

Test modules in isolation:

```bash
# Start dev server
npm run dev

# Navigate to module route
# Example: http://localhost:5173/studio
```

## See Also

- [Module API Documentation](../docs/api/MODULE_API.md)
- [Platform API Documentation](../docs/api/PLATFORM_API.md)
- [Architecture: Modules](../docs/architecture/02_MODULES.md)
- [ADR-002: Modular Architecture](../docs/architecture/adr/002-modular-architecture.md)
- [ADR-003: Lazy Loading](../docs/architecture/adr/003-lazy-loading.md)
