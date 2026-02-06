# 📐 Feature Design Guide - Mobile-First React App

**Created:** 4. února 2026  
**Purpose:** Systematic approach k návrhu nových features pro native mobile app  
**Adapted from:** FOUNDATION/09_FEATURE_DESIGN_FRAMEWORK.md (WordPress) → React Native

---

## 🎯 PROČ TENTO PROCESS?

**Problem bez frameworku:**
```
❌ Nejasné zadání → Multiple iterations, wasted time
❌ Missing aspects → Not all users satisfied
❌ No documentation → Hard for next agent to understand
❌ Ad-hoc design → Inconsistent UX
```

**Solution s frameworkem:**
```
✅ Clear requirements from start
✅ All 4 Temperaments satisfied
✅ Complete documentation
✅ Systematic, repeatable process
✅ Easy onboarding for agents
```

---

## 📋 4-PHASE PROCESS (Mobile-First)

```
1️⃣ DEFINE (15 min)   → What, Why, Who, Success Metrics
2️⃣ DESIGN (30 min)   → 4 Temperaments, Mobile UX, Responsive
3️⃣ DEVELOP (varies)  → Implementation
4️⃣ TEST & DEPLOY     → Validation on real devices
```

---

## 1️⃣ PHASE 1: DEFINE (Questions Framework)

**Before writing ANY code, answer these:**

### **1.1 PURPOSE - Co to je?**

```
"In one sentence: What does this feature do?"

Example (Exercise Timer):
"Real-time breathing timer with visual circle animation and audio cues."
```

**Your answer:**
```
[One sentence description]
```

---

### **1.2 WHY - Proč to potřebujeme?**

```
"What problem does it solve?"
"What value does it provide?"

Example (Exercise Timer):
Problem: Users lose track of breathing rhythm without guidance
Value: Provides real-time visual + audio feedback for proper technique
```

**Your answer:**
```
Problem it solves: [...]
Value it provides: [...]
```

---

### **1.3 AUDIENCE - Pro koho?**

```
"Who will use this feature?"
"What tier? (ZDARMA, SMART, AI_COACH)"
"Mobile or Desktop primary?"

Example (Exercise Timer):
- Primary: All users (ZDARMA+)
- Device: Mobile-first (60% users on mobile)
- Context: During exercise session (full attention)
```

**Your answer:**
```
Primary users: [...]
Membership tier: [...]
Primary device: [Mobile/Desktop/Both]
Usage context: [...]
```

---

### **1.4 SUCCESS METRICS**

```
"How will we measure success?"

Example (Exercise Timer):
- 80%+ completion rate (users finish exercises)
- <100ms animation lag (smooth performance)
- Works on iPhone 13 Mini (smallest target device)
- No complaints about timing accuracy
```

**Your answer:**
```
Metric 1: [...]
Metric 2: [...]
Metric 3: [...]
```

---

## 2️⃣ PHASE 2: DESIGN for 4 TEMPERAMENTS

**CRITICAL:** Every feature MUST satisfy all 4 types!

### **🎉 SANGVINIK (Fun, Social, Visual)**

**Ask:** "How will this be fun/colorful/engaging?"

**Mobile considerations:**
- Animations (but respect battery life)
- Haptic feedback (Capacitor Haptics API)
- Celebratory moments (confetti on achievement)
- Progress visualizations

**Example (Exercise Timer):**
```tsx
Sangvinik aspects:
✅ Breathing circle animates (visual stimulation)
✅ Gold pulse on phase change (micro-celebration)
✅ Completion screen with mood selection (emotional)
✅ Streak counter (gamification)
```

**Your design:**
```
Sangvinik element 1: [...]
Sangvinik element 2: [...]
```

---

### **⚡ CHOLERIK (Fast, Efficient, Goal-Oriented)**

**Ask:** "How will power users complete this quickly?"

**Mobile considerations:**
- One-handed operation (thumb-friendly zones)
- Minimal taps to complete action
- Skip/fast-forward options
- Keyboard shortcuts (for iPad/desktop)

**Example (Exercise Timer):**
```tsx
Cholerik aspects:
✅ "Skip intro" button (quick start)
✅ Timer shows % complete (progress tracking)
✅ Swipe to dismiss (fast exit)
✅ Keyboard: Space to pause (power user)
```

**Your design:**
```
Cholerik element 1: [...]
Cholerik element 2: [...]
```

---

### **📚 MELANCHOLIK (Detailed, Quality, Customizable)**

**Ask:** "Where can they see details/stats/settings?"

**Mobile considerations:**
- Expandable details (collapsible sections)
- Advanced settings (but hidden by default)
- Help tooltips (? icon)
- Data export options

**Example (Exercise Timer):**
```tsx
Melancholik aspects:
✅ Session history (last 10 sessions)
✅ Detailed stats (avg breath hold, improvement %)
✅ Settings: audio volume, haptic strength
✅ Help button: "How to measure KP?"
```

**Your design:**
```
Melancholik element 1: [...]
Melancholik element 2: [...]
```

---

### **🕊️ FLEGMATIK (Simple, Calm, Easy)**

**Ask:** "Can my grandma use this without help?"

**Mobile considerations:**
- One primary CTA (not multiple options)
- Clear visual hierarchy
- Forgiving UI (easy undo)
- Calm aesthetic (no overwhelming info)

**Example (Exercise Timer):**
```tsx
Flegmatik aspects:
✅ One big "Start" button (obvious action)
✅ Simple instructions ("Breathe in, hold, breathe out")
✅ Calm teal colors (not aggressive)
✅ Auto-save (no manual save needed)
```

**Your design:**
```
Flegmatik element 1: [...]
Flegmatik element 2: [...]
```

---

## 🎯 PHASE 2.5: MOBILE-FIRST DESIGN

**Additional checklist for native mobile app:**

### **Touch Targets (iOS Human Interface Guidelines)**
```
✅ Min 44x44pt tap targets (iOS)
✅ Min 48x48dp tap targets (Android)
✅ Spacing between tappable elements: 8px min
```

### **Responsive Breakpoints (dechbar-app):**
```
✅ 320px - iPhone SE (smallest)
✅ 390px - iPhone 13/14/15 (most common)
✅ 768px - iPad (tablet)
✅ 1024px - iPad Pro (large tablet)
✅ 1440px - Desktop (web version)
```

### **Mobile UX Patterns:**
```
✅ Bottom navigation (thumb-friendly)
✅ Swipe gestures (natural on mobile)
✅ Pull to refresh (mobile convention)
✅ Haptic feedback (Capacitor API)
✅ Safe areas (iOS notch, Android nav bar)
```

### **Performance (Mobile Constraints):**
```
✅ Lazy load images (Intersection Observer)
✅ Optimize animations (60fps target)
✅ Bundle size < 200KB initial (mobile data)
✅ Offline support (PWA Service Worker)
```

---

## 3️⃣ PHASE 3: STRUCTURE & FILES

**Based on dechbar-app architecture:**

### **Platform Component (Shared across app):**
```
src/platform/components/
├── FeatureName.tsx
└── index.ts (add export)

src/styles/components/
└── feature-name.css

docs/design-system/components/
└── FeatureName.md (API documentation)
```

### **Module Feature (Module-specific):**
```
src/modules/module-name/
├── components/
│   └── FeatureName.tsx
├── pages/
│   └── FeatureNamePage.tsx
├── api/
│   └── useFeatureName.ts (React Query hook)
├── types.ts
└── styles/
    └── feature-name.css

docs/modules/module-name/
└── FEATURE_SPEC.md
```

### **Database (if needed):**
```
supabase/migrations/
└── YYYYMMDDHHMMSS_add_feature_name.sql

docs/architecture/03_DATABASE.md
(update with new table)
```

---

## 4️⃣ PHASE 4: TEST & DEPLOY

### **Testing Checklist:**

**Devices (Real Device Testing):**
```
✅ iPhone 13 Mini (390x844) - Smallest modern iPhone
✅ iPad (768x1024) - Tablet
✅ Desktop (1440px+) - Web version
✅ Android (if time permits)
```

**Scenarios:**
```
✅ Happy path (normal usage)
✅ Error states (network offline, invalid data)
✅ Edge cases (empty state, max capacity)
✅ Accessibility (VoiceOver on iOS)
```

**Performance:**
```
✅ Lighthouse score >90 (mobile)
✅ No layout shifts (CLS < 0.1)
✅ Fast load (<2s on 3G)
```

---

## 📝 DOCUMENTATION REQUIRED

**After implementing, create/update:**

1. **Feature Spec (if major feature):**
   ```
   docs/features/FEATURE_NAME_SPEC.md or
   docs/modules/MODULE_NAME/FEATURE_SPEC.md
   ```

2. **Component API (if Platform component):**
   ```
   docs/design-system/components/ComponentName.md
   ```

3. **Database Schema (if new tables):**
   ```
   Update: docs/architecture/03_DATABASE.md
   ```

4. **CHANGELOG.md:**
   ```
   Add entry under [Unreleased] → Added/Changed
   ```

---

## ✅ SELF-CHECK BEFORE IMPLEMENTING

**Answer YES to all:**

- [ ] I defined PURPOSE in one sentence
- [ ] I explained WHY (problem + value)
- [ ] I identified AUDIENCE (who + tier + device)
- [ ] I designed for ALL 4 Temperaments
- [ ] I considered mobile-first (touch targets, performance)
- [ ] I know where files go (Platform vs Module)
- [ ] I gave feedback to user BEFORE coding
- [ ] I'm waiting for approval

**7/7 ✅?** Ready to implement!

---

## 🎯 EXAMPLE: Exercise Timer Feature

**1️⃣ DEFINE:**
```
PURPOSE: Real-time breathing timer with visual + audio guidance
WHY: Users need rhythm guidance for proper breathing technique
AUDIENCE: All users (ZDARMA+), mobile-first, during exercise session
METRICS: 80%+ completion, <100ms lag, works on iPhone 13 Mini
```

**2️⃣ DESIGN (4 Temperaments):**
```
🎉 Sangvinik: Animated circle, gold pulse, celebration screen
⚡ Cholerik: Skip intro, % progress, swipe dismiss, keyboard shortcuts
📚 Melancholik: Session history, stats, help tooltips, settings
🕊️ Flegmatik: One "Start" button, simple instructions, auto-save
```

**3️⃣ STRUCTURE:**
```
src/platform/components/BreathingTimer.tsx
src/hooks/useTimer.ts
src/styles/components/breathing-timer.css
docs/design-system/components/BreathingTimer.md
```

**4️⃣ TEST:**
```
✅ iPhone 13 Mini, iPad, Desktop
✅ Offline mode, error states
✅ Lighthouse >90
```

---

## 🔗 RELATED DOCS

- **[01_PHILOSOPHY.md](../design-system/01_PHILOSOPHY.md)** - 4 Temperaments (detailed)
- **[AI_AGENT_COMPONENT_GUIDE.md](./AI_AGENT_COMPONENT_GUIDE.md)** - How to create components
- **[PROJECT_GUIDE.md](../../PROJECT_GUIDE.md)** - Where does code go?
- **[03_DATABASE.md](../architecture/03_DATABASE.md)** - Database patterns

---

## 💡 TIPS

**For Mobile-First:**
- Design for 390px first (iPhone 13), then scale up
- Touch targets: 44x44pt minimum
- Test on real device (simulator not enough!)
- Consider thumb zones (bottom 1/3 of screen)

**For Performance:**
- Lazy load components (React.lazy)
- Optimize images (WebP, srcset)
- Use Intersection Observer (scroll performance)
- Profile with React DevTools

**For 4 Temperaments:**
- Never skip ANY type (25% of users each!)
- Simple default + advanced options = satisfies all
- Visual + efficient + detailed + calm = perfect balance

---

**Status:** ✅ Mobile-First Feature Design Framework

*Adapted from: FOUNDATION/09_FEATURE_DESIGN_FRAMEWORK.md*  
*Created: 4. února 2026*
