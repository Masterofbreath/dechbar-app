# Agent Qualification System

**Purpose:** Zajistit, že každý AI agent rozumí projektu před implementací.

---

## 🎯 Jak to funguje:

```
1. Uživatel ti dá úkol
2. Přečteš PROJECT_GUIDE.md
3. Decision tree tě nasměruje na správný Study Guide
4. Prostuduj relevantní dokumentaci
5. Dáš zpětnou vazbu (návrh, plán)
6. Čekáš na schválení
7. Implementuješ!
```

---

## 📚 STUDY GUIDES (podle typu komponenty):

### **🎨 UI Components** (Interaktivní prvky)
**Soubor:** [components/UI_COMPONENTS.md](components/UI_COMPONENTS.md)

**Klíčová slova:** button, input, form, checkbox, radio, switch, toggle, slider, dropdown, select, textarea, datepicker

**Použij když:** Tvořím interaktivní prvek, formulář, input field

---

### **📦 Layout Components** (Struktura)
**Soubor:** [components/LAYOUT_COMPONENTS.md](components/LAYOUT_COMPONENTS.md)

**Klíčová slova:** card, modal, dialog, popup, overlay, drawer, sidebar, nav, header, footer, container, grid, panel, accordion, tabs

**Použij když:** Tvořím layout, modální okno, navigaci, strukturu stránky

---

### **📊 Data Display** (Zobrazení dat)
**Soubor:** [components/DATA_DISPLAY.md](components/DATA_DISPLAY.md)

**Klíčová slova:** table, list, grid, chart, graf, progress, badge, tag, tooltip, avatar, icon, stats, statistiky

**Použij když:** Zobrazuji data, seznamy, tabulky, statistiky, grafy

---

### **🎵 Media Components** (Audio/Video)
**Soubor:** [components/MEDIA_COMPONENTS.md](components/MEDIA_COMPONENTS.md)

**Klíčová slova:** audio, přehrávač, player, video, image, gallery, slider, carousel, waveform, visualizer

**Použij když:** Pracuji s audio, video, obrázky, galerií

---

### **🎯 Animations & Effects** (Animace)
**Soubor:** [components/ANIMATIONS.md](components/ANIMATIONS.md)

**Klíčová slova:** animace, animation, transition, hover, loading, spinner, skeleton, fade, slide, bounce, spring

**Použij když:** Přidávám animace, přechody, loading states

---

### **📱 Navigation** (Navigace)
**Soubor:** [components/NAVIGATION.md](components/NAVIGATION.md)

**Klíčová slova:** navigation, menu, breadcrumb, pagination, stepper, tabs, bottombar, topbar

**Použij když:** Tvořím navigaci, menu, stránkování

---

### **🔔 Feedback** (Zpětná vazba)
**Soubor:** [components/FEEDBACK.md](components/FEEDBACK.md)

**Klíčová slova:** notification, toast, alert, snackbar, message, error, success, warning

**Použij když:** Zobrazuji notifikace, errory, úspěšné zprávy

---

### **🎨 Typography & Text** (Text)
**Soubor:** [components/TYPOGRAPHY.md](components/TYPOGRAPHY.md)

**Klíčová slova:** heading, nadpis, text, paragraph, label, link, code, blockquote

**Použij když:** Pracuji s textem, nadpisy, typografií

---

## 📋 QUALIFICATION TESTS (podle typu úkolu):

| Test | Kdy použít | Obtížnost |
|------|-----------|-----------|
| [01_GENERAL_ONBOARDING](01_GENERAL_ONBOARDING.md) | První zkušenost, orientace | 🟢 Snadné |
| [02_FEATURE_IMPLEMENTATION](02_FEATURE_IMPLEMENTATION.md) | Nová stránka, login, feature | 🟡 Střední |
| [03_MODULE_CREATION](03_MODULE_CREATION.md) | Nový standalone modul | 🔴 Pokročilé |
| [04_UI_COMPONENT](04_UI_COMPONENT.md) | Design system komponenta | 🟡 Střední |
| [05_BUG_FIX_REFACTOR](05_BUG_FIX_REFACTOR.md) | Oprava bugu, refaktorování | 🟡 Střední |

---

## 📊 Scoring Systém:

```
✅ 90-100%: Go ahead! Můžeš implementovat.
⚠️ 70-89%:  Review needed. Doplň chybějící info.
❌ <70%:    Přečti dokumentaci znovu.
```

---

## 💡 Template pro uživatele:

**Pro jakýkoli úkol (zkopíruj):**

```
Ahoj! Jsi nový agent.

Úkol: [POPIS ÚKOLU]

Instrukce: Přečti PROJECT_GUIDE.md a následuj proces pro nové agenty.
```

**Pro "refresh" (zkušený agent):**

```
Uvažuj jako nový agent, který mi pomáhá tvořit [XY].

Přečti PROJECT_GUIDE.md znovu.
```

---

## 🎯 Proč to děláme:

✅ Konzistentní kvalita  
✅ Méně chyb  
✅ Rychlejší onboarding  
✅ Škálovatelnost (10+ agentů)  
✅ Test dokumentace  
✅ Strukturovaná zpětná vazba

---

**Máš otázky?** Zeptej se uživatele!

*Last updated: 2026-01-09*
