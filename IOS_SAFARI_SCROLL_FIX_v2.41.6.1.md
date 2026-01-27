# 🔧 iOS Safari Scroll Fix - Enhanced Touch Handling
**Version:** 2.41.6.1  
**Date:** 2026-01-27  
**Author:** AI Agent - Root Cause Analysis & Fix  
**Type:** Bug Fix (Critical - Mobile UX)

---

## 🎯 PROBLÉM

Na **mobile device** (iOS Safari) při kliknutí na tlačítko **KP** nebo **Settings** v Top Nav uvnitř demo mockupu se stránka **přescrollovala úplně nahoru** na začátek Hero sekce.

### **Symptoms:**
- ❌ User klikne na "KP 39s" button → page scrolluje na top
- ❌ User klikne na "Settings" (gear icon) → page scrolluje na top
- ❌ Modal se sice otevře, ale UX je rozbité (visual jump)
- ✅ Desktop (trackpad/mouse) funguje normálně

---

## 🔍 ROOT CAUSE ANALÝZA

### **Primary Cause: SVG foreignObject Context**

```tsx
// HeroMockup.tsx - Demo app je vnořený v SVG foreignObject
<svg viewBox="0 0 300 600">
  <foreignObject x="20" y="20" width="260" height="560">
    <div className="demo-app-container">
      <DemoApp />  {/* ← Buttony jsou zde */}
    </div>
  </foreignObject>
</svg>
```

**Co se děje:**
1. User **tapne** na button v Top Nav (KP nebo Settings)
2. Button dostane **:focus** state
3. iOS Safari auto-scrolluje focused element do view
4. Ale kvůli `foreignObject`, Safari scrolluje **parent page** místo SVG
5. **Výsledek:** Page jump na top (rozbité UX)

### **Why iOS Safari?**

iOS Safari má **známý bug** s `foreignObject`:
- Focus events v `foreignObject` se propagují do parent document
- Scroll behavior ignoruje CSS `scroll-margin` v tomto kontextu
- Bug je přítomen v iOS 14-17+ (current)

**Reference:**
- [WebKit Bug #228059](https://bugs.webkit.org/show_bug.cgi?id=228059)
- [MDN Discussion](https://github.com/mdn/content/issues/23180)

### **Secondary Cause: Touch vs Click Events**

Na mobile je rozdíl mezi `touch` a `click`:
- `onClick` handler se spustí **PO** `touchend` event
- Safari může triggerovat scroll **PŘED** `onClick` handler
- `e.preventDefault()` v `onClick` přichází **příliš pozdě**

---

## ✅ ŘEŠENÍ

### **Multi-Layer Fix (CSS + JS):**

#### **1️⃣ CSS Fix: `touch-action` Properties**

**File:** `src/styles/components/demo-app.css`

```css
.demo-app-container {
  /* ... existing styles ... */
  
  /* NEW: Isolate touch handling to prevent parent scroll */
  touch-action: pan-y; /* Allow vertical scroll only, block horizontal + zoom */
}

.demo-app-container button,
.demo-app-container .kp-display,
.demo-app-container a {
  /* Existing: Prevent native focus scroll */
  scroll-margin-top: 0 !important;
  scroll-margin-bottom: 0 !important;
  scroll-snap-stop: normal !important;
  
  /* NEW: Disable touch-based scrolling on interactive elements */
  touch-action: manipulation; /* Only allow tap, no pan/zoom */
}
```

**What it does:**
- `touch-action: pan-y` na container → povoluje pouze vertikální scroll
- `touch-action: manipulation` na buttony → zabraňuje Safari auto-scroll
- Safari nemůže triggerovat scroll při focus na button

---

#### **2️⃣ JS Fix: `onTouchStart` + `onTouchEnd` Handlers**

**File:** `src/modules/public-web/components/landing/demo/components/DemoTopNav.tsx`

**Before (partial fix):**
```tsx
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.blur();  // Too late on mobile!
    onKPClick(e);
  }}
>
```

**After (complete fix):**
```tsx
<button
  onTouchStart={(e) => {
    // Prevent Safari from preparing scroll on touch
    e.preventDefault();
  }}
  onTouchEnd={(e) => {
    // Prevent default BEFORE Safari scrolls (mobile)
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).blur();
    onKPClick(e as any);
  }}
  onClick={(e) => {
    // Desktop fallback
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.blur();
    onKPClick(e);
  }}
>
```

**Why it works:**
- `onTouchStart` + `preventDefault()` → zabraňuje Safari scroll **PŘED** focus
- `onTouchEnd` + `preventDefault()` → má vyšší prioritu než `onClick`
- `onClick` zůstává pro desktop (trackpad/mouse)

---

## 📦 ZMĚNĚNÉ SOUBORY

### **1. `/src/styles/components/demo-app.css`**
- ✅ Přidán `touch-action: pan-y` na `.demo-app-container`
- ✅ Přidán `touch-action: manipulation` na buttony
- 🎯 **Důvod:** Izoluje touch handling, zabraňuje Safari auto-scroll

### **2. `/src/modules/public-web/components/landing/demo/components/DemoTopNav.tsx`**
- ✅ KP button: Přidány `onTouchStart` + `onTouchEnd` handlery
- ✅ Settings button: Přidány `onTouchStart` + `onTouchEnd` handlery
- 🎯 **Důvod:** Prevent default PŘED Safari scroll (mobile priority)

---

## 🧪 TESTOVÁNÍ

### **Test Environment:**
- 📱 **Device:** iPhone 13 Mini (375x812px)
- 🌐 **Browser:** Safari (iOS 17+)
- 🔗 **URL:** Ngrok tunnel nebo Vercel preview

### **Test Steps:**

1. **Open demo on iPhone Safari**
   - Navigate to landing page `/vyzva`
   - Scroll down to Hero mockup section

2. **Test KP Button:**
   - Tap on "KP 39s" button in Top Nav (inside mockup)
   - ✅ Expected: Modal opens, **NO page scroll**
   - ❌ Before fix: Page scrolls to top

3. **Test Settings Button:**
   - Tap on Settings (gear icon) in Top Nav
   - ✅ Expected: Drawer opens, **NO page scroll**
   - ❌ Before fix: Page scrolls to top

4. **Test Desktop (Control):**
   - Open on desktop Chrome/Firefox
   - Click KP button → modal opens ✅
   - Click Settings → drawer opens ✅

### **Checklist:**
- [ ] iPhone 13 Mini (Safari): Tap KP → no scroll ✅
- [ ] iPhone 13 Mini (Safari): Tap Settings → no scroll ✅
- [ ] Desktop (Chrome): Click KP → modal opens ✅
- [ ] Desktop (Chrome): Click Settings → drawer opens ✅
- [ ] iPad (Safari): Touch KP → no scroll ✅
- [ ] Android (Chrome): Touch KP → no scroll ✅

---

## 🎨 DESIGN IMPACT

### **User Experience:**
- ✅ **Fluid interaction:** No jarring scroll jumps
- ✅ **Professional feel:** Mockup behaves like real app
- ✅ **Mobile-first:** Optimized for touch devices
- ✅ **Desktop preserved:** Mouse/trackpad still works

### **No Visual Changes:**
- Colors, spacing, typography unchanged
- Only behavior fix (invisible to user)

---

## 📊 TECHNICAL NOTES

### **iOS Safari Touch Handling:**

```
Touch Event Sequence (iOS):
1. touchstart → preventDefault() HERE = stop scroll prep
2. touchmove (if user drags)
3. touchend → preventDefault() HERE = stop focus scroll
4. focus (if not prevented)
5. click (synthetic, fired by Safari)

Our Fix:
- Intercept at step 1 & 3
- Prevent default BEFORE Safari decides to scroll
```

### **Why Not Just `tabindex="-1"`?**

```tsx
// Option A: Remove from tab order (NOT USED)
<button tabIndex={-1}>  // ❌ Breaks accessibility

// Option B: Keep focusable, prevent scroll (USED)
<button onTouchStart={preventDefault}>  // ✅ Preserves a11y
```

**Why Option B:**
- Maintains keyboard navigation (desktop)
- Passes WCAG accessibility guidelines
- Only fixes mobile touch issue

---

## 🚨 KNOWN LIMITATIONS

### **1. iOS Safari Bug (Unfixable):**
- `foreignObject` focus behavior je Safari bug
- Náš fix je **workaround**, ne true fix
- Pokud Apple opraví WebKit bug, náš fix zůstane kompatibilní

### **2. Touch-Action Browser Support:**
- `touch-action: manipulation` podporováno iOS 11+
- Fallback: Starší iOS může stále scrollovat (edge case)

### **3. Passive Event Listeners:**
- Modern browsers používají passive listeners pro performance
- `preventDefault()` v `onTouchStart` může být ignorován
- Test na real device nutný!

---

## 🔄 ROLLBACK (If Needed)

Pokud fix způsobí problémy:

```bash
git revert <commit-hash>
```

Nebo manuální revert:

**CSS:** Odstraň `touch-action` properties  
**JS:** Odstraň `onTouchStart` + `onTouchEnd`, ponech `onClick`

---

## 📚 RELATED DOCS

- `PWA_IOS_FIXES_v2.41.6.md` - Previous iOS fixes (Circle centering)
- `MOBILE_TESTING_GUIDE.md` - How to test on mobile
- `KP_INSTRUCTIONS_SPACING_v2.41.5.md` - KP UX improvements

---

## ✅ CHECKLIST

- [x] Root cause identified (foreignObject + focus scroll)
- [x] CSS fix implemented (touch-action properties)
- [x] JS fix implemented (onTouchStart + onTouchEnd)
- [x] No TypeScript errors
- [x] No lint errors
- [x] Documentation created
- [ ] Tested on iPhone 13 Mini (NEEDS USER)
- [ ] Tested on desktop (NEEDS USER)
- [ ] Verified modal/drawer opens correctly
- [ ] Ready for production deployment

---

**Status:** ✅ Code Implemented, Awaiting Real Device Test  
**Next:** Test on iPhone 13 Mini via ngrok/Vercel preview  
**Confidence:** 85% fix will work (iOS Safari is unpredictable)

---

*Last updated: 2026-01-27*  
*Version: 2.41.6.1*  
*Agent: Root Cause Analysis & Multi-Layer Fix Implementation*
