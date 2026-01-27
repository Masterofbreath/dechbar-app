# 📱 iOS Safari Scroll Fix - Testing Checklist

**Version:** 2.41.6.1  
**Date:** 2026-01-27  
**Fix:** Multi-layer approach (CSS touch-action + JS touch handlers)

---

## 🎯 QUICK TEST (5 minut)

### **Setup:**
1. Start dev server: `npm run dev`
2. Create ngrok tunnel: `ngrok http 5173`
3. Open ngrok URL on iPhone Safari

### **Test Scenario:**
1. Navigate to landing page `/vyzva`
2. Scroll down to Hero mockup (phone visual)
3. **TAP** on "KP 39s" button inside mockup
   - ✅ Expected: KP modal opens, **NO page scroll**
   - ❌ Bug: Page scrolls to top
4. Close modal
5. **TAP** on Settings (gear icon) inside mockup
   - ✅ Expected: Settings drawer opens, **NO page scroll**
   - ❌ Bug: Page scrolls to top

---

## 🧪 FULL QA (15 minut)

### **Mobile (iPhone 13 Mini - Safari):**
- [ ] KP button tap → no scroll ✅
- [ ] Settings button tap → no scroll ✅
- [ ] Modal opens correctly
- [ ] Drawer opens correctly
- [ ] Can close modal/drawer
- [ ] No visual glitches
- [ ] Touch feels responsive

### **Mobile (iPhone 13 Pro - Safari):**
- [ ] Same tests as Mini

### **Tablet (iPad - Safari):**
- [ ] KP button tap → no scroll ✅
- [ ] Settings button tap → no scroll ✅

### **Desktop (Chrome/Firefox/Safari):**
- [ ] KP button click → modal opens ✅
- [ ] Settings button click → drawer opens ✅
- [ ] Keyboard navigation works (Tab key)
- [ ] Focus indicators visible

### **Android (Chrome):**
- [ ] KP button tap → no scroll ✅
- [ ] Settings button tap → no scroll ✅

---

## 🚨 IF FIX DOESN'T WORK

### **Diagnostic Steps:**

1. **Check Console (Safari Dev Tools):**
   ```javascript
   // Add to DemoTopNav.tsx temporarily:
   console.log('Touch started on:', e.target);
   console.log('PreventDefault called:', e.defaultPrevented);
   ```

2. **Check Computed Styles:**
   - Inspect `.demo-app-container` → should have `touch-action: pan-y`
   - Inspect `.kp-display` → should have `touch-action: manipulation`

3. **Check Event Order:**
   ```javascript
   // Add to button:
   onTouchStart={() => console.log('1. touchstart')}
   onTouchEnd={() => console.log('2. touchend')}
   onClick={() => console.log('3. click')}
   ```
   
   Expected order: 1 → 2 → 3

### **If Still Scrolls:**

**Fallback Option: Add `tabindex="-1"` (accessibility trade-off):**
```tsx
<button tabIndex={-1} ...>
  // This removes button from keyboard navigation
  // but 100% prevents Safari scroll
</button>
```

---

## ✅ SUCCESS CRITERIA

Fix is considered **successful** if:
- ✅ No page scroll on mobile when tapping KP/Settings
- ✅ Modal/drawer opens correctly
- ✅ Desktop functionality preserved
- ✅ No new bugs introduced

---

## 📊 RESULTS

**Tested by:** _______________  
**Date:** _______________  
**Device:** _______________  
**iOS Version:** _______________

**Result:**
- [ ] ✅ Fix works perfectly
- [ ] ⚠️ Partial fix (still minor scroll)
- [ ] ❌ Fix doesn't work (needs iteration)

**Notes:**
```
[Your observations here]
```

---

**Ready for Production?** [ ] YES  [ ] NO

---

*Quick reference for mobile testing*
