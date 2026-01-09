# DechBar App - Project Guide

> **⭐ START HERE** - Complete navigation for developers & AI agents

**Version:** 0.1.0  
**Last Updated:** 2026-01-09  
**Status:** Development (Pre-launch)

---

## 🎯 Quick Navigation

### For New AI Agents (READ IN ORDER):

1. **This file** (`PROJECT_GUIDE.md`) - Complete project overview
2. **[Architecture Overview](docs/architecture/00_OVERVIEW.md)** - System architecture
3. **[Platform API](docs/api/PLATFORM_API.md)** - What platform provides
4. **[Module System](src/modules/README.md)** - How modules work
5. **[.cursorrules](.cursorrules)** - Coding standards and rules
6. **Ready to code!** 🚀

### For New Developers:

1. **[README.md](README.md)** - Project overview
2. **[Quick Start](docs/development/00_QUICK_START.md)** - Setup instructions
3. **[Development Workflow](docs/development/01_WORKFLOW.md)** - How to work
4. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
5. **Start developing!** 🛠️

---

## 📁 Project Structure

### Complete Folder Map:

```
dechbar-app/
│
├── 📄 PROJECT_GUIDE.md           ← ⭐ THIS FILE (master navigation)
├── 📄 README.md                   ← Public readme
├── 📄 CHANGELOG.md                ← Change history
├── 📄 BUGS.md                     ← Bug tracker
├── 📄 CONTRIBUTING.md             ← Contribution guide
├── 📄 LICENSE                     ← License (MIT)
├── 📄 .cursorrules                ← AI agent rules
├── 📄 package.json                ← Dependencies (v0.1.0)
│
├── 📁 docs/                       ← DOCUMENTATION
│   ├── 📁 architecture/           ← Technical architecture
│   │   ├── 00_OVERVIEW.md
│   │   ├── 01_PLATFORM.md
│   │   ├── 02_MODULES.md
│   │   ├── 03_DATABASE.md
│   │   ├── 04_API.md
│   │   ├── 05_SECURITY.md
│   │   └── adr/                   ← Architecture Decision Records
│   │       ├── README.md
│   │       ├── template.md
│   │       ├── 001-supabase-backend.md
│   │       ├── 002-modular-architecture.md
│   │       └── 003-lazy-loading.md
│   │
│   ├── 📁 design-system/          ← Design system (standalone)
│   │   ├── 00_OVERVIEW.md
│   │   ├── 01_PHILOSOPHY.md       ← 4 Temperaments (CRITICAL!)
│   │   ├── 02_COLORS.md
│   │   ├── 03_TYPOGRAPHY.md
│   │   ├── 04_SPACING.md
│   │   ├── 05_BREAKPOINTS.md
│   │   ├── 06_COMPONENTS.md
│   │   ├── 07_ICONS.md
│   │   └── 08_ANIMATIONS.md
│   │
│   ├── 📁 development/            ← Developer guides
│   │   ├── 00_QUICK_START.md
│   │   ├── 01_WORKFLOW.md
│   │   ├── 02_SUPABASE.md
│   │   ├── 03_TESTING.md
│   │   ├── 04_DEPLOYMENT.md
│   │   └── 05_DEBUGGING.md
│   │
│   ├── 📁 product/                ← Business documentation
│   │   ├── VISION.md              ← Product vision (template)
│   │   ├── ROADMAP.md             ← Product roadmap
│   │   ├── MODULES.md             ← Module pricing (refs DB)
│   │   ├── METRICS.md             ← KPIs and success metrics
│   │   └── MARKET.md              ← Market analysis
│   │
│   └── 📁 api/                    ← API documentation
│       ├── PLATFORM_API.md        ← Platform API reference
│       ├── MODULE_API.md          ← Module API spec
│       ├── REST.md                ← Supabase REST API
│       └── REALTIME.md            ← Realtime subscriptions
│
├── 📁 src/                        ← SOURCE CODE
│   ├── 📁 config/                 ← Configuration
│   │   ├── index.ts
│   │   ├── environment.ts         ← Env vars (typed)
│   │   └── constants.ts           ← App constants (NOT pricing!)
│   │
│   ├── 📁 platform/               ← PLATFORM LAYER
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   ├── index.ts               ← Public API exports
│   │   ├── auth/                  ← Authentication
│   │   │   ├── index.ts
│   │   │   ├── useAuth.ts
│   │   │   └── types.ts
│   │   ├── membership/            ← Membership & access control
│   │   │   ├── index.ts
│   │   │   ├── useMembership.ts
│   │   │   └── useModuleAccess.ts
│   │   ├── modules/               ← Module registry
│   │   │   ├── index.ts
│   │   │   ├── useModules.ts      ← Load modules from DB
│   │   │   └── types.ts
│   │   ├── components/            ← Shared UI components
│   │   ├── layouts/               ← App layouts
│   │   ├── api/                   ← API utilities
│   │   │   └── supabase.ts
│   │   └── types/                 ← Shared types
│   │
│   ├── 📁 modules/                ← FEATURE MODULES
│   │   ├── README.md              ← Module system guide
│   │   └── studio/                ← Studio module (example)
│   │       ├── MODULE_MANIFEST.json  ← Module definition
│   │       ├── README.md
│   │       ├── CHANGELOG.md
│   │       ├── index.ts
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── api/
│   │       └── types.ts
│   │
│   ├── 📁 app/                    ← App entry point
│   │   ├── App.tsx
│   │   └── moduleRegistry.ts     ← Module lazy loading
│   │
│   └── 📁 styles/                 ← Global styles
│       ├── globals.css
│       └── design-tokens/         ← Design tokens (standalone)
│           ├── colors.css
│           ├── typography.css
│           ├── spacing.css
│           ├── breakpoints.css
│           ├── shadows.css
│           └── effects.css
│
├── 📁 supabase/                   ← DATABASE
│   ├── config.toml
│   └── migrations/
│       └── README.md              ← Migration guide
│
└── 📁 public/                     ← Static assets

```

---

## 🗺️ WHERE TO FIND THINGS

| What I Need | Where to Look |
|-------------|---------------|
| **Project overview** | [README.md](README.md) |
| **Architecture docs** | [docs/architecture/](docs/architecture/) |
| **Design system** | [docs/design-system/](docs/design-system/) |
| **Dev guides** | [docs/development/](docs/development/) |
| **Business docs** | [docs/product/](docs/product/) |
| **API reference** | [docs/api/](docs/api/) |
| **Database schema** | [docs/architecture/03_DATABASE.md](docs/architecture/03_DATABASE.md) |
| **Database migrations** | [supabase/migrations/](supabase/migrations/) |
| **Platform code** | [src/platform/](src/platform/) |
| **Modules** | [src/modules/](src/modules/) |
| **Config** | [src/config/](src/config/) |
| **Design tokens** | [src/styles/design-tokens/](src/styles/design-tokens/) |

---

## 🔧 WHERE TO ADD THINGS

| Task | Location | Reference |
|------|----------|-----------|
| **Add new feature** | See [01_WORKFLOW.md](docs/development/01_WORKFLOW.md) | Dev guide |
| **Add new module** | See [src/modules/README.md](src/modules/README.md) | Module guide |
| **Add database table** | See [supabase/migrations/README.md](supabase/migrations/README.md) | Migration guide |
| **Report bug** | Add to [BUGS.md](BUGS.md) | Bug tracker |
| **Log change** | Add to [CHANGELOG.md](CHANGELOG.md) | Change log |
| **Document decision** | Create ADR in [docs/architecture/adr/](docs/architecture/adr/) | ADR template |
| **Add component** | [src/platform/components/](src/platform/components/) | Platform layer |
| **Add env variable** | [src/config/environment.ts](src/config/environment.ts) | Config |
| **Add constant** | [src/config/constants.ts](src/config/constants.ts) | Config |

---

## 🏗️ Architecture

### Platform + Modules Pattern

```
┌─────────────────────────────────────────┐
│           PLATFORM LAYER                │
│  (auth, membership, components, api)    │
│                                         │
│  - useAuth()                            │
│  - useMembership()                      │
│  - useModuleAccess()                    │
│  - useModules() ← DB pricing (SSoT)    │
│  - Shared components                    │
└─────────────────────────────────────────┘
            ↓ (Platform API)
┌─────────────────────────────────────────┐
│              MODULES                    │
│  (independent products, lazy loaded)    │
│                                         │
│  Studio     Challenges    AI Coach      │
│  990 Kč     490 Kč       490 Kč/mo     │
│  lifetime   lifetime     subscription   │
└─────────────────────────────────────────┘
```

**Key Concepts:**
- **Platform** = Shared services for all modules
- **Modules** = Independent products (can be enabled/disabled)
- **Lazy loading** = Modules load on-demand
- **Single Source of Truth** = Pricing in database, never hardcoded

---

## 💡 Core Principles

### 1. Single Source of Truth

**Pricing & Module Data:**
- Stored ONLY in Supabase `modules` table
- Loaded dynamically via `useModules()` hook
- Never hardcoded in code or docs

**Why:** Price changes update everywhere instantly.

### 2. Modular Architecture

- Each module = Independent product
- Modules can be sold separately
- Lazy loaded for performance
- Can be enabled/disabled per user

**Why:** Flexible business model, better performance.

### 3. 4 Temperaments Design

Every feature designed for ALL personality types:
- 🎉 Sangvinik (fun, social)
- ⚡ Cholerik (fast, efficient)
- 📚 Melancholik (detailed, quality)
- 🕊️ Flegmatik (simple, calm)

**Why:** Inclusive UX = wider audience.

### 4. Standalone Project

- No external dependencies (was `../FOUNDATION/`, now removed)
- All design tokens internal
- Can be moved/sold independently

**Why:** Portability, easier to sell/transfer.

---

## 🔄 Common Workflows

### Creating a New Feature

1. **Decide layer:** Platform or Module?
   - Shared across modules? → Platform
   - Module-specific? → That module

2. **Write code** in appropriate folder

3. **Update CHANGELOG.md** with changes

4. **Test** (3 viewports, type check, lint)

5. **Commit** to Git

---

### Creating a New Module

1. **Copy template** from [src/modules/README.md](src/modules/README.md)

2. **Create MODULE_MANIFEST.json**

3. **Add to module registry** (`src/app/moduleRegistry.ts`)

4. **Add to database:**
   ```sql
   INSERT INTO modules (id, name, price_czk, price_type, ...)
   VALUES ('my-module', 'My Module', 990, 'lifetime', ...);
   ```

5. **Implement features**

6. **Update CHANGELOG.md**

7. **Create ADR** if architectural decision made

---

### Adding Database Table

1. **Create migration:**
   ```bash
   supabase migration new add_my_table
   ```

2. **Write SQL** in `supabase/migrations/YYYYMMDDHHMMSS_add_my_table.sql`

3. **Include:**
   - CREATE TABLE
   - Enable RLS
   - CREATE POLICY (policies)
   - CREATE INDEX (indexes)
   - COMMENT ON TABLE

4. **Apply migration:**
   ```bash
   supabase db push
   ```

5. **Update** [docs/architecture/03_DATABASE.md](docs/architecture/03_DATABASE.md)

6. **Log** in [CHANGELOG.md](CHANGELOG.md)

---

### Reporting a Bug

1. **Open** [BUGS.md](BUGS.md)

2. **Add bug** using template:
   ```markdown
   ### [BUG-001] Short description
   Module: Platform
   Severity: High
   ...
   ```

3. **Assign** (self or AI Agent)

4. **Fix** and update status to "Fixed"

---

### Making an Architectural Decision

1. **Create ADR** in `docs/architecture/adr/`

2. **Use template** from [adr/template.md](docs/architecture/adr/template.md)

3. **Number it** (next in sequence: 004, 005, etc.)

4. **Document:**
   - Context (why needed)
   - Decision (what chosen)
   - Alternatives (what rejected)
   - Consequences (pros/cons)

5. **Add to ADR list** in [adr/README.md](docs/architecture/adr/README.md)

---

## 🎯 Current Status

### Completed ✅

- [x] Enterprise folder structure
- [x] Documentation system (30+ docs)
- [x] Config management
- [x] Platform layer (auth, membership, modules)
- [x] Design tokens (standalone)
- [x] Module system (template + Studio manifest)
- [x] Tracking systems (CHANGELOG, BUGS, ADRs)
- [x] Supabase CLI integration
- [x] Database schema (6 tables)

### In Progress 🔨

- [ ] Studio module implementation
- [ ] Authentication UI
- [ ] Payment integration
- [ ] Design system components

### Planned 📋

- [ ] Challenges module
- [ ] AI Coach module
- [ ] Akademie module
- [ ] Game module

---

## 🔐 Security Model

- **Authentication:** Supabase Auth
- **Authorization:** Row Level Security (RLS) + RBAC
- **Data access:** RLS policies on ALL tables
- **API keys:** In `.env.local` (never committed)

See [docs/architecture/05_SECURITY.md](docs/architecture/05_SECURITY.md)

---

## 📊 Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | UI framework |
| Build | Vite 7 | Fast builds |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| State | Zustand + React Query | State management |
| Routing | React Router v7 | Navigation |
| Backend | Supabase | Database + Auth + Storage |
| Native | Capacitor 6 | iOS + Android wrapper |
| Hosting | Vercel | Deployment |

---

## 🗄️ Database

**Platform:** Supabase PostgreSQL  
**Project:** `iqyahebbteiwzwyrtmns`  
**Region:** West EU (Ireland)

### Tables (6):

1. **profiles** - User profiles
2. **modules** - Available products (with pricing)
3. **user_modules** - User purchases
4. **memberships** - Membership plans
5. **roles** - User roles (6 types)
6. **user_roles** - User-role assignments

### Managing Database:

- **View data:** [Supabase Dashboard](https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns)
- **Create tables:** `supabase migration new feature_name`
- **Apply changes:** `supabase db push`
- **Schema docs:** [docs/architecture/03_DATABASE.md](docs/architecture/03_DATABASE.md)

---

## 📦 Module System

### Available Modules (5):

| Module | Type | ID | Status |
|--------|------|----|----|
| DechBar STUDIO | Lifetime | `studio` | Template created |
| Výzvy (Challenges) | Lifetime | `challenges` | Planned |
| Akademie | Lifetime | `akademie` | Planned |
| DechBar GAME | Subscription | `game` | Planned |
| AI Coach | Subscription | `ai-coach` | Planned |

### Module Pricing:

**CRITICAL:** Pricing is stored in database (`modules` table), NOT in code.

- View/edit in Supabase Dashboard
- App loads prices via `useModules()` hook
- Changes are live immediately

### How Modules Work:

1. User purchases module (stored in `user_modules` table)
2. User navigates to module route (e.g., `/studio`)
3. App checks access via `useModuleAccess('studio', userId)`
4. If access granted → module loads (lazy loading)
5. Module renders

**See:** [src/modules/README.md](src/modules/README.md)

---

## 🎨 Design System

**Philosophy:** Design for 4 Temperaments (ALWAYS!)

**Design tokens location:** `src/styles/design-tokens/`

- Colors (gold, grays, semantic)
- Typography (system fonts, scales)
- Spacing (4px base unit)
- Breakpoints (mobile-first)
- Shadows (multi-layer)
- Effects (glassmorphism, animations)

**See:** [docs/design-system/00_OVERVIEW.md](docs/design-system/00_OVERVIEW.md)

---

## 🛠️ Development

### Quick Commands:

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Environment Setup:

```bash
# Copy template
cp .env.local.example .env.local

# Add your Supabase credentials
# Get from: https://supabase.com/dashboard/project/.../settings/api
```

### Supabase CLI:

```bash
# Create migration
supabase migration new feature_name

# Apply migrations
supabase db push

# View tables
supabase inspect db table-stats
```

---

## 📚 Essential Documentation

### For AI Agents (Must Read):

1. **[Architecture Overview](docs/architecture/00_OVERVIEW.md)** - System design
2. **[Platform API](docs/api/PLATFORM_API.md)** - Available hooks/components
3. **[Module System](src/modules/README.md)** - How modules work
4. **[4 Temperaments](docs/design-system/01_PHILOSOPHY.md)** - UX philosophy
5. **[Database Schema](docs/architecture/03_DATABASE.md)** - DB structure
6. **[.cursorrules](.cursorrules)** - Coding standards

### For Developers (Must Read):

1. **[Quick Start](docs/development/00_QUICK_START.md)** - Setup guide
2. **[Workflow](docs/development/01_WORKFLOW.md)** - How to develop
3. **[Supabase CLI](docs/development/02_SUPABASE.md)** - DB management
4. **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute

---

## 🔍 FAQs

### Where do I add a new feature?

**Platform feature** (shared by all modules):
→ `src/platform/[auth|membership|components|etc]/`

**Module feature** (specific to one product):
→ `src/modules/[module-id]/`

### Where are prices defined?

**In Supabase database** (`modules` table).

Never hardcode prices. Load via `useModules()` hook.

### How do I create a new module?

See [src/modules/README.md](src/modules/README.md) for complete guide.

### How do I add a database table?

See [supabase/migrations/README.md](supabase/migrations/README.md) for migration guide.

### Where do I log changes?

**Global changes:** [CHANGELOG.md](CHANGELOG.md)  
**Platform changes:** [src/platform/CHANGELOG.md](src/platform/CHANGELOG.md)  
**Module changes:** `src/modules/[module]/CHANGELOG.md`

### How do I report a bug?

Add to [BUGS.md](BUGS.md) using the template provided.

### What if I need to make an architectural decision?

Create an ADR in [docs/architecture/adr/](docs/architecture/adr/) using [template.md](docs/architecture/adr/template.md).

---

## 🚀 Getting Started (Step-by-Step)

### For AI Agents:

```
1. Read this file (PROJECT_GUIDE.md)
2. Read docs/architecture/00_OVERVIEW.md
3. Read docs/api/PLATFORM_API.md
4. Read src/modules/README.md
5. Read .cursorrules
6. You're ready to create features!
```

### For Developers:

```
1. Read README.md
2. Run: npm install
3. Setup .env.local
4. Run: npm run dev
5. Read docs/development/00_QUICK_START.md
6. Start coding!
```

---

## 📞 Support & Resources

### Documentation
- **This guide:** Complete project map
- **Architecture:** [docs/architecture/](docs/architecture/)
- **API Reference:** [docs/api/](docs/api/)

### External Resources
- **Supabase Dashboard:** https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **React Router:** https://reactrouter.com/
- **Zustand:** https://docs.pmnd.rs/zustand

---

## 🎯 Success Criteria

This project is ready for launch when:

- [ ] Authentication flow complete
- [ ] At least 1 module fully implemented
- [ ] Payment integration working
- [ ] Mobile-optimized (tested on real devices)
- [ ] RLS policies verified
- [ ] No console errors
- [ ] All 4 temperaments satisfied in UX
- [ ] Documentation complete
- [ ] VISION.md filled out

---

**Welcome to DechBar App!** 🚀

**Quality > Speed** - Build it right, build it once.

---

*Last updated: 2026-01-09*
