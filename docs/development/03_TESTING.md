# Testing Guide

## Testing Strategy

### 1. Type Checking (TypeScript)

```bash
npm run build
# Catches type errors
```

### 2. Linting (ESLint)

```bash
npm run lint
# Checks code quality
```

### 3. Manual Testing

Test on multiple viewports:
- 375px (iPhone)
- 768px (iPad)
- 1280px (Desktop)

### 4. Browser Testing

- Chrome (primary)
- Safari (iOS compatibility)
- Firefox (standards compliance)

## Testing Checklist

Before committing:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No console errors
- [ ] Tested on mobile viewport (375px)
- [ ] Tested on desktop viewport (1280px)
- [ ] Accessible (keyboard navigation works)

## Future: Automated Tests

Planned:
- Unit tests (Vitest)
- Component tests (React Testing Library)
- E2E tests (Playwright)
- Visual regression tests (Chromatic)
