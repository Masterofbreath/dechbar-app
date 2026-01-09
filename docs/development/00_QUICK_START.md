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
