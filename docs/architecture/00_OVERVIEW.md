# Architecture Overview

## System Architecture

DechBar App follows a **Platform + Modules** architecture pattern:

```
PLATFORM (Foundation Layer)
├── Authentication & Authorization
├── Membership Management
├── Design System Components
├── Payment Processing
└── Shared Services

MODULES (Feature Products)
├── SMART Membership - Smart Recommendations (249 Kč/month)
├── AI COACH Membership - Personal AI Trainer (490 Kč/month)
├── Studio - Exercise Builder (990 Kč lifetime)
├── Challenges - 21-day Programs (490 Kč lifetime)
└── Akademie - Educational Courses (1490 Kč lifetime)
```

## Key Principles

### 1. Modularity
- Each module is an independent product
- Modules can be enabled/disabled independently
- Lazy loading for optimal performance

### 2. Single Source of Truth
- Pricing and module data stored in Supabase database
- Dynamic loading prevents data duplication
- Real-time updates across the application

### 3. Platform API
- Modules communicate with platform only through defined APIs
- No direct imports between modules
- Clear separation of concerns

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand + React Query
- **Routing:** React Router v7

### Backend
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (with CDN)
- **API:** Auto-generated REST + GraphQL
- **Realtime:** Supabase Realtime subscriptions

### Native
- **Wrapper:** Capacitor 6
- **Platforms:** iOS + Android

## Architecture Layers

1. **[Platform Layer](01_PLATFORM.md)** - Shared infrastructure
2. **[Module System](02_MODULES.md)** - Independent products
3. **[Database](03_DATABASE.md)** - Data architecture
4. **[API Design](04_API.md)** - API contracts
5. **[Security](05_SECURITY.md)** - Security model

## Design Decisions

See [ADRs (Architecture Decision Records)](adr/) for detailed reasoning behind major architectural decisions.
