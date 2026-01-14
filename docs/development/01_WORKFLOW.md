# 🛠️ Development Workflow

**Pro: Programátory, AI agenty, nové členy týmu**

---

## 🚀 QUICK START

### Pro nového developera:

```bash
# 1. Clone repo
git clone [repo-url]
cd dechbar-app

# 2. Install dependencies
npm install

# 3. Setup Supabase CLI
brew install supabase/tap/supabase
supabase login
supabase link --project-ref iqyahebbteiwzwyrtmns

# 4. Create .env.local
cp .env.local.example .env.local
# Add your Supabase credentials

# 5. Start dev server
npm run dev
```

**Browser:** http://localhost:5173/

---

## 📁 PROJECT STRUCTURE

```
dechbar-app/
├── docs/                           # Dokumentace
│   ├── SUPABASE_CLI.md            # DB management
│   ├── DATABASE_SCHEMA.md         # DB schema docs
│   └── DEVELOPMENT_WORKFLOW.md    # Tento soubor
│
├── src/
│   ├── platform/                  # Shared infrastructure
│   │   ├── api/                   # Supabase client
│   │   ├── auth/                  # Authentication
│   │   ├── components/            # Design system components
│   │   ├── layouts/               # Layout components
│   │   ├── membership/            # Module ownership logic
│   │   ├── payments/              # Payment gateways
│   │   └── types/                 # TypeScript types
│   │
│   ├── modules/                   # Feature modules (products)
│   │   ├── studio/                # Exercise builder
│   │   ├── challenges/            # 21-day challenges
│   │   ├── akademie/              # Educational courses
│   │   ├── game/                  # Gamification
│   │   └── ai-coach/              # AI coach chatbot
│   │
│   ├── app/                       # App entry point
│   │   ├── App.tsx                # Main app component
│   │   └── routes.tsx             # Route definitions
│   │
│   └── styles/                    # Global styles
│       ├── globals.css            # Tailwind + globals
│       └── modern-effects.css     # Glassmorphism, shadows
│
├── supabase/
│   ├── config.toml                # Supabase config
│   └── migrations/                # DB migrations (SQL)
│       └── README.md              # Migration guide
│
├── public/                        # Static assets
├── .cursorrules                   # AI agent rules
├── tailwind.config.js             # Tailwind + design tokens
├── vite.config.ts                 # Vite config
└── package.json                   # Dependencies
```

---

## 🔄 DEVELOPMENT WORKFLOW

### Git Branching Strategy

**Máme 3 typy branches:**

```
main     → dechbar.cz (PRODUKCE)
dev      → test.dechbar.cz (TEST prostředí)
feature/* → Vercel preview URLs (dočasné)
```

**Deployment flow:**
```
Lokální vývoj
    ↓
feature/xyz branch → Vercel preview URL
    ↓
Merge do dev → test.dechbar.cz (automaticky)
    ↓
Testování na test.dechbar.cz (24h+)
    ↓
Merge do main → dechbar.cz (automaticky)
```

---

### 1️⃣ **Feature Development (Standardní workflow)**

```bash
# 1. Začni z dev branch (ne main!)
git checkout dev
git pull origin dev

# 2. Vytvoř feature branch
git checkout -b feature/add-exercises-module

# 3. Vyvíjej
# - Edituj kód v src/
# - Hot reload (Vite)
# - Testuj v browseru lokálně

# 4. Commit průběžně
git add .
git commit -m "feat(studio): add exercise builder UI"

# 5. Pushni feature branch
git push origin feature/add-exercises-module
# → Vercel vytvoří preview URL pro review

# 6. Merge do dev pro test.dechbar.cz
git checkout dev
git merge feature/add-exercises-module
git push origin dev
# → Auto-deploy na test.dechbar.cz

# 7. Testuj na test.dechbar.cz (24h minimum!)

# 8. Merge do main pro produkci (pouze pokud test OK!)
git checkout main
git pull origin main
git merge dev
git push origin main
# → Auto-deploy na dechbar.cz (PRODUKCE)
```

---

### 2️⃣ **Database Changes**

**Viz:** [SUPABASE_CLI.md](SUPABASE_CLI.md)

```bash
# 1. Vytvoř migration
supabase migration new add_exercises_table

# 2. Edituj SQL
vim supabase/migrations/YYYYMMDDHHMMSS_add_exercises_table.sql

# 3. Aplikuj na remote
supabase db push

# 4. Commit migration
git add supabase/migrations/
git commit -m "feat(db): add exercises table"
git push
```

---

### 3️⃣ **Styling (Tailwind + Design Tokens)**

**Používáme:**
- Tailwind CSS classes
- Design tokens (z `tailwind.config.js`)
- Modern effects (z `src/styles/design-tokens/effects.css`)

**Příklad:**
```tsx
<button className="
  px-6 py-3
  bg-gold text-black
  rounded-xl
  shadow-gold
  hover:scale-105
  transition-transform duration-200
  font-semibold
">
  Začít cvičení
</button>
```

**Design Tokens:**
```js
// tailwind.config.js
colors: {
  gold: '#F8CA00',
  black: '#1a1a1a',
  white: '#ffffff',
  gray: { 50: '...', /* ... */ 900: '...' },
},
breakpoints: {
  xs: '320px',
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1440px',
},
```

See [Design System](../design-system/00_OVERVIEW.md) for complete token documentation.

---

### 4️⃣ **TypeScript Types**

**Vytváříme typy pro:**
- Supabase tabulky
- API responses
- Component props
- State management

**Příklad:**
```typescript
// src/platform/types/user.ts
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

// src/platform/types/membership.ts
export type MembershipPlan = 'ZDARMA' | 'DECHBAR_HRA' | 'AI_KOUC';
```

---

### 5️⃣ **State Management (Zustand)**

**Používáme Zustand pro:**
- User state (auth)
- Membership state
- Module ownership
- UI state (modals, toasts)

**Příklad:**
```typescript
// src/platform/auth/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  signIn: async (email, password) => {
    // ...
  },
  signOut: async () => {
    // ...
  },
}));
```

---

### 6️⃣ **Testing**

**Manual Testing:**
```bash
# Dev server
npm run dev

# Test na různých viewportech:
# - Mobile: 375px (iPhone)
# - Tablet: 768px (iPad)
# - Desktop: 1280px, 1920px
```

**Type Checking:**
```bash
npm run build
# TypeScript zkontroluje všechny typy
```

**Linting:**
```bash
npm run lint
# ESLint zkontroluje code quality
```

---

## 🔐 ENVIRONMENT VARIABLES

**Nikdy necommituj `.env.local`!**

```bash
# .env.local (example)
VITE_SUPABASE_URL=https://iqyahebbteiwzwyrtmns.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ENV=development
```

**Jak získat credentials:**
1. Otevři https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns
2. Settings → API
3. Zkopíruj `URL` a `anon public` key

---

## 🚀 DEPLOYMENT

**Hosting:** Vercel (auto-deploy z GitHub)

### Setup (jednou):
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link projekt
vercel link

# 4. Nastav env variables na Vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Deploy:
```bash
# Push na main branch = auto-deploy
git push origin main

# Vercel automatically:
# - Runs npm run build
# - Deploys to production
# - Updates dechbar.cz (pokud DNS nastaven)
```

---

## 📦 MODULY (Products)

**Každý modul je:**
- Nezávislá složka v `src/modules/`
- Má vlastní routes
- Má vlastní components
- Komunikuje přes platform API

**Příklad struktura modulu:**
```
src/modules/studio/
├── index.tsx              # Entry point
├── routes.tsx             # Route definitions
├── components/            # Module-specific components
│   ├── ExerciseBuilder.tsx
│   ├── BreathingTimer.tsx
│   └── SaveExerciseForm.tsx
├── hooks/                 # Module-specific hooks
│   └── useExercises.ts
├── types.ts               # Module types
└── api.ts                 # Supabase queries
```

---

## 🤖 PRO AI AGENTY

### Checklist při vytváření nové funkce:

1. **Přečti dokumentaci:**
   - `.cursorrules`
   - `docs/SUPABASE_CLI.md`
   - `docs/DATABASE_SCHEMA.md`

2. **Vytvoř DB migraci (pokud potřeba):**
   - `supabase migration new feature_name`
   - Napiš SQL s RLS policies
   - Developer spustí `supabase db push`

3. **Vytvoř TypeScript types:**
   - `src/platform/types/feature.ts`
   - Export interfaces

4. **Vytvoř komponenty:**
   - Použij Tailwind + design tokens (viz docs/design-system/)
   - Responsivní (mobile-first)
   - Glassmorphism style

5. **State management:**
   - Zustand store (pokud global state)
   - React Query (pro API calls)

6. **Testing:**
   - Manual testing (3 viewports)
   - Type checking (`npm run build`)

---

## 🎨 DESIGN STANDARDS

**VŽDY:**
- ✅ Mobile-first approach
- ✅ Responsive (5 breakpoints)
- ✅ Modern UI (glassmorphism, shadows)
- ✅ Accessibility (contrast, focus states)
- ✅ Touch-friendly (min 44px targets)

**Design pro 4 temperamenty:**
- 🎉 **Sangvinik:** Fun, playful, barvy
- ⚡ **Cholerik:** Rychlé, efektivní, přímočaré
- 📚 **Melancholik:** Detaily, kvalita, dokumentace
- 🕊️ **Flegmatik:** Klidné, jednoduché, minimalistické

**Viz:** [Design System](../design-system/00_OVERVIEW.md) a [4 Temperaments Philosophy](../design-system/01_PHILOSOPHY.md)

---

## 🔗 UŽITEČNÉ ODKAZY

- **Supabase Dashboard:** https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **React Router:** https://reactrouter.com/
- **Zustand:** https://docs.pmnd.rs/zustand
- **Vite:** https://vite.dev/

---

## ❓ TROUBLESHOOTING

### Dev server nefunguje
```bash
# Zastavit
Ctrl + C

# Smazat node_modules a reinstall
rm -rf node_modules package-lock.json
npm install

# Start znovu
npm run dev
```

### Supabase CLI error
```bash
# Re-login
supabase logout
supabase login

# Re-link project
supabase link --project-ref iqyahebbteiwzwyrtmns
```

### TypeScript errors
```bash
# Restart TS server v VS Code/Cursor
Cmd + Shift + P → "TypeScript: Restart TS Server"
```

---

*Last updated: 2026-01-09*
