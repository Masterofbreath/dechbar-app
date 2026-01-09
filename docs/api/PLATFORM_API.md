# Platform API

The Platform provides shared services that all modules can use.

## Authentication

### `useAuth()`

```typescript
import { useAuth } from '@/platform/auth';

const { user, signIn, signOut, signUp, isLoading, error } = useAuth();

// Sign in
await signIn({ email, password });

// Sign up
await signUp({ email, password });

// Sign out
await signOut();

// Current user
console.log(user.id, user.email);
```

**Returns:**
```typescript
{
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}
```

---

## Membership

### `useMembership()`

```typescript
import { useMembership } from '@/platform/membership';

const { plan, isPremium, isLoading } = useMembership();

if (isPremium) {
  // User has paid membership
}
```

**Returns:**
```typescript
{
  plan: 'ZDARMA' | 'DECHBAR_HRA' | 'AI_KOUC';
  isPremium: boolean;
  isLoading: boolean;
  membership: Membership | null;
}
```

### `useModuleAccess(moduleId)`

```typescript
import { useModuleAccess } from '@/platform/membership';

const { hasAccess, isLoading } = useModuleAccess('studio');

if (!hasAccess) {
  return <Paywall moduleId="studio" />;
}
```

**Returns:**
```typescript
{
  hasAccess: boolean;
  isLoading: boolean;
  module: UserModule | null;
}
```

---

## Module Registry

### `useModules()`

Fetches all available modules from database:

```typescript
import { useModules } from '@/platform/modules';

const { data: modules, isLoading } = useModules();

modules.forEach(module => {
  console.log(module.name, module.price_czk);
});
```

**Returns:** React Query result with `Module[]`

### `useModule(moduleId)`

Fetches specific module:

```typescript
import { useModule } from '@/platform/modules';

const { data: studio, isLoading } = useModule('studio');

console.log(studio.name, studio.price_czk);
```

**Returns:** React Query result with `Module`

---

## UI Components

### Button

```typescript
import { Button } from '@/platform/components';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Props:**
```typescript
{
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: ReactNode;
}
```

### Card

```typescript
import { Card } from '@/platform/components';

<Card elevated={true} className="p-6">
  Card content
</Card>
```

### Modal

```typescript
import { Modal } from '@/platform/components';

<Modal 
  open={isOpen} 
  onClose={() => setOpen(false)}
  title="Modal Title"
>
  Modal content
</Modal>
```

### Input

```typescript
import { Input } from '@/platform/components';

<Input
  type="text"
  label="Email"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
```

---

## Layouts

### AppLayout

```typescript
import { AppLayout } from '@/platform/layouts';

<AppLayout>
  <YourContent />
</AppLayout>
```

Provides:
- Top navigation
- Bottom navigation (mobile)
- Safe area handling
- Responsive layout

### AuthLayout

```typescript
import { AuthLayout } from '@/platform/layouts';

<AuthLayout title="Sign In">
  <LoginForm />
</AuthLayout>
```

For login, registration, password reset pages.

---

## Utilities

### Supabase Client

```typescript
import { supabase } from '@/platform/api';

const { data, error } = await supabase
  .from('exercises')
  .select('*');
```

### useFetch Hook

```typescript
import { useFetch } from '@/platform/api';

const { data, isLoading, error } = useFetch('/api/endpoint');
```

---

## Usage Rules for Modules

### ✅ DO:
```typescript
// Import from public exports
import { useAuth, Button, Card } from '@/platform';
```

### ❌ DON'T:
```typescript
// Don't import internal implementation
import AuthProvider from '@/platform/auth/AuthProvider';
import ButtonComponent from '@/platform/components/Button/Button';
```

---

## TypeScript Types

All platform types exported from `@/platform/types`:

```typescript
import type { User, Membership, Module } from '@/platform/types';
```

---

## See Also

- [Module API](MODULE_API.md) - How modules expose their API
- [Architecture Overview](../architecture/00_OVERVIEW.md)
- [Platform Layer](../architecture/01_PLATFORM.md)
