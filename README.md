# DechBar App - React + Supabase + Capacitor

⚠️ **FOR AI AGENTS - CRITICAL:**

**Your workspace is ONLY this folder:** `/Users/DechBar/dechbar-app/`

**DO NOT work in:**
- ❌ `/Users/DechBar/` (parent - multi-project workspace)
- ❌ `/Users/DechBar/wp-content/` (WordPress project - different codebase)
- ❌ `/Users/DechBar/FOUNDATION/` (WordPress framework - not relevant here)

**Work ONLY in:**
- ✅ `/Users/DechBar/dechbar-app/` (THIS FOLDER!)
- ✅ All your files, docs, code go HERE inside dechbar-app/

**Start reading:** `README.md` (this file) → `PROJECT_GUIDE.md` → `docs/development/AI_AGENT_ONBOARDING.md`

---

## 🚀 Modern Native Mobile App

Dechová cvičení jako native mobile app (iOS + Android) s modulární architekturou.

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Custom design system
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **State:** Zustand
- **Routing:** React Router v6
- **Native:** Capacitor 6

## 📁 Project Structure

```
src/
├── platform/        # Shared infrastructure
│   ├── auth/        # Authentication
│   ├── components/  # Design system components (Button, Input, Checkbox, etc.)
│   ├── membership/  # Module ownership
│   └── payments/    # GoPay, Stripe
├── modules/         # Feature modules (products)
│   ├── studio/      # Exercise builder
│   ├── challenges/  # 21-day challenges
│   └── ...
├── styles/          # Global styles and component CSS
│   ├── components/  # Dedicated CSS per component (button.css, input.css, etc.)
│   ├── globals.css  # Tailwind + base styles
│   └── modals.css   # Modal-specific shared styles
└── app/             # App entry point

docs/
├── design-system/
│   ├── components/  # API documentation for Platform components
│   └── ...
└── development/
    ├── implementation-logs/  # History of implementations and refactorings
    └── AI_AGENT_COMPONENT_GUIDE.md  # Complete guide for creating components
```

## 🎨 Design Philosophy

**Brand Book 2.0:** Dark-first premium tech-wellbeing aesthetic

- **Colors:** Teal primary (#2CBEC6), Gold accent (#D6A23A)
- **Typography:** Inter font family
- **Theme:** Dark mode default (#121212 background)
- **Principles:** Calm by Default, One Strong CTA, Less is More

**4 Temperaments:** Every feature designed for all personality types
- 🎉 Sangvinik (fun, playful)
- ⚡ Cholerik (fast, efficient)
- 📚 Melancholik (detailed, quality)
- 🕊️ Flegmatik (calm, simple)

### Design Documentation

- **Complete guidelines:** [Visual Brand Book](/docs/brand/VISUAL_BRAND_BOOK.md)
- **Color specifications:** [Brand Colors](/docs/brand/BRAND_COLORS.md)
- **Migration history:** [Old vs. New Comparison](/docs/brand/COMPARISON.md)
- **Design system:** [Design System Overview](/docs/design-system/00_OVERVIEW.md)

## 🏗️ Architecture

```
PLATFORMA (auth, membership, design, payments)
  ↓
MODULY (independent products, API communication)
  ├── Studio - 990 Kč lifetime
  ├── Challenges - 490 Kč/pack lifetime
  └── AI Coach - 490 Kč/month subscription
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env.local from example
cp .env.local.example .env.local

# Add your Supabase credentials to .env.local

# Start dev server
npm run dev
```

### Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📱 Native Build (Capacitor)

```bash
# Install Capacitor (when ready)
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init

# Add platforms
npx cap add ios
npx cap add android

# Build and sync
npm run build
npx cap sync

# Open in Xcode/Android Studio
npx cap open ios
npx cap open android
```

## 🎨 Design System

Standalone design system built for mobile-first:
- **Breakpoints:** 320px, 480px, 768px, 1024px, 1440px
- **Colors:** Brand Gold (#F8CA00), neutrals, semantic
- **Modern effects:** Glassmorphism, shadows, spring animations
- **Philosophy:** Design for 4 Temperaments (all personality types)

See [Design System Documentation](docs/design-system/00_OVERVIEW.md)

## 🔐 Environment Variables

Create `.env.local` (never commit!):

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENV=development
```

## 📚 Documentation

**Start here:** [PROJECT_GUIDE.md](PROJECT_GUIDE.md) - Complete project navigation

### For Developers:
- **[WORKFLOW.md](WORKFLOW.md)** ⭐ - **Git workflow (LOCAL → PREVIEW → PROD) - READ FIRST!**
- **[Quick Start](docs/development/00_QUICK_START.md)** - Setup guide
- **[Development Guide](docs/development/01_WORKFLOW.md)** - How to work

### For AI Agents:
- **[AI Agent Component Guide](docs/development/AI_AGENT_COMPONENT_GUIDE.md)** ⭐ **NEW!** - Complete guide for creating Platform components
- **[Component Library Reference](docs/design-system/components/README.md)** - API documentation for all components
- **[Implementation Logs](docs/development/implementation-logs/README.md)** - History of implementations and design decisions
- **[Database Management](docs/development/02_SUPABASE.md)** - Supabase CLI
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

### For AI Agents:
- **[PROJECT_GUIDE.md](PROJECT_GUIDE.md)** - Master navigation (START HERE!)
- **[WORKFLOW.md](WORKFLOW.md)** ⭐ - **Git workflow (MANDATORY!)**
- **`.cursorrules`** - AI coding standards
- **[Platform API](docs/api/PLATFORM_API.md)** - Available platform services
- **[Module System](src/modules/README.md)** - How to create modules

### Documentation Sections:
- 🏗️ **Architecture:** [docs/architecture/](docs/architecture/)
- 🎨 **Design System:** [docs/design-system/](docs/design-system/)
- 💻 **Development:** [docs/development/](docs/development/)
- 📦 **Product:** [docs/product/](docs/product/)
- 🔌 **API:** [docs/api/](docs/api/)

### Quick Links:
- 🗄️ **Database:** [Supabase Dashboard](https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns)
- 📊 **Database Schema:** [docs/architecture/03_DATABASE.md](docs/architecture/03_DATABASE.md)
- 📦 **Migrations:** [supabase/migrations/](supabase/migrations/)
- 🎨 **Design Tokens:** [src/styles/design-tokens/](src/styles/design-tokens/)

## 🧪 Testing

- TypeScript type checking: `npm run build`
- ESLint: `npm run lint`
- Manual testing: Mobile viewports (375px, 768px, 1280px)

## 🚀 Deployment

- **Hosting:** Vercel (auto-deploy from GitHub)
- **Domain:** dechbar.cz (DNS via Wedos)
- **CDN:** Supabase Storage (built-in)

## 📝 Important Notes

- ⚠️ **NOT a WordPress project** - Standalone React app
- 🎨 **Design for 4 temperaments** - ALWAYS (see [Philosophy](docs/design-system/01_PHILOSOPHY.md))
- 📱 **Mobile-first** - Optimize for mobile, scale up
- 🔌 **Modular** - Loosely coupled, lazy loaded
- 💰 **Pricing in database** - Never hardcoded (Single Source of Truth)
- 🔐 **Security-first** - RLS enabled on all tables
- 📚 **Document everything** - Code should be self-explanatory

## 🗺️ Next Steps

1. **Setup project:** Follow [Quick Start Guide](docs/development/00_QUICK_START.md)
2. **Explore codebase:** Review [PROJECT_GUIDE.md](PROJECT_GUIDE.md)
3. **Start contributing:** Read [CONTRIBUTING.md](CONTRIBUTING.md)
4. **Build features:** Follow [Development Workflow](docs/development/01_WORKFLOW.md)

---

**Quality > Speed** 🚀
