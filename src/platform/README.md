# Platform Layer

The Platform provides shared infrastructure that all modules use.

## Structure

```
platform/
├── README.md (this file)
├── CHANGELOG.md
├── auth/              - Authentication
├── membership/        - Module access control
├── modules/           - Module registry
├── components/        - Shared UI components
├── layouts/           - App layouts
├── api/               - API utilities
└── types/             - Shared types
```

## Key Concepts

### Single Source of Truth

Pricing and module data is **ONLY** stored in Supabase database.
- Never hardcode prices
- Load dynamically via `useModules()` hook
- Real-time updates when data changes

### Public API Only

Modules should ONLY import from platform's public exports:

```typescript
// ✅ CORRECT
import { useAuth, useMembership, Button } from '@/platform';

// ❌ WRONG
import AuthProvider from '@/platform/auth/AuthProvider';
```

## Available Hooks

### Authentication
- `useAuth()` - Current user, sign in/out/up

### Membership
- `useMembership(userId)` - User's membership plan
- `useModuleAccess(moduleId, userId)` - Check module access

### Modules
- `useModules()` - All active modules (with pricing from DB)
- `useModule(moduleId)` - Specific module
- `useUserModules(userId)` - User's purchased modules

## See Also

- [Platform API Documentation](../docs/api/PLATFORM_API.md)
- [Architecture Overview](../docs/architecture/00_OVERVIEW.md)
