# 🔐 Authentication Components - Technical Documentation

## 📍 Location
`/src/components/auth/`

## 🎯 Purpose
Complete authentication flow for DechBar App.  
**Supports:** Email/Password, Magic Link, OAuth (Google, Facebook, Apple)

---

## 🏗️ Architecture

```
AuthModal (Container)
├── LoginView (Email/Password + OAuth)
├── RegisterView (Magic Link + OAuth)
└── ForgotPasswordView (Password Reset)
```

---

## 🔄 Authentication Flows

### **1. Login Flow (Email/Password)**

```
User enters email + password
↓
LoginView → useAuth().signIn()
↓
Supabase Auth → Check credentials
↓
✅ Success → Navigate to /app
❌ Failure → Show error message
```

**Remember Me:**
- ✅ Checked → Session 30 days (localStorage)
- ❌ Unchecked → Session until browser close (sessionStorage)

---

### **2. Registration Flow (Magic Link)**

```
User enters email + GDPR consent
↓
RegisterView → useAuth().signUpWithMagicLink()
↓
Supabase Auth → Send email
↓
Success State → "Zkontrolujte email"
↓
User clicks email link
↓
Redirect to /app → Logged in ✅
```

**GDPR:**
- User must check GDPR consent checkbox
- Consent stored in `user_metadata.gdpr_consent`
- Date stored in `user_metadata.gdpr_consent_date`

---

### **3. OAuth Flow (Google/Facebook/Apple)**

```
User clicks "Pokračovat s Google"
↓
LoginView → useAuth().signInWithOAuth('google')
↓
Opens Google consent popup
↓
User approves → Google redirects to Supabase callback
↓
Supabase redirects to /app
↓
✅ Success → User logged in
```

**Providers:**
- ✅ **Google** - ENABLED
- ⏳ **Facebook** - READY (disabled in UI)
- ⏳ **Apple** - READY (disabled in UI)

---

### **4. Password Reset Flow**

```
User clicks "Zapomenuté heslo"
↓
ForgotPasswordView → useAuth().resetPassword(email)
↓
Supabase Auth → Send reset email
↓
Success State → "Email odeslán"
↓
User clicks email link → Opens /reset-password page
↓
User sets new password → Redirect to /app
```

---

### **5. Logout Flow**

```
User clicks "Odhlásit se"
↓
useAuth().signOut()
↓
Supabase Auth → Clear session
↓
🌐 WEB: Redirect to / (homepage)
📱 NATIVE: Stay in /app (show AuthModal)
```

**Environment Detection:**
- Uses `/src/platform/utils/environment.ts`
- `isWebApp()` → redirect to `/`
- `isNativeApp()` → stay in `/app`

---

## 🔧 Components

### `AuthModal.tsx`

**Purpose:** Container modal that switches between views.

**Props:**
```typescript
{
  isOpen: boolean;           // Modal visibility
  onClose: () => void;       // Close handler
  defaultView?: 'login' | 'register' | 'reset';  // Starting view
}
```

**State:**
- `activeView: 'login' | 'register' | 'reset'`

**Behavior:**
- ESC key → closes modal
- Backdrop click → closes modal (Web only)
- Switches between Login/Register/ForgotPassword views

---

### `LoginView.tsx`

**Purpose:** Login form with email/password + OAuth.

**Props:**
```typescript
{
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
  onSuccess?: () => void;
}
```

**State:**
- `email: string`
- `password: string`
- `remember: boolean` - Remember Me (30 dní vs. session)
- `formError: string`

**OAuth Providers:**
- ✅ Google (ENABLED)
- ⏳ Facebook (DISABLED)
- ⏳ Apple (DISABLED)

**Validations:**
- Email must contain "@"
- Password minimum 6 characters

**Success:** Navigate to `/app`

---

### `RegisterView.tsx`

**Purpose:** Passwordless registration with Magic Link + OAuth.

**Props:**
```typescript
{
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}
```

**State:**
- `email: string`
- `gdprConsent: boolean`
- `emailSent: boolean` - Success state

**Validations:**
- Email must contain "@"
- GDPR consent must be checked

**Success:** Show "Email odeslán" success state

---

### `ForgotPasswordView.tsx`

**Purpose:** Password reset request.

**Props:**
```typescript
{
  onSwitchToLogin: () => void;
}
```

**State:**
- `email: string`
- `isSuccess: boolean`

**Success:** Show "Email odeslán" with instructions

---

## 🔗 Platform Integration

### **useAuth() Hook**

Location: `/src/platform/auth/useAuth.ts`

**Methods:**
```typescript
const {
  user,              // Current user (null if logged out)
  isLoading,         // Loading state
  error,             // Auth error
  signIn,            // Email/Password login
  signInWithOAuth,   // OAuth (Google/Facebook/Apple)
  signUpWithMagicLink, // Magic Link registration
  resetPassword,     // Password reset
  signOut            // Logout
} = useAuth();
```

---

## 🌐 Environment-Aware Behavior

### **Web (`dechbar.cz` browser)**
- After logout → Redirect to `/` (homepage)
- After OAuth → Redirect to `/app`
- Magic Link → Opens in browser → `/app`

### **Native (iOS/Android app)**
- After logout → Stay in `/app` (show AuthModal)
- After OAuth → Opens in browser → Deep link to app → `/app`
- Magic Link → Opens in app (deep link) → `/app`

**Detection:**
```typescript
import { isWebApp, isNativeApp } from '@/platform/utils/environment';

if (isWebApp()) {
  // Web-specific logic
} else {
  // Native-specific logic
}
```

---

## 📋 OAuth Configuration

### **Google OAuth**

**Status:** ✅ ENABLED

**Configuration:**
- **Client ID:** `75893576468-7dr0u87tkhj9mjtbs6975o8dd8km334r.apps.googleusercontent.com`
- **Client Secret:** `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`
- **Authorized JavaScript origins:**
  - `http://localhost:5173` (development)
  - `https://dechbar.cz` (production)
  - `https://nrlqzighwaeuxcicuhse.supabase.co` (Supabase)
  - `https://test.dechbar.cz` (test server)
- **Authorized redirect URIs:**
  - `https://nrlqzighwaeuxcicuhse.supabase.co/auth/v1/callback`

**Setup Steps:**
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client ID → Web application
3. Add authorized origins and redirect URIs
4. OAuth Consent Screen → Testing mode → Add test users
5. Copy Client ID and Secret to Supabase

**Important:**
- OAuth Consent Screen must be in "Testing" mode with test users added
- Or published to "Production" for all users
- Client Secret must match exactly in Google Cloud Console and Supabase

---

### **Facebook OAuth**

**Status:** ⏳ READY (disabled in UI)

**To Enable:**
1. Create Facebook App: https://developers.facebook.com/apps
2. Add "Facebook Login" product
3. Get App ID and App Secret
4. Supabase → Auth → Providers → Facebook → Enter credentials
5. Add valid OAuth redirect URIs
6. `LoginView.tsx` & `RegisterView.tsx` → Remove `disabled` from Facebook button

---

### **Apple OAuth**

**Status:** ⏳ READY (disabled in UI)

**To Enable:**
1. Apple Developer Account: https://developer.apple.com/account
2. Create Services ID (Sign in with Apple)
3. Get Services ID and Key
4. Supabase → Auth → Providers → Apple → Enter credentials
5. `LoginView.tsx` & `RegisterView.tsx` → Remove `disabled` from Apple button

---

## 🧪 Testing Checklist

### **Login Flow**
- [ ] Valid email/password → Success
- [ ] Invalid credentials → Error message
- [ ] Empty fields → Validation error
- [ ] "Remember Me" checked → Session persists 30 days
- [ ] "Remember Me" unchecked → Session expires on browser close
- [ ] Google OAuth → Success

### **Register Flow**
- [ ] Valid email + GDPR → Magic Link sent
- [ ] Invalid email → Error message
- [ ] GDPR not checked → Error message
- [ ] Magic Link email received → Click link → Logged in

### **Forgot Password**
- [ ] Valid email → Reset email sent
- [ ] Reset email received → Click link → `/reset-password` opens
- [ ] Set new password → Success

### **OAuth Flow**
- [ ] Google OAuth → Consent screen → Success
- [ ] Google OAuth cancel → No error, return to login
- [ ] Redirect to `/app` (not `/dashboard`)

### **Logout Flow**
- [ ] Web: Logout → Redirect to `/`
- [ ] Native: Logout → Stay in `/app`, show AuthModal

---

## 🚨 Troubleshooting

### **Issue: "401: invalid_client" (Google OAuth)**

**Cause:** Client ID/Secret mismatch or OAuth Consent Screen misconfigured

**Solution:**
1. Verify Client ID matches Google Cloud Console
2. Verify Client Secret matches (last 4 characters)
3. Check OAuth Consent Screen → "Testing" mode → Add test users
4. Check Authorized Origins and Redirect URIs
5. Wait 2-5 minutes for Google propagation
6. Try in Incognito mode

**Debug:**
```typescript
// Chrome DevTools → Network tab
// Look for: authorize?client_id=...
// Compare with Google Cloud Console Client ID
```

---

### **Issue: User redirected to login after OAuth**

**Cause:** Session not established (likely Client Secret wrong)

**Solution:**
1. Regenerate Client Secret in Google Cloud Console
2. Update in Supabase → Auth → Providers → Google
3. Save changes in Google Cloud Console (blue "Save" button)
4. Wait 2-5 minutes
5. Restart dev server
6. Try again

---

### **Issue: "Remember Me" not working**

**Cause:** localStorage/sessionStorage logic incorrect

**Solution:**
1. Check `useAuth.signIn()` logic (lines 95-104)
2. Verify localStorage key: `dechbar-auth`
3. Test in DevTools → Application → Storage

**Debug:**
```typescript
// Check session storage
console.log(localStorage.getItem('dechbar-auth'));
console.log(sessionStorage.getItem('dechbar-auth'));
```

---

### **Issue: Email not arriving (Magic Link/Reset)**

**Cause:** Supabase Email Templates not configured

**Solution:**
1. Supabase Dashboard → Authentication → Email Templates
2. Check templates are enabled:
   - Confirm signup
   - Reset password
   - Magic link
3. Check Site URL: Settings → Auth → Site URL = `https://dechbar.cz`
4. Check SPAM folder
5. Test with different email provider (Gmail, Outlook, Seznam)

**Supabase Email Settings:**
- Project Settings → Auth → Site URL
- Should match production domain or localhost for dev
- Email rate limiting may apply (check Supabase dashboard)

---

### **Issue: Logout doesn't redirect to homepage**

**Cause:** Environment detection not working

**Solution:**
1. Check `isWebApp()` returns `true` in browser
2. Test in Console: `import { isWebApp } from '@/platform/utils/environment'; console.log(isWebApp());`
3. Verify Capacitor imported correctly
4. Check browser console for errors

---

## 📚 Related Documentation

### **Platform Auth:**
- `/src/platform/auth/README.md` - useAuth hook
- `/src/platform/auth/types.ts` - TypeScript types
- `/src/platform/auth/AuthProvider.tsx` - Auth context (if exists)

### **Implementation Logs:**
- `/docs/development/implementation-logs/`
  - `2026-01-09-authentication-implementation.md`
  - `2026-01-10-auth-ux-improvements.md`
  - `2026-01-10-forgot-password-implementation.md`
  - `/oauth/VALIDATION.md` - OAuth Brand Book compliance

### **Environment Detection:**
- `/src/platform/utils/environment.ts` - Web/Native detection
- `FOUNDATION/04_DESIGN_STANDARDS.md` - Breakpoints

### **Deep Linking:**
- `capacitor.config.ts` - Capacitor configuration
- `/src/App.tsx` - Deep link handler (DeepLinkRouter component)

---

## 🔐 Security Best Practices

### **Implemented:**
- ✅ HTTPS-only OAuth (production)
- ✅ Nonce validation (Supabase handles)
- ✅ GDPR consent logging (`user_metadata`)
- ✅ Password minimum 6 characters
- ✅ Email validation (@ symbol required)
- ✅ Session timeout (30 days max with auto-refresh)
- ✅ Secure password reset flow (email verification)

### **TODO (Future):**
- ⏳ Rate limiting (login attempts)
- ⏳ 2FA (Two-Factor Authentication)
- ⏳ Device tracking (suspicious login detection)
- ⏳ IP logging for GDPR compliance

---

## 🛠️ Development Guide

### **Adding New OAuth Provider**

Example: Facebook

**1. Setup Provider:**
```bash
# Facebook Developers
# https://developers.facebook.com/apps
# Create app → Add Facebook Login
```

**2. Configure Supabase:**
```bash
# Supabase Dashboard
# Auth → Providers → Facebook
# Enable provider
# Add App ID and App Secret
# Copy Callback URL
```

**3. Update UI:**
```typescript
// LoginView.tsx & RegisterView.tsx
// Find Facebook button (currently disabled)
// Remove disabled prop

<Button
  variant="secondary"
  size="lg"
  fullWidth
  onClick={() => handleOAuthSignIn('facebook')}
  // disabled  ← Remove this line
>
```

**4. Test:**
- Click "Pokračovat s Facebook"
- Authorize app
- Should redirect to `/app`
- User created in Supabase

---

### **Testing Auth Flow Locally**

**1. Setup Test User:**
```bash
# Create test user in Supabase Dashboard
# Authentication → Users → Add User
# Email: test@dechbar.cz
# Password: TestPassword123
```

**2. Test Email/Password Login:**
```bash
# 1. Open http://localhost:5173
# 2. Click "Přihlásit se"
# 3. Enter: test@dechbar.cz / TestPassword123
# 4. Check "Zapamatovat si mě"
# 5. Click "Přihlásit se"
# Expected: Redirect to /app, see dashboard
```

**3. Test Logout:**
```bash
# 1. In /app, click "Odhlásit se"
# Expected: Redirect to / (homepage)
# 2. Verify: URL is http://localhost:5173/
```

**4. Test Google OAuth:**
```bash
# 1. Click "Pokračovat s Google"
# 2. Select Google account (must be in test users)
# 3. Approve consent
# Expected: Redirect to /app, logged in
```

**5. Test Magic Link:**
```bash
# 1. Click "Registruj se zdarma"
# 2. Enter email + check GDPR
# 3. Click "Pokračovat s e-mailem"
# Expected: "Email odeslán" success state
# 4. Check inbox (may take 1-2 minutes)
# 5. Click link in email
# Expected: Redirect to /app, logged in
```

---

## 📱 Native App Integration

### **Deep Linking**

**Configuration:** `capacitor.config.ts`

```typescript
{
  appId: 'cz.dechbar.app',
  server: {
    hostname: 'dechbar.cz',
    androidScheme: 'https',
    iosScheme: 'https'
  }
}
```

**Supported Deep Links:**
- `https://dechbar.cz/app` → Opens app dashboard
- `https://dechbar.cz/reset-password?token=abc` → Opens password reset
- `https://dechbar.cz/app?module=studio` → Opens specific module

**Handler:** `App.tsx` → `DeepLinkRouter` component

---

### **iOS Universal Links**

**Setup (Future):**
1. Add `apple-app-site-association` file to `dechbar.cz/.well-known/`
2. Configure in Xcode: Signing & Capabilities → Associated Domains
3. Test with real device (not simulator)

---

### **Android App Links**

**Setup (Future):**
1. Add `assetlinks.json` to `dechbar.cz/.well-known/`
2. Configure in Android Studio: `android/app/src/main/AndroidManifest.xml`
3. Test with real device

---

## 🔍 Debugging Tips

### **Check Current Auth State**

```typescript
// In browser console
import { useAuth } from '@/platform/auth';

// Get current user
const { user } = useAuth();
console.log('Current user:', user);

// Check session
import { supabase } from '@/platform/api/supabase';
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
```

### **Check Environment**

```typescript
import { getEnvironmentInfo, logEnvironment } from '@/platform/utils';

logEnvironment();
// Output:
// Platform: web
// Is Native App: false
// Device Type: desktop
// Screen Width: 1440px
```

### **Check OAuth Flow**

```typescript
// Chrome DevTools → Network tab
// Filter: supabase.co
// Look for:
// - /auth/v1/authorize?...
// - /auth/v1/callback?code=...
// - /auth/v1/token

// Check parameters:
// - client_id (should match Google Cloud Console)
// - redirect_uri (should be Supabase callback URL)
```

---

## 🎯 Common Workflows

### **Scenario: New Developer Onboarding**

```bash
# 1. Read this README
# 2. Setup .env.local (see NEXT_STEPS.md)
# 3. Install dependencies: npm install
# 4. Run dev server: npm run dev
# 5. Open http://localhost:5173
# 6. Test login flow with test credentials
```

### **Scenario: Adding New Auth Provider**

```bash
# 1. Setup provider (Google/Facebook/Apple/GitHub)
# 2. Add to Supabase (Auth → Providers)
# 3. Update UI (LoginView + RegisterView)
# 4. Test flow
# 5. Update this README
# 6. Create implementation log
```

### **Scenario: Debugging OAuth Issue**

```bash
# 1. Check Google Cloud Console config
# 2. Check Supabase Provider config
# 3. Compare Client ID and Secret (last 4 chars)
# 4. Check OAuth Consent Screen test users
# 5. Try in Incognito mode
# 6. Check Network tab for error responses
```

---

## 🚀 Next Steps

### **Immediate (This Sprint):**
- [ ] Test complete login/logout flow
- [ ] Verify OAuth redirect to `/app` works
- [ ] Test environment detection on different screen sizes
- [ ] Verify logout redirects to `/` on web

### **Short-term (Next Sprint):**
- [ ] Enable Facebook OAuth
- [ ] Enable Apple OAuth
- [ ] Add unit tests for useAuth hook
- [ ] Add E2E tests for auth flows

### **Long-term:**
- [ ] 2FA implementation
- [ ] Rate limiting
- [ ] Device tracking
- [ ] Session management dashboard

---

## 📞 Support

### **For Developers:**
- Read `/docs/development/01_WORKFLOW.md`
- Check `/docs/api/PLATFORM_API.md`
- Review implementation logs in `/docs/development/implementation-logs/`

### **For AI Agents:**
- Read `FOUNDATION/01_AI_AGENT_ONBOARDING.md`
- Check `dechbar-app/.cursorrules`
- Review `dechbar-app/PROJECT_GUIDE.md`

---

**Last Updated:** 2026-01-13  
**Version:** 0.2.0  
**Status:** ✅ Production Ready (Google OAuth)  
**Author:** DechBar Team

---

*"Dech je nový kofein" - DechBar* 🌬️
