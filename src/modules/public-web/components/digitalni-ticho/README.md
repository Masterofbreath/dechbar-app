# Digitální Ticho Components

**Landing page komponenty pro 21denní audio program**

---

## Přehled komponent

### Core Layout

| Component | Purpose | Priority |
|-----------|---------|----------|
| `DigitalniTichoPage.tsx` | Main page (assembles all sections) | HIGH |
| `DigitalniTichoThankYouPage.tsx` | Post-checkout success page | HIGH |

### Hero

| Component | Purpose | Priority |
|-----------|---------|----------|
| `DigitalniTichoHero.tsx` | Hero + Breathing Animation + Stripe CTA | HIGH |

**Features:**
- Breathing SVG animation (8s cycle - mirror neurons priming)
- Headline + Subheadline (tight letter-spacing)
- CTA → Stripe Embedded Checkout modal
- Trust bar (3 signals: Start, Duration, Security)

### Content Sections

| Component | Purpose | Priority |
|-----------|---------|----------|
| `DigitalniTichoHighlights.tsx` | 3-6 key features (Apple style) | HIGH |
| `DigitalniTichoAudioPreview.tsx` | Audio player (Tech + Ambient) | HIGH |
| `DigitalniTichoPro.tsx` | Pro koho to je/není (vymezení) | MEDIUM |
| `DigitalniTichoTimeline.tsx` | 3 týdny (Příběh → Vedené → Ticho) | MEDIUM |
| `DigitalniTichoSoundIdentity.tsx` | Technical specs (melancholici) | LOW |
| `DigitalniTichoDech.tsx` | Dechové módy (optional) | LOW |

### Sales

| Component | Purpose | Priority |
|-----------|---------|----------|
| `DigitalniTichoPricing.tsx` | Price + Features + Stripe CTA | HIGH |
| `DigitalniTichoFAQ.tsx` | TOP 10 objections (sales tool) | HIGH |
| `DigitalniTichoFinalCTA.tsx` | Final push (re-cap) | MEDIUM |

### Support

| Component | Purpose | Priority |
|-----------|---------|----------|
| `DigitalniTichoSocialProof.tsx` | Testimonials (placeholder) | LOW |
| `DigitalniTichoFooter.tsx` | Legal + Czech trust signals | HIGH |

---

## Design Pattern

**Všechny komponenty následují:**

1. **Brand Book 2.0** - Dark-first, Teal+Gold, Inter font
2. **Apple Premium** - Méně je více, tight letter-spacing
3. **Tone of Voice** - Tykání, imperativ, krátké věty, BEZ emoji
4. **Challenge pattern** - Proven structure z `/vyzva`

---

## Messages Config

**Všechny UI texty:**
```typescript
import { MESSAGES } from '@/config/messages';

// Usage:
MESSAGES.digitalniTicho.hero.headline
MESSAGES.digitalniTicho.pricing.cta
MESSAGES.digitalniTicho.faq.questions
```

**Single source of truth** - změny v `messages.ts` se projeví všude.

---

## CSS Styling

**Soubor:** `../styles/digitalni-ticho.css`

**Pattern:**
- BEM naming: `.digitalni-ticho-hero__headline`
- CSS variables: `var(--color-primary)`
- Responsive: Mobile-first (375px → 768px → 1280px)
- Accessibility: `prefers-reduced-motion`

**Import:** Auto-imported přes `globals.css`

---

## Stripe Integration

**Components používající Stripe:**

1. `DigitalniTichoHero.tsx` - CTA v hero
2. `DigitalniTichoPricing.tsx` - Primary checkout section
3. `DigitalniTichoFinalCTA.tsx` - Re-cap CTA

**Shared pattern:**
```typescript
const [isPaymentOpen, setPaymentOpen] = useState(false);
const [clientSecret, setClientSecret] = useState<string | null>(null);

async function handleCheckout() {
  const { data } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_DIGITALNI_TICHO,
      moduleId: 'digitalni-ticho',
      successUrl: '/digitalni-ticho/dekujeme',
      cancelUrl: '/digitalni-ticho',
    }
  });
  setClientSecret(data.clientSecret);
  setPaymentOpen(true);
}

<PaymentModal
  isOpen={isPaymentOpen}
  onClose={() => setPaymentOpen(false)}
  clientSecret={clientSecret}
  moduleTitle="Digitální ticho"
  price="990 Kč"
  interval="lifetime"
/>
```

---

## 4 Temperamenty Satisfaction

### Sangvinik (Fun, Social)
- ✅ Breathing animation (visual engagement)
- ✅ Audio preview (try before buy)
- ✅ Colorful icons (teal + gold accents)

### Cholerik (Efficiency, Results)
- ✅ Clear CTA (immediate action)
- ✅ Highlights (quick scan of benefits)
- ✅ One-page checkout (minimal clicks)

### Melancholik (Detail, Quality)
- ✅ Sound Identity section (technical specs)
- ✅ FAQ (all questions answered)
- ✅ Architecture table (precise structure)

### Flegmatik (Calm, Simple)
- ✅ Minimal design (no clutter)
- ✅ Garance (low risk - "Zruš kdykoliv")
- ✅ Gentle language (no pressure)

---

## Development Notes

### Adding New Section

1. Create component in `/components/digitalni-ticho/`
2. Add messages to `messages.ts` → `digitalniTicho.*`
3. Add CSS to `digitalni-ticho.css`
4. Import in `DigitalniTichoPage.tsx`
5. Test responsive (375px, 768px, 1280px)

### Modifying Copy

**NEVER hardcode text!** Always use `MESSAGES.*`

```typescript
// ❌ BAD
<h1>Strukturované ticho na 21 dní.</h1>

// ✅ GOOD
<h1>{MESSAGES.digitalniTicho.hero.headline}</h1>
```

### Styling Pattern

```css
/* BEM naming */
.digitalni-ticho-[section]__[element]--[modifier]

/* Reference design tokens */
color: var(--color-primary);  /* NOT #2CBEC6 */
font-size: var(--font-size-lg);  /* NOT 18px */
```

---

## Known Limitations

### Audio Preview
- ⚠️ **Placeholder files** - real audio pending
- **Workaround:** Can be disabled if not ready

### Social Proof
- ⚠️ **No testimonials** - placeholder only
- **Workaround:** Section is conditional (can hide)

### Company Info
- ⚠️ **Placeholder data** - IČO, Sídlo, Telefon
- **Workaround:** Replace before PROD launch

---

## Quick Commands

### Local Development
```bash
cd /Users/DechBar/dechbar-app
npm run dev
# → http://localhost:5174/digitalni-ticho
```

### Build Test
```bash
npm run build  # Check for errors
```

### Deploy Preview
```bash
git checkout test
git add .
git commit -m "feat: Add Digitální ticho"
git push origin test
```

### Deploy Production
```bash
git checkout main
git merge test
git push origin main
```

---

**Last Updated:** 2026-02-17  
**Components:** 12 total  
**Lines of Code:** ~1500 (TS + CSS)  
**Status:** ✅ Ready for testing
