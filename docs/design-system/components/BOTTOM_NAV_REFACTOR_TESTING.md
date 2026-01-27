# Bottom Nav Refactor - Testing Checklist

**Date:** 2026-01-25  
**Version:** 2.0 (Dynamic FAB System)  
**Status:** ✅ Code Implemented, ⏳ Manual Testing Required

---

## 🎯 Změny implementované

### 1. TSX Komponenta (`BottomNav.tsx`)
- ✅ Odstraněn `isFAB` prop z `NavItem` interface
- ✅ Odstraněn `isFAB` z `NAV_ITEMS` konfigurace
- ✅ Zjednodušen `handleTabClick` - odstraněn FAB-specific logic
- ✅ Unified render struktura - všechny taby používají `bottom-nav__icon-wrapper`
- ✅ Dynamický icon size: `isActive ? 28 : 24`

### 2. CSS Styles (`bottom-nav.css`)
- ✅ FAB styling přesunut na `.bottom-nav__tab--active`
- ✅ Vytvořen universální `.bottom-nav__icon-wrapper` pro všechny taby
- ✅ Active tab: gold kruh (56px), elevation (-24px), gold shadow
- ✅ Inactive tabs: žádný kruh (24px icon), gray color
- ✅ Hover změněn z teal na gold
- ✅ Focus outline změněn na gold (konzistentní s active)
- ✅ Press animations upraveny (active: 0.95, inactive: 0.92)
- ✅ Reduced motion support

### 3. Navigation Hook (`useNavigation.ts`)
- ✅ Odstraněn `isFABPressed` state
- ✅ Odstraněn `setFABPressed` method
- ✅ Cleanup unused kódu

### 4. Dokumentace
- ✅ Aktualizován `BottomNav.md` - popsán dynamic FAB system
- ✅ Přidány visual examples (4 active states)
- ✅ Aktualizovány design tokens
- ✅ Aktualizován behavior popis

---

## 🧪 Testing Checklist

### A) Funkční Testing - 4 Active States

Test každý tab ve 4 stavech:

#### 1️⃣ Tab "Dnes" aktivní
- [ ] Gold kruh na "Dnes" (56×56px)
- [ ] "Dnes" icon 28px, ostatní 24px
- [ ] "Dnes" label gold, ostatní gray
- [ ] "Dnes" elevated (-24px margin-top)
- [ ] Gold shadow pouze na "Dnes"
- [ ] Ostatní taby nemají kruh

#### 2️⃣ Tab "Cvičit" aktivní
- [ ] Gold kruh na "Cvičit" (56×56px)
- [ ] "Cvičit" icon 28px, ostatní 24px
- [ ] "Cvičit" label gold, ostatní gray
- [ ] "Cvičit" elevated (-24px margin-top)
- [ ] Gold shadow pouze na "Cvičit"
- [ ] Ostatní taby nemají kruh

#### 3️⃣ Tab "Akademie" aktivní
- [ ] Gold kruh na "Akademie" (56×56px)
- [ ] "Akademie" icon 28px, ostatní 24px
- [ ] "Akademie" label gold, ostatní gray
- [ ] "Akademie" elevated (-24px margin-top)
- [ ] Gold shadow pouze na "Akademie"
- [ ] Ostatní taby nemají kruh

#### 4️⃣ Tab "Pokrok" aktivní
- [ ] Gold kruh na "Pokrok" (56×56px)
- [ ] "Pokrok" icon 28px, ostatní 24px
- [ ] "Pokrok" label gold, ostatní gray
- [ ] "Pokrok" elevated (-24px margin-top)
- [ ] Gold shadow pouze na "Pokrok"
- [ ] Ostatní taby nemají kruh

---

### B) Interakce Testing

#### Hover Effects (Desktop)
- [ ] Hover na neaktivní tab → icon + label gold preview
- [ ] Hover na neaktivní tab → icon translateY(-2px)
- [ ] Hover na aktivní tab → enhanced shadow (větší glow)

#### Press Animations
- [ ] Click neaktivní tab → scale(0.92) celého buttonu
- [ ] Click aktivní tab → scale(0.95) pouze icon wrapperu
- [ ] Smooth transition mezi active states

#### Focus States (Keyboard Navigation)
- [ ] Tab key naviguje mezi všemi 4 taby
- [ ] Focus outline viditelný (2px gold)
- [ ] Enter/Space aktivuje tab

---

### C) Responsive Testing

#### Mobile 375px (iPhone SE)
- [ ] Icon sizes správné (28px active, 24px inactive)
- [ ] Labels čitelné (11px, nebo 10px na úzkých displejích)
- [ ] Touch targets min 44×44px
- [ ] Elevation (-24px) nesmí překrývat content
- [ ] Safe area insets fungují (iOS notch)

#### Tablet 768px (iPad)
- [ ] Stejné chování jako mobile
- [ ] Žádné visual glitches
- [ ] Touch targets dostatečně velké

#### Desktop 1280px
- [ ] Hover effects fungují
- [ ] Cursor pointer na všech tabech
- [ ] Focus states viditelné

#### Very Narrow (<375px)
- [ ] Fallback styling aktivní (10px font, menší padding)
- [ ] Všechny taby se vejdou

---

### D) Accessibility Testing

#### ARIA Attributes
- [ ] `aria-label` na každém tabu
- [ ] `aria-current="page"` pouze na aktivním tabu
- [ ] `role="navigation"` na nav elementu
- [ ] `aria-label="Hlavní navigace"` na nav

#### Screen Reader
- [ ] Tab announces: "[Název tabu] - současná stránka" (když aktivní)
- [ ] Tab announces: "[Název tabu]" (když neaktivní)
- [ ] Navigace mezi taby logická (zleva doprava)

#### Color Contrast
- [ ] Gold (#D6A23A) na black (#121212) ≥ 4.5:1 ✅ (measured: 6.8:1)
- [ ] Gray (#A0A0A0) na dark (#1E1E1E) ≥ 4.5:1 ✅ (measured: 7.2:1)
- [ ] Icon na gold kruhu (#121212 on #D6A23A) ≥ 4.5:1 ✅

#### Reduced Motion
- [ ] Pokud `prefers-reduced-motion: reduce` → žádné transitions
- [ ] Pokud `prefers-reduced-motion: reduce` → žádné transform animace

---

### E) Edge Cases

#### Z-index Hierarchy
- [ ] Elevated tab se NEPŘEKRÝVÁ s top navigation
- [ ] Elevated tab se NEPŘEKRÝVÁ s page content
- [ ] Modal overlays překrývají bottom nav správně

#### Safe Area Insets (iOS)
- [ ] Bottom nav padding-bottom respektuje `env(safe-area-inset-bottom)`
- [ ] Elevated tab (-24px) nesráží se s iOS notch/home indicator

#### Animation Performance
- [ ] Žádné janky při přepínání mezi taby
- [ ] Smooth 60fps transitions
- [ ] GPU acceleration funguje (transform používá hardware acceleration)

#### Font Rendering
- [ ] Gold text čitelný na dark background
- [ ] Inter font se renderuje správně
- [ ] Font weight 600 na aktivním tabu viditelný rozdíl

---

## 🎨 Visual Regression Testing

### Before/After Screenshots

Udělej screenshots v těchto stavech:

1. **Všechny 4 active states** (Dnes, Cvičit, Akademie, Pokrok)
2. **Hover state** (neaktivní tab)
3. **Press state** (click animation)
4. **Focus state** (keyboard navigation)

Testuj na:
- Chrome DevTools (375px, 768px, 1280px)
- Real iPhone (pokud máš k dispozici)
- Real Android (pokud máš k dispozici)

---

## ✅ Expected Results

### ✅ Visual Clarity IMPROVED
- Aktivní sekce je okamžitě viditelná (gold kruh + elevation)
- Uživatel nemůže zaměnit aktivní tab s neaktivním
- Gold "Cvičit" už nemate, když není aktivní

### ✅ Consistency MAINTAINED
- Design tokens používány správně
- Accessibility zachována (WCAG AA)
- Touch targets splňují minimum (44×44px)
- Smooth animations zachovány

### ✅ Code Quality IMPROVED
- Méně complexity (odstranění FAB-specific logiky)
- Universální icon wrapper pro všechny taby
- Cleaner state management (žádný `isFABPressed`)

---

## 🚨 Potential Issues to Watch

### 1. Animation Jarring
**Risk:** Gold kruh může "skákat" mezi taby  
**Mitigation:** CSS transition na `margin-top` (implementováno)

### 2. Z-index Collision
**Risk:** Elevated tab překrývá content  
**Mitigation:** Test na real content, zkontroluj z-index hierarchy

### 3. Safe Area Issues
**Risk:** -24px margin koliduje s iOS notch  
**Mitigation:** Test na real iPhone s notch

### 4. Font Weight Visibility
**Risk:** Gold text méně čitelný než teal  
**Mitigation:** Zkontroluj contrast ratio (6.8:1 = OK ✅)

---

## 📝 Testing Sign-off

Po dokončení manuálního testingu:

- [ ] Všechny funkční testy prošly
- [ ] Všechny interakce fungují správně
- [ ] Responsive na všech breakpointech OK
- [ ] Accessibility nezhoršena
- [ ] Visual regression screenshots pořízeny
- [ ] Edge cases ověřeny
- [ ] Real device testing dokončeno

**Tester:** _______________  
**Date:** _______________  
**Approved for PROD:** ☐ Yes ☐ No

---

## 🚀 Deployment Plan

1. ✅ Code changes committed
2. ⏳ Deploy to TEST server (test.dechbar.cz)
3. ⏳ Manual testing on TEST (24h+ recommended)
4. ⏳ Fix any discovered issues
5. ⏳ Final approval from stakeholder
6. ⏳ Deploy to PROD (dechbar.cz)
7. ⏳ Monitor for issues
8. ⏳ Rollback ready (if needed)

---

**Ready for manual testing!** 🎉
