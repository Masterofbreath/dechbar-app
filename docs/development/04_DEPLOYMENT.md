# Deployment Guide

## Deployment Strategy

- **Platform:** Vercel (auto-deploy from GitHub)
- **Domain:** dechbar.cz (DNS via Wedos)
- **Database:** Supabase (hosted)
- **CDN:** Supabase Storage (built-in)

## Vercel Setup

### 1. Connect Repository

1. Go to https://vercel.com
2. Import Git repository
3. Select `dechbar-app` project

### 2. Configure Environment Variables

Add to Vercel:
```
VITE_SUPABASE_URL=https://iqyahebbteiwzwyrtmns.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENV=production
```

### 3. Deploy Settings

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Domain Setup

1. Add custom domain: `dechbar.cz`
2. Configure DNS in Wedos:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

## Deployment Workflow

### Automatic Deployment

```bash
# Push to main branch
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Runs npm run build
# 3. Deploys to production
# 4. Updates dechbar.cz
```

### Preview Deployments

```bash
# Push to feature branch
git push origin feature/new-module

# Vercel creates preview URL
# Example: dechbar-app-git-feature-new-module.vercel.app
```

## Database Migrations

Always migrate database BEFORE deploying code changes:

```bash
# 1. Apply database migrations
supabase db push

# 2. Verify migrations successful
supabase inspect db table-stats

# 3. Then deploy app
git push origin main
```

## Rollback

### Quick Rollback (Vercel)

1. Go to Vercel dashboard
2. Find previous working deployment
3. Click "Promote to Production"

### Database Rollback

```bash
# Create revert migration
supabase migration new revert_feature_x

# Write DROP or ALTER statements
# Push migration
supabase db push
```

## Monitoring

- **Vercel Analytics:** Automatic performance monitoring
- **Supabase Logs:** Database query logs
- **Google Analytics:** User behavior tracking

## Checklist Before Deploy

- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables set in Vercel
- [ ] No console errors in production build
- [ ] Tested on staging/preview URL
- [ ] CHANGELOG.md updated
