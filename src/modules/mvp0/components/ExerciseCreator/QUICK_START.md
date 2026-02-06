# 🚀 EXERCISE CREATOR - QUICK START

**For:** New AI Agent  
**Time to read:** 5 minutes  
**Then:** Start implementation in 4 days

---

## ❓ WHAT IS THIS?

**Exercise Creator** je komponenta pro tvorbu vlastních dechových cvičení v DechBar app.

**Where:** View "Cvičit" → Tab "Vlastní" → Button "+ Vytvořit"  
**What:** Fullscreen modal editor  
**Result:** Custom breathing exercise with color, rhythm, repetitions

---

## 📄 DOCUMENTS IN THIS FOLDER

Read in this order:

1. **QUICK_START.md** (this file) - 5 min overview
2. **MASTER.md** - Complete overview with flows
3. **SPECIFICATION.md** - Deep technical specification
4. **IMPLEMENTATION_CHECKLIST.md** - Day-by-day implementation
5. **README.md** - Component documentation

---

## 🎯 WHAT YOU'LL BUILD

### MVP Features (4 days):

✅ **Breathing Pattern Editor**
- 4 hybrid steppers (inhale, hold, exhale, hold)
- Range: 0.0 - 20.0s, increment 0.5s

✅ **Repetition Controller**
- Circular drag control (1-99 reps)
- Quick presets: [9×] [18×] [27×]

✅ **Color Picker**
- 8 preset colors (teal, gold, purple, etc.)
- Applied to card background

✅ **Name + Description**
- Name: 3-50 chars, emoji support, unique
- Description: Optional, 350 chars

✅ **Tier System**
- FREE: Max 3 exercises
- SMART: Unlimited
- iOS-compliant paywall

✅ **Validation**
- Real-time, inline errors
- Save disabled when invalid

---

## 📐 DESIGN REFERENCE

```
[Mobile Layout]

←  Zrušit       Nové cvičení
   Jednoduchý  ●━━○  Komplexní
───────────────────────────────
Název cvičení*
[Box Breathing 🫁_________]

ⓘ Informace o cvičení ▼
───────────────────────────────
Rytmus dechu

  ▲      ▲      ▲      ▲
 4.0s   0.0s   4.0s   0.0s
  ▼      ▼      ▼      ▼
Nádech Zadrž  Výdech Zadrž
───────────────────────────────
Doba a opakování

     ╭─────╮
    │  ◉   │
    │  9×   │
    │00:01:12│
     ╰─────╯

 [9×]  [18×]  [27×]
───────────────────────────────
Barva karty cvičení

[●✓] [●] [●] [●] [●] [●] [●] [●]
───────────────────────────────
      [✓ Uložit]
```

---

## 🏗️ FILE STRUCTURE

```
ExerciseCreator/
├── QUICK_START.md              ← You are here
├── MASTER.md                   ← Start here after this
├── SPECIFICATION.md            ← Deep dive
├── IMPLEMENTATION_CHECKLIST.md ← Follow this
├── README.md                   ← Documentation
├── types.ts                    ✅ Already created
├── constants.ts                ✅ Already created
├── index.ts                    ✅ Already created
├── ExerciseCreatorModal.tsx    ⏳ You implement
├── components/
│   ├── BasicInfoSection.tsx
│   ├── BreathingPatternSection.tsx
│   ├── BreathingControl.tsx
│   ├── DurationSection.tsx
│   ├── ColorPickerSection.tsx
│   └── ModeToggle.tsx
└── hooks/
    ├── useExerciseCreator.ts   ← XState machine
    ├── useBreathingValidation.ts
    ├── useDurationCalculator.ts
    └── useExerciseNameExists.ts
```

---

## ⏱️ TIMELINE

**Total:** 4 days (32 hours)

**Day 1:** Foundation (types, XState, structure)  
**Day 2:** UI Components (all sections)  
**Day 3:** Integration (DB, API, testing)  
**Day 4:** Polish (animations, analytics)

---

## ✅ SUCCESS = WHEN...

- ✅ User can create exercise in < 2 minutes
- ✅ All 20 test scenarios pass
- ✅ WCAG AA accessibility compliant
- ✅ 4 temperaments validated
- ✅ Database migration applied
- ✅ Analytics tracking working
- ✅ Deployed to PROD

---

## 🚨 CRITICAL NOTES

### iOS Compliance
❌ **NO** payment links in app!
✅ Only "Navštiv dechbar.cz" + copy button

### 4 Temperaments
- **Sangvinik:** Colors, emoji ✅
- **Cholerik:** Quick presets ✅
- **Melancholik:** 0.5s precision ✅
- **Flegmatik:** Clean UI ✅

### Performance
- Modal open: <150ms
- Input response: <50ms
- Validation: Debounced 300ms

---

## 📚 PRE-REQUISITES

Before starting, explore:
- `../session-engine/SessionEngineModal.tsx` (similar modal)
- `../../api/exercises.ts` (API hooks)
- `../../types/exercises.ts` (type definitions)
- `/docs/design-system/` (4 Temperamenty)
- `/docs/brand/VISUAL_BRAND_BOOK.md` (Design system)

---

## 🎯 YOUR NEXT STEPS

```
1. ✅ Read QUICK_START.md (you're here)
2. → Read MASTER.md (15 min)
3. → Read SPECIFICATION.md (30 min)
4. → Explore existing code (30 min)
5. → Start IMPLEMENTATION_CHECKLIST.md Day 1
6. → Build for 4 days
7. → Deploy to PROD
```

---

## 🤝 HELP & SUPPORT

**Stuck?**
1. Re-read SPECIFICATION.md section
2. Check existing session-engine/ code
3. Review .cursorrules for standards
4. Ask team with specific question

**Found an issue in spec?**
1. Document in README.md
2. Discuss before workaround

---

## 🎉 LET'S GO!

**Ready to start?**

→ Open `MASTER.md` for complete overview  
→ Then `IMPLEMENTATION_CHECKLIST.md` for Day 1  
→ Build amazing UX! 🚀

---

*Created: 5. února 2026*  
*Version: 1.0*  
*Status: Ready for Implementation*
