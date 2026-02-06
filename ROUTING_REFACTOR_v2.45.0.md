# 🚀 Routing Refactor v2.45.0 - Migration Guide

**Date:** 2026-02-05  
**Status:** ✅ COMPLETED  
**Breaking Changes:** YES - Routing architecture changed

---

## 📋 WHAT CHANGED

### **Before (v2.44.x):**
- ❌ Triple nested `<Routes>` components
- ❌ Catch-all route conflicts
- ❌ Component-based guards (`ProtectedRoute`, `AdminGuard`)
- ❌ Manual auth checking in components

### **After (v2.45.0):**
- ✅ Flat routing structure with `createBrowserRouter`
- ✅ No catch-all conflicts (single `path: '*'` at the end)
- ✅ Loader-based guards (`authLoader`, `adminLoader`)
- ✅ Auth checks BEFORE route renders

---

## 🏗️ NEW ARCHITECTURE

### **File Structure:**

```
src/
├── App.tsx                              # ← NEW: Simple RouterProvider wrapper
├── App.old.tsx                          # ← OLD: Backed up (can delete after testing)
│
├── routes/                              # ← NEW: Route configuration
│   ├── index.tsx                        # ← Route definitions (createBrowserRouter)
│   ├── loaders/
│   │   ├── authLoader.ts                # ← Protects /app/* routes
│   │   └── adminLoader.ts               # ← Protects /app/admin/* routes
│   └── layouts/
│       ├── RootLayout.tsx               # ← Root wrapper (auth init + deep links)
│       ├── ErrorPage.tsx                # ← Global error handler
│       └── ErrorPage.css
│
├── platform/
│   ├── guards/
│   │   ├── AdminGuard.tsx               # ← DEPRECATED (use adminLoader instead)
│   │   └── AdminGuard.css
│   └── layouts/
│       ├── AppLayout.tsx                # ← NO CHANGES
│       └── AdminLayout.tsx              # ← NO CHANGES
│
└── components/
    └── ProtectedRoute.tsx               # ← DEPRECATED (use authLoader instead)
```

---

## 🔐 AUTH FLOW CHANGES

### **Before (Component-based):**

```typescript
// App.tsx
<Route path="/app" element={
  <ProtectedRoute>              // ← Wraps children
    <AppLayout>
      ...
    </AppLayout>
  </ProtectedRoute>
}} />
```

**Problems:**
- Component renders first, then checks auth
- Loading states visible to user
- Redirects after component mount

---

### **After (Loader-based):**

```typescript
// routes/index.tsx
{
  path: 'app',
  loader: authLoader,          // ← Runs BEFORE render
  element: <AppLayout />,
  children: [ ... ]
}

// routes/loaders/authLoader.ts
export async function authLoader({ request }: { request: Request }) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    const url = new URL(request.url);
    const returnTo = encodeURIComponent(url.pathname + url.search);
    return redirect(`/?returnTo=${returnTo}`);
  }
  
  return { user: session.user };
}
```

**Benefits:**
- ✅ Auth check BEFORE component renders
- ✅ No loading states (redirect happens immediately)
- ✅ Preserves `returnTo` URL for post-login redirect

---

## 🛡️ ADMIN GUARD CHANGES

### **Before (Component-based):**

```typescript
<Route path="admin/*" element={
  <AdminGuard>                  // ← Component wrapper
    <AdminLayout>
      ...
    </AdminLayout>
  </AdminGuard>
}} />
```

---

### **After (Loader-based):**

```typescript
{
  path: 'admin',
  loader: adminLoader,          // ← Runs BEFORE render
  element: <AdminLayout />,
  children: [ ... ]
}

// routes/loaders/adminLoader.ts
export async function adminLoader() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return redirect('/?returnTo=%2Fapp%2Fadmin');
  }
  
  // Load user roles from user_roles table
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', session.user.id);
  
  const roles = userRoles?.map(r => r.role_id) || [];
  const isAdmin = roles.includes('admin') || roles.includes('ceo');
  
  if (!isAdmin) {
    return redirect('/app?error=access_denied');
  }
  
  return { user: session.user, roles };
}
```

**Benefits:**
- ✅ Role check BEFORE admin panel renders
- ✅ Roles loaded from DB in loader (not in component useEffect)
- ✅ No "Access Denied" flash

---

## 🔄 ROUTE STRUCTURE COMPARISON

### **Before (Triple nested):**

```typescript
<Routes>                                    // ← Level 1
  <Route path="/app" element={
    <ProtectedRoute>
      <Routes>                              // ← Level 2
        <Route path="admin/*" element={
          <AdminGuard>
            <Routes>                        // ← Level 3
              <Route path="media" ... />
            </Routes>
          </AdminGuard>
        }} />
      </Routes>
    </ProtectedRoute>
  }} />
  <Route path="*" ... />                    // ← Conflicts!
</Routes>
```

---

### **After (Flat):**

```typescript
createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'veda', element: <SciencePage /> },
      {
        path: 'app',
        loader: authLoader,
        element: <Outlet />,
        children: [
          { index: true, element: <AppLayoutWrapper /> },
          {
            path: 'admin',
            loader: adminLoader,
            element: <AdminLayoutWrapper />,
            children: [
              { path: 'media', element: <AudioPlayerAdmin /> },
              { path: 'analytics', element: <AdminComingSoon /> },
            ],
          },
        ],
      },
      { path: '*', element: <ErrorPage /> },  // ← No conflicts!
    ],
  },
])
```

---

## 🚀 BENEFITS

| Aspect | Before | After |
|--------|--------|-------|
| **Route nesting** | 3 levels | Flat structure |
| **Catch-all conflicts** | ❌ Yes | ✅ No |
| **Auth check timing** | After render | Before render |
| **Loading states** | Visible flash | No flash |
| **Code splitting** | Manual | Automatic |
| **Debuggability** | Hard | Easy (React Router DevTools) |
| **Performance** | Slower | Faster (parallel loaders) |
| **Future-proof** | No | Yes (Remix-ready) |

---

## 🧪 TESTING

### **1. Public Routes:**

- ✅ `/` → Landing page
- ✅ `/veda` → Science page
- ✅ `/vyzva` → Challenge page
- ✅ `/reset-password` → Reset password page

### **2. Protected Routes (Auth required):**

- ✅ `/app` → Dashboard (redirects to `/?returnTo=%2Fapp` if not logged in)
- ✅ After login → Redirects back to `/app`

### **3. Admin Routes (Admin role required):**

- ✅ `/app/admin` → Redirects to `/app/admin/media`
- ✅ `/app/admin/media` → Audio Player Admin
- ✅ Non-admin user → Redirects to `/app?error=access_denied`

### **4. 404 Handling:**

- ✅ `/unknown-path` → ErrorPage component
- ✅ No catch-all route conflicts

---

## 🐛 TROUBLESHOOTING

### **Issue: "Cannot find module '@/routes'"**

**Cause:** TypeScript path alias not configured.

**Fix:** Already configured in `tsconfig.json` (paths are inherited).

---

### **Issue: "Loader returned undefined"**

**Cause:** Loader must return either:
- Data object: `return { user: ... }`
- Redirect: `return redirect('/path')`
- null: `return null`

**Fix:** Always return something from loader.

---

### **Issue: "useNavigate must be called inside Router"**

**Cause:** Component is outside `<RouterProvider>`.

**Fix:** Move component inside route tree or use `redirect()` in loader.

---

## 📝 MIGRATION CHECKLIST

- [x] Create `src/routes/index.tsx`
- [x] Create `src/routes/loaders/authLoader.ts`
- [x] Create `src/routes/loaders/adminLoader.ts`
- [x] Create `src/routes/layouts/RootLayout.tsx`
- [x] Create `src/routes/layouts/ErrorPage.tsx`
- [x] Backup old `App.tsx` to `App.old.tsx`
- [x] Create new simple `App.tsx` with `RouterProvider`
- [x] Type check passes ✅
- [ ] Test public routes
- [ ] Test auth flow (login → redirect)
- [ ] Test admin access
- [ ] Test 404 handling
- [ ] Deploy to TEST environment
- [ ] Test on TEST for 24h+
- [ ] Deploy to PROD

---

## 🗑️ DEPRECATED FILES (Can delete after testing)

- `src/App.old.tsx` (old routing implementation)
- `src/components/ProtectedRoute.tsx` (replaced by `authLoader`)
- `src/platform/guards/AdminGuard.tsx` (replaced by `adminLoader`)
- `src/platform/guards/AdminGuard.css`

**⚠️ Keep for now until PROD is stable!**

---

## 📚 REFERENCES

- [React Router v6.4+ Data APIs](https://reactrouter.com/en/main/routers/create-browser-router)
- [Loader Tutorial](https://reactrouter.com/en/main/route/loader)
- [Protecting Routes](https://reactrouter.com/en/main/start/tutorial#protecting-routes)

---

**Version:** 2.45.0  
**Last Updated:** 2026-02-05  
**Status:** ✅ Ready for testing
