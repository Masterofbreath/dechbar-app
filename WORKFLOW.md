# Git Workflow

**Complete documentation:** [docs/development/01_WORKFLOW.md](docs/development/01_WORKFLOW.md)

## Quick Reference

### Branches

- `main` → dechbar.cz (PRODUCTION)
- `dev` → test.dechbar.cz (TEST - 24h+ testing before PROD)
- `feature/*` → Vercel preview URLs (temporary)

### Daily Workflow

```bash
# Start from dev (not main!)
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/my-feature-name

# Make changes, commit frequently
git add .
git commit -m "feat: add my feature"

# Push to create Vercel preview
git push origin feature/my-feature-name
```

### Deploy to TEST

```bash
# Merge to dev for testing
git checkout dev
git merge feature/my-feature-name
git push origin dev
# → Auto-deploy to test.dechbar.cz
```

### Deploy to PROD

**After 24h+ testing on test.dechbar.cz:**

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
# → Auto-deploy to dechbar.cz (PRODUCTION)
```

### Security Rules

- ✅ ALWAYS work on `dev` branch by default
- ❌ NEVER push to `main` without 24h+ testing on dev
- ⚠️ AI Agents: ASK before pushing to `main`!

---

## Full Documentation

See [docs/development/01_WORKFLOW.md](docs/development/01_WORKFLOW.md) for:
- Complete Git branching strategy
- Database migration workflow
- TypeScript types management
- Styling with Tailwind
- Testing procedures
- Deployment details
- Troubleshooting guide
