# Security Model

## Security Layers

DechBar App implements security at multiple levels:

1. **Authentication** - Who you are
2. **Authorization** - What you can do
3. **Row Level Security (RLS)** - What data you can access
4. **Input Validation** - What data is acceptable
5. **Environment Security** - API key protection

## 1. Authentication

### Supabase Auth

```typescript
// Email/Password
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});

// OAuth (Google, Apple)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

### Session Management

- Sessions stored in localStorage
- Automatic refresh on expiry
- Secure httpOnly cookies option

### Protected Routes

```typescript
import { useAuth } from '@/platform/auth';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}
```

## 2. Authorization

### Role-Based Access Control (RBAC)

Roles defined in database:

```sql
-- roles table
member      - Basic user (level 1)
vip_member  - VIP user (level 2)
student     - Student (level 1)
teacher     - Teacher (level 3)
admin       - Admin (level 4)
ceo         - CEO (level 5)
```

### Module Access Control

```typescript
import { useModuleAccess } from '@/platform/membership';

function StudioPage() {
  const { hasAccess, isLoading } = useModuleAccess('studio');
  
  if (!hasAccess) return <Paywall moduleId="studio" />;
  return <StudioContent />;
}
```

### Permission Checks

```typescript
// Check if user has specific role
const hasRole = await user_has_role(userId, 'admin');

// Check if user has any of roles
const isStaff = await user_has_any_role(userId, ['teacher', 'admin', 'ceo']);

// Check if user is admin
const isAdmin = await user_is_admin(userId);
```

## 3. Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Users can only see their own exercises
CREATE POLICY "Users can view own exercises"
  ON exercises FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own exercises
CREATE POLICY "Users can create own exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### RLS Best Practices

1. **Enable RLS on ALL tables**
2. **Default deny** - No policy = no access
3. **Explicit policies** for each operation (SELECT, INSERT, UPDATE, DELETE)
4. **Use `auth.uid()`** for user identification
5. **Test policies thoroughly**

## 4. Input Validation

### Client-side Validation

```typescript
import { z } from 'zod';

const ExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  duration_seconds: z.number().min(1).max(3600),
  breathing_pattern: z.object({
    inhale: z.number().min(1).max(60),
    hold: z.number().min(0).max(60),
    exhale: z.number().min(1).max(60),
  }),
});

// Validate before submission
try {
  const validated = ExerciseSchema.parse(formData);
  await createExercise(validated);
} catch (error) {
  // Handle validation errors
}
```

### Server-side Validation

Database constraints:

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  duration_seconds INTEGER CHECK (duration_seconds > 0 AND duration_seconds <= 3600),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);
```

## 5. Environment Security

### API Keys

```typescript
// .env.local (NEVER commit!)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

// Use only anon key on client
// Service role key ONLY on server
```

### Environment Variables

```typescript
// src/config/environment.ts
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
} as const;

// Validate at startup
if (!env.supabase.url || !env.supabase.anonKey) {
  throw new Error('Missing required environment variables');
}
```

## Security Checklist

### Before Production

- [ ] All tables have RLS enabled
- [ ] All policies tested and verified
- [ ] No service_role key on client
- [ ] Environment variables properly secured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive info

### Ongoing

- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Monitor Supabase logs
- [ ] Review and update policies as needed

## Common Vulnerabilities

### Prevented by Architecture

- **SQL Injection:** Supabase uses parameterized queries
- **XSS:** React escapes output by default
- **CSRF:** Supabase handles token validation
- **Session hijacking:** Secure httpOnly cookies

### Developer Responsibility

- **Broken access control:** Implement proper RLS policies
- **Sensitive data exposure:** Don't log sensitive info
- **Missing rate limiting:** Configure appropriately
- **Insecure dependencies:** Regular updates

## Incident Response

1. **Detect:** Monitor logs and errors
2. **Assess:** Determine scope and impact
3. **Contain:** Disable affected features if needed
4. **Fix:** Deploy security patch
5. **Verify:** Test fix thoroughly
6. **Document:** Create post-mortem ADR

## See Also

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Schema](03_DATABASE.md)
