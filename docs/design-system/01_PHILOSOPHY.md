# Design Philosophy: 4 Temperaments

## Core Principle

**Every feature must satisfy ALL 4 personality types.**

People interact with apps differently based on their temperament. DechBar's design accommodates all types simultaneously.

## The 4 Temperaments

### 🎉 Sangvinik (Sanguine) - The Enthusiast

**Characteristics:**
- Fun-loving, social, spontaneous
- Wants: Color, playfulness, social features
- Dislikes: Boring, repetitive, isolated

**Design For Them:**
- Vibrant colors and animations
- Social sharing features
- Gamification and achievements
- Playful UI elements
- Community features

**Example:**
```tsx
<AchievementBadge 
  icon="🏆" 
  color="gold"
  animation="bounce"
>
  7 days streak!
</AchievementBadge>
```

---

### ⚡ Cholerik (Choleric) - The Achiever

**Characteristics:**
- Goal-oriented, efficient, decisive
- Wants: Speed, shortcuts, results
- Dislikes: Unnecessary steps, slow interfaces

**Design For Them:**
- Fast navigation (keyboard shortcuts)
- Progress indicators
- Clear CTAs
- Minimal clicks to goal
- Skip options

**Example:**
```tsx
<QuickAction 
  onClick={startExercise}
  shortcut="Cmd+E"
>
  Start Exercise →
</QuickAction>
```

---

### 📚 Melancholik (Melancholic) - The Perfectionist

**Characteristics:**
- Detail-oriented, thoughtful, quality-focused
- Wants: Information, depth, customization
- Dislikes: Shallow features, lack of detail

**Design For Them:**
- Detailed statistics
- Advanced settings
- Help documentation
- Explanations and tooltips
- History and logs

**Example:**
```tsx
<ExerciseDetails>
  <Stats detailed={true} />
  <HistoryChart days={30} />
  <AdvancedSettings />
  <InfoTooltip>
    Learn more about breathing patterns...
  </InfoTooltip>
</ExerciseDetails>
```

---

### 🕊️ Flegmatik (Phlegmatic) - The Peacemaker

**Characteristics:**
- Calm, easygoing, harmony-seeking
- Wants: Simplicity, peace, no pressure
- Dislikes: Complexity, stress, forced choices

**Design For Them:**
- Clean, minimal UI
- Calm colors
- No aggressive notifications
- Optional features (don't force)
- Gentle guidance

**Example:**
```tsx
<CalmInterface 
  colors="neutral"
  pressure={false}
>
  <SimpleButton>
    Start when ready
  </SimpleButton>
  <GentleReminder optional />
</CalmInterface>
```

## Balancing All 4

### Example: Exercise Screen

```tsx
function ExerciseScreen() {
  return (
    <Screen>
      {/* FLEGMATIK: Clean, minimal layout */}
      <SimpleLayout>
        
        {/* CHOLERIK: Quick start, clear CTA */}
        <QuickStartButton shortcut="Space">
          Start Exercise
        </QuickStartButton>
        
        {/* SANGVINIK: Colorful, animated */}
        <ProgressRing 
          color="gold" 
          animated 
        />
        
        {/* MELANCHOLIK: Detailed info available */}
        <ExpandableDetails>
          <Statistics detailed />
          <History />
          <Settings advanced />
        </ExpandableDetails>
        
        {/* SANGVINIK: Social share */}
        <ShareButton social />
        
        {/* FLEGMATIK: No pressure */}
        <OptionalReminders />
        
      </SimpleLayout>
    </Screen>
  );
}
```

## Design Checklist

For every feature, ask:

- [ ] **Sangvinik:** Is it fun and social?
- [ ] **Cholerik:** Is it fast and efficient?
- [ ] **Melancholik:** Is there enough detail and quality?
- [ ] **Flegmatik:** Is it simple and pressure-free?

## Real-World Examples

### ✅ GOOD: Exercise Builder

- **Sangvinik:** Colorful preview, fun animations
- **Cholerik:** Quick templates, keyboard shortcuts
- **Melancholik:** Advanced customization, tooltips everywhere
- **Flegmatik:** Simple mode available, no forced choices

### ❌ BAD: Forced Onboarding

- **Problem:** Forces all users through 10-step tutorial
- **Issue:** Cholerik wants to skip, Flegmatik feels pressured
- **Fix:** Make skippable, provide "Learn as you go" option

## Implementation Guidelines

### Colors

- **Sangvinik:** Use vibrant accent colors
- **Cholerik:** High contrast for clarity
- **Melancholik:** Subtle variations for depth
- **Flegmatik:** Calm, neutral base colors

### Typography

- **Sangvinik:** Varied sizes for visual interest
- **Cholerik:** Clear hierarchy for scanning
- **Melancholik:** Detailed body text, good readability
- **Flegmatik:** Generous whitespace, not overwhelming

### Interactions

- **Sangvinik:** Animations and feedback
- **Cholerik:** Instant response, no delays
- **Melancholik:** Confirmations for important actions
- **Flegmatik:** Non-intrusive, gentle

### Navigation

- **Sangvinik:** Visual, icon-based
- **Cholerik:** Fast, shortcuts available
- **Melancholik:** Breadcrumbs, clear location
- **Flegmatik:** Simple, not too many options

## Testing With Real Users

When testing, recruit:
- 1-2 Sangviniks (ask about fun/social)
- 1-2 Choleriks (ask about speed/efficiency)
- 1-2 Melancholiks (ask about detail/quality)
- 1-2 Flegmatiks (ask about simplicity/stress)

## Further Reading

- [Color Palette](02_COLORS.md) - How colors support each temperament
- [Component Library](06_COMPONENTS.md) - Components designed for all 4
- [Animations](08_ANIMATIONS.md) - Motion that doesn't annoy any type
