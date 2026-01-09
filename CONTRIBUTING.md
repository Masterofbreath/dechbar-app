# Contributing to DechBar App

Thank you for your interest in contributing to DechBar App!

## Getting Started

1. **Read** [PROJECT_GUIDE.md](PROJECT_GUIDE.md) - Complete project overview
2. **Setup** your development environment - [Quick Start Guide](docs/development/00_QUICK_START.md)
3. **Understand** the architecture - [Architecture Overview](docs/architecture/00_OVERVIEW.md)
4. **Follow** coding standards - [.cursorrules](.cursorrules)

## Development Workflow

### 1. Fork & Clone (if external contributor)

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/dechbar-app.git
cd dechbar-app
```

### 2. Create Feature Branch

```bash
# Create branch from main
git checkout -b feature/your-feature-name

# Or for bugs
git checkout -b fix/bug-description
```

### 3. Make Changes

- Follow folder structure in [PROJECT_GUIDE.md](PROJECT_GUIDE.md)
- Follow coding standards in [.cursorrules](.cursorrules)
- Write clean, documented code
- Test your changes

### 4. Commit

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat(studio): add exercise builder component"
```

**Commit Message Format:**

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Scopes:**
- `platform` - Platform layer
- `studio` - Studio module
- `auth` - Authentication
- `db` - Database
- `docs` - Documentation
- etc.

### 5. Push & Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Describe changes, link to issues
```

## Code Quality Standards

### Before Committing:

- [ ] `npm run lint` passes
- [ ] `npm run build` passes (TypeScript check)
- [ ] No console errors
- [ ] Tested on mobile (375px)
- [ ] Tested on desktop (1280px)
- [ ] Updated [CHANGELOG.md](CHANGELOG.md)
- [ ] Updated relevant documentation

### Code Style:

- **TypeScript:** Strict mode, explicit types
- **React:** Functional components only
- **Naming:** camelCase (variables), PascalCase (components)
- **Imports:** Use `@/` alias for absolute imports
- **Comments:** Document WHY, not WHAT

See [.cursorrules](.cursorrules) for complete standards.

## Design Guidelines

### 4 Temperaments (MANDATORY)

Every UI feature must satisfy ALL 4 personality types:

- 🎉 **Sangvinik** - Fun, colorful, social
- ⚡ **Cholerik** - Fast, efficient, goal-oriented
- 📚 **Melancholik** - Detailed, quality, informative
- 🕊️ **Flegmatik** - Simple, calm, pressure-free

Read [docs/design-system/01_PHILOSOPHY.md](docs/design-system/01_PHILOSOPHY.md)

### Design Checklist:

- [ ] Sangvinik satisfied? (Is it fun?)
- [ ] Cholerik satisfied? (Is it fast?)
- [ ] Melancholik satisfied? (Enough detail?)
- [ ] Flegmatik satisfied? (Is it simple?)

## Database Changes

### Always Use Migrations:

```bash
# Create migration
supabase migration new add_feature_name

# Write SQL
# Apply
supabase db push
```

### Migration Checklist:

- [ ] `IF NOT EXISTS` for idempotence
- [ ] RLS enabled on table
- [ ] RLS policies created
- [ ] Indexes for foreign keys
- [ ] Comments on table/columns
- [ ] Updated docs/architecture/03_DATABASE.md

See [supabase/migrations/README.md](supabase/migrations/README.md)

## Creating a New Module

Follow [src/modules/README.md](src/modules/README.md) guide.

**Checklist:**
- [ ] MODULE_MANIFEST.json created
- [ ] Added to module registry
- [ ] Added to database `modules` table
- [ ] README.md created
- [ ] CHANGELOG.md created
- [ ] Public API exported in index.ts
- [ ] Access control implemented
- [ ] Documentation updated

## Documentation

### When to Update Docs:

- New feature → Update relevant doc
- Architecture change → Create ADR
- API change → Update API docs
- New module → Update module list

### Documentation Locations:

- **Architecture:** `docs/architecture/`
- **Design system:** `docs/design-system/`
- **Development:** `docs/development/`
- **Product:** `docs/product/`
- **API:** `docs/api/`

## Testing

### Manual Testing Required:

1. **Viewports:**
   - 375px (mobile)
   - 768px (tablet)
   - 1280px (desktop)

2. **Browsers:**
   - Chrome (primary)
   - Safari (iOS compatibility)

3. **Accessibility:**
   - Keyboard navigation works
   - Screen reader friendly

## Pull Request Process

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update CHANGELOG.md
5. Update documentation
6. Create pull request
7. Address review comments
8. Get approval
9. Merge to main

## Questions?

- Check [PROJECT_GUIDE.md](PROJECT_GUIDE.md)
- Check [docs/](docs/)
- Open an issue on GitHub

---

**Thank you for contributing to DechBar App!** 🙏

**Remember:** Quality > Speed. Build it right. 🚀
