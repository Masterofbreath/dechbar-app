# Architecture Decision Records (ADRs)

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

## Why ADRs?

- **Memory:** Remember why decisions were made
- **Communication:** Share context with team/new developers
- **Exit/Sale:** Show buyers your thoughtful decision-making
- **Accountability:** Track who decided what and when

## ADR Format

See [template.md](template.md) for the standard format.

## List of ADRs

### Accepted

- [ADR-001: Supabase as Backend](001-supabase-backend.md) - 2026-01-09
- [ADR-002: Modular Architecture](002-modular-architecture.md) - 2026-01-09
- [ADR-003: Lazy Loading Modules](003-lazy-loading.md) - 2026-01-09

### Proposed

(None currently)

### Deprecated

(None currently)

## How to Create an ADR

1. Copy `template.md`
2. Rename to `XXX-descriptive-name.md` (next number)
3. Fill out all sections
4. Set status to "Proposed"
5. Discuss with team (if applicable)
6. Update status to "Accepted" or "Rejected"
7. Add to this README

## ADR Lifecycle

```
Proposed → Accepted → Implemented
        ↓
     Rejected

Accepted → Deprecated (when superseded)
```
