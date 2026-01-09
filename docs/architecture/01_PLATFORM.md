# Platform Layer

The Platform provides shared infrastructure and services that all modules can use.

## Platform Components

### 1. Authentication (`platform/auth/`)
- User authentication (email, Google, Apple)
- Session management
- Protected routes
- **Hooks:** `useAuth()`

### 2. Membership (`platform/membership/`)
- Membership plan management (ZDARMA, DECHBAR_HRA, AI_KOUC)
- Module access control
- Subscription tracking
- **Hooks:** `useMembership()`, `useModuleAccess(moduleId)`

### 3. Module Registry (`platform/modules/`)
- Module loading and registration
- Dynamic module access
- Pricing information (from database)
- **Hooks:** `useModules()`, `useModule(moduleId)`

### 4. Design System (`platform/components/`)
- Shared UI components
- Consistent styling
- Accessibility built-in
- **Components:** Button, Card, Modal, Input, etc.

### 5. Layouts (`platform/layouts/`)
- Application layouts
- Responsive navigation
- Safe area handling (mobile)
- **Components:** AppLayout, AuthLayout

### 6. API Layer (`platform/api/`)
- Supabase client
- API utilities
- Data fetching hooks
- **Utilities:** supabase client, useFetch hook

## Platform API Contract

Modules can ONLY access platform through exported APIs:

```typescript
// ✅ CORRECT - Using platform exports
import { useAuth, useMembership, Button } from '@/platform';

// ❌ WRONG - Direct import from platform internals
import AuthProvider from '@/platform/auth/AuthProvider';
```

## Data Flow

```
User Action
    ↓
Module Component
    ↓
Platform Hook (useAuth, useMembership, etc.)
    ↓
Supabase API
    ↓
Database
```

## Folder Structure

```
src/platform/
├── README.md
├── CHANGELOG.md
├── auth/
│   ├── index.ts          ← Public exports
│   ├── useAuth.ts
│   ├── AuthProvider.tsx
│   └── types.ts
├── membership/
│   ├── index.ts
│   ├── useMembership.ts
│   ├── useModuleAccess.ts
│   └── types.ts
├── modules/
│   ├── index.ts
│   ├── useModules.ts
│   ├── useModule.ts
│   └── types.ts
├── components/
│   ├── index.ts
│   ├── Button/
│   ├── Card/
│   └── ...
├── layouts/
│   ├── index.ts
│   ├── AppLayout.tsx
│   └── AuthLayout.tsx
└── api/
    ├── index.ts
    ├── supabase.ts
    └── useFetch.ts
```

## See Also

- [Platform API Documentation](../api/PLATFORM_API.md)
- [Module System](02_MODULES.md)
- [Security Model](05_SECURITY.md)
