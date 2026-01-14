# Module System

Modules are independent products that users can purchase separately.

## Module Concept

Each module:
- Is a standalone product with its own pricing
- Can be enabled/disabled independently
- Loaded lazily for performance
- Communicates only through Platform API

## Available Modules

| Module | Type | ID | Database Table |
|--------|------|----|----|
| SMART (Membership) | Subscription | `membership-smart` | modules |
| AI COACH (Membership) | Subscription | `membership-ai-coach` | modules |
| DechBar STUDIO | Lifetime | `studio` | modules |
| Výzvy (Challenges) | Lifetime | `challenges` | modules |
| Akademie | Lifetime | `akademie` | modules |

## Module Structure

Every module MUST follow this structure:

```
src/modules/[module-id]/
├── MODULE_MANIFEST.json   ← Module definition
├── README.md               ← Module documentation
├── CHANGELOG.md            ← Module-specific changes
├── index.ts                ← Public API exports
├── routes.tsx              ← Route definitions
├── components/             ← Module components
├── hooks/                  ← Module-specific hooks
├── api/                    ← Supabase queries
└── types.ts                ← Module types
```

## MODULE_MANIFEST.json

Every module requires a manifest file:

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

## Module Loading (Lazy)

Modules are loaded on-demand:

```typescript
// Module registry
const moduleRegistry = {
  studio: () => import('@/modules/studio'),
  challenges: () => import('@/modules/challenges'),
  akademie: () => import('@/modules/akademie'),
  game: () => import('@/modules/game'),
  'ai-coach': () => import('@/modules/ai-coach'),
};

// Load module when user accesses it
const loadModule = async (moduleId: string) => {
  const loader = moduleRegistry[moduleId];
  if (!loader) throw new Error(`Module ${moduleId} not found`);
  return await loader();
};
```

## Module Access Control

Access is controlled by membership and module ownership:

```typescript
import { useModuleAccess } from '@/platform/membership';

function StudioPage() {
  const { hasAccess, isLoading } = useModuleAccess('studio');
  
  if (isLoading) return <Loading />;
  if (!hasAccess) return <Paywall moduleId="studio" />;
  
  return <StudioContent />;
}
```

## Module Communication

Modules should NOT communicate directly:

```typescript
// ❌ WRONG - Direct module import
import { ChallengeList } from '@/modules/challenges';

// ✅ CORRECT - Through platform API or shared event bus
import { usePlatformEvent } from '@/platform/events';
```

## Creating a New Module

1. Copy template structure
2. Create `MODULE_MANIFEST.json`
3. Implement features
4. Export public API in `index.ts`
5. Register in module registry
6. Add to database `modules` table
7. Update `CHANGELOG.md`
8. Create ADR if architectural decision made

## See Also

- [Module API Documentation](../api/MODULE_API.md)
- [Platform Layer](01_PLATFORM.md)
- [Creating Your First Module](../development/MODULE_CREATION.md)
