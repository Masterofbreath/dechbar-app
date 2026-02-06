# Admin Panel Documentation

Admin panel pro správu DechBar App obsahu (tracks, albums, playlists).

## 📋 Overview

Admin panel poskytuje rozhraní pro správce aplikace:
- **Media Management:** CRUD operace na audio tracks
- **Analytics:** Statistiky (placeholder)
- **Gamifikace:** Správa výzev a kurzů (placeholder)
- **Uživatelé:** User management (placeholder)
- **Systém:** System settings (placeholder)

## 🏗️ Architecture

### Routing Structure (Bluetooth-Safe)

**CRITICAL:** Admin routes jsou vnořené pod `/app/*` pro zachování Bluetooth context.

```
/app
├── / (index) → User dashboard (AppLayout + NavigationRouter)
└── admin/*
    ├── / (index) → Redirect to /app/admin/media
    ├── media → AudioPlayerAdmin (CRUD tracks)
    ├── analytics → AdminComingSoon
    ├── gamification → AdminComingSoon
    ├── users → AdminComingSoon
    └── system → AdminComingSoon
```

**Proč vnořené routes?**
- React neodmountuje `/app` wrapper při navigaci `/app` ↔ `/app/admin`
- Bluetooth connection zůstane aktivní (budoucí BLE senzory)
- Audio Player (Zustand store) zůstane v paměti
- User session preserved

### Layout Structure

Admin režim má **čistý Apple Premium interface bez TopNav, BottomNav a AdminHeader**:

```
┌─────────────────────────────────────────┐
│ Sidebar   │   Admin Content            │
│ (240px)   │   (Full Height!)           │
├───────────┤                            │
│ 🎯 Logo   │                            │
├───────────┤                            │
│ 👤 User   │   <AudioPlayerAdmin/>      │
│ Jakub P.  │   <SearchBar/>             │
│ ADMIN     │   <TrackTable/>            │
├───────────┤   ...                      │
│ 🎵 Media  │                            │
│ 📊 Stats  │   (+44px více místa!)      │
│ 🏆 Game   │                            │
│ 👥 Users  │                            │
│ ⚙️ System │                            │
├───────────┤                            │
│ ← Zpět    │                            │
└───────────┴────────────────────────────┘
```

**Components:**
- `AdminSidebar` (240px): Logo + user info + nav menu + back button
- Content area (flex-1): Outlet pro admin pages
- **Removed:** `AdminHeader` (was 44px) - cleaner design, more content space

### Security Model (RBAC)

**Two-layer security:**

1. **Client-side:** `AdminGuard` component
   - Checks `user.role === 'admin' || 'super_admin'`
   - Shows access denied page pro non-admins

2. **Server-side:** Supabase RLS policies
   - Only admins can INSERT/UPDATE/DELETE tracks
   - Everyone can SELECT tracks (for playback)

**Role assignment:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

### API Service Pattern

**Abstraction layer** pro snadnou migraci na REST API:

```typescript
// ✅ CORRECT: Use adminApi abstraction
const tracks = await adminApi.tracks.getAll();

// ❌ WRONG: Direct Supabase queries in components
const { data } = await supabase.from('tracks').select('*');
```

**Benefits:**
- Type-safe (TypeScript interfaces)
- Centralized error handling
- Easy to mock for testing
- Future REST API migration = change only `adminApi.ts`

## 📁 File Structure

```
src/platform/
├── auth/
│   ├── types.ts (User with role field)
│   ├── hooks/
│   │   └── useIsAdmin.ts
│   └── index.ts (export useIsAdmin)
├── guards/
│   ├── AdminGuard.tsx
│   └── AdminGuard.css
├── layouts/
│   ├── AdminLayout.tsx
│   └── AdminLayout.css
├── components/
│   └── admin/
│       ├── AdminHeader.tsx
│       ├── AdminHeader.css
│       ├── AdminSidebar.tsx
│       └── AdminSidebar.css
├── services/
│   └── admin/
│       ├── adminApi.ts (CRUD operations)
│       └── types.ts (TrackInput, TrackFilters)
└── pages/
    └── admin/
        ├── AudioPlayerAdmin.tsx
        ├── AudioPlayerAdmin.css
        ├── AdminComingSoon.tsx
        ├── AdminComingSoon.css
        └── components/
            ├── SearchBar.tsx
            ├── SearchBar.css
            ├── TrackTable.tsx
            ├── TrackTable.css
            ├── TrackForm.tsx
            └── TrackForm.css
```

## 🚀 How to Add New Admin Section

1. **Create page component:**
   ```typescript
   // src/platform/pages/admin/UsersAdmin.tsx
   export default function UsersAdmin() {
     return <div>Users management...</div>;
   }
   ```

2. **Add lazy import in App.tsx:**
   ```typescript
   const UsersAdmin = lazy(() => import('@/platform/pages/admin/UsersAdmin'));
   ```

3. **Add route in App.tsx:**
   ```tsx
   <Route path="users" element={<UsersAdmin />} />
   ```

4. **Sidebar link already exists** (AdminSidebar.tsx)

## 🔧 AdminSidebar Configuration

Menu items are defined in `AdminSidebar.tsx`:

```typescript
const ADMIN_MENU_ITEMS = [
  { path: '/app/admin/media', icon: 'music', label: 'Media' },
  { path: '/app/admin/analytics', icon: 'chart', label: 'Analytika' },
  // Add new items here...
];
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

**Phase 1: Foundation**
- [ ] User type has `role` field
- [ ] `useIsAdmin()` returns correct value
- [ ] AdminGuard blocks non-admins
- [ ] AdminLayout renders without TopNav/BottomNav
- [ ] "Administrace" button visible in Settings (admin only)
- [ ] Navigation `/app` ↔ `/app/admin` works without unmounts

**Phase 2: Media Management**
- [ ] Tracks load from database
- [ ] Create new track works
- [ ] Edit track works
- [ ] Delete track works (with confirmation)
- [ ] Search tracks works
- [ ] Track plays in user mode after creation

**Phase 3: Security**
- [ ] Admin can CRUD tracks
- [ ] Non-admin cannot access `/app/admin`
- [ ] Non-admin cannot write to tracks (RLS test)
- [ ] Non-admin can read tracks (for playback)

### Security Testing

**RLS Test (non-admin cannot write):**
```javascript
// Login as regular user, open DevTools Console:
const { data, error } = await supabase
  .from('tracks')
  .insert({ title: 'Hack', duration: 60, audio_url: 'test.mp3' });

console.log(error); // Should show RLS policy error
```

## 🐛 Troubleshooting

### Issue: Admin cannot write to tracks

**Cause:** RLS policy blocking admin user

**Fix:**
```sql
-- Check if user has admin role
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

-- If role is NULL or 'user', grant admin:
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Issue: Entire /app tree unmounts during navigation

**Cause:** Incorrect route nesting (admin routes as sibling, not child)

**Fix:** Admin routes MUST be nested under `/app/*`:
```tsx
// ❌ WRONG:
<Route path="/app" element={...} />
<Route path="/admin" element={...} />

// ✅ CORRECT:
<Route path="/app" element={...}>
  <Route path="admin/*" element={...} />
</Route>
```

### Issue: Non-admin can access admin panel

**Cause:** AdminGuard not applied to route

**Fix:** Wrap AdminLayout with AdminGuard:
```tsx
<Route 
  path="admin/*" 
  element={<AdminGuard><AdminLayout>...</AdminLayout></AdminGuard>}
/>
```

## 📱 Mobile Responsiveness

- **Desktop:** Sidebar 240px, table layout
- **Tablet (<1024px):** Sidebar 200px, table layout
- **Mobile (<768px):** Sidebar overlay (hamburger), card layout

**Breakpoints:**
- `1024px`: Narrow sidebar
- `768px`: Hamburger menu, card layout, touch targets 44px

## 🎨 Design System

**Colors:**
- Background: `#121212`
- Surface: `#1E1E1E`
- Accent: `#D6A23A` (Gold)
- Primary: `#2CBEC6` (Teal)
- Error: `#FF6B6B`

**Spacing:** 1rem base unit (16px)
**Typography:** Inter font, 600 weight for headings
**Animations:** 0.2s hover, 0.3s modals, cubic-bezier(0.4, 0, 0.2, 1)

## 🔮 Future Enhancements

- [ ] Albums management (CRUD albums)
- [ ] Playlists management
- [ ] User management (view users, change roles)
- [ ] Analytics dashboard (track plays, user activity)
- [ ] Gamification management (challenges, courses)
- [ ] Bulk operations (import/export CSV)
- [ ] Image upload (cover_url field)
- [ ] Audio upload (audio_url field)
- [ ] Real-time collaboration (multiple admins)

## 📚 Related Documentation

- [Supabase RLS Setup](../SUPABASE_RLS_SETUP.md)
- [Audio Player Types](../components/AudioPlayer/types.ts)
- [App Routing](../App.tsx)

---

**Version:** 2.44.0  
**Last Updated:** 2026-02-05  
**Maintainer:** DechBar Team
