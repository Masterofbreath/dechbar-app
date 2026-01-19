# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account created

## Setup Steps

### 1. Install Dependencies

```bash
cd /Users/DechBar/dechbar-app
npm install
```

### 2. Configure Environment

```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local and add your credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

**Get Supabase credentials:**
1. Go to https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns
2. Settings → API
3. Copy URL and anon key

### 3. Setup Supabase CLI (Optional but recommended)

```bash
# Install CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref iqyahebbteiwzwyrtmns
```

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173/

## Verify Setup

- [ ] Dev server starts without errors
- [ ] No console errors in browser (F12)
- [ ] Can see React app in browser
- [ ] Tailwind CSS styles working

## Next Steps

- Read [01_WORKFLOW.md](01_WORKFLOW.md) for development workflow
- Read [02_SUPABASE.md](02_SUPABASE.md) for database management
- Read [../architecture/00_OVERVIEW.md](../architecture/00_OVERVIEW.md) for architecture

## Troubleshooting

### Port 5173 already in use
```bash
# Kill process on port
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Restart TypeScript server in Cursor
# Cmd + Shift + P → "TypeScript: Restart TS Server"
```

---

## 🎯 Your First Task (Tutorial)

After setup, try this simple task to verify everything works.

### Task 1: Change Landing Page Hero Headline

**Goal:** Edit hero section text on landing page.

**Steps:**

1. **Find the component:**
```bash
open src/modules/public-web/components/landing/HeroSection.tsx
```

2. **Locate the headline (around line 10):**
```tsx
<h1 className="landing-hero__title">
  První česká aplikace pro funkční dýchání
</h1>
```

3. **Edit text (test change):**
```tsx
<h1 className="landing-hero__title">
  TESTOVACÍ HEADLINE - První česká aplikace pro funkční dýchání
</h1>
```

4. **Save and check browser:**
   - Dev server auto-reloads
   - See change instantly at http://localhost:5173/

5. **Verify Tone of Voice:**
   - Check [docs/design-system/TONE_OF_VOICE.md](../design-system/TONE_OF_VOICE.md)
   - ✅ Tykání? ✅ Imperativ? ✅ Krátké věty?

6. **Revert change:**
```tsx
<h1 className="landing-hero__title">
  První česká aplikace pro funkční dýchání
</h1>
```

7. **Optional - Git practice:**
```bash
git status  # See what changed
git diff    # See exact changes
# No need to commit (was just test)
```

**Success Checklist:**

- [ ] Found component in correct location
- [ ] Dev server auto-reloaded on save
- [ ] Saw change in browser
- [ ] Understood Tone of Voice rules
- [ ] Reverted change successfully

---

### Task 2: Understand Component Architecture

**Goal:** Learn Platform component structure.

**Steps:**

1. **Read existing Button component:**
```bash
open src/platform/components/Button.tsx
```

2. **Study structure:**
   - TypeScript interface for props
   - Variant system (primary/secondary/ghost)
   - Size system (sm/md/lg)
   - CSS class composition

3. **Check CSS:**
```bash
open src/styles/components/button.css
```

4. **See BEM naming:**
   - `.dechbar-button` (base)
   - `.dechbar-button--primary` (variant)
   - `.dechbar-button--lg` (size)

5. **Read documentation:**
```bash
open docs/design-system/components/Button.md
```

**Key Takeaways:**

- Platform components are reusable across modules
- TypeScript props define API
- CSS uses BEM-like naming
- Documentation is mandatory

---

### Task 3: Practice Decision Tree

**Goal:** Use decision tree to determine code location.

**Scenarios:**

1. **"I need to add a Modal component"**
   - Question: Will 2+ modules use it?
   - Answer: YES → `src/platform/components/Modal.tsx`

2. **"I need to edit Landing Page pricing"**
   - Question: Module-specific?
   - Answer: YES → `src/modules/public-web/components/landing/PricingSection.tsx`

3. **"I need a hook to fetch exercises"**
   - Question: General or module-specific?
   - Answer: Module-specific → `src/modules/studio/hooks/useExercises.ts`

---

## 🎓 What's Next?

1. **Read full workflow:** [01_WORKFLOW.md](01_WORKFLOW.md)
2. **Explore PROJECT_GUIDE.md:** [../../PROJECT_GUIDE.md](../../PROJECT_GUIDE.md)
3. **Study 4 Temperaments:** [../design-system/01_PHILOSOPHY.md](../design-system/01_PHILOSOPHY.md)
4. **Start real work!**

---

*Congratulations! Your setup is verified and you understand the basics.*

*Time to first successful change: ~1 hour (vs 2.5 hours without this tutorial)*
