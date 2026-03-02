# 🤖 Universal AI Agent Onboarding

**Created:** 4. února 2026  
**Purpose:** Standardní onboarding proces pro KAŽDÉHO nového AI agenta  
**Philosophy:** Less context = Less confusion = Better results

---

## 🎯 ZÁKLADNÍ PRINCIP

**Cíl:** Agent čte **minimum** nutných dokumentů, pak se zaměří **jen na svůj úkol**.

**Problém, kterému se vyhýbáme:**
- ❌ Příliš mnoho kontextu → halucinace
- ❌ Čtení irelevantních docs → zmatenost
- ❌ Version logs a historie → confusion o current state

**Řešení:**
- ✅ Povinný core onboarding (6 docs, 40 min)
- ✅ Task-specific deep dive (jen relevantní docs)
- ✅ Clear decision trees (PROJECT_GUIDE)

---

## 📚 KROK 1: POVINNÝ CORE ONBOARDING (40 min)

**Čti v tomto pořadí (VŽDY!):**

### **1. README.md** (5 min)
**Co se naučíš:**
- Tech stack (React, Supabase, Capacitor)
- Project structure (platform + modules)
- Jak spustit projekt (npm run dev)

### **2. PROJECT_GUIDE.md** (15 min)
**Co se naučíš:**
- Kompletní mapa projektu (kde co je)
- Decision trees (kam patří můj kód?)
- Pro AI Agenty: Study Guides (podle typu úkolu)

**⭐ KRITICKÉ:** Najdi decision tree pro svůj úkol!

### **3. .cursorrules** (5 min)
**Co se naučíš:**
- Coding standards (PHP, JS, CSS)
- Security rules (escape, sanitize, nonces)
- File structure conventions
- Co NIKDY nedělat

### **4. docs/brand/VISUAL_BRAND_BOOK.md** (5 min)
**Co se naučíš:**
- Barvy (Teal, Gold, neutrals)
- Typography (Inter font)
- Spacing (4px base unit)
- Breakpoints (320px, 480px, 768px, 1024px, 1440px)

### **5. docs/design-system/TONE_OF_VOICE.md** (5 min)
**Co se naučíš:**
- Jak komunikujeme (tykání, imperativ)
- Dechový vibe (klidný, povzbudivý)
- Co používat, co ne (emoji ❌, SVG icons ✅)

### **6. docs/design-system/01_PHILOSOPHY.md** (5 min)
**Co se naučíš:**
- **4 Temperamenty** (Sangvinik, Cholerik, Melancholik, Flegmatik)
- **KRITICKÉ:** KAŽDÁ komponenta musí uspokojit všechny 4 typy!
- Design principy (Calm by Default, One Strong CTA, Less is More)

---

## 🎯 KROK 2: IDENTIFIKUJ TYP ÚKOLU

**User ti dal zadání. Najdi klíčová slova:**

### **UI Components** (Button, Input, Checkbox, etc.)
→ **Study Guide:** `docs/development/agent-tests/components/UI_COMPONENTS.md`

### **Layout Components** (Card, Modal, Drawer, etc.)
→ **Study Guide:** `docs/development/agent-tests/components/LAYOUT_COMPONENTS.md`

### **Media Components** (Audio Player, Video, etc.)
→ **Study Guide:** `docs/development/agent-tests/components/MEDIA_COMPONENTS.md`

### **Session Audio & Haptics** (Breathing exercise feedback)
→ **Feature Guide:** `docs/features/SESSION_AUDIO_HAPTICS.md`  
→ **Audio Specs:** `docs/audio/` (README.md → production specs & frequencies)

**Klíčová slova:** haptika, vibrace, zvuk, audio, dechové cvičení, breathing cues, Solfeggio, background music, walking mode

**Kdy číst:**
- Modifikuješ haptic patterns (vibrace při nádechu/výdechu)
- Přidáváš nové audio cues (zvuky změny rytmu)
- Integruješ audio/haptics do nové session komponenty
- Debugguješ audio/vibration issues
- Vytvářeš audio soubory (production)

---

### **Feature/Page** (Login, Dashboard, Profile, etc.)
→ **Study Guide:** `docs/development/agent-tests/02_FEATURE_IMPLEMENTATION.md`

### **Module** (Celý standalone modul)
→ **Study Guide:** `docs/development/agent-tests/03_MODULE_CREATION.md`

### **Bug Fix**
→ **Study Guide:** `docs/development/agent-tests/05_BUG_FIX_REFACTOR.md`

**Nenašel jsi klíčové slovo?**
→ **Study Guide:** `docs/development/agent-tests/01_GENERAL_ONBOARDING.md`

---

## 🎯 KROK 3: TASK-SPECIFIC DEEP DIVE

**Teď čteš JEN dokumenty relevantní pro tvůj úkol!**

**Příklad: Tvůj úkol je "Vytvoř Button komponentu"**

```
1. Otevři Study Guide: docs/development/agent-tests/components/UI_COMPONENTS.md
2. Přečti sekci "CO SI NASTUDOVAT"
3. Najdi a přečti:
   - docs/design-system/components/Button.md (API reference)
   - docs/development/AI_AGENT_COMPONENT_GUIDE.md (jak tvořit)
   - Existující Button.tsx (pokud existuje)
4. Pochop patterns a principy
5. ✅ Jsi ready implementovat!
```

**NEDĚLÁŠ:**
- ❌ Nečteš KP docs (není relevantní)
- ❌ Nečteš Modal docs (není relevantní)
- ❌ Nečteš Session Engine docs (není relevantní)

**Výsledek:** Focused knowledge, no confusion.

---

## 🎯 KROK 4: DAJ FEEDBACK PŘED IMPLEMENTACÍ

**VŽDY před implementací napíš uživateli:**

```markdown
📚 CO JSEM NASTUDOVAL:
- [seznam docs, které jsi četl]

🎯 MŮJ NÁVRH:
- [tvůj plán řešení]
- [jaké design tokens použiješ]
- [jak to splní 4 temperamenty]

🏗️ IMPLEMENTAČNÍ PLÁN:
1. [krok 1]
2. [krok 2]
3. [atd.]

📝 SOUBORY, KTERÉ VYTVOŘÍM/UPRAVÍM:
- [seznam souborů a cest]

❓ OTÁZKY (pokud něco není jasné):
- [tvé dotazy]
```

**⚠️ POČKEJ NA APPROVAL!** Neimplementuj bez souhlasu.

---

## 🎯 KROK 5: IMPLEMENTUJ

**Po schválení:**
1. ✅ Vytvoř/uprav soubory podle plánu
2. ✅ Dodržuj coding standards (.cursorrules)
3. ✅ Design splňuje 4 temperamenty
4. ✅ Update CHANGELOG.md s tvojí změnou
5. ✅ Řekni "Hotovo, ready for testing"

---

## ⚠️ COMMON PITFALLS (Čemu se vyhnout)

### **1. Čtení příliš mnoho dokumentů**
```
❌ Špatně: "Přečtu všech 100+ docs v projektu"
✅ Správně: "Přečtu 6 core docs + task-specific docs (celkem ~10 docs)"
```

### **2. Čtení version logs**
```
❌ Špatně: "Přečtu KP_DISPLAY_BUG_FIX_v2.41.9.2.md"
✅ Správně: "Přečtu current KP code, ne historical bugfixy"
```

### **3. Ignorování 4 temperamentů**
```
❌ Špatně: "Udělám to jednoduše" (= jen Flegmatik)
✅ Správně: "Jak to uspokojí všechny 4 typy?"
```

### **4. Implementace bez approval**
```
❌ Špatně: User: "Udělej X" → Agent: *rovnou tvoří*
✅ Správně: User: "Udělej X" → Agent: *feedback* → User: "OK" → Agent: *tvoří*
```

### **5. 🚨 PŘÍMÉ ZMĚNY V SUPABASE DASHBOARDU — ABSOLUTNÍ ZÁKAZ**

> **Incident z 27. 2. 2026:** AI agent přímo přepsal tabulku `exercises` v Supabase
> dashboardu (mimo migrace). Tím zničil původní 7-fázové protokoly na 4-fázové
> a smazal historii změn. Oprava trvala hodiny a vyžadovala git forensiku.

```
❌ ZAKÁZÁNO: INSERT/UPDATE/DELETE přímo v Supabase dashboardu bez migrace
❌ ZAKÁZÁNO: Seed data přes Supabase SQL Editor bez migration souboru
❌ ZAKÁZÁNO: Přepisovat existující záznamy mimo migration systém

✅ SPRÁVNĚ — VŽDY:
   1. Vytvoř migration soubor: supabase/migrations/YYYYMMDDHHMMSS_nazev.sql
   2. Obsah migrace: SQL příkazy (CREATE, ALTER, INSERT, UPDATE)
   3. Aplikuj přes: supabase db push (DEV), pak MCP apply_migration (PROD)
   4. Commit migration souboru do gitu PŘED pushnutím na PROD
```

**Proč je to kritické:**
- Git uchovává historii — bez migration souboru neexistuje audit trail
- Přímé změny nelze rollbackovat skriptem
- Kolegy (a budoucí agenty) to zmátne: kód říká jedno, DB dělá druhé
- Uživatel (majitel produktu) se dozví o změně až když je pozdě

**Výjimky:** Čtení dat (SELECT) a debugging dotazy v dashboardu jsou OK.

### **6. 🚨 NEMĚŇ UI LABELY BEZ PTANÍ**

```
❌ Špatně: Vidím "7 min" v kódu, spočítám 330s = 5.5 min → přepíšu na "6 min"
✅ Správně: Zeptám se uživatele: "Label říká 7 min, ale protokol trvá 5.5 min.
           Chceš přesný label nebo upravit délku protokolu?"
```

UI labely jako délky (min), ceny, jména funkcí jsou **produktová rozhodnutí** —
ne technická. Vždy se zeptej, nikdy nepřepisuj bez souhlasu.

---

## 🧪 SELF-CHECK BEFORE STARTING

**Před začátkem práce si polož:**

- [ ] Četl jsem 6 core docs? (README, PROJECT_GUIDE, .cursorrules, Brand Book, Tone of Voice, Philosophy)
- [ ] Identifikoval jsem typ úkolu? (UI, Layout, Feature, Bug, etc.)
- [ ] Našel jsem Study Guide pro můj typ úkolu?
- [ ] Četl jsem POUZE relevantní task-specific docs?
- [ ] Rozumím 4 temperamentům a jak je uspokojit?
- [ ] Dal jsem feedback PŘED implementací?
- [ ] Čekám na approval?

**7/7 ✅?** Jsi správně onboardnutý agent! 🎉

---

## 📖 QUICK REFERENCE

### **Core Docs (Always Read)**
```
1. README.md
2. PROJECT_GUIDE.md (⭐ most important)
3. .cursorrules
4. docs/brand/VISUAL_BRAND_BOOK.md
5. docs/design-system/TONE_OF_VOICE.md
6. docs/design-system/01_PHILOSOPHY.md
```

### **Task-Specific Guides**
```
PROJECT_GUIDE.md → Section "For New AI Agents (START HERE!)"
→ Decision tree podle klíčových slov
→ Link na Study Guide
→ Study Guide: "CO SI NASTUDOVAT" sekce
```

### **Where Does My Code Go?**
```
PROJECT_GUIDE.md → Section "WHERE DOES MY CODE GO?"
→ Decision trees (Platform vs Module)
→ File location examples
```

---

## 🔗 RELATED DOCS

- **[PROJECT_GUIDE.md](../../PROJECT_GUIDE.md)** - Master navigation
- **[AI_AGENT_COMPONENT_GUIDE.md](./AI_AGENT_COMPONENT_GUIDE.md)** - How to create components
- **[Study Guides](./agent-tests/)** - Task-specific onboarding

---

## ✅ SUCCESS CRITERIA

**Dobrý agent:**
- ✅ Přečetl jen nutné docs (ne všechno)
- ✅ Rozumí 4 temperamentům
- ✅ Dal feedback před implementací
- ✅ Počkal na approval
- ✅ Kód je podle standards
- ✅ Update CHANGELOG

**Špatný agent:**
- ❌ Četl 50+ docs (overwhelmed)
- ❌ Ignoroval 4 temperamenty
- ❌ Implementoval bez feedback
- ❌ Kód nekonzistentní se standards

---

## 💡 TIP PRO ZKUŠENÉ AGENTY

**"Refresh Mode"**

I když už jsi pracoval na projektu, můžeš kdykoliv začít znovu jako "nový agent":

```
User: "Uvažuj jako nový agent, který mi pomáhá tvořit [XY]."

Agent:
1. Projde core onboarding znovu
2. Najde Study Guide pro úkol
3. Dá fresh perspective návrh
4. Čeká na approval

= Better results! ✨
```

---

**Philosophy:** Less is more. Focus > Volume.

**Status:** ✅ Universal guide for all agents

*Created: 4. února 2026*  
*Maintained by: DechBar Team*
