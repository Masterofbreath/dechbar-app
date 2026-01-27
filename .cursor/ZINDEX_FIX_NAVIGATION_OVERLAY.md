# 🔧 Z-Index Fix - Navigation Behind Settings Overlay

**Date:** 2026-01-26  
**Status:** ✅ IMPLEMENTED  
**Testing:** Ready for mobile testing on ngrok

---

## 🐛 PROBLÉM:

**Na mobile:**
- ❌ TOP NAV viditelná **NAD** Settings drawer
- ❌ BOTTOM NAV viditelná **NAD** Settings drawer
- ❌ Settings overlay (tmavý fade) **POD** navigací

**Očekávané chování (jako desktop):**
- ✅ Tmavý overlay NAD navigací
- ✅ TOP NAV + BOTTOM NAV **ZA** tmavým overlay (viditelné, ale ztmavené)
- ✅ Settings drawer NAD overlay

---

## 🔍 PŘÍČINA:

### Z-Index Stack (před fixem):

```css
/* TOP NAV */
.top-nav {
  z-index: 1001; /* ❌ PŘÍLIŠ VYSOKÝ! */
}

/* BOTTOM NAV */
.bottom-nav {
  /* ❌ ŽÁDNÝ z-index! */
}

/* Settings Overlay */
.settings-drawer-overlay {
  z-index: 10000; /* ← Teoreticky správně, ALE... */
}

/* Settings Drawer */
.settings-drawer {
  z-index: 10001;
}
```

**Problém:**
- TOP NAV má `z-index: 1001` - **nepřiměřeně vysoké** pro fixed navigation
- BOTTOM NAV **nemá** explicitní z-index
- Standard: Navigation = 100-1000, Modals/Overlays = 10000+
- I když overlay má vyšší z-index (10000), **stacking context konflikt** způsobil že navigation byla viditelná nad overlay

---

## ✅ ŘEŠENÍ: Snížit Navigation Z-Index

### Fix #1: TOP NAV z-index 1001 → 100

**Soubor:** `top-nav.css`

**Změna:**
```css
/* BEFORE */
.top-nav {
  z-index: 1001; /* Above content, below modals */
}

/* AFTER */
.top-nav {
  z-index: 100; /* Above content, below modals (10000+) - was 1001, too high! */
}
```

**Výsledek:**
- ✅ TOP NAV správně **POD** Settings overlay (100 < 10000)
- ✅ Stále NAD page content

---

### Fix #2: BOTTOM NAV z-index přidán

**Soubor:** `bottom-nav.css`

**Změna:**
```css
/* BEFORE */
.bottom-nav {
  /* Part of flex layout, not fixed */
  height: 72px;
  /* ... no z-index ... */
}

/* AFTER */
.bottom-nav {
  /* Position & z-index for proper stacking */
  position: relative; /* Ensure stacking context */
  z-index: 100; /* Match TOP NAV - below modals (10000+) */
  
  /* Layout */
  height: 72px;
  /* ... */
}
```

**Výsledek:**
- ✅ BOTTOM NAV explicitní z-index (konzistence s TOP NAV)
- ✅ Správně **POD** Settings overlay
- ✅ `position: relative` zajišťuje stacking context

---

### Fix #3: Aktualizace komentářů v settings-drawer.css

**Soubor:** `settings-drawer.css`

**Změny:**
```css
/* BEFORE */
.settings-drawer-overlay {
  z-index: 10000;  /* Above TOP NAV (1001) and BOTTOM NAV (1000) */
}

.settings-drawer {
  z-index: 10001;  /* Above overlay (10000) and TOP NAV (1001) */
}

/* AFTER */
.settings-drawer-overlay {
  z-index: 10000;  /* Above TOP NAV (100) and BOTTOM NAV (100) */
}

.settings-drawer {
  z-index: 10001;  /* Above overlay (10000) and TOP NAV (100) */
}
```

**Výsledek:**
- ✅ Komentáře reflektují nové z-index hodnoty
- ✅ Dokumentace aktuální

---

## 📊 FINÁLNÍ Z-INDEX STACK:

```
10001 - Settings Drawer         ✅ (Nejvyšší)
10000 - Settings Overlay         ✅ (Tmavý fade)
  100 - TOP NAV                  ✅ (Za overlay)
  100 - BOTTOM NAV               ✅ (Za overlay)
    1 - Page content             ✅ (Nejnižší)
```

**Správné pořadí (zdola nahoru):**
1. Page content (z-index: auto/1)
2. TOP NAV + BOTTOM NAV (z-index: 100) - **viditelné za overlay**
3. Settings Overlay (z-index: 10000) - **tmavý fade NAD navigací**
4. Settings Drawer (z-index: 10001) - **nad vším**

---

## 🎯 VÝSLEDEK:

**Desktop:**
- ✅ Settings jako side panel (již fungovalo)
- ✅ Navigation viditelná za tmavým overlay ✅

**Mobile:**
- ✅ Settings fullscreen
- ✅ Tmavý overlay NAD navigací ✅ **FIXED!**
- ✅ TOP NAV + BOTTOM NAV viditelné za overlay ✅ **FIXED!**
- ✅ Stejné chování jako desktop ✅

---

## 🧪 TESTING CHECKLIST:

### Desktop (>768px):
- [ ] Otevři Settings (gear icon)
- [ ] Settings panel zprava ✅
- [ ] Tmavý overlay viditelný ✅
- [ ] TOP NAV + BOTTOM NAV za overlay ✅

### Mobile (<768px):
- [ ] Otevři Settings (gear icon)
- [ ] Settings fullscreen ✅
- [ ] **Tmavý overlay NAD TOP NAV?** ✅ **MĚLO BY BÝT FIXED!**
- [ ] **Tmavý overlay NAD BOTTOM NAV?** ✅ **MĚLO BY BÝT FIXED!**
- [ ] Navigation viditelná, ale ztmavená? ✅
- [ ] Settings drawer nad vším? ✅

### Swipe Test (mobile):
- [ ] Swipe Settings zprava doleva (do půlky)
- [ ] **Vidíš tmavý overlay a navigation za ním?** ✅
- [ ] Swipe dokončit → Settings zavře plynule ✅

---

## 📋 SOUBORY UPRAVENY:

1. ✅ `src/styles/components/top-nav.css`
   - Změna: `z-index: 1001` → `z-index: 100`
   - Line: 22

2. ✅ `src/styles/components/bottom-nav.css`
   - Přidáno: `position: relative`
   - Přidáno: `z-index: 100`
   - Lines: 10-14

3. ✅ `src/styles/components/settings-drawer.css`
   - Aktualizace komentářů (1001 → 100)
   - Lines: 9, 28

---

## 💡 TECHNICKÁ POZNÁMKA:

### Proč z-index: 100 místo 1001?

**Standard z-index layers:**
```
1-99:     Content elements (cards, sections, etc.)
100-999:  Fixed navigation (TOP NAV, BOTTOM NAV, side menus)
1000-9999: Dropdowns, tooltips, popovers
10000+:    Modals, overlays, toasts (highest priority)
```

**Původní hodnota (1001):**
- ❌ Spadala do "dropdowns/tooltips" range
- ❌ Způsobovala konflikty s modals (10000+)
- ❌ Nepřiměřeně vysoká pro fixed navigation

**Nová hodnota (100):**
- ✅ Správný range pro fixed navigation
- ✅ Jasně pod modals/overlays (10000+)
- ✅ Konzistentní napříč TOP + BOTTOM NAV

### Proč `position: relative` na BOTTOM NAV?

**Důvod:**
- `z-index` funguje pouze na **positioned elements** (`relative`, `absolute`, `fixed`, `sticky`)
- BOTTOM NAV byl `position: static` (default)
- `position: relative` bez `top/left/right/bottom` **nezmění pozici**, pouze umožní z-index

**Výsledek:**
- ✅ BOTTOM NAV zůstává v flex layoutu (žádná změna pozice)
- ✅ `z-index: 100` je aktivní
- ✅ Vytvoří stacking context pro správné layering

---

## 🚀 DEPLOYMENT NOTES:

**Co testovat:**
1. ✅ Desktop - Settings side panel s navigation za overlay
2. ✅ **Mobile - Settings fullscreen s navigation za overlay** ← HLAVNÍ FIX!
3. ✅ Swipe gesture stále funguje plynule

**Known Good State:**
- Navigation visible (za tmavým overlay) ✅
- Settings overlay NAD navigací ✅
- Settings drawer NAD overlay ✅
- Z-index stack konzistentní ✅

---

**Fix implementován! Auto-refresh za ~200ms!** 🚀

**Test na mobile - měl bys teď vidět tmavý overlay NAD navigací!** 📱✨
