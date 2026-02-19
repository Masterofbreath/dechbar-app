# Deployment Guide - Digitální Ticho Landing Page

**Status:** ✅ Ready for deployment  
**Dev Server:** http://localhost:5174/digitalni-ticho  
**Target Launch:** Dnes večer (2026-02-17)

---

## Pre-Deployment Checklist

### Code ✅
- [✅] All components implemented (12 components)
- [✅] CSS compiled (digitalni-ticho.css)
- [✅] Messages config complete
- [✅] Routes added
- [✅] TypeScript passes (no linter errors)
- [✅] Imports resolved

### Content ⚠️
- [ ] **Audio preview files** - CRITICAL! Upload to `/public/audio/`
- [ ] **Company info** - Replace IČO, Sídlo, Telefon v footeru
- [ ] **Legal pages** - GDPR, VOP musí existovat

### Stripe ⚠️
- [ ] **Price created** v Stripe Dashboard (990 CZK)
- [ ] **Price ID** přidán do `.env.local`
- [ ] **Webhook** configured
- [ ] **Test mode** otestován

---

## STEP 1: Příprava Audio Preview Files

### Option A: Máš hotové audio soubory

```bash
# Copy files to public/audio/
cp ~/path/to/tech-minimal.mp3 /Users/DechBar/dechbar-app/public/audio/digitalni-ticho-preview-tech-minimal.mp3
cp ~/path/to/film-ambient.mp3 /Users/DechBar/dechbar-app/public/audio/digitalni-ticho-preview-film-ambient.mp3

# Verify
ls -lh /Users/DechBar/dechbar-app/public/audio/digitalni-ticho*
```

### Option B: Nemáš audio soubory (fallback)

**Disable Audio Preview dočasně:**

Soubor: `src/modules/public-web/pages/DigitalniTichoPage.tsx`

Zakomentuj:
```tsx
{/* 3. Audio Preview - CRITICAL pro audio-only produkt */}
{/* <DigitalniTichoAudioPreview /> */}
```

**Nebo:**

Vytvoř placeholder MP3 (silence):
```bash
# Generate 30s silence MP3
ffmpeg -f lavfi -i anullsrc=r=48000:cl=stereo -t 30 -q:a 2 /Users/DechBar/dechbar-app/public/audio/digitalni-ticho-preview-tech-minimal.mp3
cp /Users/DechBar/dechbar-app/public/audio/digitalni-ticho-preview-tech-minimal.mp3 /Users/DechBar/dechbar-app/public/audio/digitalni-ticho-preview-film-ambient.mp3
```

---

## STEP 2: Update Company Info

**Soubor:** `src/modules/public-web/components/digitalni-ticho/DigitalniTichoFooter.tsx`

**Replace placeholder:**

```tsx
{/* Czech-specific: Company Info (IČO, Sídlo, Telefon) */}
<div className="digitalni-ticho-footer__company-info">
  DechBar s.r.o.<br />
  IČO: [REAL_ICO]<br />
  Sídlo: [REAL_ADDRESS], Česká republika<br />
  Telefon: +420 [REAL_PHONE]
</div>
```

---

## STEP 3: Stripe Setup

### 3.1 Create Product & Price

**Stripe Dashboard:** https://dashboard.stripe.com

1. Navigate to: **Products → + Add Product**
2. Fill:
   ```
   Name: Digitální ticho
   Description: 21denní audio program strukturovaného klidu
   ```
3. Price:
   ```
   Type: One time
   Amount: 990 CZK
   Currency: CZK
   ```
4. Save → Copy **Price ID** (začíná `price_`)

### 3.2 Add to Environment

**Soubor:** `/Users/DechBar/dechbar-app/.env.local`

```bash
VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_xxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT:** Restart dev server po změně `.env.local`!

```bash
# Kill current dev server
# Ctrl+C v terminálu

# Start again
npm run dev
```

### 3.3 Configure Webhook

**Stripe Dashboard:** Developers → Webhooks

**Endpoint URL:**
```
https://[YOUR_SUPABASE_PROJECT].supabase.co/functions/v1/stripe-webhooks
```

**Events:**
- `payment_intent.succeeded`
- `checkout.session.completed`

**Copy** webhook signing secret → Add to Supabase:
```bash
cd /Users/DechBar/dechbar-app
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## STEP 4: Local Testing

### 4.1 Start Dev Server

```bash
cd /Users/DechBar/dechbar-app
npm run dev
# Opens on: http://localhost:5174/
```

### 4.2 Navigate to Landing Page

```
http://localhost:5174/digitalni-ticho
```

### 4.3 Test Checklist

**Visual:**
- [ ] Breathing animation běží
- [ ] Headline tight letter-spacing
- [ ] Gold CTA button glow
- [ ] Dark mode správný (#121212 background)

**Functionality:**
- [ ] Click CTA → Stripe modal otevře
- [ ] Audio preview (pokud files nahrané) → plays
- [ ] FAQ accordion → expand/collapse
- [ ] Scrolling smooth

**Stripe:**
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Redirect to: `/digitalni-ticho/dekujeme`
- [ ] Success page displays

**Console:**
- [ ] No errors (F12 → Console)
- [ ] No 404s (Network tab)

---

## STEP 5: Deploy to PREVIEW (test branch)

### 5.1 Git Commit

```bash
cd /Users/DechBar/dechbar-app
git checkout test

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "feat: Add Digitální ticho landing page

- Hero with breathing animation (8s cycle)
- Stripe Embedded Checkout (990 Kč)
- Audio preview (Tech Minimal + Film Ambient)
- FAQ (TOP 10 objections)
- Following /vyzva pattern + Brand Book 2.0
- Apple Premium dark mode design"

# Push to test branch
git push origin test
```

### 5.2 Vercel Auto-Deploy

**Vercel** automaticky deploy po push na `test` branch.

**Sleduj deployment:**
```
Vercel Dashboard → dechbar-app → Deployments
```

**Preview URL:**
```
https://dechbar-app-git-test-[your-org].vercel.app/digitalni-ticho
```

### 5.3 Verify Preview

**Open preview URL** a projdi testing checklist (desktop + mobile).

---

## STEP 6: User Testing (5-10 osob)

### 6.1 Share Preview URL

**Email template:**

```
Subject: [TEST] Digitální ticho - Nová landing page

Ahoj!

Můžeš mi pomoct otestovat novou landing page pro Digitální ticho?

URL: https://dechbar-app-git-test-xxx.vercel.app/digitalni-ticho

Co mě zajímá:
1. Je ti jasné, co kupuješ?
2. Je cena férová? (990 Kč)
3. Checkout byl smooth? (test card: 4242 4242 4242 4242)
4. Něco ti chybí / matlo?

Děkuji!
```

### 6.2 Collect Feedback

**Google Form nebo Notion:**
- [ ] Clarity score (1-5)
- [ ] Pricing clarity (1-5)
- [ ] Checkout smoothness (1-5)
- [ ] Would you buy? (yes/no)
- [ ] Open feedback (text)

### 6.3 Analyze & Fix

**Common issues:**
- Headline unclear → test variant headline
- Price too high → add value framing
- Checkout confusing → add more trust signals
- Missing info → add to FAQ

**Fix issues:**
```bash
git checkout test
# Make changes
git add .
git commit -m "fix: User testing feedback - [describe]"
git push origin test
```

---

## STEP 7: Deploy to PRODUCTION

### 7.1 Final Review

**POUZE po:**
- [x] User testing complete (5+ osob)
- [x] All critical bugs fixed
- [x] Preview works perfectly
- [x] Stripe tested (test mode)

### 7.2 Switch to Production Mode

**Stripe Dashboard:**
1. Toggle from "Test mode" → "Production"
2. Verify Price ID (production price)
3. Copy **Live Price ID**

**Update .env.local:**
```bash
VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_LIVE_xxxxxxxxxxxxx
```

### 7.3 Git Merge & Push

```bash
cd /Users/DechBar/dechbar-app

# Checkout main
git checkout main

# Merge test → main
git merge test

# Final check
git log -1

# Push to production
git push origin main
```

### 7.4 Vercel Production Deploy

**Vercel** automaticky deploy na:
```
https://dechbar.cz/digitalni-ticho
```

**Sleduj:**
- Vercel Dashboard → Deployments
- Wait for "Ready" status (~2-3 min)

---

## STEP 8: Post-Launch Monitoring

### First Hour
- [ ] Visit: `https://dechbar.cz/digitalni-ticho`
- [ ] Test on mobile (iOS Safari)
- [ ] Test Stripe (real card - small amount)
- [ ] Check Vercel logs (no errors)

### First 24 Hours

**Stripe Dashboard:**
- [ ] Monitor payments (count, revenue)
- [ ] Check failed payments (investigate reasons)
- [ ] Verify webhooks delivered

**Vercel Analytics:**
- [ ] Page views
- [ ] Bounce rate
- [ ] Average time on page
- [ ] Conversion funnel

**Google Analytics (if setup):**
- [ ] Traffic sources
- [ ] Device breakdown (mobile vs desktop)
- [ ] Drop-off points
- [ ] CTA click rate

### First Week

**Metrics to track:**
```
Conversion Rate = (Payments / Unique Visitors) × 100
Target: 15-25%

Payment Success Rate = (Successful / Total Attempts) × 100
Target: 95%+

Mobile Traffic = (Mobile Visitors / Total Visitors) × 100
Expected: 60-70%
```

---

## Emergency Rollback

**Pokud PROD má critical bug:**

```bash
cd /Users/DechBar/dechbar-app

# Checkout main
git checkout main

# Revert last commit
git revert HEAD

# Push (triggers new deploy)
git push origin main
```

**Nebo:**

**Vercel Dashboard:**
1. Deployments → Find last working deploy
2. Click "..." → Promote to Production
3. Instant rollback (no Git needed)

---

## Success Metrics

### Day 1 (Launch Day)
- 🎯 Zero critical errors
- 🎯 50+ unique visitors
- 🎯 5-10 conversions (10-20% rate)

### Week 1
- 🎯 500+ unique visitors
- 🎯 50-100 conversions (15-25% rate)
- 🎯 49 500 - 99 000 Kč revenue

### Month 1
- 🎯 2000+ unique visitors
- 🎯 300-500 conversions
- 🎯 297 000 - 495 000 Kč revenue

---

## Support & Troubleshooting

### Common Issues

**"Stripe modal se neotevírá"**
→ Check console (F12)
→ Verify Price ID in `.env.local`
→ Restart dev server

**"Payment fails"**
→ Check Stripe Dashboard (test mode?)
→ Verify webhook configured
→ Check Edge Function logs

**"Success page 404"**
→ Verify route: `/digitalni-ticho/dekujeme`
→ Check imports in `routes/index.tsx`

### Contact

**Developer:** [Your Name]  
**Email:** [Your Email]  
**Stripe Support:** https://support.stripe.com

---

**Last Updated:** 2026-02-17  
**Version:** 1.0  
**Status:** ✅ Ready for deployment
