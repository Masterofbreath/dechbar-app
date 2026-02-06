# Admin Panel - Changelog

## [2.46.2] - 2026-02-05

### 🎨 Redesign - Apple Premium Clean Design

**Removed:**
- ❌ `AdminHeader` component (44px saved)
- ❌ `AdminHeader.tsx` (1610 bytes)
- ❌ `AdminHeader.css` (2001 bytes)

**Added:**
- ✅ Logo section in `AdminSidebar` (top position)
- ✅ Full viewport height for content (+44px)

**Changed:**
- `AdminSidebar` now starts at `top: 0` (previously `top: 44px`)
- `AdminLayout` removed `AdminHeader` import and usage
- `AdminLayout.css` removed `padding-top: 44px` from container

**Impact:**
- +44px more content space (better UX for tables, forms)
- Zero redundancy (user info & back button only in sidebar)
- Cleaner codebase (-2 files, -3611 bytes)
- Follows Apple macOS System Settings pattern

**Design Philosophy:**
- Apple Premium: "Less is more"
- Visual Brand Book: Golden accents only
- Tone of Voice: Professional, efficient, calm
- 4 Temperaments: All satisfied

---

## [2.46.1] - 2026-02-05

### 🔧 Fix - Admin Route Trailing Wildcard

**Fixed:**
- Admin route path changed from `admin` to `admin/*` in React Router config
- Resolves React Router warning about missing trailing `*` for nested routes
- Fixes persistent redirect from `/app/admin` to `/app`

**Changed:**
- `src/routes/index.tsx`: Updated admin route path

---

## [2.46.0] - 2026-02-05

### 🚀 New - Cache-First Role Management System

**Added:**
- `RoleCache` class for localStorage-based role caching with TTL
- `RoleService` class for centralized role fetching with cache-first strategy
- `adminLoader` now uses cache-first role checking (instant access)
- Background role refresh via `useLoadUserRoles` hook

**Changed:**
- `authStore` updated to use `roleService.fetchRolesWithCache()`
- `adminLoader` updated to use `roleService.fetchRolesWithCache()`
- Cache cleared on logout

**Fixed:**
- Race condition where `adminLoader` executed before roles loaded
- Slow role loading causing unnecessary redirects

---

## [2.45.0] - 2026-02-05

### 🔄 Refactor - React Router Data API Migration

**Changed:**
- Migrated from nested `<Routes>` to React Router v6.4+ Data API
- Using `createBrowserRouter` with flat route structure
- Added `authLoader` and `adminLoader` for route-level protection
- Created `RootLayout` for auth initialization

**Fixed:**
- Global catch-all route conflict with admin routes
- Persistent redirect from `/app/admin` to `/app`

---

## [2.44.0] - 2026-02-04

### 🎉 New - Admin Panel Implementation

**Added:**
- Admin panel with RBAC (Role-Based Access Control)
- `AdminLayout` with sidebar navigation
- `AudioPlayerAdmin` page for media management (CRUD tracks)
- `adminApi` service for Supabase abstraction
- "Administrace" button in Settings (visible for admin/ceo only)
- `useIsAdmin` hook for role checking

**Security:**
- Client-side protection via `AdminGuard`
- Server-side protection via Supabase RLS
- Roles stored in `user_roles` table (many-to-many)

**Design:**
- Bluetooth-safe routing (admin routes nested under `/app/*`)
- Clean admin interface (no TopNav, no BottomNav)
- Mobile-responsive (sidebar → hamburger on <768px)

---

*For detailed documentation, see:*
- `ADMIN_LAYOUT_REDESIGN_v2.46.2.md`
- `ADMIN_ROUTE_FIX_v2.46.1.md`
- `ROLE_MANAGEMENT_v2.46.0.md`
- `ROUTING_REFACTOR_v2.45.0.md`
- `src/platform/pages/admin/README.md`
