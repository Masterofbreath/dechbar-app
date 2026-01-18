# Code Structure - Quick Navigation Guide

**Version:** 1.0  
**Last Updated:** 2026-01-18  
**For:** AI Agents, New Developers, Code Reviews

> ⚠️ **IMPORTANT:** Tento dokument se automaticky aktualizuje při přidání nových složek/souborů!  
> Pokud vytváříš novou složku nebo modul, **VŽDY aktualizuj tento soubor!**

---

## 📋 Table of Contents

1. [Visual File Tree](#visual-file-tree)
2. [Quick Reference](#quick-reference---kde-co-najít)
3. [Import Paths](#import-paths)
4. [Naming Conventions](#naming-conventions)
5. [Where to Add Things](#where-to-add-things)

---

## 🌳 Visual File Tree

```
dechbar-app/
├── 📄 Root Files (Essentials only)
│   ├── README.md              # Project overview
│   ├── PROJECT_GUIDE.md       # ⭐ Master navigation
│   ├── CHANGELOG.md           # Version history
│   ├── BUGS.md                # Bug tracker
│   ├── CONTRIBUTING.md        # Contribution guide
│   ├── LICENSE                # MIT license
│   ├── package.json           # Dependencies
│   ├── .cursorrules           # AI agent rules
│   ├── .gitignore             # Git ignore
│   ├── tsconfig.json          # TypeScript config
│   ├── tailwind.config.js     # Tailwind + design tokens
│   ├── vite.config.ts         # Vite build config
│   └── capacitor.config.ts    # iOS/Android native config
│
├── 📁 docs/                   # DOCUMENTATION (40+ files)
│   ├── architecture/          # System architecture
│   │   ├── 00_OVERVIEW.md
│   │   ├── 01_PLATFORM.md
│   │   ├── 02_MODULES.md
│   │   ├── 03_DATABASE.md
│   │   ├── 04_API.md
│   │   ├── 05_SECURITY.md
│   │   ├── CODE_STRUCTURE.md  # ⭐ THIS FILE
│   │   └── adr/               # Architecture Decision Records
│   │       ├── README.md
│   │       ├── template.md
│   │       ├── 001-supabase-backend.md
│   │       ├── 002-modular-architecture.md
│   │       └── 003-lazy-loading.md
│   │
│   ├── design-system/         # Design tokens & components
│   │   ├── 00_OVERVIEW.md
│   │   ├── 01_PHILOSOPHY.md   # 4 Temperaments
│   │   ├── 02_COLORS.md
│   │   ├── 03_TYPOGRAPHY.md
│   │   ├── 04_SPACING.md
│   │   ├── 05_BREAKPOINTS.md
│   │   ├── 06_COMPONENTS.md
│   │   ├── 07_ICONS.md
│   │   ├── 08_ANIMATIONS.md
│   │   ├── TONE_OF_VOICE.md
│   │   ├── MESSAGE_LIBRARY.md
│   │   └── components/        # Component API docs
│   │       ├── README.md      # Index
│   │       ├── TopNav.md
│   │       ├── BottomNav.md
│   │       └── Loader.md
│   │
│   ├── development/           # Developer guides
│   │   ├── 00_QUICK_START.md
│   │   ├── 01_WORKFLOW.md
│   │   ├── 02_SUPABASE.md
│   │   ├── 03_TESTING.md
│   │   ├── 04_DEPLOYMENT.md
│   │   ├── 05_DEBUGGING.md
│   │   ├── AI_AGENT_COMPONENT_GUIDE.md  # ⭐ Component creation guide
│   │   ├── agent-tests/       # Study guides for agents
│   │   └── implementation-logs/  # Implementation history
│   │       ├── README.md
│   │       └── 2026-01-18-mvp0-navigation.md  # Latest
│   │
│   ├── product/               # Business docs
│   │   ├── VISION.md
│   │   ├── ROADMAP.md
│   │   ├── MODULES.md
│   │   └── ...
│   │
│   ├── brand/                 # Brand guidelines
│   │   ├── VISUAL_BRAND_BOOK.md
│   │   ├── BRAND_COLORS.md
│   │   └── ...
│   │
│   └── api/                   # API reference
│       ├── PLATFORM_API.md
│       ├── MODULE_API.md
│       └── ...
│
├── 📁 src/                    # SOURCE CODE
│   ├── 📁 platform/           # ⭐ PLATFORM LAYER (shared)
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   ├── index.ts           # ⭐ Public API (barrel export)
│   │   │
│   │   ├── components/        # Design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Logo.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── IconButton.tsx
│   │   │   ├── TextLink.tsx
│   │   │   ├── NavIcon.tsx    # 🆕 Universal UI icons
│   │   │   ├── Icon.tsx       # DechBar logo icon
│   │   │   ├── navigation/    # 🆕 Navigation components
│   │   │   │   ├── TopNav.tsx
│   │   │   │   ├── BottomNav.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── layouts/           # 🆕 Layout wrappers
│   │   │   ├── AppLayout.tsx  # TOP + Content + BOTTOM
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/             # Platform hooks
│   │   │   ├── useScrollLock.ts
│   │   │   ├── useNavigation.ts  # 🆕 Central nav state
│   │   │   ├── useFocusTrap.ts   # 🔜 TODO
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/              # Authentication
│   │   │   ├── useAuth.ts
│   │   │   ├── authStore.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── membership/        # Membership & access
│   │   │   ├── useMembership.ts
│   │   │   ├── useModuleAccess.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── modules/           # Module registry
│   │   │   ├── useModules.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── api/               # API utilities
│   │   │   ├── supabase.ts
│   │   │   ├── usePublicStats.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── types/             # Shared TypeScript types
│   │   │   ├── user.ts
│   │   │   ├── membership.ts
│   │   │   └── index.ts
│   │   │
│   │   └── utils/             # Utility functions
│   │       ├── environment.ts
│   │       └── index.ts
│   │
│   ├── 📁 modules/            # ⭐ FEATURE MODULES (products)
│   │   ├── README.md          # Module system guide
│   │   │
│   │   ├── mvp0/              # 🆕 MVP0 - The Core
│   │   │   ├── MODULE_MANIFEST.json
│   │   │   ├── README.md
│   │   │   ├── CHANGELOG.md
│   │   │   ├── index.ts
│   │   │   ├── pages/         # Views (routed screens)
│   │   │   │   ├── DnesPage.tsx       # Main dashboard
│   │   │   │   ├── CvicitPage.tsx     # Exercise library
│   │   │   │   ├── AkademiePage.tsx   # Education
│   │   │   │   ├── PokrokPage.tsx     # Progress stats
│   │   │   │   ├── ProfilPage.tsx     # User profile
│   │   │   │   ├── SettingsPage.tsx   # App settings
│   │   │   │   └── index.ts
│   │   │   ├── components/    # MVP0-specific components
│   │   │   │   ├── Greeting.tsx
│   │   │   │   ├── SmartExerciseButton.tsx
│   │   │   │   ├── PresetProtocolButton.tsx
│   │   │   │   ├── DailyTipWidget.tsx
│   │   │   │   ├── LockedFeatureModal.tsx
│   │   │   │   └── index.ts
│   │   │   └── data/
│   │   │       └── dailyTips.ts
│   │   │
│   │   ├── public-web/        # Landing page module
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   └── styles/
│   │   │
│   │   └── studio/            # Studio module (template)
│   │       └── ...
│   │
│   ├── 📁 components/         # Shared components (not platform)
│   │   ├── auth/              # Auth-specific UI
│   │   │   ├── AuthModal.tsx
│   │   │   ├── LoginView.tsx
│   │   │   ├── RegisterView.tsx
│   │   │   └── ForgotPasswordView.tsx
│   │   ├── shared/            # Generic shared
│   │   │   ├── CloseButton.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── Logo.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── 📁 pages/              # Legacy pages (before modules)
│   │   ├── auth/
│   │   │   └── ResetPasswordPage.tsx
│   │   └── dashboard/
│   │       └── DashboardPage.tsx  # Old dashboard (keep for compatibility)
│   │
│   ├── 📁 config/             # Configuration
│   │   ├── environment.ts     # Env vars (typed + validated)
│   │   ├── constants.ts       # App constants (NO pricing!)
│   │   ├── messages.ts        # UI messages (Tone of Voice)
│   │   ├── logo.ts            # Logo config
│   │   └── index.ts
│   │
│   ├── 📁 styles/             # Global styles
│   │   ├── globals.css        # Main entry (imports all)
│   │   │
│   │   ├── design-tokens/     # Design tokens (CSS variables)
│   │   │   ├── colors.css     # Teal, Gold, grays
│   │   │   ├── typography.css # Inter font, sizes
│   │   │   ├── spacing.css    # 4px base unit
│   │   │   ├── breakpoints.css # 390, 768, 1024, 1280
│   │   │   ├── shadows.css    # Multi-layer shadows
│   │   │   ├── effects.css    # Glassmorphism
│   │   │   └── logo.css       # Logo tokens
│   │   │
│   │   ├── components/        # Component-specific CSS
│   │   │   ├── button.css
│   │   │   ├── input.css
│   │   │   ├── checkbox.css
│   │   │   ├── icon-button.css
│   │   │   ├── close-button.css
│   │   │   ├── error-message.css
│   │   │   ├── loader.css
│   │   │   ├── oauth-icons.css
│   │   │   ├── top-nav.css    # 🆕
│   │   │   ├── bottom-nav.css # 🆕
│   │   │   └── locked-feature-modal.css # 🆕
│   │   │
│   │   ├── layouts/           # 🆕 Layout CSS
│   │   │   └── app-layout.css
│   │   │
│   │   ├── pages/             # Page-specific CSS
│   │   │   ├── dashboard.css
│   │   │   └── dnes.css       # 🆕
│   │   │
│   │   ├── modals.css         # Base modal styles
│   │   └── auth.css           # Auth screens
│   │
│   ├── 📁 utils/              # Utility functions
│   │   ├── logo.ts
│   │   └── inflection.ts
│   │
│   ├── 📁 app/                # App entry
│   │   └── moduleRegistry.ts  # Module lazy loading registry
│   │
│   ├── App.tsx                # Root component
│   └── main.tsx               # Entry point
│
├── 📁 supabase/               # Database
│   ├── config.toml
│   └── migrations/
│       └── README.md
│
├── 📁 public/                 # Static assets
│   └── assets/
│
└── 📁 node_modules/           # Dependencies (ignored)

```

---

## 🔍 Quick Reference - Kde co najít?

| Hledám... | Kde to je | Příklad |
|-----------|-----------|---------|
| **Navigation components** | `src/platform/components/navigation/` | TopNav, BottomNav |
| **UI components** | `src/platform/components/` | Button, Input, Card |
| **Layout wrappers** | `src/platform/layouts/` | AppLayout |
| **Icons** | `src/platform/components/NavIcon.tsx` | home, dumbbell, chart-line |
| **Hooks** | `src/platform/hooks/` | useAuth, useNavigation |
| **Pages (views)** | `src/modules/{module}/pages/` | DnesPage, CvicitPage |
| **Module components** | `src/modules/{module}/components/` | Greeting, PresetButton |
| **Styles (component)** | `src/styles/components/` | button.css, top-nav.css |
| **Styles (page)** | `src/styles/pages/` | dnes.css |
| **Design tokens** | `src/styles/design-tokens/` | colors.css, spacing.css |
| **Config** | `src/config/` | environment.ts, constants.ts |
| **Types** | `src/platform/types/` | user.ts, membership.ts |
| **API docs** | `docs/design-system/components/` | TopNav.md, Button.md |
| **Implementation logs** | `docs/development/implementation-logs/` | History of changes |

---

## 📦 Import Paths

### Path Aliases (tsconfig.json)

```typescript
// Platform imports
import { Button, useAuth, AppLayout } from '@/platform';

// Module imports
import { DnesPage } from '@/modules/mvp0';

// Component imports
import { AuthModal } from '@/components/auth';

// Config imports
import { APP_CONFIG } from '@/config';

// Utils imports
import { getLogoPath } from '@/utils/logo';
```

### Actual Paths

| Alias | Resolves to |
|-------|-------------|
| `@/platform` | `src/platform/index.ts` (public API) |
| `@/modules/{id}` | `src/modules/{id}/index.ts` |
| `@/components` | `src/components/` |
| `@/config` | `src/config/` |
| `@/utils` | `src/utils/` |
| `@/styles` | `src/styles/` |

---

## 📝 Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `TopNav.tsx`, `DnesPage.tsx` |
| **Hooks** | camelCase | `useNavigation.ts`, `useAuth.ts` |
| **Utils** | camelCase | `environment.ts`, `logo.ts` |
| **Types** | PascalCase | `User.ts`, `Membership.ts` |
| **Constants** | UPPER_SNAKE | `constants.ts` (obsahuje APP_CONFIG) |
| **CSS** | kebab-case | `top-nav.css`, `button.css` |
| **Data** | camelCase | `dailyTips.ts`, `faq.ts` |

### CSS Classes (BEM-like)

```css
/* Component */
.component-name { }

/* Element */
.component-name__element { }

/* Modifier */
.component-name--modifier { }
.component-name__element--modifier { }

/* Examples */
.top-nav { }
.top-nav__avatar { }
.top-nav__avatar--placeholder { }
.bottom-nav__tab--active { }
```

### Folder Names

| Type | Convention | Example |
|------|------------|---------|
| **Platform folders** | lowercase | `auth/`, `components/`, `hooks/` |
| **Module folders** | kebab-case | `mvp0/`, `public-web/` |
| **Page folders** | lowercase | `pages/`, `components/` |

---

## 🛠️ Where to Add Things?

### Decision Tree

```
Přidávám nový...

├─ UI Component (sdílený napříč app)?
│  → src/platform/components/ComponentName.tsx
│  → src/styles/components/component-name.css
│  → docs/design-system/components/ComponentName.md
│  → docs/development/implementation-logs/YYYY-MM-DD-component-name.md
│
├─ Navigation component?
│  → src/platform/components/navigation/NavComponentName.tsx
│  → src/styles/components/nav-component-name.css
│
├─ Layout wrapper?
│  → src/platform/layouts/LayoutName.tsx
│  → src/styles/layouts/layout-name.css
│
├─ Hook (sdílený)?
│  → src/platform/hooks/useHookName.ts
│  → Export v src/platform/hooks/index.ts
│  → Export v src/platform/index.ts
│
├─ Page (view) pro existující modul?
│  → src/modules/{module}/pages/PageName.tsx
│  → src/styles/pages/{page-name}.css (optional)
│
├─ Component (module-specific)?
│  → src/modules/{module}/components/ComponentName.tsx
│  → Styles inline v page CSS nebo samostatný
│
├─ Nový modul?
│  → src/modules/{module-id}/
│  │   ├── MODULE_MANIFEST.json
│  │   ├── README.md
│  │   ├── CHANGELOG.md
│  │   ├── index.ts
│  │   ├── pages/
│  │   ├── components/
│  │   └── data/ (optional)
│  → docs/product/MODULES.md (update pricing reference)
│
├─ Design token?
│  → src/styles/design-tokens/{token-name}.css
│  → Import v src/styles/globals.css
│
├─ Config value?
│  → src/config/constants.ts (static)
│  → src/config/environment.ts (env vars)
│
├─ TypeScript type?
│  → src/platform/types/{type-name}.ts
│  → Export v src/platform/types/index.ts
│
├─ Database table?
│  → supabase migration new table_name
│  → supabase/migrations/YYYYMMDDHHMMSS_table_name.sql
│  → docs/architecture/03_DATABASE.md (update schema docs)
│
└─ Documentation?
   → docs/{category}/{file}.md
   → Update relevant index/README.md
   → **UPDATE THIS FILE (CODE_STRUCTURE.md)!**
```

---

## 🔄 Module Structure Template

Každý nový modul MUSÍ následovat tuto strukturu:

```
src/modules/{module-id}/
├── MODULE_MANIFEST.json   # Module definition (REQUIRED)
├── README.md              # Module docs
├── CHANGELOG.md           # Module-specific changes
├── index.ts               # Public API exports
│
├── pages/                 # Routed screens
│   ├── {Page}Page.tsx
│   └── index.ts
│
├── components/            # Module-specific components
│   ├── {Component}.tsx
│   └── index.ts
│
├── hooks/                 # Module-specific hooks (optional)
│   └── use{Feature}.ts
│
├── api/                   # Supabase queries (optional)
│   └── {feature}.ts
│
├── data/                  # Static data (optional)
│   └── {data}.ts
│
└── types.ts               # Module types (optional)
```

---

## 📊 Current Statistics

**Updated:** 2026-01-18

| Kategorie | Počet |
|-----------|-------|
| **Platform components** | 13 (Button, Input, Checkbox, Card, Logo, Loader, IconButton, TextLink, NavIcon, Icon, TopNav, BottomNav, AppLayout) |
| **Platform hooks** | 7 (useAuth, useMembership, useModuleAccess, useModules, useNavigation, useScrollLock, + useFocusTrap TODO) |
| **Modules** | 3 (mvp0, public-web, studio) |
| **Pages (MVP0)** | 6 (Dnes, Cvicit, Akademie, Pokrok, Profil, Settings) |
| **Design token files** | 7 |
| **Total TS/TSX files** | ~105 |
| **Documentation files** | 40+ |

---

## 🚨 Rules for Updating This File

### ✅ ALWAYS UPDATE when:
1. Vytváříš novou složku v `src/`
2. Přidáváš nový modul (`src/modules/{id}`)
3. Vytváříš novou kategorii komponent
4. Přidáváš nový design token file
5. Měníš strukturu projektu

### 📝 How to Update:
1. Edituj Visual File Tree (ASCII tree)
2. Přidej do Quick Reference tabulky
3. Update Statistics section
4. Update Last Updated date

### 🔗 Related Files to Update:
- `PROJECT_GUIDE.md` (master navigation)
- `docs/architecture/00_OVERVIEW.md` (if architectural change)
- `.cursorrules` (if new standards)

---

## 📚 Further Reading

- **[PROJECT_GUIDE.md](../../PROJECT_GUIDE.md)** - Master navigation
- **[Architecture Overview](./00_OVERVIEW.md)** - System design
- **[Platform Layer](./01_PLATFORM.md)** - Platform API
- **[Module System](./02_MODULES.md)** - How modules work
- **[AI Agent Component Guide](../development/AI_AGENT_COMPONENT_GUIDE.md)** - Component creation

---

**Version History:**
- 1.0 (2026-01-18): Initial creation after MVP0 navigation implementation

---

✅ **Tento dokument je living document - aktualizuj ho při každé struktuře změně!**
