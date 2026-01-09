# Module API

How modules expose their functionality and integrate with the platform.

## Module Structure

Every module must export a public API through `index.ts`:

```typescript
// src/modules/studio/index.ts

// Export components
export { ExerciseBuilder } from './components/ExerciseBuilder';
export { ExerciseList } from './components/ExerciseList';

// Export hooks
export { useExercises } from './hooks/useExercises';
export { useExercisePlayer } from './hooks/useExercisePlayer';

// Export types
export type { Exercise, ExerciseSession } from './types';

// Export routes
export { studioRoutes } from './routes';
```

## MODULE_MANIFEST.json

Every module MUST have a manifest:

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

## Lazy Loading

Modules are loaded on-demand:

```typescript
// src/app/moduleRegistry.ts
export const moduleRegistry = {
  studio: () => import('@/modules/studio'),
  challenges: () => import('@/modules/challenges'),
  // ...
};

// Router loads module when accessed
const StudioModule = lazy(() => import('@/modules/studio'));
```

## Module Routes

Modules define their own routes:

```typescript
// src/modules/studio/routes.tsx
export const studioRoutes = [
  {
    path: '/studio',
    element: <StudioHome />,
  },
  {
    path: '/studio/exercises',
    element: <ExerciseList />,
  },
  {
    path: '/studio/exercises/:id',
    element: <ExerciseDetail />,
  },
];
```

## Module Access Control

Modules should use platform hooks for access control:

```typescript
// src/modules/studio/index.tsx
import { useModuleAccess } from '@/platform/membership';

export function StudioModule() {
  const { hasAccess, isLoading } = useModuleAccess('studio');
  
  if (isLoading) return <LoadingState />;
  if (!hasAccess) return <Paywall moduleId="studio" />;
  
  return <StudioContent />;
}
```

## Module Data Layer

Modules manage their own Supabase queries:

```typescript
// src/modules/studio/api/exercises.ts
import { supabase } from '@/platform/api';

export async function fetchExercises(userId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
}
```

## Module State

Modules can have their own Zustand stores:

```typescript
// src/modules/studio/store.ts
import { create } from 'zustand';

interface StudioState {
  selectedExercise: Exercise | null;
  setSelectedExercise: (exercise: Exercise | null) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  selectedExercise: null,
  setSelectedExercise: (exercise) => set({ selectedExercise: exercise }),
}));
```

## Inter-Module Communication

Modules should NOT import from each other directly.

### ✅ CORRECT: Via Platform Events

```typescript
// Module emits event
import { usePlatformEvent } from '@/platform/events';

const { emit } = usePlatformEvent();
emit('exercise_completed', { exerciseId, duration });

// Other module listens
const { on } = usePlatformEvent();
on('exercise_completed', (data) => {
  // Update achievements, stats, etc.
});
```

### ❌ WRONG: Direct Import

```typescript
// Don't do this!
import { ExerciseList } from '@/modules/studio';
```

## Module Lifecycle

```typescript
// src/modules/studio/index.tsx

export function StudioModule() {
  // Initialize module
  useEffect(() => {
    console.log('Studio module loaded');
    
    return () => {
      console.log('Studio module unloaded');
    };
  }, []);
  
  return <StudioContent />;
}
```

## Creating a New Module

See [../development/MODULE_CREATION.md](../development/MODULE_CREATION.md) for step-by-step guide.

Quick steps:
1. Copy module template
2. Create `MODULE_MANIFEST.json`
3. Implement features
4. Export public API in `index.ts`
5. Register in `moduleRegistry`
6. Add to database `modules` table

## See Also

- [Platform API](PLATFORM_API.md)
- [Module System](../architecture/02_MODULES.md)
- [Lazy Loading Decision](../architecture/adr/003-lazy-loading.md)
