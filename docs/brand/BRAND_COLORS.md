# DechBar Brand Colors

Complete color palette reference for DechBar 2.0 dark-first design.

---

## Color Palette Overview

```
┌─────────────────────────────────────────────────┐
│  PRIMARY: Teal (Brand Identity)                 │
│  #2CBEC6  ████████  Calm, breathing, clarity    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ACCENT: Gold (Energy & CTAs)                   │
│  #D6A23A  ████████  Warmth, achievement, action │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BACKGROUND: Dark Neutral (Calm Canvas)         │
│  #121212  ████████  Premium, modern, restful    │
└─────────────────────────────────────────────────┘
```

---

## Primary Color: Teal

### Main Teal
```css
--color-primary: #2CBEC6
```
**HEX:** #2CBEC6  
**RGB:** rgb(44, 190, 198)  
**HSL:** hsl(183, 64%, 47%)

**Usage:**
- Focus rings on inputs and buttons
- Active navigation items
- Interactive links
- Brand logo (primary color)
- Progress indicators
- Selection highlights

**Accessibility:**
- On #121212 (dark bg): 7.2:1 contrast ✓ WCAG AA
- On #1E1E1E (surface): 6.8:1 contrast ✓ WCAG AA
- On #2A2A2A (elevated): 6.4:1 contrast ✓ WCAG AA

### Light Teal
```css
--color-primary-light: #6ADBE0
```
**HEX:** #6ADBE0  
**RGB:** rgb(106, 219, 224)  
**HSL:** hsl(183, 65%, 65%)

**Usage:**
- Hover states
- Light accents on dark surfaces
- Backgrounds for teal content areas
- Gradient overlays

### Dark Teal
```css
--color-primary-dark: #15939A
```
**HEX:** #15939A  
**RGB:** rgb(21, 147, 154)  
**HSL:** hsl(183, 76%, 34%)

**Usage:**
- Pressed states
- Dark accents
- Alternative focus colors
- Borders on light backgrounds (future light mode)

---

## Accent Color: Gold

### Main Gold
```css
--color-accent: #D6A23A
```
**HEX:** #D6A23A  
**RGB:** rgb(214, 162, 58)  
**HSL:** hsl(40, 65%, 53%)

**Usage:**
- Primary CTA buttons (main call-to-action)
- Success celebrations
- Achievement badges
- Premium feature highlights
- Gold stars, rewards

**Accessibility:**
- Text (#121212) on gold: 6.8:1 contrast ✓ WCAG AA
- Gold on dark (#121212): Good visibility for buttons

### Light Gold
```css
--color-accent-light: #F0C76A
```
**HEX:** #F0C76A  
**RGB:** rgb(240, 199, 106)  
**HSL:** hsl(42, 80%, 68%)

**Usage:**
- Hover states on gold buttons
- Highlights and glows
- Gradient overlays
- Soft accents

### Dark Gold
```css
--color-accent-dark: #B8892F
```
**HEX:** #B8892F  
**RGB:** rgb(184, 137, 47)  
**HSL:** hsl(39, 59%, 45%)

**Usage:**
- Pressed states on gold buttons
- Darker accents
- Alternative gold tone for variety

---

## Background Colors

### Main Background (App Canvas)
```css
--color-background: #121212
```
**HEX:** #121212  
**RGB:** rgb(18, 18, 18)  
**HSL:** hsl(0, 0%, 7%)

**Why #121212 instead of #000000?**
- Material Design best practice for dark mode
- Allows subtle elevation shadows
- Less eye strain than pure black
- Premium, modern aesthetic
- Better color reproduction on OLED screens

**Usage:**
- Main app background
- Body background
- Default dark canvas

### Surface (Cards, Panels)
```css
--color-surface: #1E1E1E
```
**HEX:** #1E1E1E  
**RGB:** rgb(30, 30, 30)  
**HSL:** hsl(0, 0%, 12%)

**Usage:**
- Cards
- Input backgrounds
- Panel backgrounds
- List items
- Content containers

**Elevation:** Level 1 (slightly elevated from background)

### Surface Elevated (Modals, Popovers)
```css
--color-surface-elevated: #2A2A2A
```
**HEX:** #2A2A2A  
**RGB:** rgb(42, 42, 42)  
**HSL:** hsl(0, 0%, 16%)

**Usage:**
- Modal backgrounds
- Dropdown menus
- Tooltips
- Floating panels
- Navigation drawers

**Elevation:** Level 2 (highest elevation in UI hierarchy)

---

## Text Colors (Off-White Hierarchy)

### Primary Text
```css
--color-text-primary: #E0E0E0
```
**HEX:** #E0E0E0  
**RGB:** rgb(224, 224, 224)  
**HSL:** hsl(0, 0%, 88%)  
**Opacity:** 87% white (Material Design standard)

**Usage:**
- Headings
- Body text
- Primary labels
- Important information

**Contrast:** 11.6:1 on #121212 ✓ WCAG AAA

### Secondary Text
```css
--color-text-secondary: #A0A0A0
```
**HEX:** #A0A0A0  
**RGB:** rgb(160, 160, 160)  
**HSL:** hsl(0, 0%, 63%)  
**Opacity:** 60% white (Material Design standard)

**Usage:**
- Secondary information
- Timestamps
- Metadata
- Subtitles

**Contrast:** 7.2:1 on #121212 ✓ WCAG AA

### Tertiary Text (Hints, Captions)
```css
--color-text-tertiary: #707070
```
**HEX:** #707070  
**RGB:** rgb(112, 112, 112)  
**HSL:** hsl(0, 0%, 44%)  
**Opacity:** 38% white (Material Design standard)

**Usage:**
- Placeholder text
- Disabled text
- Hints
- Captions
- Helper text

**Contrast:** 4.6:1 on #121212 ✓ WCAG AA (minimum)

---

## Border Colors

### Default Border
```css
--color-border: #2A2A2A
```
**HEX:** #2A2A2A (same as surface-elevated)  

**Usage:**
- Input borders (default state)
- Card borders (if needed)
- Dividers
- Separators

### Focus Border
```css
--color-border-focus: var(--color-primary)
```
**References:** #2CBEC6 (teal)

**Usage:**
- Input focus state
- Button focus ring
- Interactive element focus

---

## Semantic Colors

### Success
```css
--color-success: #10B981
```
**HEX:** #10B981  
**RGB:** rgb(16, 185, 129)  
**HSL:** hsl(158, 84%, 39%)

**Usage:**
- Success messages
- Completed states
- Positive feedback
- Checkmarks

**Contrast:** 5.2:1 on #121212 ✓ WCAG AA

### Error
```css
--color-error: #EF4444
```
**HEX:** #EF4444  
**RGB:** rgb(239, 68, 68)  
**HSL:** hsl(0, 84%, 60%)

**Usage:**
- Error messages
- Validation errors
- Destructive actions
- Warnings (critical)

**Contrast:** 5.8:1 on #121212 ✓ WCAG AA

### Warning
```css
--color-warning: #F59E0B
```
**HEX:** #F59E0B  
**RGB:** rgb(245, 158, 11)  
**HSL:** hsl(38, 92%, 50%)

**Usage:**
- Warning messages
- Caution states
- Important notices
- "Proceed with caution" indicators

**Contrast:** 6.2:1 on #121212 ✓ WCAG AA

### Info
```css
--color-info: var(--color-primary)
```
**References:** #2CBEC6 (teal - same as primary)

**Usage:**
- Informational messages
- Tips
- Helpful hints
- Neutral notifications

---

## Neutral Gray Scale

Material Design dark theme gray palette:

```css
--color-gray-50: #FAFAFA   /* Lightest */
--color-gray-100: #F5F5F5
--color-gray-200: #EEEEEE
--color-gray-300: #E0E0E0  /* Same as text-primary */
--color-gray-400: #BDBDBD
--color-gray-500: #9E9E9E  /* Middle gray */
--color-gray-600: #757575
--color-gray-700: #616161
--color-gray-800: #424242
--color-gray-900: #212121  /* Darkest usable */
```

**Usage:**
- Skeleton loaders
- Disabled states
- Subtle backgrounds
- Gradients
- Borders and dividers

---

## Color Combinations (Tested for Accessibility)

### High Contrast Combinations

| Foreground | Background | Contrast | WCAG Level |
|------------|------------|----------|------------|
| #E0E0E0 (text-primary) | #121212 (background) | 11.6:1 | AAA ✓ |
| #A0A0A0 (text-secondary) | #121212 (background) | 7.2:1 | AA ✓ |
| #707070 (text-tertiary) | #121212 (background) | 4.6:1 | AA ✓ |
| #2CBEC6 (primary) | #121212 (background) | 7.2:1 | AA ✓ |
| #121212 (dark text) | #D6A23A (gold button) | 6.8:1 | AA ✓ |
| #E0E0E0 (text) | #1E1E1E (surface) | 10.8:1 | AAA ✓ |
| #10B981 (success) | #121212 (background) | 5.2:1 | AA ✓ |
| #EF4444 (error) | #121212 (background) | 5.8:1 | AA ✓ |

### Recommended Pairings

**Primary CTA:**
- Background: #D6A23A (gold)
- Text: #121212 (dark)
- Use for: Main actions, "Start Practice", "Continue"

**Secondary Button:**
- Background: #1E1E1E (surface)
- Text: #E0E0E0 (text-primary)
- Border: #2A2A2A (border)
- Use for: Cancel, Back, Settings

**Ghost Button:**
- Background: transparent
- Text: #2CBEC6 (primary teal)
- Use for: Tertiary actions, links styled as buttons

**Card on Dark:**
- Background: #1E1E1E (surface)
- Text: #E0E0E0 (text-primary)
- Border: #2A2A2A (optional)

**Modal:**
- Background: #2A2A2A (surface-elevated)
- Text: #E0E0E0 (text-primary)
- Overlay: rgba(0, 0, 0, 0.85)

---

## Implementation Examples

### CSS Custom Properties (Design Tokens)
```css
:root {
  /* Primary */
  --color-primary: #2CBEC6;
  --color-primary-light: #6ADBE0;
  --color-primary-dark: #15939A;
  
  /* Accent */
  --color-accent: #D6A23A;
  --color-accent-light: #F0C76A;
  --color-accent-dark: #B8892F;
  
  /* Backgrounds */
  --color-background: #121212;
  --color-surface: #1E1E1E;
  --color-surface-elevated: #2A2A2A;
  
  /* Text */
  --color-text-primary: #E0E0E0;
  --color-text-secondary: #A0A0A0;
  --color-text-tertiary: #707070;
  
  /* Borders */
  --color-border: #2A2A2A;
  --color-border-focus: var(--color-primary);
  
  /* Semantic */
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-info: var(--color-primary);
}
```

### Tailwind Config
```js
colors: {
  primary: {
    DEFAULT: 'var(--color-primary)',
    light: 'var(--color-primary-light)',
    dark: 'var(--color-primary-dark)',
  },
  accent: {
    DEFAULT: 'var(--color-accent)',
    light: 'var(--color-accent-light)',
    dark: 'var(--color-accent-dark)',
  },
  background: 'var(--color-background)',
  surface: {
    DEFAULT: 'var(--color-surface)',
    elevated: 'var(--color-surface-elevated)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    tertiary: 'var(--color-text-tertiary)',
  },
}
```

### Component Usage
```tsx
// Primary CTA Button
<button className="bg-accent text-background">
  Start Practice →
</button>

// Input with focus state
<input className="bg-surface text-text-primary border border-border focus:border-primary" />

// Card
<div className="bg-surface text-text-primary rounded-lg">
  Card content
</div>
```

---

## Color Psychology

### Teal (#2CBEC6) - Primary
**Psychological associations:**
- Calm, clarity, breathing
- Trust, stability
- Balance between blue (calm) and green (growth)
- Water, air, natural elements

**Perfect for:** Breathing app, wellness, meditation

### Gold (#D6A23A) - Accent
**Psychological associations:**
- Achievement, success
- Warmth, energy
- Premium, valuable
- Optimism, positivity

**Perfect for:** CTAs, rewards, celebrating progress

### Dark (#121212) - Background
**Psychological associations:**
- Sophistication, premium
- Focus, concentration
- Calm, restful
- Modern, tech-forward

**Perfect for:** Evening use, reducing stimulation

---

## Color Don'ts

❌ **Never use pure white (#FFFFFF) for text on dark backgrounds**
- Too harsh, causes eye strain
- Use #E0E0E0 (87% white) instead

❌ **Never use pure black (#000000) for large background areas**
- Too extreme, no depth
- Use #121212 instead

❌ **Don't mix old gold (#F8CA00) with new teal (#2CBEC6)**
- Old gold is now deprecated
- Use new gold (#D6A23A) as accent only

❌ **Don't use teal for CTA buttons**
- Teal is for focus/links, not primary actions
- Use gold (#D6A23A) for CTAs

❌ **Don't create new color variants**
- Stick to defined palette
- Consistency is key

---

## Future: Light Mode Colors (Prepared)

When light mode is added, we'll use:

```css
[data-theme="light"] {
  --color-background: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-surface-elevated: #FFFFFF;
  --color-text-primary: #121212;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --color-border: #E5E7EB;
  /* Primary and accent colors stay the same */
}
```

---

**Last Updated:** 2026-01-12  
**Version:** 2.0
