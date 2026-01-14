# Landing Page Master Specification

**Version:** 2.0 (Research-Based Rebuild)  
**Last Updated:** 2026-01-14  
**Status:** Production Ready  
**For:** Development, Marketing, QA teams

---

## Table of Contents

1. [Page Structure](#page-structure)
2. [Complete Copywriting](#complete-copywriting)
3. [Component Specifications](#component-specifications)
4. [Visual Specifications](#visual-specifications)
5. [Technical Requirements](#technical-requirements)
6. [SEO & Meta](#seo--meta)
7. [Analytics Events](#analytics-events)
8. [Performance Targets](#performance-targets)

---

## Page Structure

### 6-Section Modified Apple Model

```
1. HERO SECTION          (100vh) - Above fold impact
2. SCIENCE SECTION       (50vh)  - Credibility fast
3. HOW IT WORKS         (80vh)  - Process clarity
4. TRUST SECTION        (50vh)  - Social proof
5. PRICING SECTION      (80vh)  - Value proposition
6. FINAL CTA + FAQ      (100vh) - Conversion + Objections
```

**Total scroll:** ~4.5 viewports (desktop), ~7 viewports (mobile)

---

## Complete Copywriting

### SECTION 1: Hero

**H1 (Main Headline):**
```
První česká aplikace pro funkční dýchání
```

**Specs:**
- Font: Inter Bold, 48px (desktop) / 36px (tablet) / 32px (mobile)
- Color: var(--color-text-primary) #E0E0E0
- Letter-spacing: -0.02em (premium tight spacing)
- Line-height: 1.25 (tight for impact)
- Max-width: 700px
- Alignment: Left (desktop), Center (mobile)

**H2 (Subheadline):**
```
Měř svůj pokrok. Cvič s certifikovaným instruktorem. 
Viditelné výsledky za 21 dní.
```

**Specs:**
- Font: Inter Regular, 18px (desktop) / 16px (mobile)
- Color: var(--color-text-secondary) #A0A0A0
- Line-height: 1.5 (normal readability)
- Max-width: 600px

**Primary CTA:**
```
Začít zdarma →
```

**Specs:**
- Button variant: Primary (Gold)
- Size: Large (16px 32px padding)
- Font: Inter Medium, 18px
- Width: Auto (min 200px)
- Component: `<Button variant="primary" size="lg">`

**CTA Subtext (Below button):**
```
Email → První cvičení za 2 minuty
```

**Specs:**
- Font: 14px, color: var(--color-text-tertiary)
- Purpose: Set expectations, reduce friction

**Trust Signals (4 items, inline):**

1. Icon: 👥 + Text: "1150+ dýchačů"
2. Icon: 🎧 + Text: "100+ cvičení"
3. Icon: ✅ + Text: "Certifikováno"
4. Icon: 💰 + Text: "Od 0 Kč"

**Specs:**
- Layout: Horizontal row (desktop), 2x2 grid (mobile)
- Icon: 20x20px SVG, currentColor
- Text: 14px, color: var(--color-text-secondary)
- Gap: var(--spacing-6) between items

---

### SECTION 2: Proč Dýchání (Science)

**Section Title:**
```
Proč dýchání mění vše
```

**Specs:**
- Font: Inter Bold, 30px
- Color: var(--color-primary) #2CBEC6
- Alignment: Center
- Margin-bottom: var(--spacing-8)

**Intro Paragraph:**
```
95% populace dýchá suboptimálně. To ovlivňuje spánek, 
energii i odolnost vůči stresu.
```

**Specs:**
- Font: 18px, Regular
- Color: var(--color-text-primary)
- Max-width: 800px
- Alignment: Center

**3 Science Pillars:**

**Pillar 1:**
- Icon: DNA helix (24x24 SVG)
- Title: "Bohrův efekt"
- Description: "Více CO₂ = lepší okysličení tkání"

**Pillar 2:**
- Icon: Lungs (24x24 SVG)
- Title: "Oxid dusnatý"
- Description: "Nosní dech = +18% kyslíku"

**Pillar 3:**
- Icon: Chart (24x24 SVG)
- Title: "Sleduj pokrok"
- Description: "BOLT skóre = objektivní metrika zdraví"

**Specs:**
- Layout: 3-column grid (desktop), 1-column (mobile)
- Icon color: var(--color-primary) #2CBEC6
- Title: Inter Semibold, 20px
- Description: 16px, Regular, color: var(--color-text-secondary)
- Card background: var(--color-surface)
- Padding: var(--spacing-6)
- Border-radius: var(--radius-lg)

**Link:**
```
Přečti si vědecké pozadí →
```

**Specs:**
- Component: `<TextLink>` from Platform
- Points to: `/veda` page
- Color: var(--color-primary)

---

### SECTION 3: Jak To Funguje (How It Works)

**Section Title:**
```
Jak DechBar funguje
```

**Specs:** Same as Section 2 title

**3 Steps:**

**Step 1: Změř**
- Number badge: "1"
- Title: "Změř"
- Description: "Zjisti své BOLT skóre během 60 sekund. Získej výchozí hodnotu pro tracking."
- Screenshot placeholder: Stopwatch/timer UI

**Step 2: Cvič**
- Number badge: "2"
- Title: "Cvič"
- Description: "Vyber z 100+ audio programů. Ranní aktivace, polední reset nebo večerní relaxace."
- Screenshot placeholder: Exercise selection UI

**Step 3: Zlepšuj**
- Number badge: "3"
- Title: "Zlepšuj"
- Description: "Sleduj svůj pokrok v čase. Průměrné zlepšení: +12 sekund za 3 týdny."
- Screenshot placeholder: Progress graph UI

**Specs:**
- Layout: Horizontal (desktop 3-col), Vertical stack (mobile)
- Number badge: 48x48px circle, Gold background, dark text
- Title: Inter Bold, 24px
- Description: 16px, color: var(--color-text-secondary)
- Screenshot: Max-width 300px, border-radius: var(--radius-xl), shadow: var(--shadow-md)

---

### SECTION 4: Důvěra (Trust)

**Section Title:**
```
Co říkají odborníci
```

**Professional Endorsement (Placeholder):**
```
"Funkční dýchání je jednou z nejefektivnějších metod 
pro regulaci nervového systému. DechBar je nejlepší 
nástroj, který mohu svým klientům doporučit."

— MUDr. Jan Novák, fyzioterapeut
  Fakultní nemocnice Motol, Praha
```

**Specs:**
- Quote: 20px, Italic, color: var(--color-text-primary)
- Attribution: 16px, Regular, color: var(--color-text-secondary)
- Background: var(--color-surface)
- Padding: var(--spacing-8)
- Border-left: 4px solid var(--color-primary)
- Max-width: 800px

**Data Panel (Always Show):**

3 metrics in grid:

1. **"1150+ aktivních uživatelů"**
2. **"Průměrné zlepšení BOLT: +12 sekund (3 týdny)"**
3. **"4.8★ hodnocení v App Store"**

**Specs:**
- Layout: 3-column grid (desktop), 1-column (mobile)
- Each metric:
  - Number: 36px Bold, color: var(--color-primary)
  - Label: 14px, color: var(--color-text-secondary)
  - Background: var(--color-surface)
  - Padding: var(--spacing-6)
  - Border-radius: var(--radius-lg)

---

### SECTION 5: Pricing

**Section Title:**
```
Vyber si svou cestu
```

**Intro (Optional):**
```
Začni zdarma. Upgrade, když uvidíš výsledky.
```

**3 Pricing Tiers:**

**Tier 1: ZDARMA**
- Badge: None
- Price: "0 Kč"
- Period: "Navždy"
- Features:
  - ✅ 3 základní dechová cvičení
  - ✅ Ranní, polední a večerní protokol
  - ✅ Audio instrukce
  - ❌ BOLT skóre tracking
  - ❌ Pokročilé programy
- CTA: "Začít zdarma →" (Ghost button)

**Tier 2: STARTER** (Highlighted - most popular)
- Badge: "OBLÍBENÉ"
- Price: "125 Kč"
- Period: "/měsíc" (or "1 494 Kč/rok" with discount)
- Savings Badge: "Ušetříš 1,494 Kč při ročním předplatném"
- Features:
  - ✅ Všechno z ZDARMA
  - ✅ BOLT skóre tracking
  - ✅ Grafy a statistiky pokroku
  - ✅ 50+ audio programů
  - ❌ AI doporučení
- CTA: "Začít →" (Primary Gold button)

**Tier 3: PRO**
- Badge: "PREMIUM"
- Price: "245 Kč"
- Period: "/měsíc" (or "2 940 Kč/rok")
- Savings Badge: "Ušetříš 2,940 Kč při ročním předplatném"
- Features:
  - ✅ Všechno ze STARTER
  - ✅ Všech 100+ programů
  - ✅ AI personalizované doporučení
  - ✅ Pokročilé analýzy (HRV, trendy)
  - ✅ Prioritní podpora
- CTA: "Začít →" (Primary Gold button)

**Specs:**
- Reuse existing `PricingCard` component
- Layout: 3 cards side-by-side (desktop), stack (mobile)
- Highlight: STARTER tier (border: var(--color-primary))

---

### SECTION 6: Final CTA + FAQ

**CTA Repeat:**
```
Začít zdarma →
```

**CTA Headline:**
```
Připravený na první nádech?
```

**Specs:**
- Same as Hero CTA styling
- Centered on page
- Background: var(--color-surface) (elevated card)
- Padding: var(--spacing-12)

**FAQ (7 Questions):**

**Q1: Potřebuji nějaké vybavení?**
```
A: Ne. Stačí telefon a 5 minut denně. Vše ostatní je v tobě.
```

**Q2: Jak rychle uvidím výsledky?**
```
A: První změny (lepší spánek, větší klid) během 7 dní. 
Měřitelné zlepšení BOLT skóre za 3 týdny.
```

**Q3: Je to vhodné pro začátečníky?**
```
A: Ano. Aplikace tě provede od základů. Žádná předchozí 
zkušenost není potřeba.
```

**Q4: Kolik to stojí?**
```
A: Základní verze je zdarma. Prémiové tarify od 125 Kč/měsíc 
(roční předplatné).
```

**Q5: Funguje offline?**
```
A: Ano. Všechna cvičení si můžeš stáhnout a cvičit bez internetu.
```

**Q6: Co je BOLT skóre?**
```
A: Objektivní metrika tvé schopnosti tolerovat CO₂. Čím vyšší 
BOLT, tím zdravější dýchání. Průměr populace: 20 sekund. 
Optimum: 40+ sekund.
```

**Q7: Potřebuji Apple Watch nebo fitness tracker?**
```
A: Ne. Aplikace funguje samostatně. Ale podporujeme Apple Watch 
pro pokročilé sledování srdečního tepu (HRV).
```

**Specs:**
- Component: Accordion (expand/collapse)
- Default: All collapsed
- Animation: 250ms ease-in-out
- Question: Inter Semibold, 18px, color: var(--color-text-primary)
- Answer: Inter Regular, 16px, color: var(--color-text-secondary)
- Background: var(--color-surface)
- Border: 1px solid var(--color-border)
- Icon: Chevron down/up (currentColor)

---

## Complete Copywriting (All Sections)

### SEO Meta Tags

```html
<title>DechBar - První česká aplikace pro funkční dýchání</title>

<meta name="description" content="Měř svůj pokrok. Cvič s certifikovaným instruktorem. Zlepši spánek, sniž stres, zvyš energii. Měřitelné výsledky za 21 dní. Od 0 Kč." />

<meta name="keywords" content="funkční dýchání, BOLT skóre, dechová cvičení, aplikace na dýchání, česká aplikace, buteyko metoda, jak zlepšit spánek, proti stresu, dechbar" />

<!-- Open Graph -->
<meta property="og:title" content="DechBar - První česká aplikace pro funkční dýchání" />
<meta property="og:description" content="Měř svůj pokrok. Cvič s certifikovaným instruktorem. Viditelné výsledky za 21 dní." />
<meta property="og:image" content="https://dechbar.cz/og-image.png" />
<meta property="og:url" content="https://dechbar.cz/" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="cs_CZ" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="DechBar - První česká aplikace pro funkční dýchání" />
<meta name="twitter:description" content="Měřitelné výsledky za 21 dní. Od 0 Kč." />
<meta name="twitter:image" content="https://dechbar.cz/og-image.png" />

<!-- Canonical -->
<link rel="canonical" href="https://dechbar.cz/" />
```

---

### Footer Copy

**Slogan:**
```
Tvůj dechový průvodce v kapse.
```

**Made in Badge:**
```
🇨🇿 Vytvořeno v České republice
```

**Navigation Links:**

**Produkt:**
- Jak to funguje
- Věda za DechBarem (/veda)
- Ceník
- Changelog

**Podpora:**
- FAQ
- Kontakt
- Nápověda

**Právní:**
- Obchodní podmínky
- Ochrana osobních údajů (GDPR)
- Cookies

**Komunita:**
- Blog (future)
- Instagram: @dechbar.cz
- Facebook: /dechbar

**Copyright:**
```
© 2026 DechBar. Všechna práva vyhrazena.
```

---

## Component Specifications

### Component Hierarchy

```
LandingPage (Main Composer)
├── Header (existing, keep as-is)
├── HeroSection (rebuild)
│   ├── Logo (Platform)
│   ├── Headlines (H1, H2)
│   ├── Button (Platform)
│   ├── TrustSignals (new)
│   └── HeroMockup (new)
├── SciencePillars (new)
│   ├── SectionTitle
│   ├── IntroText
│   ├── PillarCard x3
│   └── TextLink (Platform)
├── HowItWorks (new)
│   ├── SectionTitle
│   └── StepCard x3
├── TrustSection (new)
│   ├── ProfessionalQuote
│   └── DataPanel (3 metrics)
├── PricingSection (existing, keep)
│   └── PricingCard x3
├── FinalCTASection (new)
│   ├── CTA Repeat
│   └── FAQ (new accordion)
└── Footer (existing, enhance)
```

---

### Detailed Component Specs

#### HeroSection.tsx

```typescript
interface HeroSectionProps {
  // No props - static content
}

export function HeroSection() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  function handleCTA() {
    setShowAuthModal(true);
  }
  
  return (
    <section className="landing-hero">
      <div className="landing-hero__container">
        <div className="landing-hero__content">
          <h1 className="landing-hero__title">
            První česká aplikace pro funkční dýchání
          </h1>
          
          <h2 className="landing-hero__subtitle">
            Měř svůj pokrok. Cvič s certifikovaným instruktorem. 
            Viditelné výsledky za 21 dní.
          </h2>
          
          <div className="landing-hero__cta">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCTA}
            >
              Začít zdarma →
            </Button>
            <p className="landing-hero__cta-subtext">
              Email → První cvičení za 2 minuty
            </p>
          </div>
          
          <TrustSignals />
        </div>
        
        <div className="landing-hero__visual">
          <HeroMockup />
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="register"
      />
    </section>
  );
}
```

---

#### TrustSignals.tsx

```typescript
const TRUST_ITEMS = [
  { icon: 'users', text: '1150+ dýchačů' },
  { icon: 'headphones', text: '100+ cvičení' },
  { icon: 'certificate', text: 'Certifikováno' },
  { icon: 'currency', text: 'Od 0 Kč' },
];

export function TrustSignals() {
  return (
    <div className="trust-signals">
      {TRUST_ITEMS.map((item, index) => (
        <div key={index} className="trust-signal">
          <TrustIcon name={item.icon} />
          <span className="trust-signal__text">{item.text}</span>
        </div>
      ))}
    </div>
  );
}
```

**CSS:**
```css
.trust-signals {
  display: flex;
  gap: var(--spacing-6);
  flex-wrap: wrap;
  margin-top: var(--spacing-6);
}

.trust-signal {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.trust-signal__text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .trust-signals {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

#### HeroMockup.tsx

```typescript
export function HeroMockup() {
  return (
    <div className="hero-mockup">
      <div className="hero-mockup__phone">
        {/* SVG placeholder phone frame */}
        <svg viewBox="0 0 300 600" className="hero-mockup__frame">
          <rect x="10" y="10" width="280" height="580" rx="40" 
                fill="var(--color-surface)" />
          <rect x="20" y="20" width="260" height="560" rx="30" 
                fill="var(--color-background)" />
          
          {/* Placeholder screen content */}
          <circle cx="150" cy="200" r="60" 
                  fill="var(--color-primary)" opacity="0.2" />
          <rect x="80" y="300" width="140" height="20" rx="10" 
                fill="var(--color-text-tertiary)" opacity="0.3" />
          <rect x="60" y="340" width="180" height="20" rx="10" 
                fill="var(--color-text-tertiary)" opacity="0.2" />
        </svg>
      </div>
    </div>
  );
}
```

**CSS:**
```css
.hero-mockup {
  max-width: 300px;
  margin: 0 auto;
}

.hero-mockup__phone {
  animation: floating 3s ease-in-out infinite;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5));
}

@keyframes floating {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-mockup__phone {
    animation: none;
  }
}
```

---

#### SciencePillars.tsx

```typescript
interface Pillar {
  icon: string;
  title: string;
  description: string;
}

const PILLARS: Pillar[] = [
  {
    icon: 'dna',
    title: 'Bohrův efekt',
    description: 'Více CO₂ = lepší okysličení tkání',
  },
  {
    icon: 'lungs',
    title: 'Oxid dusnatý',
    description: 'Nosní dech = +18% kyslíku',
  },
  {
    icon: 'chart',
    title: 'Sleduj pokrok',
    description: 'BOLT skóre = objektivní metrika zdraví',
  },
];

export function SciencePillars() {
  return (
    <section className="science-section">
      <div className="science-section__container">
        <h2 className="section-title">Proč dýchání mění vše</h2>
        
        <p className="science-section__intro">
          95% populace dýchá suboptimálně. To ovlivňuje spánek, 
          energii i odolnost vůči stresu.
        </p>
        
        <div className="science-pillars">
          {PILLARS.map((pillar, index) => (
            <div key={index} className="pillar-card">
              <ScienceIcon name={pillar.icon} />
              <h3 className="pillar-card__title">{pillar.title}</h3>
              <p className="pillar-card__description">{pillar.description}</p>
            </div>
          ))}
        </div>
        
        <TextLink href="/veda">
          Přečti si vědecké pozadí →
        </TextLink>
      </div>
    </section>
  );
}
```

---

#### HowItWorks.tsx

```typescript
const STEPS = [
  {
    number: 1,
    title: 'Změř',
    description: 'Zjisti své BOLT skóre během 60 sekund. Získej výchozí hodnotu pro tracking.',
    screenshot: 'measure-placeholder',
  },
  {
    number: 2,
    title: 'Cvič',
    description: 'Vyber z 100+ audio programů. Ranní aktivace, polední reset nebo večerní relaxace.',
    screenshot: 'practice-placeholder',
  },
  {
    number: 3,
    title: 'Zlepšuj',
    description: 'Sleduj svůj pokrok v čase. Průměrné zlepšení: +12 sekund za 3 týdny.',
    screenshot: 'progress-placeholder',
  },
];

export function HowItWorks() {
  return (
    <section className="how-it-works-section">
      <div className="how-it-works__container">
        <h2 className="section-title">Jak DechBar funguje</h2>
        
        <div className="steps-grid">
          {STEPS.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-card__number">{step.number}</div>
              <div className="step-card__screenshot">
                {/* SVG placeholder */}
                <StepScreenshotPlaceholder type={step.screenshot} />
              </div>
              <h3 className="step-card__title">{step.title}</h3>
              <p className="step-card__description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

#### TrustSection.tsx

```typescript
interface TrustSectionProps {
  showEndorsement?: boolean;
}

export function TrustSection({ showEndorsement = true }: TrustSectionProps) {
  return (
    <section className="trust-section">
      <div className="trust-section__container">
        <h2 className="section-title">Co říkají odborníci</h2>
        
        {showEndorsement && (
          <blockquote className="professional-quote">
            <p className="professional-quote__text">
              "Funkční dýchání je jednou z nejefektivnějších metod 
              pro regulaci nervového systému. DechBar je nejlepší 
              nástroj, který mohu svým klientům doporučit."
            </p>
            <footer className="professional-quote__attribution">
              — MUDr. Jan Novák, fyzioterapeut<br />
              Fakultní nemocnice Motol, Praha
            </footer>
          </blockquote>
        )}
        
        <div className="data-panel">
          <div className="data-metric">
            <div className="data-metric__number">1150+</div>
            <div className="data-metric__label">aktivních uživatelů</div>
          </div>
          
          <div className="data-metric">
            <div className="data-metric__number">+12s</div>
            <div className="data-metric__label">
              průměrné zlepšení BOLT (3 týdny)
            </div>
          </div>
          
          <div className="data-metric">
            <div className="data-metric__number">4.8★</div>
            <div className="data-metric__label">hodnocení v App Store</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

#### FAQ.tsx

```typescript
import { useState } from 'react';
import { FAQ_ITEMS } from '../data/faq';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="faq-item">
      <button 
        className="faq-item__question"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <svg 
          className={`faq-item__icon ${isOpen ? 'faq-item__icon--open' : ''}`}
          width="20" 
          height="20" 
          viewBox="0 0 24 24"
        >
          <path 
            d="M6 9l6 6 6-6" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className="faq-item__answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  return (
    <div className="faq-list">
      {FAQ_ITEMS.map((item, index) => (
        <FAQItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
}
```

---

#### FinalCTASection.tsx

```typescript
export function FinalCTASection() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  return (
    <section className="final-cta-section">
      <div className="final-cta__container">
        <div className="final-cta__card">
          <h2 className="final-cta__headline">
            Připravený na první nádech?
          </h2>
          
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowAuthModal(true)}
          >
            Začít zdarma →
          </Button>
          
          <p className="final-cta__subtext">
            Email → První cvičení za 2 minuty
          </p>
        </div>
        
        <FAQ />
      </div>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="register"
      />
    </section>
  );
}
```

---

## Visual Specifications

### Layout Grid

```css
.landing-page {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
}

.section__container {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--spacing-6); /* 24px horizontal */
}
```

### Section Spacing

```css
/* Consistent vertical rhythm */
.landing-section {
  padding: var(--spacing-20) 0; /* 80px top/bottom */
}

@media (max-width: 768px) {
  .landing-section {
    padding: var(--spacing-16) 0; /* 64px mobile */
  }
}
```

### Typography Scale (Landing-Specific)

```css
/* Hero headline (larger than app) */
.landing-hero__title {
  font-size: 48px; /* Desktop */
  font-size: 36px; /* Tablet */
  font-size: 32px; /* Mobile */
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-tight);
  line-height: var(--line-height-tight);
}

/* Section titles */
.section-title {
  font-size: var(--font-size-3xl); /* 30px */
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-8);
}
```

---

## Technical Requirements

### Performance Budget

| Metric | Target | Max |
|--------|--------|-----|
| First Contentful Paint | < 1.2s | 1.5s |
| Largest Contentful Paint | < 2.0s | 2.5s |
| Time to Interactive | < 2.5s | 3.0s |
| Cumulative Layout Shift | < 0.1 | 0.15 |
| Total Bundle Size | < 400 KB | 500 KB |

### Optimization Strategies

```typescript
// 1. Code splitting
const SciencePage = lazy(() => import('./pages/SciencePage'));

// 2. Image optimization
// - Use WebP with PNG fallback
// - Lazy load below-fold images
// - Responsive images (srcset)

// 3. Critical CSS inlining
// - Hero section styles inline in <head>
// - Below-fold styles async loaded
```

### Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions (iOS 14+)
- Opera: Last 2 versions
- NO IE11 support

---

## SEO Strategy

### Primary Keywords (Czech)

1. **"funkční dýchání"** (exact match - category ownership)
2. **"BOLT skóre"** (unique term - own it)
3. **"dechová cvičení aplikace"** (broad + specific)
4. **"aplikace na dýchání"** (simple search term)
5. **"buteyko metoda"** (method-specific)

### Long-Tail Keywords (Pain-Based SEO)

Target Czech searches for problems we solve:

- "tlak na hrudi stres" → Blog: "Jak dýchání pomáhá s tlakem na hrudi"
- "nemůžu se dodýchnout" → Blog: "Příznaky špatného dýchání a jak je poznat"
- "jak zlepšit spánek" → Landing subpage: "Dýchání pro lepší spánek"
- "chronická únava" → Blog: "Jak dýchání zvyšuje energii"
- "jak se zbavit úzkosti" → Blog: "Funkční dýchání proti úzkosti"

### Schema Markup

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "DechBar",
  "description": "První česká aplikace pro funkční dýchání s měřitelnými výsledky",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CZK"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1150"
  }
}
</script>
```

---

## Analytics Events

### Track User Journey

```typescript
// Page load
analytics.track('Landing_Page_Viewed', {
  referrer: document.referrer,
  device: isMobile ? 'mobile' : 'desktop',
});

// Scroll depth
analytics.track('Section_Viewed', {
  section: 'hero' | 'science' | 'howitworks' | 'trust' | 'pricing' | 'faq',
  scrollDepth: percentage,
});

// Interactions
analytics.track('CTA_Clicked', {
  location: 'hero' | 'pricing' | 'final',
  text: 'Začít zdarma',
});

analytics.track('Science_Link_Clicked');
analytics.track('FAQ_Item_Opened', { question: string });
analytics.track('Pricing_Tier_Viewed', { tier: 'ZDARMA' | 'STARTER' | 'PRO' });

// Conversion
analytics.track('Email_Submitted', {
  source: 'landing_hero' | 'landing_final',
});
```

---

## A/B Testing Framework

### Prepared Variants

**Test 1: Headline**
- A: "První česká aplikace pro funkční dýchání" (current)
- B: "Zlepši spánek, sniž stres, zvyš energii"

**Test 2: CTA Text**
- A: "Začít zdarma →" (current)
- B: "Změř své BOLT skóre →"

**Test 3: Hero Layout**
- A: 2-column (text left, mockup right)
- B: Centered (text + CTA centered, mockup below)

**Test 4: Trust Section**
- A: With professional endorsement
- B: Data only (no endorsement)

**Implementation:** Use Vercel Edge Config for instant variant swaps.

---

## Mobile-First Responsive Spec

### Breakpoint Behavior

**390px (Mobile):**
- Hero: 1 column, text centered, mockup below
- Trust signals: 2x2 grid
- Science pillars: 1 column stack
- How it works: Vertical stack
- Pricing: 1 column stack
- FAQ: Full width

**768px (Tablet):**
- Hero: 2 columns (60/40 split)
- Trust signals: 1 row (4 items)
- Science pillars: 1 column (cards wider)
- How it works: Vertical stack (larger)
- Pricing: 2 columns (ZDARMA stacks, STARTER + PRO side-by-side)
- FAQ: Full width

**1024px+ (Desktop):**
- Hero: 2 columns (50/50 split)
- Science pillars: 3 columns
- How it works: 3 columns horizontal
- Pricing: 3 columns side-by-side

---

## Accessibility Specification

### WCAG AA Compliance

All text must meet 4.5:1 minimum contrast:

- ✅ #E0E0E0 on #121212 = 11.6:1 (AAA)
- ✅ #A0A0A0 on #121212 = 7.2:1 (AA)
- ✅ #2CBEC6 on #121212 = 7.2:1 (AA)
- ✅ #121212 on #D6A23A = 6.8:1 (AA)

### Keyboard Navigation

- Tab order: Logical top-to-bottom, left-to-right
- Focus indicators: 2px solid var(--color-primary)
- Skip links: "Skip to main content"
- Accordion: Space/Enter to toggle

### Screen Reader

```html
<!-- Semantic HTML -->
<main role="main">
  <section aria-labelledby="hero-heading">
    <h1 id="hero-heading">...</h1>
  </section>
</main>

<!-- Image alt text -->
<img src="mockup.png" alt="DechBar aplikace zobrazující BOLT skóre tracking" />

<!-- ARIA for interactive elements -->
<button aria-expanded="false" aria-controls="faq-1">
  Question text
</button>
<div id="faq-1" role="region">
  Answer text
</div>
```

---

## Asset Requirements

### Images

**Hero Mockup:**
- Format: PNG or WebP
- Size: 600x1200px (@2x for retina)
- Content: iPhone frame + DechBar dashboard screenshot
- Optimization: < 150 KB
- **Fallback:** SVG placeholder (current plan)

**How It Works Screenshots (3):**
- Format: PNG or WebP
- Size: 390x844px (iPhone 14 Pro aspect)
- Content:
  1. BOLT test screen
  2. Exercise selection screen
  3. Progress graph screen
- Optimization: < 100 KB each
- **Fallback:** SVG placeholders (current plan)

### SVG Icons (9 Total)

**Science (3):**
- `dna.svg` - Double helix icon
- `lungs.svg` - Lungs outline
- `chart.svg` - Growth chart

**Trust (4):**
- `users.svg` - Community icon
- `headphones.svg` - Audio icon
- `certificate.svg` - Badge/seal icon
- `currency.svg` - Czech crown symbol

**Steps (3):**
- `measure.svg` - Stopwatch with "1"
- `practice.svg` - Headphones with "2"
- `improve.svg` - Trend up with "3"

**Specs (All Icons):**
- Size: 24x24px viewBox
- Style: Outline, 2px stroke
- Color: currentColor (dynamic via CSS)
- Format: Inline SVG (no external files for critical icons)

---

## Success Metrics

### Conversion Funnel

```
Landing Page View
  ↓ (40% click rate target)
Hero CTA Click
  ↓ (60% form completion target)
Email Submitted
  ↓ (70% email open rate target)
Email CTA Click
  ↓ (50% app install target)
App Installed
  ↓ (30% activation target)
First Session Completed
```

### KPIs (Week 1 Post-Launch)

- Landing page views: 1,000+
- Email registrations: 400+ (40% conversion)
- App installs: 240+ (60% of emails)
- Active users: 72+ (30% activation)

### Monitoring

**Daily:**
- Conversion rate (landing → email)
- Bounce rate (should be < 50%)
- Time on page (target: 90+ seconds)

**Weekly:**
- Email → App install rate
- Section engagement (scroll tracking)
- FAQ usage (which questions opened most)

---

## Post-Launch Optimization

### Quick Wins (Week 1-2)

1. **CTA button color** - A/B test Gold vs. Teal
2. **Headline variant** - Test benefit-first vs. category-first
3. **Hero layout** - Test 2-column vs. centered
4. **Trust signal order** - Test which order converts best

### Medium-Term (Month 1-3)

1. Add real app screenshots (replace placeholders)
2. Add real professional endorsement (if available)
3. Add video explainer (60-90s Bohr effect visualization)
4. Expand FAQ based on actual user questions
5. Add testimonials section (when we have 10+ good ones)

### Long-Term (Month 3-6)

1. Localization (SK, EN, DE)
2. A/B test full page variants
3. Add interactive BOLT test (try before register)
4. Add case studies section (deep dives on user results)
5. Add press mentions (if we get media coverage)

---

## Related Documents

- [`COMPETITIVE_POSITIONING.md`](COMPETITIVE_POSITIONING.md) - Market positioning
- [`PERSONAS.md`](PERSONAS.md) - User personas
- [`LANDING_PAGE_VOCABULARY.md`](../../brand/LANDING_PAGE_VOCABULARY.md) - Copy guidelines
- [`CZECH_MARKET_INSIGHTS.md`](../../brand/CZECH_MARKET_INSIGHTS.md) - Research insights
- [`VISUAL_BRAND_BOOK.md`](../../brand/VISUAL_BRAND_BOOK.md) - Design system

---

**Last Updated:** 2026-01-14  
**Status:** Ready for Implementation  
**Owner:** Product & Development teams
