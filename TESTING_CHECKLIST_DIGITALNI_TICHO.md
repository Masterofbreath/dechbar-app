# Testing Checklist - Digitální Ticho Landing Page

**Pre-Launch QA checklist**  
**URL (local):** http://localhost:5174/digitalni-ticho  
**URL (preview):** TBD (po deploy na test branch)

---

## DESKTOP TESTING (1280px+)

### Hero Section
- [ ] **Breathing animation** běží smooth (8s cycle: 4s in, 4s out)
- [ ] **Animation performance** - 60 FPS, žádné lagy
- [ ] **Headline** má tight letter-spacing (-0.02em) - vizuálně premium
- [ ] **CTA button** má gold glow (--shadow-gold) - viditelný i bez hover
- [ ] **CTA hover** - translateY(-2px) + increased shadow
- [ ] **Trust bar** - 3 signály inline (Calendar, Clock, Lock icons)
- [ ] **Grid layout** - 50% content / 50% breathing circle
- [ ] **Breathing circle** max-width 400px, centered

### Highlights Section
- [ ] **Grid** - 3 columns se správným gap (32px)
- [ ] **Icons** - 64×64px, teal color (#2CBEC6)
- [ ] **Headlines** - gold color (#D6A23A), 20px font
- [ ] **Text** - secondary color (#A0A0A0), readable line-height

### Audio Preview
- [ ] **Tab switcher** funguje (Tech Minimal ⇄ Film Ambient)
- [ ] **Active tab** - teal background, dark text
- [ ] **Audio player** - HTML5 controls viditelné
- [ ] **Play button** funguje (oba tracky)
- [ ] **Note text** - "Doporučujeme sluchátka..." viditelný

### Pro Section
- [ ] **2 columns** - equal width, gap 32px
- [ ] **Checkmarks** - ✓ teal pro "je", × gray pro "není"
- [ ] **Background** - surface color (#1E1E1E) pro cards

### Timeline
- [ ] **Vertical layout** - centrovaný, max-width 600px
- [ ] **Vertikální linka** - teal gradient, fade out na konci
- [ ] **3 kroky** - Týden 1-2-3, správný spacing (40px)
- [ ] **Background override** - překrývá linku (#121212)

### Sound Identity
- [ ] **Table** - 3 sloupce (Fáze, Délka, BPM)
- [ ] **Table styling** - subtle borders, readable
- [ ] **Elements grid** - 2 columns (Povolené vs. Zakázané)
- [ ] **Bullets** - teal pro allowed, default pro forbidden

### Dech Section
- [ ] **3 columns** - Box breathing, Tichý nos, Dlouhý výdech
- [ ] **Cards** - surface background, rounded 12px
- [ ] **Note** - research mention viditelný, italic

### Pricing
- [ ] **Card** - centered, max-width 600px
- [ ] **Badge** - "PŘEDPRODEJ" teal border + background
- [ ] **Price anchoring** - 990 Kč large, 1 290 Kč strikethrough
- [ ] **Per day** - "47 Kč/den" visible
- [ ] **Features list** - 5 items s checkmarks
- [ ] **Guarantee box** - teal border, low-opacity background
- [ ] **CTA button** - full width, gold glow

### FAQ
- [ ] **Accordion** - expand/collapse funguje
- [ ] **Icons** - + a − se mění
- [ ] **Animation** - fadeIn při otevření
- [ ] **10 otázek** - všechny zobrazené

### Final CTA
- [ ] **Headline** - centered, tight letter-spacing
- [ ] **Subtext** - three-part (• separátory)
- [ ] **Button** - gold glow, full width v containeru

### Footer
- [ ] **Logo** - off-white variant, správná velikost
- [ ] **Tagline** - "Funkční klid. Žádné klišé."
- [ ] **Legal links** - GDPR, VOP, Kontakt (• separátory)
- [ ] **Company info** - IČO, Sídlo, Telefon visible
- [ ] **Copyright** - 2026 DechBar

---

## STRIPE CHECKOUT (Desktop)

### Modal Otevření
- [ ] **CTA click** - modal se otevře okamžitě (< 500ms)
- [ ] **Loading state** - "Načítám..." text během wait
- [ ] **Error handling** - pokud session fail, zobrazí error message
- [ ] **Body scroll lock** - pozadí se nezscrolluje

### Stripe Modal Content
- [ ] **Dark mode preserved** - modal tmavý, ne bílý redirect
- [ ] **Logo** - DechBar logo visible (512×512px)
- [ ] **Title** - "Digitální ticho" + "990 Kč"
- [ ] **Payment form** - Stripe Embedded Checkout loaded
- [ ] **Apple Pay button** - visible na Safari (pokud supported)
- [ ] **Card input** - dark theme styling
- [ ] **ESC key** - zavře modal

### Test Payment
- [ ] **Test card** - `4242 4242 4242 4242` works
- [ ] **Expiry** - any future date works
- [ ] **CVC** - any 3 digits works
- [ ] **Submit** - processing indicator shows
- [ ] **Success redirect** - `/digitalni-ticho/dekujeme`
- [ ] **Cancel** - ESC nebo close button → `/digitalni-ticho`

---

## MOBILE TESTING (375px iPhone SE)

### Hero Section
- [ ] **Single column** - content stacked vertically
- [ ] **Headline** - 32px (menší než desktop 48px)
- [ ] **Subtitle** - 16px, readable
- [ ] **Breathing circle** - 250-300px max, centered
- [ ] **CTA button** - min-height 52px (iOS touch target)
- [ ] **Trust signals** - stacked vertically, centered

### All Sections
- [ ] **Padding** - reduced to 16px horizontal (kompaktnější)
- [ ] **Grids** - přepnuté na single column
- [ ] **Font sizes** - responzivní (menší na mobile)
- [ ] **Touch targets** - minimum 44×44px (iOS standard)

### Audio Preview
- [ ] **Player** - full width, responsive controls
- [ ] **Tabs** - stack nebo wrap na mobile

### Pricing
- [ ] **Card** - full width minus padding
- [ ] **Price** - still readable (large enough)
- [ ] **Button** - full width, easy to tap

### FAQ
- [ ] **Question buttons** - min-height 56px (touch target)
- [ ] **Text** - 16px (ne menší - iOS čitelnost)

### Footer
- [ ] **Links** - wrap nebo stack
- [ ] **Company info** - čitelné (11-12px minimum)

---

## TABLET TESTING (768px iPad)

### Layout Breakpoint
- [ ] **Grid transition** - smooth přechod na single column
- [ ] **Breathing circle** - 300px max
- [ ] **Spacing** - adequate (ne příliš husté)

---

## ACCESSIBILITY TESTING

### Keyboard Navigation
- [ ] **Tab order** - logický (top → bottom)
- [ ] **CTA buttons** - focusable s visible outline
- [ ] **FAQ items** - focusable, Enter k otevření
- [ ] **Stripe modal** - Tab order uvnitř modalu
- [ ] **ESC key** - zavře Stripe modal

### Focus Indicators
- [ ] **2px teal outline** - viditelný na všech interactive elements
- [ ] **Outline offset** - 2px spacing (ne přímo na elementu)
- [ ] **Contrast** - teal (#2CBEC6) na dark (#121212) = 7.2:1 ✓

### Screen Reader
- [ ] **Semantic HTML** - h1, h2, section tags správně
- [ ] **ARIA labels** - na SVG icons ("Dechová animace")
- [ ] **Alt text** - pokud budou obrázky

### WCAG AA Contrast
- [ ] **Text primary** (#E0E0E0) na background (#121212) = 11.6:1 ✓
- [ ] **Text secondary** (#A0A0A0) na background = 7.2:1 ✓
- [ ] **Gold CTA** (#D6A23A) s dark text (#121212) = 6.8:1 ✓
- [ ] **Teal** (#2CBEC6) na dark = 7.2:1 ✓

### Reduced Motion
- [ ] **prefers-reduced-motion** - breathing animation OFF
- [ ] **Fallback** - static circle (no scale transform)

---

## PERFORMANCE TESTING

### Lighthouse Audit

**Spusť v Chrome DevTools:**
```
F12 → Lighthouse → Performance → Analyze
```

**Target scores:**
- [ ] **Performance:** 90+ (desktop), 80+ (mobile)
- [ ] **Accessibility:** 95+ (100 ideal)
- [ ] **Best Practices:** 95+
- [ ] **SEO:** 90+

### Core Web Vitals
- [ ] **FCP** (First Contentful Paint) < 1.5s
- [ ] **LCP** (Largest Contentful Paint) < 2.5s
- [ ] **CLS** (Cumulative Layout Shift) < 0.1
- [ ] **FID** (First Input Delay) < 100ms

### Network
- [ ] **CSS** - single bundle, minified
- [ ] **JS** - code split, lazy loaded where possible
- [ ] **Fonts** - Inter font cached (from Fontsource)
- [ ] **Audio** - NOT preloaded (lazy load on tab switch)

---

## CROSS-BROWSER TESTING

### Chrome (latest)
- [ ] Layout správný
- [ ] Breathing animation smooth
- [ ] Stripe modal funguje
- [ ] Audio preview plays

### Safari (latest) - CRITICAL
- [ ] **Apple Pay** - visible v Stripe modal
- [ ] **Breathing animation** - SVG renders correctly
- [ ] **Backdrop blur** - glassmorphism funguje
- [ ] **Audio player** - HTML5 controls work

### Firefox (latest)
- [ ] Layout konzistentní s Chrome
- [ ] Animations fungují
- [ ] No console errors

### Mobile Safari (iOS)
- [ ] **Touch targets** - easy to tap (52px minimum)
- [ ] **Apple Pay** - 1-click checkout works
- [ ] **Scrolling** - smooth, no jank
- [ ] **Breathing animation** - performance OK

---

## STRIPE TEST MODE

### Test Card Numbers

**Visa (success):**
```
4242 4242 4242 4242
```

**Mastercard (success):**
```
5555 5555 5555 4444
```

**Declined card:**
```
4000 0000 0000 0002
```

**Insufficient funds:**
```
4000 0000 0000 9995
```

### Test Flow
1. [ ] Click CTA "Odemkni program →"
2. [ ] Modal otevře (< 500ms)
3. [ ] Stripe form loaded (dark styled)
4. [ ] Fill test card: `4242 4242 4242 4242`
5. [ ] Expiry: `12/28`
6. [ ] CVC: `123`
7. [ ] Click "Pay"
8. [ ] Processing indicator
9. [ ] Redirect to `/digitalni-ticho/dekujeme`
10. [ ] Success page displays correctly

### Error Scenarios
- [ ] **Invalid card** - error message visible
- [ ] **Network error** - graceful handling
- [ ] **Session expired** - can retry

---

## USER TESTING (5-10 osob)

### Feedback Questions

**Clarity:**
- Je ti jasné, co kupuješ?
- Rozumíš rozdílu Tech Minimal vs. Film Ambient?
- Je ti jasné, kdy program startuje?

**Pricing:**
- Je cena jasná?
- Rozumíš garance "Zruš kdykoliv do startu"?
- Zdá se ti cena férová?

**Checkout:**
- Byl checkout smooth?
- Cítil/a ses bezpečně při zadávání karty?
- Něco tě matlo / zpomalovalo?

**Overall:**
- Co by tě přesvědčilo ke koupi?
- Co ti chybí?
- Co bys změnil/a?

---

## PRE-DEPLOYMENT CHECKLIST

### Code Quality
- [✅] TypeScript compiles (no errors)
- [✅] ESLint passes (no errors)
- [✅] All components implemented
- [✅] CSS imports správně
- [✅] Messages config kompletní
- [✅] Routes přidány

### Content
- [ ] **Audio preview files** nahrané do `/public/audio/`
- [ ] **IČO, Sídlo, Telefon** - real data v footeru
- [ ] **Stripe Price ID** - nastaven v `.env.local`
- [ ] **Legal links** - GDPR, VOP pages existují

### Stripe
- [ ] **Product created** v Stripe Dashboard
- [ ] **Price created** (990 CZK one-time)
- [ ] **Price ID** zkopírován do env
- [ ] **Webhook** nastaven (payment_intent.succeeded)
- [ ] **Test mode** - vše funguje

### Vercel
- [ ] **Git branch** - `test` (pro preview)
- [ ] **Auto-deploy** - enabled
- [ ] **Environment variables** - Stripe keys set
- [ ] **Domain** - `dechbar.cz` connected

---

## KNOWN ISSUES / TODO

### Audio Preview Files
- ⚠️ **Missing:** Preview MP3 files nejsou v `/public/audio/`
- **Action:** Vygenerovat v Suno AI (viz `/public/audio/README_DIGITALNI_TICHO.md`)
- **Fallback:** Disable Audio Preview section dočasně

### Company Info
- ⚠️ **Placeholder:** IČO, Sídlo, Telefon jsou placeholder
- **Action:** Replace s real data v `DigitalniTichoFooter.tsx`

### Testimonials
- ⚠️ **Placeholder:** Social Proof section je prázdná
- **Action:** Po beta testingu přidat real testimonials

---

## LAUNCH WORKFLOW

### 1. Local Testing
```bash
cd /Users/DechBar/dechbar-app
npm run dev
# Navigate to: http://localhost:5174/digitalni-ticho
# Test všechny checklisty výše
```

### 2. Deploy to PREVIEW (test branch)
```bash
git checkout test
git add .
git commit -m "feat: Add Digitální ticho landing page"
git push origin test
# Vercel auto-deploy → get preview URL
```

### 3. User Testing
- Pošli preview URL 5-10 osobám
- Collect feedback (form nebo Google Docs)
- Identify issues

### 4. Bug Fixes
```bash
git checkout test
# Fix issues
git add .
git commit -m "fix: User testing feedback"
git push origin test
```

### 5. Deploy to PRODUCTION
```bash
git checkout main
git merge test
git push origin main
# Vercel auto-deploy → https://dechbar.cz/digitalni-ticho
```

### 6. Post-Launch Monitoring
- First 24h: sleduj conversion rate
- Stripe Dashboard: sleduj payments
- Vercel Analytics: sleduj errors
- Google Analytics: sleduj funnel drop-offs

---

## SUCCESS CRITERIA

### Launch Day (Day 1)
- ✅ Zero critical errors
- ✅ Stripe payments fungují
- ✅ Mobile responsive works
- ✅ Accessibility AA compliant

### First Week
- 🎯 **Conversion rate:** 15-25%
- 🎯 **Payment success rate:** 95%+
- 🎯 **Mobile traffic:** 60-70% (expected)
- 🎯 **Bounce rate:** < 40%

### First Month
- 🎯 **Total sales:** 50-100 pre-sales
- 🎯 **Revenue:** 49 500 - 99 000 Kč
- 🎯 **Refund rate:** < 5%
- 🎯 **Customer satisfaction:** 4.5+ / 5

---

**Last Updated:** 2026-02-17  
**Status:** Ready for testing  
**Dev Server:** http://localhost:5174/digitalni-ticho
