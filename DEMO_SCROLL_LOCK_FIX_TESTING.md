# 📱 Demo Scroll Lock Fix - Testing Guide

**Version:** 2.41.7  
**Date:** 2026-01-27  
**Fix:** NO-OP scroll lock + force unlock failsafe

---

## 🎯 QUICK TEST (5 minut)

### **Setup:**
```bash
# 1. Start dev server
npm run dev

# 2. Open on mobile (via ngrok or local network)
# Ngrok:
ngrok http 5173

# OR Local network:
# Find your IP: ifconfig | grep "inet "
# Open on mobile: http://YOUR_IP:5173
```

### **Test Scenario:**

**Test na iPhone Safari:**
1. Navigate to `/vyzva` (landing page)
2. Scroll down to Hero mockup section
3. **TAP KP button** (39s)
   - ✅ Expected: Modal opens, **NO scroll jump**
   - ✅ Expected: Can scroll page UP/DOWN while modal open
   - ✅ Expected: Close modal → scroll still works
4. **TAP Settings button** (gear icon)
   - ✅ Expected: Drawer opens, **NO scroll jump**
   - ✅ Expected: Close drawer → scroll works
5. **TAP Exercise card** (RÁNO, RESET, NOC)
   - ✅ Expected: Modal opens, **NO scroll jump**
   - ✅ Expected: Close modal → scroll works
6. **Switch to Cvicit tab** → tap exercise card
   - ✅ Expected: Modal opens, works correctly

---

## 🧪 FULL QA (15 minut)

### **Mobile (iPhone - Safari):**
- [ ] Tap KP button → modal opens, no scroll ✅
- [ ] Close KP modal → can scroll page ✅
- [ ] Tap Settings → drawer opens, no scroll ✅
- [ ] Close Settings → can scroll page ✅
- [ ] Tap RÁNO protocol → modal opens ✅
- [ ] Tap RESET protocol → modal opens ✅
- [ ] Tap NOC protocol → modal opens ✅
- [ ] Switch to Cvicit → tap BOX breathing ✅
- [ ] Tap Calm exercise → modal opens ✅
- [ ] Multiple open/close cycles → always works ✅
- [ ] **NEVER need to reload page!** ✅

### **Desktop (Chrome/Firefox/Safari):**
- [ ] Click KP button → modal opens ✅
- [ ] Click Settings → drawer opens ✅
- [ ] Click Exercise cards → modals open ✅
- [ ] Keyboard Tab navigation works ✅
- [ ] Scroll always functional ✅

### **Android (Chrome):**
- [ ] All buttons work correctly ✅
- [ ] Scroll never locked ✅

---

## ✅ SUCCESS CRITERIA

Fix is **successful** if:
1. ✅ No scroll jump when opening modals
2. ✅ Can always scroll page (never locked)
3. ✅ No need to reload page
4. ✅ Works on ALL buttons (KP, Settings, Exercise cards)
5. ✅ Desktop functionality preserved

---

## 🚨 IF PROBLEMS OCCUR

### **Problem: Still scrolls to top**
→ This is **different issue** (focus scroll, v2.41.6.1)
→ Check `onTouchStart` + `onTouchEnd` handlers in DemoTopNav.tsx

### **Problem: Body is locked (can't scroll)**
→ Check browser console: `document.body.style.overflow`
→ Should be: `""` (empty string) or `"auto"`
→ If `"hidden"` → failsafe didn't work, report bug

### **Problem: Desktop keyboard nav broken**
→ Should NOT happen (we didn't change tabindex)
→ Test: Press Tab key → focus should move
→ If broken, report bug

---

## 📊 TEST RESULTS

**Tested by:** _______________  
**Date:** _______________  
**Device:** _______________  
**iOS Version:** _______________

### **Results:**

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| KP button | ⬜ | |
| Settings button | ⬜ | |
| Exercise cards | ⬜ | |
| Scroll after close | ⬜ | |
| Desktop | ⬜ | |

**Overall Result:**
- [ ] ✅ All tests passed - Ready for production
- [ ] ⚠️ Minor issues - Needs adjustment
- [ ] ❌ Major issues - Needs rework

**Notes:**
```
[Your observations here]
```

---

## 🎯 EXPECTED BEHAVIOR

### **What Changed:**

**Before Fix:**
```
1. Tap button → Scroll to top ❌
2. Modal opens
3. Can't scroll ❌
4. Close modal
5. Still can't scroll ❌
6. Must reload page ❌
```

**After Fix:**
```
1. Tap button → No scroll ✅
2. Modal opens ✅
3. Can scroll page ✅
4. Close modal ✅
5. Still can scroll ✅
6. No reload needed ✅
```

---

**Ready to test!** 📱✨

*Quick reference for mobile testing - v2.41.7*
