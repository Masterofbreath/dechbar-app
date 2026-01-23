# 🎯 PROMPT PRO NOVÉHO AGENTA - KP KOMPONENTA

**Datum:** 2026-01-23  
**Komponenta:** KP Tracking Engine (Měření Kontrolní Pauzy)  
**Účel:** Kompletní handoff pro nového AI agenta

---

## 👋 ÚVOD PRO NOVÉHO AGENTA

Ahoj! Vítej v projektu **DechBar App - Komponenta měření KP (Kontrolní Pauza)**.

Tvůj předchůdce dokončil verzi **v3.3** (critical crash fix + UX polish). Nyní pokračuješ v **dolaďování flow** od kliknutí na KP button v TOP NAV až po finální uložení měření.

**Tvůj cíl:** Vyladit flow podle principů **Apple Premium Style** a **Méně je více**.

---

## 📚 KROK 1: POVINNÝ ONBOARDING (ČTEŠ PRVNÍ!)

Než začneš cokoliv dělat, **MUSÍŠ** si přečíst tyto dokumenty **V TOMTO POŘADÍ**:

### 1.1 Základní dokumentace projektu

1. **README.md** (root) - Přehled projektu
2. **PROJECT_GUIDE.md** - Navigace pro AI agenty (⭐ START HERE)
3. **WORKFLOW.md** - Git workflow (LOCAL → TEST → PROD)
4. **.cursorrules** - Coding standards

### 1.2 Design & Brand Guidelines

5. **docs/design-system/TONE_OF_VOICE.md** - Jak komunikujeme (tykání, imperativ, dechový vibe)
6. **docs/brand/VISUAL_BRAND_BOOK.md** - Visual identity (dark-first, teal/gold, spacing)
7. **docs/design-system/01_PHILOSOPHY.md** - 4 Temperamenty (KRITICKÉ!)
8. **docs/development/AI_AGENT_COMPONENT_GUIDE.md** - Jak tvořit komponenty

### 1.3 KP Komponenta - Specifická dokumentace

9. **docs/api/KP_MEASUREMENTS_API.md** - API hook `useKPMeasurements()`
10. **docs/api/KP_DATA_CONTRACT.md** ⭐ **NOVÉ!** - Co ukládáme do DB (a proč)
11. **docs/development/implementation-logs/2026-01-23-kp-flow-v3.md** - Architektura v3
12. **KP_FLOW_V3.3_CRASH_FIX.md** (root) - Poslední změny (crash fix)

---

## 🎯 KROK 2: AKTUÁLNÍ STAV (KDE JSME SKONČILI)

### ✅ CO JE HOTOVO (v3.3):

#### Frontend Komponenty
- ✅ `src/platform/components/KPCenter.tsx` - Hlavní modal
- ✅ `src/hooks/kp/useKPMeasurementEngine.ts` - Headless hook (logika)
- ✅ `src/hooks/kp/useKPTimer.ts` - Timer state machine
- ✅ `src/components/kp/StaticBreathingCircle.tsx` - Circle placeholder
- ✅ `src/utils/kp/` - Utilities (calculations, formatting, validation)
- ✅ `src/styles/components/kp-center.css` - Styling

#### Flow States
- ✅ **Ready View** - Výchozí stav, "Začít měření" button
- ✅ **Instructions View** - Fullscreen návod "Jak měřit KP?"
- ✅ **Measuring View** - Timer běží, "Zastavit měření" button
- ✅ **Intermediate View** - Zobrazí výsledek pokusu, "Další měření" / "Hotovo"
- ✅ **Result View** - Finální průměr, "Zavřít" button

#### Kritické Bugfixy (v3.3)
- ✅ **FIXED:** Crash při spuštění měření (`calculateAverage([])` error)
- ✅ **FIXED:** Bezpečný `lastAttemptValue` (bounds check)
- ✅ **IMPROVED:** Instructions UX (jeden nadpis místo dvou)
- ✅ **IMPROVED:** CSS spacing pro instructions (12px místo 8px)

#### Architektura
- ✅ **Headless Hook Pattern** - Logic (hook) vs UI (component) separation
- ✅ **Stable Layout** - Circle VŽDY na stejné pozici, mění se jen obsah
- ✅ **Modal Stability** - ViewMode transitions bez jumping

---

### 🚧 CO CHYBÍ / CO LADIT:

#### Frontend Flow Polish
- ⚠️ **UX Refinement** - Možná je flow příliš komplikované? (user feedback)
- ⚠️ **Transitions** - Smooth animations mezi states?
- ⚠️ **Error Handling** - Co když timer selže?
- ⚠️ **Mobile UX** - Testováno jen na desktop?

#### Backend / Database
- ❌ **SUPABASE MIGRATION** - Ještě NEEXISTUJE! (záměrně)
- ❌ **RLS Policies** - Budou vytvořeny později
- ❌ **Helper Functions** - Budou vytvořeny později

#### Testing
- ⚠️ **Real User Testing** - Potřeba feedback od uživatele
- ⚠️ **Edge Cases** - Co když user zavře modal během měření?
- ⚠️ **Mobile Testing** - 375px, 768px breakpoints

---

## 🚀 KROK 3: TVŮJ ÚKOL (CO MÁŠ DĚLAT)

### Primární Focus: **UX Flow Polish**

Tvůj hlavní úkol je **doladit flow měření KP** od začátku do konce:

```
User Flow:
1. Klikne na KP button v TOP NAV
2. Otevře se modal (Ready View)
3. Klikne "Začít měření"
4. Timer běží (Measuring View)
5. Klikne "Zastavit měření"
6. Zobrazí se intermediate result
7. Pokračuje / Ukončuje měření
8. Zobrazí se finální result
9. Zavře modal
```

**Tvé otázky:**
- Je flow **intuitivní**?
- Je flow **rychlé**? (méně kliknutí = lepší)
- Je flow **přehledné**? (user ví, co dělat)
- Splňuje **Apple Premium Style**? (smooth, predictable)
- Splňuje **Méně je více**? (žádné zbytečnosti)

---

### Sekundární Focus: **Error Handling & Edge Cases**

- Co když user zavře modal během measuring?
- Co když timer selže?
- Co když saveKP() vrátí error?
- Co když user nemá internet?

---

### ❌ CO NEDĚLÁŠ (DŮLEŽITÉ!):

- ❌ **NETVOŘÍM DB MIGRATION** - Přijde později, až bude flow stabilní
- ❌ **NEPŘIPOJUJI SUPABASE** - Pro testování používej MOCK DATA
- ❌ **NEMIGRUJI DATA** - Žádné ALTER TABLE, žádné migrační skripty

**Proč tento přístup:**
- ✅ Flow se může měnit → schema se může měnit
- ✅ Rychlé iterace bez DB závislostí
- ✅ Optimální schema design až na konci

---

## 🗄️ KROK 4: DATABASE STRATEGIE (DŮLEŽITÉ!)

### Aktuální Stav:
- **DB Migration:** ❌ NEEXISTUJE (záměrně!)
- **Pro testování:** Používej **MOCK DATA**
- **Data Contract:** Viz `docs/api/KP_DATA_CONTRACT.md`

### Co musíš vědět:

1. **Frontend je ready** - `useKPMeasurements()` hook existuje
2. **Data structure je definovaná** - Viz `KP_DATA_CONTRACT.md`
3. **Pro testování:** Mock `saveKP()` success response
4. **DB vytvoříme POZDĚJI** - Až bude flow stabilní

### Mock Data Pro Testování:

```typescript
// Simulace saveKP() success
const mockSaveKP = async (data: SaveKPData) => {
  console.log('Mock saveKP:', data);
  // Simulace delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Vrať mock response
  return {
    id: 'mock-id',
    ...data,
    created_at: new Date().toISOString(),
  };
};
```

---

## 🎨 KROK 5: DESIGN GUIDELINES (KRITICKÉ!)

### Apple Premium Style Principles:

1. **Calm by Default** - UI je uklidňující, ne stimulující
2. **One Strong CTA** - Jeden dominantní button (gold), ostatní subdued
3. **Less is More** - Každý element musí mít účel
4. **Consistent & Intuitive** - Stejné věci vypadají stejně všude
5. **Accessible Contrast** - WCAG AA compliance

### Tone of Voice:

- ✅ **Tykání** - "Začít měření" (ne "Zahájit měření")
- ✅ **Imperativ** - "Pokračuj" (ne "Pokračování")
- ✅ **Gender-neutral** - "Jsi ready?" (ne "Jsi připravený/á?")
- ✅ **Dechový vibe** - "Máš dodýcháno!" (30-50% zpráv)
- ❌ **Žádné emoji** v buttons/labels (jen v success messages)

### 4 Temperamenty:

**KAŽDÁ feature musí fungovat pro všechny 4 typy:**
- 🎉 **Sangvinik** - Chce zábavu, sociální prvky
- ⚡ **Cholerik** - Chce rychlost, efektivitu
- 📚 **Melancholik** - Chce detaily, kvalitu
- 🕊️ **Flegmatik** - Chce klid, jednoduchost

**Příklad KP flow:**
- Sangvinik: Celebrace po dokončení ("Bomba! Nadechl ses k úspěchu")
- Cholerik: Rychlý flow (min. kliknutí, jasné CTA)
- Melancholik: Detailní instrukce (fullscreen view "Jak měřit?")
- Flegmatik: Klidný timer (smooth animations, bez urgence)

---

## 🛠️ KROK 6: TECHNICKÉ DETAILY

### Klíčové Soubory:

```
dechbar-app/
├── src/
│   ├── platform/components/
│   │   └── KPCenter.tsx ⭐ (hlavní modal)
│   ├── hooks/kp/
│   │   ├── useKPMeasurementEngine.ts ⭐ (logika)
│   │   └── useKPTimer.ts (timer state machine)
│   ├── components/kp/
│   │   ├── StaticBreathingCircle.tsx
│   │   └── index.ts
│   ├── utils/kp/
│   │   ├── calculations.ts
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── settings.ts
│   └── styles/components/
│       └── kp-center.css
├── docs/api/
│   ├── KP_MEASUREMENTS_API.md
│   └── KP_DATA_CONTRACT.md ⭐ (NOVÝ!)
└── docs/development/implementation-logs/
    └── 2026-01-23-kp-flow-v3.md
```

### Architektura (Headless Hook Pattern):

```
KPCenter (modal container)
├─ ViewMode: 'ready' | 'instructions' | 'measuring'
├─ MeasuringView (UI component)
│   ├─ useKPMeasurementEngine (logika hook)
│   ├─ renderCircleContent() - Obsah UVNITŘ circle
│   └─ renderButton() - Button POD circle
└─ StaticBreathingCircle (circle placeholder)
```

**Proč tento pattern:**
- Logic (hook) je oddělená od UI (component)
- Circle VŽDY na stejné pozici
- Smooth transitions (mění se pouze obsah)

---

## 🧪 KROK 7: TESTOVÁNÍ

### Test Checklist:

#### Manual Testing:
- [ ] Otevři KP modal z TOP NAV
- [ ] Klikni "Začít měření" → Timer běží
- [ ] Klikni "Zastavit měření" → Intermediate result
- [ ] Klikni "Další měření" → Timer běží znovu
- [ ] Dokončit všechny 3 pokusy → Result view
- [ ] Klikni "Zavřít" → Modal zavře, toast notification
- [ ] Otevři znovu → Ready view (NE auto-start!)

#### Edge Cases:
- [ ] Zavři modal během měření → Otevři znovu → Ready view
- [ ] Klikni "Hotovo (ukončit měření)" po 1. pokusu → Result view (1 pokus)
- [ ] Klikni "Jak měřit KP?" → Instructions fullscreen → "Zpět k měření"

#### Breakpoints:
- [ ] 375px (mobile)
- [ ] 768px (tablet)
- [ ] 1280px (desktop)

#### Browser Testing:
- [ ] Chrome (dev tools mobile emulation)
- [ ] Safari (desktop + iOS simulator)
- [ ] Firefox (optional)

---

## 🚦 KROK 8: GIT WORKFLOW

### Branches:

```
main → dechbar.cz (PRODUCTION)
dev → test.dechbar.cz (TEST - 24h+ testing)
feature/* → Vercel preview URLs
```

### Tvůj Workflow:

```bash
# 1. Start from dev
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/kp-flow-polish

# 3. Make changes, commit
git add .
git commit -m "feat(kp): polish flow XYZ"

# 4. Push to dev for testing
git checkout dev
git merge feature/kp-flow-polish
git push origin dev
# → Auto-deploy to test.dechbar.cz
```

### ⚠️ SECURITY RULES:

- ✅ **ALWAYS work on `dev` branch**
- ❌ **NEVER push to `main` without 24h+ testing**
- ⚠️ **ASK user before pushing to `main`!**

---

## 💬 KROK 9: KOMUNIKACE S UŽIVATELEM

### Před začátkem práce:

**VŽDY napiš uživateli:**

```markdown
📚 CO JSEM NASTUDOVAL:
- [seznam dokumentů]

🎯 MŮJ NÁVRH:
- [co chceš změnit]
- [jak to splňuje design principles]
- [jak to vyhovuje 4 temperamentům]

🏗️ IMPLEMENTAČNÍ PLÁN:
1. [krok 1]
2. [krok 2]
...

📝 SOUBORY, KTERÉ UPRAVÍM:
- [seznam souborů]

❓ OTÁZKY (pokud něco není jasné):
- [tvé dotazy]
```

### ⚠️ ČEKEJ NA SCHVÁLENÍ!

**NEIMPLEMENTUJ, dokud uživatel nepotvrdí plán!**

---

## 🚨 KROK 10: DŮLEŽITÁ VAROVÁNÍ

### ❌ CO NIKDY NEDĚLAT:

1. ❌ **NEMIGRUJ DATABASE** - Přijde později!
2. ❌ **NEPUSH NA MAIN** - Bez 24h testování!
3. ❌ **NEPOUŽÍVEJ EMOJI** - V buttons/labels (jen success messages)
4. ❌ **NEVYTVÁŘEJ NOVÉ BREAKPOINTS** - Používej existující (375px, 768px, 1280px)
5. ❌ **NEPOUŽÍVEJ `!important`** - Jen v krajním případě
6. ❌ **NEHARDCODUJ HODNOTY** - Používej design tokens (var(--spacing-4))
7. ❌ **NEIMPLEMENTUJ BEZ PLÁNU** - Vždy nejprve navrh, pak čekej na schválení

### ✅ CO VŽDY DĚLAT:

1. ✅ **ČTI DOKUMENTACI PRVNÍ** - Před jakýmkoliv kódem
2. ✅ **DRŽÍ SE 4 TEMPERAMENTŮ** - Každá feature pro všechny typy
3. ✅ **POUŽÍVEJ DESIGN TOKENS** - var(--color-primary), var(--spacing-4)
4. ✅ **TESTUJ NA 3 BREAKPOINTECH** - 375px, 768px, 1280px
5. ✅ **COMMIT ČASTO** - Malé, atomické commity
6. ✅ **PTEJ SE** - Pokud si nejsi jistý!

---

## 🎓 KROK 11: UŽITEČNÉ ODKAZY

### Dokumentace:
- [README.md](README.md) - Přehled projektu
- [PROJECT_GUIDE.md](PROJECT_GUIDE.md) - Master navigation
- [WORKFLOW.md](WORKFLOW.md) - Git workflow
- [docs/design-system/TONE_OF_VOICE.md](docs/design-system/TONE_OF_VOICE.md)
- [docs/brand/VISUAL_BRAND_BOOK.md](docs/brand/VISUAL_BRAND_BOOK.md)

### KP Komponenta:
- [docs/api/KP_MEASUREMENTS_API.md](docs/api/KP_MEASUREMENTS_API.md)
- [docs/api/KP_DATA_CONTRACT.md](docs/api/KP_DATA_CONTRACT.md) ⭐
- [docs/development/implementation-logs/2026-01-23-kp-flow-v3.md](docs/development/implementation-logs/2026-01-23-kp-flow-v3.md)
- [KP_FLOW_V3.3_CRASH_FIX.md](KP_FLOW_V3.3_CRASH_FIX.md)

### Supabase:
- Dashboard: https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns
- **NOTE:** Migration přijde později!

### Vercel:
- TEST: https://test.dechbar.cz (auto-deploy from `dev` branch)
- PROD: https://dechbar.cz (auto-deploy from `main` branch)

---

## ✅ KROK 12: CHECKLIST PŘED ZAČÁTKEM

Než začneš cokoliv dělat, zkontroluj:

- [ ] Přečetl jsi **všechny povinné dokumenty** (KROK 1)
- [ ] Rozumíš **aktuálnímu stavu** komponenty (KROK 2)
- [ ] Chápeš **tvůj úkol** (KROK 3)
- [ ] Víš o **DB strategii** (mock data, migration později) (KROK 4)
- [ ] Rozumíš **design guidelines** (Apple Premium, Tone of Voice, 4 Temperamenty) (KROK 5)
- [ ] Znáš **technické detaily** (soubory, architektura) (KROK 6)
- [ ] Víš, jak **testovat** (manuál, edge cases, breakpoints) (KROK 7)
- [ ] Chápeš **Git workflow** (dev → test → main) (KROK 8)
- [ ] Víš, jak **komunikovat** (návrh → schválení → implementace) (KROK 9)
- [ ] Znáš **varování** (co nedělat, co vždy dělat) (KROK 10)

---

## 🚀 TVŮJ PRVNÍ KROK

**Po přečtení všech dokumentů:**

1. Otevři `src/platform/components/KPCenter.tsx`
2. Prostuduj aktuální flow (Ready → Measuring → Result)
3. Otevři browser na http://localhost:5173
4. Klikni na KP button v TOP NAV
5. Projdi celý flow (Začít → Měření → Zastavit → Další → Hotovo)
6. Zapiš si **své postřehy:**
   - Co je dobře?
   - Co by se dalo zlepšit?
   - Splňuje to Apple Premium Style?
   - Splňuje to Méně je více?

**Pak napiš uživateli:**

```markdown
👋 Ahoj! Jsem nový agent na KP komponentě.

📚 PROSTUDOVAL JSEM:
- [seznam všech dokumentů]

🎯 MŮJ ROZBOR AKTUÁLNÍHO STAVU:
- [tvé postřehy k flow]
- [co je dobře]
- [co by se dalo zlepšit]

💡 MÉ NÁVRHY NA VYLEPŠENÍ:
1. [návrh 1]
2. [návrh 2]
...

❓ MÉ OTÁZKY:
- [tvé dotazy]

Můžeme pokračovat?
```

---

## 🎯 ZÁVĚR

**Tvůj úspěch závisí na:**
1. ✅ Důkladném studiu dokumentace
2. ✅ Pochopení design principles (Apple Premium, 4 Temperamenty)
3. ✅ Komunikaci s uživatelem (návrh → schválení → implementace)
4. ✅ Testování na real devices (mobile, tablet, desktop)
5. ✅ Kvalitním kódu (design tokens, type-safe, lint-clean)

**Pamatuj:**
- **Quality > Speed** - Dělej to správně, ne rychle
- **Méně je více** - Každý element musí mít účel
- **Ask before Act** - Ptej se, pokud si nejsi jistý
- **Test before Push** - Vždy testuj na 3 breakpointech

---

**Hodně štěstí! Těšíme se na spolupráci!** 🚀

---

*Last updated: 2026-01-23*  
*Version: 1.0*  
*Previous Agent: Claude Sonnet 4.5 (v3.3 crash fix)*
