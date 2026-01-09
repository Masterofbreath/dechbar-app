# Metrics & KPIs

> **Status:** Template - Define your metrics

---

## North Star Metric

**The ONE metric that matters most:**

[To be defined - examples:]
- Monthly Active Users (MAU) completing 5+ sessions
- Weekly Active Users (WAU)
- Revenue per user (ARPU)

---

## Product Metrics

### Engagement
- [ ] Daily Active Users (DAU)
- [ ] Weekly Active Users (WAU)
- [ ] Monthly Active Users (MAU)
- [ ] DAU/MAU ratio (stickiness)
- [ ] Sessions per user per week
- [ ] Average session duration

### Activation
- [ ] % of signups who complete first exercise
- [ ] Time to first exercise (TTFE)
- [ ] % of users who return day 2

### Retention
- [ ] Day 1 retention
- [ ] Day 7 retention
- [ ] Day 30 retention
- [ ] Monthly churn rate

### Conversion
- [ ] Free → Paid conversion rate
- [ ] Module purchase rate
- [ ] Average modules per user
- [ ] Time to first purchase

---

## Business Metrics

### Revenue
- [ ] Monthly Recurring Revenue (MRR)
- [ ] Annual Recurring Revenue (ARR)
- [ ] Lifetime Value (LTV)
- [ ] Average Revenue Per User (ARPU)

### Growth
- [ ] User growth rate (MoM)
- [ ] Revenue growth rate (MoM)
- [ ] Viral coefficient (K-factor)

### Costs
- [ ] Customer Acquisition Cost (CAC)
- [ ] LTV/CAC ratio (target: >3)
- [ ] Server costs per user
- [ ] AI tokens cost per user (for AI Coach)

---

## Module-Specific Metrics

### Studio
- Exercises created per user
- Active exercises ratio
- Session completion rate

### Challenges
- Challenge completion rate
- Average challenge duration
- Repeat purchase rate

### AI Coach
- Conversations per user
- Retention rate
- Token usage per user

---

## Success Targets

### Year 1 (2026)
- Users: [Target]
- MAU: [Target]
- Revenue: [Target CZK/month]
- Churn: <5%

### Year 2 (2027)
- Users: [Target]
- MAU: [Target]
- Revenue: [Target CZK/month]
- International: [% of revenue]

---

## Tracking Implementation

### Tools
- Google Analytics 4 (user behavior)
- PostHog (product analytics)
- Supabase Dashboard (database stats)
- Vercel Analytics (performance)

### Events to Track

```typescript
// User events
track('user_signup', { method: 'email' });
track('exercise_completed', { duration: 300 });
track('module_purchased', { module_id: 'studio', price: 990 });

// Business events
track('payment_successful', { amount: 990, provider: 'gopay' });
track('subscription_renewed', { module_id: 'ai-coach' });
```

---

**Update this document monthly with actual metrics once launched.**
