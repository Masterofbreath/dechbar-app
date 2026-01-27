# 🤖 Agent Onboarding - DechBar Landing Page `/vyzva`

**Created:** 2026-01-26  
**Purpose:** Onboarding nového agenta pro práci na landing page Březnové Dechové Výzvy 2026  
**Context:** Replace stávajícího agenta (příliš velký kontext, high cost)

---

## 🎯 **SOUČASNÝ STAV PROJEKTU:**

### **✅ CO JE HOTOVÉ:**

**Landing Page `/vyzva` je 98% complete:**
- ✅ Hero sekce (email input + SMART bonus badge)
- ✅ 3 Reasons (Funkční probuzení, Pustíš a dýcháš, Funguje i offline)
- ✅ Timeline (TEĎ → 26.2. → 1.3.) - vertical centered
- ✅ Testimonials (3 clean cards, pure black bg)
- ✅ FAQ (6 otázek, accordion)
- ✅ Final CTA ("Změň své ráno za 21 dní" + email input)
- ✅ ChallengeFooter (ultra-minimal: logo + 3 legal links)
- ✅ Homepage Footer (ultra-minimal: logo + 5 links inline)
- ✅ Mobile optimization (iPhone 13 Mini tested)
- ✅ HeroMockup (interaktivní demo, 300px, scale 0.693)

---

## ⚠️ **AKTIVNÍ PROBLÉM (FIX NEEDED):**

### **iOS Safari Focus Scroll Issue:**

**Symptom:**
- Kliknutí na "KP 39s" nebo "Settings" button v Top Nav mockupu
- → Scrolluje stránku nahoru (na začátek Hero)
- → Visual KP měření se rozbije

**Root Cause:**
- iOS Safari auto-scrolls focused elements
- SVG foreignObject context confuses Safari
- Top Nav (top: 0) triggers scroll, Bottom Nav (bottom: 0) ne

**Fix v progress:**
1. CSS: scroll-margin: 0 (demo-app.css)
2. JS: e.currentTarget.blur() (DemoTopNav.tsx)
3. Testování na iPhone

---

## 📁 **KLÍČOVÉ SOUBORY:**

### **Landing Page Components:**
```
src/modules/public-web/
├── pages/
│   └── ChallengePage.tsx           # Main LP (6 sekcí)
├── components/challenge/
│   ├── ChallengeHero.tsx           # Hero + email input
│   ├── Challenge3Reasons.tsx       # 3 benefits (inline SVG icons)
│   ├── ChallengeTimeline.tsx       # Vertical timeline (3 kroky)
│   ├── ChallengeTestimonials.tsx   # 3 testimonials
│   ├── ChallengeFAQ.tsx            # 6 FAQ (accordion)
│   ├── ChallengeFinalCTA.tsx       # Final CTA
│   └── ChallengeFooter.tsx         # Ultra-minimal footer
├── styles/
│   └── challenge.css               # LP-specific styles
└── data/
    └── challengeConfig.ts          # Config (timeline, testimonials)
```

### **Shared Components (Homepage i LP):**
```
src/modules/public-web/components/landing/
├── Footer.tsx                      # Homepage footer (ultra-minimal)
└── HeroMockup.tsx                  # Interaktivní demo mockup
    └── demo/
        ├── DemoApp.tsx             # Main demo app
        └── components/
            ├── DemoTopNav.tsx      # ← FIX NEEDED (iOS scroll)
            ├── DemoBottomNav.tsx
            ├── DemoKPCenter.tsx
            └── DemoSettingsDrawer.tsx
```

### **Styles:**
```
src/styles/components/
├── demo-app.css                    # Demo container (scale 0.693)
├── demo-top-nav.css
├── demo-bottom-nav.css
├── demo-kp-center.css
└── demo-kp-center-mobile.css       # ← Recently fixed (absolute positioning)
```

### **Config:**
```
src/config/messages.ts              # All copy (challenge.* object)
```

---

## 🎨 **DESIGN STANDARDS:**

### **Apple Premium Style:**
- ✅ Méně je více (6 sekcí, ne 8+)
- ✅ Sebevědomá jednoduchost (no hard sell)
- ✅ Tight letter-spacing (-0.02em na headlines)
- ✅ Gold CTA s glow shadow
- ✅ Dark-first (#121212)
- ✅ No header na conversion LP

### **Tone of Voice:**
- ✅ VŽDY tykání (ne vykání)
- ✅ Imperativ v CTA ("Registruj se", ne "Registrace")
- ✅ Krátké věty (max 15-20 slov)
- ✅ **ŽÁDNÉ emoji** (premium brand)
- ✅ Lowercase "dechpresso" (feature name)

### **Mobile-First (iPhone 13 Mini):**
- ✅ Touch targets: 52px CTA, 56px FAQ
- ✅ Font: 18px input (no iOS auto-zoom)
- ✅ Mockup: 300px (consistent s homepage)
- ✅ Trust signals: centered (ne left-aligned)
- ✅ Spacing: 48px sections (kompaktní)

---

## 🔧 **NEDÁVNÉ ZMĚNY (poslední 2 hodiny):**

1. ✅ Breaking text removed (redundance s Final CTA)
2. ✅ Timeline text: "Výzva startuje." (stručné)
3. ✅ FAQ updated (6 otázek, "dechpresso" mention)
4. ✅ Final CTA: "Změň své ráno za 21 dní." + "Zdarma. 7 minut denně."
5. ✅ ChallengeFooter: logo + tagline added
6. ✅ Homepage Footer: ultra-minimal (5 links inline)
7. ✅ Mockup scale: 0.693 (responsive scales removed)
8. ✅ KP modal positioning: fixed → absolute (stay in mockup)
9. ⚠️ iOS Safari scroll: IN PROGRESS

---

## 🚀 **IMMEDIATE TASK:**

**Dokonči iOS Safari scroll fix:**

**Soubor:** `src/styles/components/demo-app.css`

**Přidat před accessibility section:**
```css
/* iOS Safari Focus Scroll Prevention */
.demo-app-container button {
  scroll-margin: 0 !important;
}
```

**Soubor:** `src/modules/public-web/components/landing/demo/components/DemoTopNav.tsx`

**KP button + Settings button - přidat blur():**
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.blur();  // iOS Safari fix
  onKPClick(e);
}}
```

**Test:** iPhone 13 Mini → klik KP → no scroll ✅

---

## 📊 **METRICS & GOALS:**

**Target:**
- 2000-5000 email registrací
- 15-20% conversion rate
- 100K+ Kč/měsíc revenue (duben 2026)

**Timeline:**
- Launch: 1.2.2026 (ZÍTRA!)
- WhatsApp: 1150+ kontaktů
- PPC: od 15.2.
- Registrace: 26-28.2. (3denní okno)
- Start výzvy: 1.3.2026

---

## ✅ **TESTING CHECKLIST (před launch):**

- [ ] iOS Safari scroll fix (KP + Settings button)
- [ ] Desktop: Homepage i LP mockup identické
- [ ] Mobile (375px): Všechny touch targets 44px+
- [ ] Responsive: 375px, 768px, 1280px
- [ ] Brand compliance: No emoji, tykání, imperativ
- [ ] Visual Brand Book: Colors, typography, spacing
- [ ] Analytics: Email submission tracking ready

---

## 🎯 **NEXT AGENT TODO:**

1. Dokonči iOS scroll fix (3-part solution)
2. Test na iPhone 13 Mini
3. Final QA (desktop + mobile)
4. Ship to production (1.2. launch)

---

**Ať to dýchá!** 🚀
