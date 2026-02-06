# 📚 DechBar App - Documentation Structure

**Last Updated:** 4. února 2026  
**Status:** ✅ Optimized & Clean  
**Purpose:** Quick reference pro navigaci v dokumentaci

---

## 🎯 PHILOSOPHY

**Less is More:**
- ✅ Minimal essential docs (not comprehensive archives)
- ✅ Current state only (no historical version logs)
- ✅ Task-focused guides (not general overviews)
- ✅ Git history for details (not separate archive folders)

**Result:** Clean structure, fast onboarding, no confusion.

---

## 📁 ROOT DOCUMENTS (10 Essential)

| Document | Lines | Purpose | Who Reads |
|----------|-------|---------|-----------|
| **README.md** | 224 | Project overview, tech stack, quick start | Everyone (first contact) |
| **PROJECT_GUIDE.md** | 997 | Master navigation, decision trees | AI Agents, new devs |
| **CHANGELOG.md** | ~400 | Version history (semver) | Devs, agents |
| **BUGS.md** | 95 | Active bug tracker | Team |
| **CONTRIBUTING.md** | 223 | Contribution guidelines | External contributors |
| **WORKFLOW.md** | 70 | Git workflow (LOCAL→PREVIEW→PROD) | All devs, agents |
| **COMPLETE_TESTING_GUIDE.md** | 401 | E2E testing for Challenge flow | QA, agents |
| **MOBILE_TESTING_GUIDE.md** | 284 | Test localhost on mobile devices | Devs |
| **EDGE_FUNCTIONS_TESTING_GUIDE.md** | 279 | Test Supabase Edge Functions | Backend devs |
| **PROD_SUPABASE_SETUP.md** | 502 | Production Supabase setup | DevOps |

**Total:** 3475 lines (focused, no fluff)

---

## 📂 ORGANIZED DOCUMENTATION (/docs/)

### **Architecture** (`docs/architecture/`)
```
00_OVERVIEW.md           - System architecture overview
01_PLATFORM.md           - Platform layer specs
02_MODULES.md            - Module system design
03_DATABASE.md           - Complete DB schema (12 tables)
04_DATABASE_MIGRATIONS_LOG.md - Migration tracking
05_DATABASE_QUICK_REFERENCE.md - Quick queries
adr/                     - Architecture Decision Records
```

### **Design System** (`docs/design-system/`)
```
00_OVERVIEW.md           - Design system overview
01_PHILOSOPHY.md         - ⭐ 4 Temperaments (CRITICAL!)
02_COLORS.md             - Color palette
03_TYPOGRAPHY.md         - Font system
04_SPACING.md            - Spacing scale
05_BREAKPOINTS.md        - Responsive breakpoints
06_COMPONENTS.md         - Component library
07_ICONS.md              - Icon system
08_ANIMATIONS.md         - Animation guidelines
components/              - Component API docs
```

### **Development** (`docs/development/`)
```
00_QUICK_START.md        - Setup guide
01_WORKFLOW.md           - Development workflow
02_SUPABASE.md           - Supabase CLI guide
03_TESTING.md            - Testing strategy
04_DEPLOYMENT.md         - Deployment process
05_DEBUGGING.md          - Debug guide
AI_AGENT_ONBOARDING.md   - ⭐ Universal agent onboarding
AI_AGENT_COMPONENT_GUIDE.md - How to create components
HMR_GUIDE.md             - Vite HMR troubleshooting
agent-tests/             - Task-specific Study Guides
implementation-logs/     - Historical implementation logs
```

### **Brand** (`docs/brand/`)
```
VISUAL_BRAND_BOOK.md     - ⭐ Complete visual identity
BRAND_COLORS.md          - Color specifications
TONE_OF_VOICE.md         - ⭐ Communication style
COMPARISON.md            - Old vs new brand comparison
```

### **Marketing** (`docs/marketing/`)
```
ecomail/                 - Ecomail integration
├── README.md            - Navigation
├── 00_MASTER.md         - ⭐ Credentials + current state
├── 01_ARCHITECTURE.md   - System design
├── 02_TAXONOMY.md       - Lists, tags, fields
├── 03_TROUBLESHOOTING.md - Debug guide
├── QUICK_REFERENCE.md   - Fast lookups
├── INDEX.md             - Complete map
└── archive/             - Old docs (18 files)

TRACKING_VERIFICATION_GUIDE.md - GA + Ecomail tracking
```

### **Product** (`docs/product/`)
```
VISION.md                - Product vision
ROADMAP.md               - Product roadmap
MODULES.md               - Module pricing (refs DB)
METRICS.md               - KPIs and success metrics
MARKET.md                - Market analysis
```

### **API** (`docs/api/`)
```
PLATFORM_API.md          - Platform API reference
MODULE_API.md            - Module API spec
REST.md                  - Supabase REST API
REALTIME.md              - Realtime subscriptions
```

---

## 🤖 FOR NEW AI AGENTS

**Start here (in order):**

```
1. README.md                                  (5 min)
2. PROJECT_GUIDE.md                           (15 min)
3. docs/development/AI_AGENT_ONBOARDING.md    (10 min) ⭐ NEW!
4. docs/brand/VISUAL_BRAND_BOOK.md            (5 min)
5. docs/design-system/TONE_OF_VOICE.md        (5 min)
6. docs/design-system/01_PHILOSOPHY.md        (5 min)

= 45 minutes total ✅

Then: Find your task type → Read Study Guide → Task-specific docs only
```

---

## 🧭 QUICK NAVIGATION

| I Need To... | Go To |
|--------------|-------|
| **Understand project** | README.md → PROJECT_GUIDE.md |
| **Onboard as agent** | docs/development/AI_AGENT_ONBOARDING.md |
| **Find where code goes** | PROJECT_GUIDE.md → Decision trees |
| **Check database schema** | docs/architecture/03_DATABASE.md |
| **Understand design system** | docs/design-system/00_OVERVIEW.md |
| **Learn brand guidelines** | docs/brand/VISUAL_BRAND_BOOK.md |
| **Test features** | COMPLETE_TESTING_GUIDE.md |
| **Deploy to production** | WORKFLOW.md + PROD_SUPABASE_SETUP.md |
| **Debug Ecomail** | docs/marketing/ecomail/03_TROUBLESHOOTING.md |
| **Debug HMR** | docs/development/HMR_GUIDE.md |

---

## 📊 DOCUMENTATION METRICS

### **Before Cleanup (3.2.2026)**
```
ROOT .md files: 70
Total lines: ~20,000
Ecomail docs: 18 scattered
Agent onboarding: Component-specific (confusing)
Context noise: Very high
```

### **After Cleanup (4.2.2026)**
```
ROOT .md files: 10 (86% reduction) ✅
Total lines: 3,475 (essential only)
Ecomail docs: 4 core + 5 meta (organized)
Agent onboarding: Universal (clear & focused)
Context noise: Minimal ✅
```

**Improvement:** 
- 86% fewer ROOT files
- 82% fewer lines in ROOT
- 100% faster agent onboarding (45 min vs 3 hours)

---

## 🗑️ WHAT WAS DELETED (60 files)

**Categories:**
- Version logs (40 files) - KP, Modal, Session Engine bugfixes
- Implementation summaries (8 files) - Historical feature summaries
- One-time docs (12 files) - Localization, old onboardings, polish logs

**Why Delete (not Archive):**
- ✅ Git history preserves everything
- ✅ Archive = temptation for agents to read (confusion)
- ✅ Clean structure = clear focus
- ✅ Restore from git if truly needed (unlikely)

**Details:** See `docs/CLEANUP_LOG_2026-02-04.md`

---

## ✅ VERIFICATION

**Essential docs present:**
```bash
ls /Users/DechBar/dechbar-app/*.md
# Should show exactly 10 files
```

**New docs created:**
```bash
ls docs/development/AI_AGENT_ONBOARDING.md
ls docs/development/HMR_GUIDE.md
# Both should exist
```

**Ecomail organized:**
```bash
ls docs/marketing/ecomail/*.md | wc -l
# Should show 9 files
```

---

## 🔄 MAINTENANCE

**Update this document when:**
- ✅ Adding new essential doc to ROOT
- ✅ Moving docs between folders
- ✅ Reorganizing docs/ structure
- ✅ Major documentation changes

**Monthly review:**
- Check for new .md files in ROOT (should remain ~10)
- Archive any new version logs promptly
- Keep documentation current

---

**Status:** ✅ Clean, organized, maintainable

*Last cleanup: 4. února 2026*
