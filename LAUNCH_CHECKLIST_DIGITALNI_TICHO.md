# 🚀 Launch Checklist - Digitální Ticho

**Quick reference pro launch dnes večer**

---

## ✅ HOTOVO

### Code Implementation
- [✅] 12 komponent vytvořeno
- [✅] CSS styling (digitalni-ticho.css)
- [✅] Messages config (všechny texty)
- [✅] Routes (/digitalni-ticho + /dekujeme)
- [✅] TypeScript compiles (no errors)
- [✅] Dev server běží (http://localhost:5174/)

### Documentation
- [✅] Feature docs (DIGITALNI_TICHO.md)
- [✅] Stripe setup guide
- [✅] Testing checklist
- [✅] Deployment guide

---

## ⚠️ CO JEŠTĚ CHYBÍ (před launch)

### 1. Audio Preview Files (CRITICAL)

**Akce:** Nahrát 2 MP3 soubory do `/public/audio/`

**Files:**
```
digitalni-ticho-preview-tech-minimal.mp3 (30-45s)
digitalni-ticho-preview-film-ambient.mp3 (30-45s)
```

**Fallback:** Zakomentuj Audio Preview section v DigitalniTichoPage.tsx

**Instrukce:** Viz `/public/audio/README_DIGITALNI_TICHO.md`

---

### 2. Stripe Price ID (CRITICAL)

**Akce:** Vytvořit Product + Price v Stripe Dashboard

**Steps:**
1. https://dashboard.stripe.com
2. Products → + Add Product
3. Name: "Digitální ticho"
4. Price: 990 CZK (one-time)
5. Copy Price ID: `price_xxxxx`
6. Add to `.env.local`:
   ```
   VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_xxxxx
   ```

**Instrukce:** Viz `STRIPE_SETUP_DIGITALNI_TICHO.md`

---

### 3. Company Info (OPTIONAL)

**Akce:** Replace placeholder v footeru

**Soubor:** `src/modules/public-web/components/digitalni-ticho/DigitalniTichoFooter.tsx`

**Replace:**
```tsx
IČO: 12345678 → IČO: [REAL_ICO]
Sídlo: Praha, ČR → Sídlo: [REAL_ADDRESS]
Telefon: +420 XXX → Telefon: +420 [REAL_PHONE]
```

---

### 4. Legal Pages (OPTIONAL - ale doporučené)

**Akce:** Ensure `/gdpr` a `/obchodni-podminky` pages existují

**Fallback:** Links v footeru půjdou na 404 (není kritické pro launch)

---

## 🎯 LAUNCH WORKFLOW

### Varianta A: IMMEDIATE LAUNCH (risk: no user testing)

```bash
# 1. Připrav audio files + Stripe
# 2. Commit
cd /Users/DechBar/dechbar-app
git checkout test
git add .
git commit -m "feat: Add Digitální ticho landing page"

# 3. Deploy to PREVIEW first (safe)
git push origin test
# → Vercel preview URL

# 4. Quick test na preview URL (10 min)
# 5. Merge to PROD
git checkout main
git merge test
git push origin main
# → https://dechbar.cz/digitalni-ticho
```

**Pros:** Fast (launch dnes večer ✅)  
**Cons:** No user testing (risk)

---

### Varianta B: SAFE LAUNCH (doporučeno)

```bash
# 1. Připrav audio files + Stripe
# 2. Deploy to PREVIEW
cd /Users/DechBar/dechbar-app
git checkout test
git add .
git commit -m "feat: Add Digitální ticho landing page"
git push origin test

# 3. User testing (5-10 osob, 2-3h)
# Share preview URL → collect feedback

# 4. Fix bugs (if any)
# ... make changes ...
git add .
git commit -m "fix: User feedback - [describe]"
git push origin test

# 5. Deploy to PROD (zítra ráno)
git checkout main
git merge test
git push origin main
```

**Pros:** Safer, user validated  
**Cons:** Launch zítra (ne dnes večer)

---

## 📝 TESTING PRIORITIES (pokud málo času)

### HIGH Priority (MUST test)
1. ✅ **Breathing animation** - běží smooth?
2. ✅ **CTA button** - otevře Stripe modal?
3. ✅ **Stripe test payment** - funguje s test card?
4. ✅ **Success redirect** - /dekujeme page?
5. ✅ **Mobile responsive** - iPhone Safari OK?

### MEDIUM Priority (should test)
6. ✅ Audio preview - plays?
7. ✅ FAQ accordion - expand/collapse?
8. ✅ ESC key - zavře modal?

### LOW Priority (nice to test)
9. ✅ Keyboard navigation - Tab order OK?
10. ✅ Reduced motion - animation OFF?

---

## 🔥 EMERGENCY FIXES

### Stripe modal se neotevírá

**Quick fix:**
```typescript
// DigitalniTichoHero.tsx
// Add fallback: redirect to Stripe Checkout URL
window.location.href = `https://checkout.stripe.com/...`;
```

### Audio preview 404

**Quick fix:**
```tsx
// DigitalniTichoPage.tsx
{/* <DigitalniTichoAudioPreview /> */}
```

### Company info placeholder

**Quick fix:**
```tsx
// DigitalniTichoFooter.tsx
// Remove company info section dočasně
```

---

## 📊 POST-LAUNCH (první 24h)

### Monitoring Dashboard

**Stripe:**
- https://dashboard.stripe.com/payments
- Watch: Total revenue, successful payments, failed payments

**Vercel:**
- https://vercel.com/[your-org]/dechbar-app/analytics
- Watch: Page views, errors, performance

**Google Analytics (if setup):**
- Watch: Traffic, conversions, funnel

### Success Metrics

**Day 1:**
```
Visitors: 50-100
Conversions: 5-15
Conversion rate: 10-15% (realistic pro day 1)
Revenue: 4 950 - 14 850 Kč
```

**Red Flags:**
- Conversion < 5% → investigate drop-off points
- Payment failures > 10% → check Stripe setup
- Bounce rate > 60% → headline/offer mismatch
- Mobile errors → check responsive

---

## 🎉 LAUNCH READY!

**Všechno je připraveno!**

**Zbývá jen:**
1. ⚠️ Nahrát audio preview files (nebo disable section)
2. ⚠️ Nastavit Stripe Price ID
3. ✅ Git commit + push
4. ✅ Test na preview
5. ✅ Deploy to PROD

**Estimated time:** 1-2h (s testingem)

**Launch target:** Dnes večer ✅

---

**Last Updated:** 2026-02-17  
**Version:** 1.0
