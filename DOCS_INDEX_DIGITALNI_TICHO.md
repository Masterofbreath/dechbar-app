# 📚 Digitální Ticho - Index Dokumentace

**Navigace pro nového agenta**

---

## 🎯 START HERE (povinné čtení)

### 1. START_HERE_NEW_AGENT.md ⭐⭐⭐
**Čas:** 2 min  
**Obsah:** Quick start, kde začít, co číst  
**Kdy:** PRVNÍ soubor při handoff

### 2. README_DIGITALNI_TICHO.md ⭐⭐⭐
**Čas:** 10 min  
**Obsah:** Master dokumentace - positioning, struktura, specs  
**Kdy:** Hned po START_HERE

---

## 🚀 LAUNCH GUIDES (před deployment)

### 3. QUICK_START_V3.md ⭐⭐
**Čas:** 3 min  
**Obsah:** Quick launch workflow, enable video/audio  
**Kdy:** Před deploymentem

### 4. STRIPE_SETUP_DIGITALNI_TICHO.md ⭐⭐
**Čas:** 5 min  
**Obsah:** Stripe Product/Price creation, env setup  
**Kdy:** Před prvním checkout testem

### 5. DEPLOYMENT_GUIDE_DIGITALNI_TICHO.md ⭐
**Čas:** 10 min  
**Obsah:** Git workflow, preview → PROD  
**Kdy:** Před deploy

### 6. LAUNCH_CHECKLIST_DIGITALNI_TICHO.md ⭐
**Čas:** 5 min  
**Obsah:** Pre-launch checklist (quick reference)  
**Kdy:** Den launch

---

## 🧪 TESTING & QA

### 7. TESTING_CHECKLIST_DIGITALNI_TICHO.md ⭐⭐
**Čas:** 15 min  
**Obsah:** Desktop/mobile/accessibility/Stripe testing  
**Kdy:** Po každé změně před deploy

---

## 📹 ASSETS PRODUCTION

### 8. public/videos/README_VIDEO.md ⭐
**Čas:** 5 min  
**Obsah:** Video script (5 min), audio specs (7.5 min)  
**Kdy:** Když natáčíš video/audio

---

## 📜 CHANGELOG & HISTORY

### 9. DIGITALNI_TICHO_V3_COMPLETE.md
**Obsah:** V3 změny (final version)

### 10. DIGITALNI_TICHO_V3_FINAL.md
**Obsah:** V3 opravy (truthful copy)

### 11. DIGITALNI_TICHO_V2_CHANGES.md
**Obsah:** V2 změny (Janina model)

### 12. DIGITALNI_TICHO_SUMMARY.md
**Obsah:** V1 implementace (original)

---

## 📖 REFERENCE DOCS

### Brand & Design
- `docs/brand/VISUAL_BRAND_BOOK.md` - Colors, typography, shadows
- `docs/design-system/TONE_OF_VOICE.md` - Tykání, imperativ, dechový vibe
- `docs/design-system/01_PHILOSOPHY.md` - 4 temperamenty

### Technical
- `docs/features/DIGITALNI_TICHO.md` - Feature documentation
- `src/modules/public-web/components/digitalni-ticho/README.md` - Component overview

---

## 🗺️ READING PATH (podle úkolu)

### Jsem nový agent (first time)
```
1. START_HERE_NEW_AGENT.md        (2 min)
2. README_DIGITALNI_TICHO.md      (10 min)
3. Spusť dev server               (1 min)
4. Prozkoumej stránku v browseru  (5 min)
```

### Chci změnit copy
```
1. README_DIGITALNI_TICHO.md → "Positioning" sekce
2. Edit: src/config/messages.ts
3. Reload browser (auto-refresh)
```

### Chci nasadit (deploy)
```
1. QUICK_START_V3.md
2. STRIPE_SETUP_DIGITALNI_TICHO.md (if not done)
3. TESTING_CHECKLIST_DIGITALNI_TICHO.md
4. DEPLOYMENT_GUIDE_DIGITALNI_TICHO.md
```

### Chci přidat video/audio
```
1. public/videos/README_VIDEO.md
2. Upload files
3. Edit komponenty (set AVAILABLE = true)
4. Test
```

### Debugging
```
1. TESTING_CHECKLIST_DIGITALNI_TICHO.md → Troubleshooting
2. Console errors (F12)
3. ReadLints tool
```

---

## 📊 DOCUMENTATION STATS

**Total docs:** 12 files  
**Master docs:** 2 (START_HERE + README)  
**Launch guides:** 4  
**Changelogs:** 4  
**Assets:** 1  
**Reference:** 1 (this file)

---

## ✅ HANDOFF CHECKLIST

**Před předáním novému agentovi zkontroluj:**

- [✅] All code implemented
- [✅] TypeScript passes
- [✅] Dev server runs
- [✅] Master docs vytvořeny
- [✅] Launch guides vytvořeny
- [✅] Positioning dokumentován
- [✅] Assets specs napsány
- [✅] Troubleshooting guide
- [✅] Cost awareness note

---

**Next Agent:** Otevři `START_HERE_NEW_AGENT.md` a začni tam!

**Last Update:** 2026-02-17 13:35  
**Version:** V3 FINAL HANDOFF
