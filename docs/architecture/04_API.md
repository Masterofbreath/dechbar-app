# API Design

## API Architecture

DechBar App uses multiple API layers:

1. **Supabase Auto-generated APIs** (REST + GraphQL)
2. **Platform API** (TypeScript hooks and functions)
3. **Module API** (Module-specific exports)

## 1. Supabase API

### REST API

Auto-generated from database schema:

```typescript
// Get all modules
const { data } = await supabase
  .from('modules')
  .select('*')
  .eq('is_active', true);

// Get user's purchased modules
const { data } = await supabase
  .from('user_modules')
  .select('*, modules(*)')
  .eq('user_id', userId);
```

### GraphQL API

Available at: `https://[project-ref].supabase.co/graphql/v1`

### Realtime Subscriptions

```typescript
const channel = supabase
  .channel('modules-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'modules' },
    (payload) => console.log(payload)
  )
  .subscribe();
```

## 2. Platform API

### Authentication

```typescript
import { useAuth } from '@/platform/auth';

const { user, signIn, signOut, isLoading } = useAuth();
```

### Membership

```typescript
import { useMembership, useModuleAccess } from '@/platform/membership';

const { plan, isPremium } = useMembership();
const { hasAccess } = useModuleAccess('studio');
```

### Module Registry

```typescript
import { useModules, useModule } from '@/platform/modules';

const { data: modules } = useModules();
const { data: studio } = useModule('studio');
```

## 3. Module API

Each module exports its public API:

```typescript
// modules/studio/index.ts
export { ExerciseBuilder } from './components/ExerciseBuilder';
export { useExercises } from './hooks/useExercises';
export type { Exercise, ExerciseSession } from './types';
```

## API Patterns

### Data Fetching

Using React Query for caching and state management:

```typescript
import { useQuery } from '@tanstack/react-query';

export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Mutations

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (exercise) => {
      const { data, error } = await supabase
        .from('exercises')
        .insert(exercise)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}
```

### Error Handling

```typescript
try {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise);
    
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Error creating exercise:', error);
  throw error;
}
```

## API Conventions

### Naming

- **Hooks:** `use[Entity]` (e.g., `useAuth`, `useModules`)
- **Query hooks:** `use[Entity]s` (list) or `use[Entity]` (single)
- **Mutation hooks:** `useCreate[Entity]`, `useUpdate[Entity]`, `useDelete[Entity]`

### Return Types

```typescript
// Query hook
interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
}

// Mutation hook
interface MutationResult<T> {
  mutate: (data: T) => void;
  isLoading: boolean;
  error: Error | null;
}
```

## Rate Limiting

Supabase has built-in rate limiting. For additional control:

```typescript
import { useQuery } from '@tanstack/react-query';

// Limit refetch frequency
useQuery({
  queryKey: ['modules'],
  queryFn: fetchModules,
  refetchInterval: 60000, // Refetch max once per minute
  staleTime: 300000, // Consider data fresh for 5 minutes
});
```

## See Also

- [Platform API Documentation](../api/PLATFORM_API.md)
- [Module API Documentation](../api/MODULE_API.md)
- [Database Schema](03_DATABASE.md)
