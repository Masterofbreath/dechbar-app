# ADR-001: Supabase as Backend Platform

## Status

Accepted

## Date

2026-01-09

## Context

DechBar App needs a backend platform for:
- Database (PostgreSQL)
- Authentication (email, OAuth)
- File storage (audio files, images)
- Real-time subscriptions
- API generation

We need a solution that:
- Scales with user growth
- Minimizes backend development time
- Provides built-in security
- Supports native mobile apps
- Has reasonable pricing

## Decision

Use Supabase as the primary backend platform instead of building custom backend or using Firebase.

## Consequences

### Positive

- **PostgreSQL database** - More powerful than Firestore, supports complex queries
- **Row Level Security (RLS)** - Built-in authorization at database level
- **Auto-generated APIs** - REST and GraphQL APIs created automatically
- **Open source** - Can self-host if needed (avoid vendor lock-in)
- **Real-time subscriptions** - Built-in WebSocket support
- **Storage with CDN** - File storage with global CDN included
- **Type-safe** - Can generate TypeScript types from schema
- **Cost-effective** - Free tier generous, pricing scales well

### Negative

- **Smaller community** than Firebase
- **Younger product** - Some features less mature
- **Learning curve** - Team needs to learn PostgreSQL and RLS
- **Edge Functions** - Serverless functions are newer, fewer examples

### Neutral

- **PostgreSQL required** - Team must learn SQL (not NoSQL)
- **EU hosting** - Good for GDPR, but latency for non-EU users

## Alternatives Considered

### Alternative 1: Firebase

**Pros:**
- Larger community and ecosystem
- More mature, extensive documentation
- Google backing

**Cons:**
- Firestore NoSQL - Less powerful for complex queries
- Vendor lock-in - Hard to migrate away
- Pricing - Can get expensive at scale
- No built-in RLS - Custom security rules

**Decision:** Rejected - PostgreSQL and RLS are more important for our use case.

### Alternative 2: Custom Backend (Node.js + PostgreSQL)

**Pros:**
- Full control
- No vendor lock-in
- Custom optimizations

**Cons:**
- Months of development time
- Ongoing maintenance
- Security implementation from scratch
- No built-in real-time
- Infrastructure management

**Decision:** Rejected - Time to market is critical, Supabase provides 80% of what we need.

### Alternative 3: Hasura + PostgreSQL

**Pros:**
- Similar to Supabase
- GraphQL-first
- Good performance

**Cons:**
- More complex setup
- No built-in storage
- Authentication requires third-party
- Smaller ecosystem than Supabase

**Decision:** Rejected - Supabase is more complete (auth + storage included).

## Implementation Notes

- Use Supabase PostgreSQL for all data storage
- Implement RLS policies on all tables
- Use Supabase Auth for authentication
- Use Supabase Storage for audio files and images
- Generate TypeScript types from database schema
- Use Edge Functions for server-side logic (payment processing, etc.)

## Related Decisions

- [ADR-002: Modular Architecture](002-modular-architecture.md) - Architecture benefits from Supabase's flexibility

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase vs Firebase Comparison](https://supabase.com/alternatives/supabase-vs-firebase)
- [Project Supabase Dashboard](https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns)
