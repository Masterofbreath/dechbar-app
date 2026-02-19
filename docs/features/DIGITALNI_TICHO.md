# Digitální Ticho Landing Page

**Typ:** Landing page pro audio produkt  
**Cena:** 990 Kč (předprodej) → 1 290 Kč (po startu)  
**Route:** `/digitalni-ticho`  
**Launch:** 1.3.2026  
**Status:** ✅ Implementováno

---

## Přehled

High-conversion landing page pro 21denní audio program "Digitální ticho" z produktové řady REŽIM.

### Cíle
- **Conversion rate:** 15-25% (benchmark pro české audio produkty)
- **Prodej:** Předprodej (990 Kč) s garanc"í "Zruš kdykoliv do startu"
- **Design:** Apple Premium dark mode (Brand Book 2.0)
- **Payment:** Stripe Embedded Checkout (Apple Pay, Google Pay, Cards)

---

## Struktura Landing Page

### 1. Hero Section
- **Breathing SVG Animation** (8s cycle - fyziologický priming)
- Headline: "Strukturované ticho na 21 dní."
- Subheadline: Popis architektury (intro → nájezd → hluboká práce → doznění)
- CTA: "Odemkni program →" (otevře Stripe modal)
- Trust bar: Start 1.3.2026 • 21 × 15 min • Bezpečná platba

### 2. Highlights
- 6 klíčových features (3-column grid)
- Icons: Custom SVG (outline, 2.5px stroke)
- Text: Benefit-focused (ne feature-focused)

### 3. Audio Preview
- **KRITICKÉ:** 30-45s ukázka (řeší objection "nevím co kupuju")
- 2 varianty: Tech Minimal + Film Ambient
- HTML5 audio player (custom styled dark mode)

### 4. Pro koho to je / není
- 2 columns (desktop) / stack (mobile)
- Jasné vymezení proti spa/meditace/ezo
- Confidence: 9/10 (Deep Research)

### 5. Timeline
- 3 týdny struktura (Příběh → Vedené → Ticho)
- A↔B škála (postupné prohlubování)
- Vertical centered layout (following ChallengeTimeline)

### 6. Sound Identity
- Technical specs pro melancholiky
- Table: Fáze | Délka | BPM
- Povolené vs. Zakázané elementy

### 7. Dech
- Optional section
- 2-3 dechové módy jako doporučení (ne povinnost)
- HRV research backed

### 8. Pricing
- 990 Kč (anchoring: vs. 1 290 Kč)
- Features list (5 items)
- Garance: "Zruš kdykoliv do startu"
- CTA → Stripe Embedded Checkout

### 9. Social Proof
- Placeholder (testimonials budou doplněny po beta)

### 10. FAQ
- TOP 10 objections (z Deep Research)
- Accordion pattern
- Sales tool (ne jen help section)

### 11. Final CTA
- Re-cap headline + subtext + CTA
- Opakování CTA je standard pro konverzi

### 12. Footer
- Legal links (GDPR, VOP, Kontakt)
- Czech trust signals: IČO, Sídlo, Telefon (+420)

---

## Technická Implementace

### Komponenty

```
src/modules/public-web/
├── pages/
│   ├── DigitalniTichoPage.tsx
│   └── DigitalniTichoThankYouPage.tsx
│
├── components/digitalni-ticho/
│   ├── DigitalniTichoHero.tsx
│   ├── DigitalniTichoHighlights.tsx
│   ├── DigitalniTichoAudioPreview.tsx
│   ├── DigitalniTichoPro.tsx
│   ├── DigitalniTichoTimeline.tsx
│   ├── DigitalniTichoSoundIdentity.tsx
│   ├── DigitalniTichoDech.tsx
│   ├── DigitalniTichoPricing.tsx
│   ├── DigitalniTichoSocialProof.tsx
│   ├── DigitalniTichoFAQ.tsx
│   ├── DigitalniTichoFinalCTA.tsx
│   └── DigitalniTichoFooter.tsx
│
└── styles/
    └── digitalni-ticho.css
```

### Messages Config

Všechny UI texty v `src/config/messages.ts` → `MESSAGES.digitalniTicho.*`

### Routing

Routes v `src/routes/index.tsx`:
- `/digitalni-ticho` → DigitalniTichoPage
- `/digitalni-ticho/dekujeme` → DigitalniTichoThankYouPage

### Stripe Integration

**Edge Function:** `supabase/functions/create-checkout-session`

**Price ID:** `VITE_STRIPE_PRICE_DIGITALNI_TICHO` (env variable)

**Checkout Flow:**
```
CTA Click → Create Session → Stripe Modal → Payment → Success Page
```

---

## Design Specifikace

### Colors
- Background: `#121212` (NOT #000 - Material Design dark)
- Surface: `#1E1E1E` (cards, sections)
- Text Primary: `#E0E0E0` (87% white)
- Text Secondary: `#A0A0A0` (60% white)
- Primary (Teal): `#2CBEC6`
- Accent (Gold): `#D6A23A`

### Typography
- Font: Inter
- Headline letter-spacing: `-0.02em` (tight, Apple Premium)
- Headline font-size: `48px` (desktop) → `32px` (mobile)

### Breathing Animation
```css
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
}
/* Duration: 8s (4s in, 4s out) */
```

### Shadows
- Gold glow: `var(--shadow-gold)` (CTA buttons)
- Breathing glow: `var(--glow-primary-shadow-medium)`

---

## Testing Checklist

### Desktop (1280px)
- [ ] Breathing animation běží smooth (8s cycle)
- [ ] Hero headline tight letter-spacing (-0.02em)
- [ ] CTA button gold glow visible
- [ ] Audio preview funguje (oba tracky)
- [ ] Stripe modal otevře dark mode checkout
- [ ] FAQ accordion expand/collapse
- [ ] Footer má IČO, Sídlo, Telefon

### Mobile (375px)
- [ ] Grid přepne na single column
- [ ] Breathing circle max-width 300px
- [ ] Trust signals stack vertically
- [ ] CTA button min-height 52px (iOS touch target)
- [ ] Scrollování smooth
- [ ] Audio player responsive

### Accessibility
- [ ] Keyboard navigation (Tab order)
- [ ] ESC key zavře Stripe modal
- [ ] Focus indicators viditelné (2px teal outline)
- [ ] WCAG AA contrast (všechny texty)
- [ ] `prefers-reduced-motion` respektováno

### Stripe
- [ ] Test card: `4242 4242 4242 4242` funguje
- [ ] Checkout session vytvoří
- [ ] Redirect na `/digitalni-ticho/dekujeme` po platbě
- [ ] Cancel redirect na `/digitalni-ticho`

---

## A/B Testing Setup (optional)

### Headline Variants
1. "Strukturované ticho na 21 dní." (control)
2. "Zastav šum. Vrať fokus." (výkon)
3. "15 minut. Každý den. Klid." (minimal)
4. "Nadechni se. Ztiš hlavu." (dech)
5. "Klid, který zvládneš." (bezpečí)

### Audio Preview Placement
- A: Hned pod Hero (above fold)
- B: Po Timeline (after explanation)

### Pricing Display
- A: "990 Kč"
- B: "990 Kč (47 Kč/den)"

---

## Stripe Setup Instrukce

### 1. Vytvoř Product v Stripe Dashboard

```
Product Name: Digitální ticho
Description: 21denní audio program strukturovaného klidu
```

### 2. Vytvoř Price

```
Type: One-time payment
Amount: 990 CZK
Currency: CZK
```

### 3. Zkopíruj Price ID

```
price_xxxxxxxxxxxxxxxxxxxxx
```

### 4. Přidej do .env.local

```bash
VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_xxxxxxxxxxxxxxxxxxxxx
```

### 5. Test Mode

Stripe test card:
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

---

## Launch Checklist

### Pre-Launch
- [ ] Všechny komponenty implementovány
- [ ] CSS kompiluje bez errorů
- [ ] TypeScript compiles (`npm run build`)
- [ ] Audio preview files nahrané
- [ ] Stripe Price ID nastaven
- [ ] Routes fungují
- [ ] Messages config kompletní

### Deployment
1. **PREVIEW:** Push to `test` branch
2. **User testing:** 5-10 osob (feedback)
3. **Bug fixes:** Podle user feedback
4. **PRODUCTION:** Push to `main` branch

### Post-Launch Monitoring (první 24h)
- [ ] Conversion rate (cíl: 15-25%)
- [ ] Stripe payments successful
- [ ] Success page visits
- [ ] Drop-off points (GA funnel)
- [ ] Error logs (Vercel)

---

## Resources

- **UX Psychology Report:** Deep Research PDF
- **Deep Research:** Copywriting + Competitive Analysis PDF
- **Pattern Reference:** `/vyzva` landing page
- **Brand Book:** `docs/brand/VISUAL_BRAND_BOOK.md`
- **Tone of Voice:** `docs/design-system/TONE_OF_VOICE.md`

---

**Version:** 1.0  
**Last Updated:** 2026-02-17  
**Author:** AI Agent (based on Deep Research + UX Psychology)
