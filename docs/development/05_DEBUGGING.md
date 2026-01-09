# Debugging Guide

## Development Tools

### Browser DevTools

**Chrome DevTools (F12):**
- Console: Errors and logs
- Network: API calls
- Application: LocalStorage, cookies
- Performance: Profiling

### React Developer Tools

Install: Chrome extension "React Developer Tools"
- Component tree
- Props inspection
- State debugging

### Supabase Logs

Dashboard → Logs:
- Database queries
- Auth events
- Storage operations
- Edge function logs

## Common Issues

### Supabase Connection Errors

**Problem:** "Invalid API key" or connection refused

**Solution:**
```bash
# Check .env.local
cat .env.local

# Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# Get from: https://supabase.com/dashboard/project/.../settings/api
```

### RLS Policy Errors

**Problem:** "Row level security policy violated"

**Solution:**
```sql
-- Check policies in Supabase Dashboard
-- Table Editor → Select table → Policies tab
-- Verify user has correct policy
```

### Module Not Loading

**Problem:** Module stuck on loading state

**Solution:**
1. Check browser console for errors
2. Verify module exists in `src/modules/`
3. Check module is registered in moduleRegistry
4. Verify user has access (check `user_modules` table)

## Debugging Techniques

### Console Logging

```typescript
console.log('User:', user);
console.error('Error:', error);
console.table(modules); // Pretty print arrays/objects
```

### React Query Devtools

```bash
npm install @tanstack/react-query-devtools
```

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Network Debugging

```typescript
// Log all Supabase requests
const supabase = createClient(url, key, {
  auth: {
    debug: true,
  },
});
```

## Performance Debugging

### Slow Queries

```sql
-- In Supabase SQL Editor
-- Show slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;
```

### React Performance

```tsx
import { Profiler } from 'react';

<Profiler id="ExerciseBuilder" onRender={logRenderTime}>
  <ExerciseBuilder />
</Profiler>
```

## Error Tracking

For production, consider:
- Sentry (error tracking)
- LogRocket (session replay)
- PostHog (product analytics)
