# Modules & Pricing

## Pricing Management

**All pricing is stored in Supabase database** (`modules` table).

Prices are NEVER hardcoded. The app loads pricing dynamically from the database.

### To View/Edit Pricing:

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns)
2. Navigate to "Table Editor"
3. Open `modules` table
4. Edit `price_czk` and `price_type` columns
5. Changes are live immediately (app reloads from DB)

---

## Available Products

Pricing shown below is REFERENCE ONLY - check database for current values.

### Membership Tiers (Subscription)

#### 1. SMART
- **ID:** `membership-smart`
- **Type:** Monthly/Annual subscription
- **Pricing:** 
  - Monthly: 249 Kč/měsíc
  - Annual: 125 Kč/měsíc (1,499 Kč ročně, úspora 1,488 Kč)
- **Features:**
  - BOLT skóre tracking
  - Smart doporučení tréninků
  - Grafy a statistiky pokroku
  - 50+ audio programů
- **Description:** Inteligentní doporučení pro pokročilé

#### 2. AI COACH
- **ID:** `membership-ai-coach`
- **Type:** Monthly/Annual subscription
- **Pricing:** 
  - Monthly: 490 Kč/měsíc
  - Annual: 245 Kč/měsíc (2,940 Kč ročně, úspora 2,940 Kč)
- **Features:**
  - Všechno ze SMART
  - Všech 100+ programů
  - AI trenér přizpůsobený tobě
  - Pokročilé analýzy (HRV, trendy)
  - Prioritní podpora
- **Description:** Tvůj osobní AI trenér

---

### Lifetime Products

#### 3. DechBar STUDIO
- **ID:** `studio`
- **Type:** Lifetime purchase
- **Reference Price:** 990 Kč
- **Description:** Build custom breathing exercises

#### 4. Výzvy (Challenges)
- **ID:** `challenges`
- **Type:** Lifetime purchase
- **Reference Price:** 490 Kč
- **Description:** 21-day breathing challenges

#### 5. Akademie
- **ID:** `akademie`
- **Type:** Lifetime purchase
- **Reference Price:** 1490 Kč
- **Description:** Educational courses and lessons

---

## Pricing Strategy

### Lifetime vs. Subscription

**Lifetime products:**
- One-time payment
- User owns forever
- Examples: Studio, Challenges, Akademie
- Stored in: `user_modules` table

**Subscription products (Membership Tiers):**
- Monthly or annual recurring
- Access while active
- Examples: SMART, AI COACH
- Stored in: `memberships` table (ONE active tier per user)

**Key Difference:**
- User has ONE active membership tier (ZDARMA → SMART → AI_COACH)
- User can own MULTIPLE lifetime modules

### Bundle Pricing

Consider offering bundles:
- All lifetime modules: 2500 Kč (save 500 Kč)
- All subscriptions: 550 Kč/month (save 90 Kč)

Update in database `modules` table or create separate `bundles` table.

---

## Module Dependencies

Some modules may require others:

```
Akademie → requires Studio (učení pokročilých technik)
AI Coach → can work standalone
Game → can work standalone
```

Defined in `MODULE_MANIFEST.json` for each module.

---

## Free Tier (ZDARMA)

Users with ZDARMA membership get:
- Access to basic features
- Limited exercises (3?)
- Trial of premium features (7 days?)

Define in `memberships` table or module-specific logic.

---

## Changing Prices

### Steps:

1. Open Supabase Dashboard
2. Edit `modules` table
3. Update `price_czk` column
4. Save
5. App automatically shows new price

### Version History:

Log all price changes in `CHANGELOG.md`:
```markdown
## [0.2.1] - 2026-03-15
### Changed
- Studio price: 990 Kč → 890 Kč (launch promotion)
```

---

## A/B Testing Prices (Future)

Supabase Edge Functions can serve different prices to different users for testing.

---

**Remember:** Never hardcode prices in code or docs. Always load from database.
