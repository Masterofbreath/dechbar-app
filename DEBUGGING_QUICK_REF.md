# 🐛 Quick Debugging Reference - Routing v2.45.0

## ✅ QUICK HEALTH CHECK

Open browser console and run:

```javascript
// 1. Check route matching
console.log('Current URL:', window.location.pathname);

// 2. Check auth state
const authStore = window.__ZUSTAND_DEVTOOLS__?.stores?.['auth-store']?.getState();
console.log('User:', authStore?.user);
console.log('Is Loading:', authStore?.isLoading);
console.log('Roles:', authStore?.user?.roles);

// 3. Check if admin
const isAdmin = authStore?.user?.roles?.includes('admin') || authStore?.user?.roles?.includes('ceo');
console.log('Is Admin:', isAdmin);
```

---

## 🔍 COMMON ISSUES

### **1. Admin panel redirects to `/app`**

**Symptom:** Clicking "Administrace" redirects to dashboard.

**Debug:**
```javascript
// Check if adminLoader is running
console.log('Roles:', window.__ZUSTAND_DEVTOOLS__?.stores?.['auth-store']?.getState()?.user?.roles);
```

**Fix:**
- Ensure user has `admin` or `ceo` role in `user_roles` table
- Check `adminLoader.ts` is being called (add `console.log` at top)

---

### **2. Infinite redirect loop**

**Symptom:** Page keeps redirecting.

**Debug:**
- Open Network tab in DevTools
- Look for repeated redirects

**Fix:**
- Check `authLoader` and `adminLoader` return statements
- Ensure loaders return data or redirect, not undefined

---

### **3. "Cannot find module '@/routes'"**

**Symptom:** TypeScript error.

**Fix:**
- Check `tsconfig.json` has path aliases configured
- Restart VS Code / TypeScript server

---

### **4. White screen / blank page**

**Symptom:** App doesn't load.

**Debug:**
```bash
npm run dev
# Check console for errors
```

**Common causes:**
- Syntax error in `routes/index.tsx`
- Missing import in `App.tsx`
- Loader throwing unhandled error

---

### **5. Auth redirect not working**

**Symptom:** Protected routes show blank page instead of redirecting.

**Debug:**
```javascript
// In authLoader.ts, add console.log:
export async function authLoader({ request }: { request: Request }) {
  console.log('authLoader running for:', request.url);
  // ...rest of loader
}
```

**Fix:**
- Ensure `authLoader` is attached to route
- Check Supabase session is valid

---

## 🔧 ROLLBACK INSTRUCTIONS

If new routing breaks:

```bash
cd dechbar-app/src
mv App.tsx App.new.tsx
mv App.old.tsx App.tsx
git checkout App.tsx  # Restore from git if needed
```

Then refresh browser.

---

## 📞 ESCALATION

If issue persists:

1. Check `ROUTING_REFACTOR_v2.45.0.md` migration guide
2. Check `IMPLEMENTATION_COMPLETE.md` testing steps
3. Check browser console for errors
4. Check Supabase logs for auth errors
5. Ask for help with detailed error messages

---

**Last Updated:** 2026-02-05
