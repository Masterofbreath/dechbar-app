# 📱 Mobile Hover Fix - Testing Checklist

**Version:** v2.41.0  
**Date:** 2026-01-26  
**Tester:** ___________  
**Device:** ___________  
**Browser:** ___________  
**Ngrok URL:** https://cerebellar-celestine-debatingly.ngrok-free.dev

---

## ✅ PRE-TESTING SETUP

- [ ] Vite dev server běží (`npm run dev`)
- [ ] Ngrok tunel běží (`ngrok http 5173`)
- [ ] Mobile připojeno na ngrok URL
- [ ] Přihlášen/a do /app

---

## 🧪 TEST 1: Settings Drawer - CloseButton

### Test 1.1: CloseButton neutral při otevření

**Kroky:**
1. Na mobile: Klikni na Settings icon (gear) v TOP NAV
2. Settings drawer se otevře (slide zprava)
3. Pozoruj CloseButton (X) v pravém horním rohu

**Očekávaný výsledek:**
- [ ] CloseButton je **ŠEDÝ** (neutral)
- [ ] CloseButton **NENÍ** teal (aktivní)
- [ ] Žádný teal background ani glow

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 1.2: TopNav pill neutral po zavření (CloseButton)

**Kroky:**
1. Na mobile: Otevři Settings
2. Klikni na CloseButton (X)
3. Settings se zavře
4. Pozoruj `.top-nav__right` pill (bell + settings icons)

**Očekávaný výsledek:**
- [ ] TopNav pill je **NEUTRAL** (default background)
- [ ] TopNav pill **NENÍ** teal
- [ ] Žádný teal border ani background

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 1.3: TopNav pill neutral po zavření (Swipe)

**Kroky:**
1. Na mobile: Otevři Settings
2. Swipe zprava doleva (zavři gestem)
3. Settings se zavře
4. Pozoruj `.top-nav__right` pill

**Očekávaný výsledek:**
- [ ] TopNav pill je **NEUTRAL**
- [ ] Žádný stuck hover state

**Status:** ⬜ Pass / ⬜ Fail

---

## 🧪 TEST 2: KPCenter Modal - CloseButton

### Test 2.1: CloseButton neutral při otevření

**Kroky:**
1. Na mobile: Klikni na "KP ?" button v TOP NAV (vlevo)
2. KP measurement modal se otevře
3. Pozoruj CloseButton (X) v pravém horním rohu

**Očekávaný výsledek:**
- [ ] CloseButton je **ŠEDÝ** (neutral)
- [ ] CloseButton **NENÍ** teal
- [ ] Žádný teal background

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 2.2: TopNav pill neutral po zavření

**Kroky:**
1. Na mobile: Otevři KP measurement modal
2. Klikni na CloseButton (X)
3. Modal se zavře
4. Pozoruj `.top-nav__right` pill

**Očekávaný výsledek:**
- [ ] TopNav pill je **NEUTRAL**
- [ ] TopNav pill **NENÍ** teal
- [ ] Žádný stuck hover state

**Status:** ⬜ Pass / ⬜ Fail

---

## 🖥️ TEST 3: Desktop - Hover Effects Fungují

### Test 3.1: CloseButton hover

**Kroky:**
1. Na **desktopu** (localhost:5173): Otevři Settings
2. Hover myší nad CloseButton (X)

**Očekávaný výsledek:**
- [ ] CloseButton je **TEAL** při hover
- [ ] Icon se **TOČÍ** (rotate 90deg)
- [ ] Smooth transition

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 3.2: TopNav pill hover

**Kroky:**
1. Na **desktopu**: Hover myší nad `.top-nav__right` pill

**Očekávaný výsledek:**
- [ ] Pill má **TEAL background** při hover
- [ ] Teal border při hover
- [ ] Smooth transition

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 3.3: Settings button hover (gear)

**Kroky:**
1. Na **desktopu**: Hover myší nad Settings icon (gear)

**Očekávaný výsledek:**
- [ ] Icon je **TEAL** při hover
- [ ] Gear se **TOČÍ** (rotate 45deg)
- [ ] Smooth animation

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 3.4: Bell button hover

**Kroky:**
1. Na **desktopu**: Hover myší nad Bell icon (notifications)

**Očekávaný výsledek:**
- [ ] Icon je **TEAL** při hover
- [ ] Bell se **HOUPÁ** (bellRing animation)
- [ ] Smooth animation

**Status:** ⬜ Pass / ⬜ Fail

---

## 🎯 TEST 4: Mobile Tap Highlight

### Test 4.1: Žádný modrý flash

**Kroky:**
1. Na mobile: Tap na jakýkoliv button (Settings, KP, avatar)
2. Pozoruj flash efekt

**Očekávaný výsledek:**
- [ ] **ŽÁDNÝ** modrý flash (default Safari/Chrome highlight)
- [ ] Pouze vlastní tap animace (`:active` state)

**Status:** ⬜ Pass / ⬜ Fail

---

## 🔄 TEST 5: Regression Testing

### Test 5.1: Settings swipe gesture stále funguje

**Kroky:**
1. Otevři Settings
2. Swipe zprava doleva

**Očekávaný výsledek:**
- [ ] Settings se zavře plynule
- [ ] Žádné poskočení
- [ ] Smooth animation

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 5.2: Navigation mezi taby funguje

**Kroky:**
1. Klikni na BOTTOM NAV taby (Dnes, Cvičit, Akademie, Pokrok)

**Očekávaný výsledek:**
- [ ] Gold kruh přeskakuje na aktivní tab
- [ ] Taby se nepohybují (fixed width)
- [ ] Smooth transitions

**Status:** ⬜ Pass / ⬜ Fail

---

## 📊 FINAL RESULTS

| Test | Status |
|------|--------|
| Test 1.1 - Settings CloseButton neutral | ⬜ |
| Test 1.2 - TopNav pill neutral (CloseButton) | ⬜ |
| Test 1.3 - TopNav pill neutral (Swipe) | ⬜ |
| Test 2.1 - KP CloseButton neutral | ⬜ |
| Test 2.2 - TopNav pill neutral (KP close) | ⬜ |
| Test 3.1 - Desktop CloseButton hover | ⬜ |
| Test 3.2 - Desktop TopNav pill hover | ⬜ |
| Test 3.3 - Desktop Settings hover | ⬜ |
| Test 3.4 - Desktop Bell hover | ⬜ |
| Test 4.1 - No blue flash | ⬜ |
| Test 5.1 - Swipe gesture works | ⬜ |
| Test 5.2 - Navigation works | ⬜ |

**Overall Status:** ⬜ All Pass / ⬜ Some Fail

---

## 📝 NOTES

**Issues Found:**

_____________________________________________

_____________________________________________

_____________________________________________

**Screenshots:**

- [ ] Settings CloseButton stuck (if fail)
- [ ] TopNav pill stuck (if fail)
- [ ] Desktop hover working (pass)

---

**Tester Signature:** ___________  
**Date Completed:** ___________  
**Time Spent:** ___________
