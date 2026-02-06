# Supabase RLS Policies Setup

This file contains SQL commands to set up Row Level Security policies for the admin panel.

**IMPORTANT:** These commands must be executed manually in Supabase SQL Editor.

**NOTE:** DechBar stores roles in `auth.users.user_metadata.roles` for synchronous access (prevents logout timing issues).

## Current Architecture

Roles are stored in `user_metadata` as JSON array:
```json
{
  "full_name": "Tomáš Dechbar",
  "roles": ["admin", "ceo", "member"]
}
```

This approach ensures:
- **Synchronous access** (no async fetch during auth state changes)
- **No logout timing issues** (auth callback stays synchronous)
- **Fast performance** (no additional DB query)

## Setup Steps

### 1. Grant admin role to specific user

**Via Supabase Dashboard:**
1. Go to Authentication → Users
2. Find your user
3. Click "..." → Edit User
4. Under "User Metadata", add:
   ```json
   {
     "roles": ["admin", "ceo"]
   }
   ```

**Via SQL (Alternative):**
```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'tomas@dechbar.cz';

-- Update user_metadata with roles
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"roles": ["admin", "ceo"]}'::jsonb
WHERE email = 'tomas@dechbar.cz';
```

### 2. RLS Policy: Only admins/ceo can manage tracks

```sql
CREATE POLICY "Admin can manage tracks" 
ON tracks FOR ALL 
TO authenticated 
USING (
  auth.jwt() -> 'user_metadata' -> 'roles' ?| array['admin', 'ceo']
);
```

**Explanation:**
- `auth.jwt()` gets current JWT token
- `-> 'user_metadata' -> 'roles'` navigates to roles array
- `?|` checks if array contains ANY of the values
- `array['admin', 'ceo']` checks for admin OR ceo role

### 3. RLS Policy: Everyone can read tracks (for playback)

```sql
CREATE POLICY "Everyone can read tracks" 
ON tracks FOR SELECT 
TO authenticated 
USING (true);
```

## Rollback Commands

If you need to rollback the changes:

### Remove roles from user_metadata
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'roles'
WHERE email = 'your-email@example.com';
```

### Remove admin policy
```sql
DROP POLICY IF EXISTS "Admin can manage tracks" ON tracks;
```

### Remove read policy
```sql
DROP POLICY IF EXISTS "Everyone can read tracks" ON tracks;
```

### Disable RLS completely (ONLY FOR TESTING!)
```sql
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;

-- To re-enable:
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
```

## Testing

After setup, test the policies:

1. **As admin user (or ceo):**
   - Navigate to `/app/admin/media`
   - Try to create, edit, delete tracks
   - All operations should work

2. **As regular user:**
   - Try to access `/app/admin`
   - Should see access denied page
   - Try to play tracks in `/app`
   - Should work (read access)

3. **RLS Test (non-admin cannot write):**
   - Login as regular user (without admin/ceo role in metadata)
   - Open browser DevTools Console
   - Try direct Supabase insert:
   ```javascript
   const { data, error } = await supabase
     .from('tracks')
     .insert({ title: 'Test', duration: 60, audio_url: 'test.mp3' });
   console.log(error); // Should show RLS policy error
   ```

## Checking Your Current Roles

In browser DevTools Console:
```javascript
// Get current session
const { data: { session } } = await supabase.auth.getSession();
console.log('User metadata:', session?.user?.user_metadata);
console.log('User roles:', session?.user?.user_metadata?.roles);
```

## Why user_metadata Instead of user_roles Table?

**Problem with async fetch from user_roles table:**
- Auth state listener (`onAuthStateChange`) must be synchronous
- Making it async causes timing issues during logout
- JWT token gets invalidated before roles are fetched
- Results in "Auth session missing!" errors (403)

**Solution with user_metadata:**
- Roles stored directly in JWT token payload
- Synchronous access (no DB query needed)
- No timing issues with logout
- Faster performance (one less query)
- Simpler codebase (no complex async handling)
