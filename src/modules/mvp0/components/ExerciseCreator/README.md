# Exercise Creator Component

**Status:** 🚧 In Development  
**Version:** 1.0.0-alpha  
**Created:** 5. února 2026  
**Owner:** MVP0 Module

---

## 📋 Overview

Exercise Creator je plně interaktivní nástroj pro tvorbu vlastních dechových cvičení. Umožňuje uživatelům vytvářet, upravovat a personalizovat dechové vzory přizpůsobené jejich potřebám.

**Hlavní funkce:**
- ✨ Vytváření vlastních dechových cvičení (nádech, zádrž, výdech, zádrž)
- 🎨 Výběr barvy karty (8 preset barev)
- ⏱️ Nastavení počtu opakování (1-99 cyklů)
- 📝 Název + popis cvičení (emoji support)
- 🔄 Editace existujících cvičení
- 🔒 Tier-based omezení (FREE: 3 cvičení, SMART: unlimited)

---

## 🏗️ Architecture

### Component Hierarchy

```
ExerciseCreatorModal (Container)
├── Header
│   ├── CloseButton
│   ├── Title
│   └── ModeToggle (Simple ↔ Complex)
├── ScrollableContent
│   ├── BasicInfoSection
│   │   ├── NameInput
│   │   └── DescriptionField
│   ├── BreathingPatternSection
│   │   ├── BreathingControl (Nádech)
│   │   ├── BreathingControl (Zadrž po nádechu)
│   │   ├── BreathingControl (Výdech)
│   │   └── BreathingControl (Zadrž po výdechu)
│   ├── DurationSection
│   │   ├── CircularController
│   │   └── QuickPresets
│   └── ColorPickerSection
└── Footer
    └── SaveButton
```

### File Structure

```
ExerciseCreator/
├── README.md                          ← This file
├── SPECIFICATION.md                   ← Complete technical spec
├── IMPLEMENTATION_CHECKLIST.md        ← Step-by-step guide
├── ExerciseCreatorModal.tsx           ← Main container
├── components/
│   ├── BasicInfoSection.tsx
│   ├── BreathingPatternSection.tsx
│   ├── BreathingControl.tsx
│   ├── DurationSection.tsx
│   ├── ColorPickerSection.tsx
│   └── ModeToggle.tsx
├── hooks/
│   ├── useExerciseCreator.ts          ← XState machine
│   ├── useBreathingValidation.ts
│   ├── useDurationCalculator.ts
│   └── useExerciseNameExists.ts
├── types.ts
├── constants.ts
└── index.ts
```

---

## 🚀 Quick Start

### For New Agents

**👋 Jsi nový agent?** Následuj tento postup:

1. **Přečti dokumentaci** (v tomto pořadí):
   - `SPECIFICATION.md` - Kompletní specifikace
   - `IMPLEMENTATION_CHECKLIST.md` - Implementační kroky
   - `/Users/DechBar/dechbar-app/docs/design-system/01_PHILOSOPHY.md` - 4 Temperamenty
   - `/Users/DechBar/dechbar-app/docs/brand/VISUAL_BRAND_BOOK.md` - Design system

2. **Prozkoumej existující komponenty:**
   - `../session-engine/` - SessionEngineModal (reference)
   - `../ExerciseList.tsx` - Jak se zobrazují cvičení
   - `../../api/exercises.ts` - API hooks

3. **Začni implementací:**
   - Fáze 1: Základní struktura (modal shell)
   - Fáze 2: Input controls (steppers, circular controller)
   - Fáze 3: Validace a ukládání
   - Fáze 4: Integrace s ExerciseList

---

## 🎯 Key Features

### 1. Breathing Pattern Editor (4-Column Layout)

Uživatel nastavuje 4 parametry vedle sebe:
- **Nádech:** 0.0 - 20.0s (increment 0.5s)
- **Zadrž po nádechu:** 0.0 - 20.0s
- **Výdech:** 0.0 - 20.0s
- **Zadrž po výdechu:** 0.0 - 20.0s

**Control Type:** Hybrid Stepper
- Tap +/- arrows: Increment/decrement 0.5s
- Long press: Rapid increment
- Tap central value: Open numeric keyboard

### 2. Circular Duration Controller

Drag-to-set repetition count (1-99):
- Drag gold handle (◉) around circle
- Live calculation: "9× Opakování • 00:01:12"
- Quick presets: [9×] [18×] [27×]

### 3. Color Picker (8 Presets)

Tap to select card background color:
- Teal, Gold, Purple, Green, Red, Blue, Orange, Pink
- Applied to ExerciseCard in "Vlastní" tab

### 4. Tier System Integration

**FREE Tier:**
- Max 3 custom exercises
- Paywall shown when creating 4th

**SMART Tier:**
- Unlimited exercises
- Complex mode (future: multi-phase)

---

## 📐 Design System Compliance

### Colors

```css
--modal-background: #121212;
--modal-surface: #1E1E1E;
--text-primary: #E0E0E0;
--color-primary: #2CBEC6; /* Teal - focus */
--color-accent: #D6A23A;  /* Gold - CTA */
--color-error: #EF4444;
```

### Typography

```css
font-family: 'Inter', sans-serif;
font-size: 16px (body), 20px (header), 24px (input values);
letter-spacing: -0.02em (headings);
font-variant-numeric: tabular-nums (for aligned numbers);
```

### Spacing

```css
--spacing-section-gap: 32px;
--spacing-item-gap: 16px;
--spacing-input-padding: 16px;
```

---

## ✅ Validation Rules

### Required Fields:
- ✅ **Název:** Min 3 znaky, max 50 znaků, unique check
- ✅ **Rytmus:** Min 1 hodnota > 0.0 (nesmí být všechny 0)

### Valid Patterns:
- ✅ 4-0-0-0 (jen nádech)
- ✅ 0-0-4-0 (jen výdech)
- ✅ 4-4-4-4 (box breathing)
- ❌ 0-0-0-0 (error: "Nastavte alespoň jeden dech")

### Limits:
- Max total duration: **45 minutes**
- Max repetitions: **99**
- Duration range per phase: **0.0 - 20.0s**

---

## 🔌 Integration Points

### 1. Database (Supabase)

**New Column:**
```sql
ALTER TABLE exercises 
ADD COLUMN card_color VARCHAR(7) DEFAULT '#2CBEC6';
```

**Payload Structure:**
```typescript
{
  name: string,
  description: string | null,
  category: 'custom',
  card_color: string, // hex color
  breathing_pattern: {
    version: "1.0",
    type: "simple",
    phases: [{ /* single phase */ }]
  }
}
```

### 2. API Hooks

**Existing (reuse):**
- `useCreateExercise()` - Create mutation
- `useUpdateExercise()` - Update mutation
- `useCustomExerciseCount()` - Tier limit check

**New (implement):**
- `useExerciseNameExists()` - Unique name validation

### 3. SessionEngine

No changes needed - SessionEngineModal already supports custom exercises via `Exercise` interface.

### 4. ExerciseList

**Update ExerciseCard:**
- Apply `exercise.card_color` as background
- Add "Settings" icon for custom exercises → opens editor

---

## 🧪 Testing Checklist

### Functional Tests:
- [ ] Create new exercise (happy path)
- [ ] Edit existing exercise
- [ ] Validation errors (name, pattern, duration)
- [ ] Tier limit enforcement (FREE: 3 exercises)
- [ ] Close with unsaved changes (confirm modal)
- [ ] Save → appears in "Vlastní" tab with correct color

### Edge Cases:
- [ ] Network failure during save
- [ ] Duplicate name conflict
- [ ] Extreme values (0.5s, 20.0s, 99 reps)
- [ ] Emoji in name

### Accessibility:
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader support (ARIA labels)
- [ ] Touch targets ≥ 44x44px
- [ ] Focus indicators visible

### 4 Temperaments:
- [ ] **Sangvinik:** Colorful picker, emoji support ✅
- [ ] **Cholerik:** Quick presets, keyboard shortcuts ✅
- [ ] **Melancholik:** 0.5s precision, inline validation ✅
- [ ] **Flegmatik:** Clean UI, optional fields ✅

---

## 📊 Analytics Events

Track these events:
- `exercise_creator_opened`
- `exercise_creator_field_changed`
- `exercise_creator_saved`
- `exercise_creator_error`
- `tier_limit_reached`

---

## 🚧 Implementation Status

### Phase 1: MVP (Simple Mode)
- [ ] File structure setup
- [ ] TypeScript interfaces
- [ ] XState machine
- [ ] BasicInfoSection
- [ ] BreathingPatternSection
- [ ] DurationSection
- [ ] ColorPickerSection
- [ ] Validation logic
- [ ] Database migration
- [ ] API integration

### Phase 2: Polish
- [ ] TierLockModal
- [ ] Confirm discard modal
- [ ] Animations
- [ ] Accessibility audit
- [ ] Analytics

### Phase 3: Future (V2.0)
- [ ] Complex mode (multi-phase)
- [ ] AI suggestions (AI COACH tier)
- [ ] Community sharing

---

## 📚 Related Documentation

- **[SPECIFICATION.md](./SPECIFICATION.md)** - Complete technical specification
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Step-by-step guide
- **[/docs/design-system/](../../../docs/design-system/)** - Design system docs
- **[/docs/brand/VISUAL_BRAND_BOOK.md](../../../docs/brand/VISUAL_BRAND_BOOK.md)** - Brand guidelines

---

## 🤝 Contributing

**Pre implementaci:**
1. Přečti SPECIFICATION.md
2. Zkontroluj existing components (session-engine/)
3. Následuj IMPLEMENTATION_CHECKLIST.md

**Během implementace:**
1. Dodržuj TypeScript typy (types.ts)
2. Používej design tokens (CSS variables)
3. Testuj na všech breakpointech (390px, 768px, 1024px)
4. Validuj 4 temperamenty

**Po implementaci:**
1. Update tento README (Implementation Status)
2. Add analytics events
3. Test accessibility
4. Create pull request

---

**Questions?** Check SPECIFICATION.md nebo se zeptej v team discussion.

**Ready to start?** → Open `IMPLEMENTATION_CHECKLIST.md` 🚀
