# REST API

Supabase auto-generates REST API from database schema.

## Base URL

```
https://iqyahebbteiwzwyrtmns.supabase.co/rest/v1/
```

## Authentication

Include in all requests:

```
Headers:
  apikey: [your-anon-key]
  Authorization: Bearer [user-jwt-token]
```

## Endpoints

### GET /modules

List all active modules:

```
GET /modules?is_active=eq.true&order=sort_order
```

Response:
```json
[
  {
    "id": "studio",
    "name": "DechBar STUDIO",
    "price_czk": 990,
    "price_type": "lifetime"
  }
]
```

### GET /exercises

List user's exercises:

```
GET /exercises?user_id=eq.[user-id]&order=created_at.desc
```

### POST /exercises

Create new exercise:

```
POST /exercises
Body: {
  "name": "Morning Breath",
  "duration_seconds": 300,
  "breathing_pattern": {...}
}
```

## Using in Code

```typescript
import { supabase } from '@/platform/api';

// With JavaScript client (recommended)
const { data } = await supabase
  .from('modules')
  .select('*')
  .eq('is_active', true);

// Direct REST call (not recommended)
const response = await fetch(
  'https://iqyahebbteiwzwyrtmns.supabase.co/rest/v1/modules?is_active=eq.true',
  {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${userToken}`,
    },
  }
);
```

## See Also

- [Supabase REST API Documentation](https://supabase.com/docs/guides/api)
- [Platform API](PLATFORM_API.md)
