# Bottom Nav Fix - Stabilní Ikony (No Layout Shift)

**Date:** 2026-01-25  
**Issue:** Ikony se posouvaly při změně aktivního tabu  
**Status:** ✅ Fixed

---

## 🐛 Problém

Při kliknutí na jiný tab se **všechny ostatní ikony pohybovaly** (layout shift).

### Příčina:
```css
/* ❌ PŘED: */
.bottom-nav__tab--active {
  margin-top: -24px; /* Negative margin ovlivňuje layout flow */
}
```

- `margin-top: -24px` **mění layout flow**
- Flexbox musí přepočítat pozice všech elementů
- Ostatní taby se posunou, aby kompenzovaly změnu

---

## ✅ Řešení

Použít `transform: translateY()` místo `margin-top`:

```css
/* ✅ PO: */
.bottom-nav__tab--active {
  transform: translateY(-24px); /* Visual offset, žádný vliv na layout */
}
```

### Proč funguje:
- ✅ `transform` **neovlivňuje layout** ostatních elementů
- ✅ Element zůstává ve svém původním prostoru v DOM
- ✅ Ostatní taby zůstávají na místě
- ✅ Stále dostaneme elevation efekt

---

## 🔧 Provedené změny

### 1. Změna elevation metody

**Soubor:** `src/styles/components/bottom-nav.css`

```css
/* Řádek 78-80 */
.bottom-nav__tab--active {
  position: relative;
  transform: translateY(-24px); /* Změněno z margin-top */
}
```

### 2. Fixní šířka tabů (stabilita)

```css
/* Řádek 32 */
.bottom-nav__tab {
  min-width: 80px; /* Změněno z 64px - všechny taby stejně široké */
}
```

**Důvod:** Gold kruh (56px) vs. normální ikona (24px) mohlo způsobit width změny.

### 3. Upravená transition

```css
/* Řádek 37 */
.bottom-nav__tab {
  transition: transform 0.2s ease; /* Odstraněno margin-top */
}
```

### 4. Opravená press animace

```css
/* Řádky 130-137 */
/* Active tab press - combine translateY with scale */
.bottom-nav__tab--active:active {
  transform: translateY(-24px) scale(0.98);
}
```

**Důvod:** Při press musíme kombinovat `translateY` (elevation) se `scale` (press efekt).

---

## 📊 Výsledek

### Před opravou:
```
Klikneš na "Cvičit" → [Dnes] [🟡Cvičit] [Akademie] [Pokrok]
                        ↓      ↓         ↓          ↓
                     VŠECHNY IKONY SE POSUNOU (layout shift)
```

### Po opravě:
```
Klikneš na "Cvičit" → [Dnes] [🟡Cvičit] [Akademie] [Pokrok]
                              ↑ only this moves up
                     OSTATNÍ ZŮSTÁVAJÍ NA MÍSTĚ ✅
```

---

## ✅ Testování

### Co ověřit:
- [ ] Klikni na "Dnes" → ostatní ikony se NEposunou
- [ ] Klikni na "Cvičit" → ostatní ikony se NEposunou
- [ ] Klikni na "Akademie" → ostatní ikony se NEposunou
- [ ] Klikni na "Pokrok" → ostatní ikony se NEposunou
- [ ] Gold kruh se smooth přesouvá (transition funguje)
- [ ] Press animace funguje správně (scale + translateY)
- [ ] Hover effects stále fungují

### Edge cases:
- [ ] Test na úzkých displejích (<375px)
- [ ] Test na touch device (press animation)
- [ ] Test rychlého klikání (transition se nepřekrývá)

---

## 🎯 Technické detaily

### CSS Transform vs Margin:

| Vlastnost | `margin-top: -24px` | `transform: translateY(-24px)` |
|-----------|---------------------|--------------------------------|
| **Layout flow** | ❌ Ovlivňuje | ✅ Neovlivňuje |
| **Ostatní elementy** | ❌ Posunou se | ✅ Zůstávají na místě |
| **Performance** | ⚠️ Reflow + Repaint | ✅ Pouze Composite (GPU) |
| **Animace** | ⚠️ Může být janky | ✅ Smooth 60fps |
| **Use case** | Layout adjustments | Visual effects |

### Proč `min-width: 80px`?

- Gold kruh: 56px + padding 12px × 2 = 80px
- Normální ikona: 24px + padding 12px × 2 = 48px
- Fixní šířka zajistí, že flex container má konzistentní velikost
- Žádné "breathing" efekty při změně active state

---

## 📝 Souhrn souborů

### Upraveno:
- ✅ `src/styles/components/bottom-nav.css` (~4 changes)

### Beze změny:
- ✅ `src/platform/components/navigation/BottomNav.tsx` (žádná změna nutná)
- ✅ `src/platform/hooks/useNavigation.ts` (žádná změna nutná)

---

## 🚀 Deployment

1. ✅ Změny provedeny
2. ⏳ Test na localhost:5173
3. ⏳ Deploy na TEST server
4. ⏳ Visual verification
5. ⏳ Deploy na PROD

---

**Fix je ready pro testování!** 🎉

Otevři http://localhost:5173/ a zkus klikat mezi taby - ikony by měly zůstat stabilní!
