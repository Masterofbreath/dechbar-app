# PresetProtocolButton Component

## Overview

Reusable UI button component for launching preset breathing protocols (RÁNO, RESET, NOC) from the Dnes page. This is NOT a separate exercise engine - it's a UI wrapper that opens the standard `SessionEngineModal` with special configuration for direct countdown start.

---

## Purpose

Protocols are curated admin-created breathing exercises designed for specific daily use cases:
- **RÁNO** - Morning activation (7 min)
- **RESET** - Midday stress reset (5 min)
- **NOC** - Evening relaxation (10 min)

The button provides quick access to these protocols with optimized UX (direct start, no intro screens).

---

## Architecture

### Component Relationship

```
┌─────────────────────┐
│    Dnes Page        │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │ PresetProtocol │ (THIS COMPONENT - Just UI button)
    │    Button      │
    └──────┬──────────┘
           │ onClick → opens modal with skipFlow=true
           │
           ▼
┌────────────────────────┐
│  SessionEngineModal    │ (Shared with regular exercises)
│   (exercise engine)    │
└────────────────────────┘
           │
      ┌────▼─────┐
      │ Countdown │ → Shows protocol description
      │  (5-4-3)  │
      └────┬──────┘
           │
      ┌────▼─────┐
      │  Active  │ → Breathing guidance
      │ Session  │
      └──────────┘
```

### Key Distinction

**PresetProtocolButton IS:**
- ✅ UI component (button card)
- ✅ Entry point for protocols
- ✅ Passes `skipFlow=true` to SessionEngineModal

**PresetProtocolButton IS NOT:**
- ❌ Separate exercise engine
- ❌ Different from regular exercises (uses same SessionEngineModal)
- ❌ Custom flow logic (just UI wrapper)

---

## Usage

### Basic Example

```tsx
import { PresetProtocolButton } from '@/modules/mvp0/components';

<PresetProtocolButton
  protocol="rano"
  icon="sun"
  label="RÁNO"
  duration="7 min"
  onClick={() => handleProtocolClick('RÁNO')}
/>
```

### Real Implementation (DnesPage)

```tsx
// DnesPage.tsx
function handleProtocolClick(protocolName: string) {
  const exercise = exercises.find(ex => ex.name === protocolName);
  
  if (exercise) {
    setSkipFlow(true);  // Enable direct countdown start
    setSelectedExercise(exercise);
  }
}

// Render
<PresetProtocolButton
  protocol="rano"
  icon="sun"
  label="RÁNO"
  duration="7 min"
  onClick={() => handleProtocolClick('RÁNO')}
/>

{selectedExercise && (
  <SessionEngineModal
    exercise={selectedExercise}
    skipFlow={skipFlow}  // Pass skipFlow flag
    onClose={...}
  />
)}
```

---

## Props

```typescript
export interface PresetProtocolButtonProps {
  /** Protocol ID (lowercase) */
  protocol: 'rano' | 'reset' | 'noc';
  
  /** Icon name (from NavIcon) */
  icon: 'sun' | 'refresh' | 'moon';
  
  /** Protocol label (uppercase display) */
  label: string;
  
  /** Duration text (e.g., "7 min") */
  duration: string;
  
  /** Click handler - opens SessionEngineModal with skipFlow=true */
  onClick?: () => void;
}
```

---

## Styling

**CSS File:** `src/styles/components/preset-protocol-button.css` (TODO: verify file exists)

**Key Classes:**
- `.preset-protocol-button` - Main button container
- `.preset-protocol-button__icon` - Icon wrapper
- `.preset-protocol-button__label` - Protocol name (uppercase)
- `.preset-protocol-button__duration` - Duration text

**Design:**
- Card-based layout
- Hover/focus states
- Accessible (aria-label with full description)
- Mobile-optimized (responsive sizing)

---

## Behavior

### Click Flow

1. User clicks protocol button
2. `onClick` handler fires
3. Parent component (DnesPage) finds exercise by name
4. Sets `skipFlow=true` state
5. Opens `SessionEngineModal` with exercise + skipFlow flag
6. SessionEngineModal auto-starts countdown (skips intro screens)
7. Countdown shows **protocol description** (not tips)
8. Active session begins after 5-4-3-2-1

### skipFlow Flag Behavior

**When `skipFlow=true` (Protocols):**
- ✅ Skip SessionStartScreen (exercise detail view)
- ✅ Skip MoodBeforePick (emoji mood selection)
- ✅ Direct countdown start
- ✅ Show protocol description in countdown (contextual)

**When `skipFlow=false` (Regular Exercises):**
- ✅ Show SessionStartScreen
- ✅ Show MoodBeforePick
- ✅ Manual countdown start ("Začít cvičení" button)
- ✅ Show rotating tips in countdown (educational)

---

## Integration with Exercise System

### Protocol Detection

Protocols are detected using helper function:

```typescript
// src/utils/exerciseHelpers.ts
export function isProtocol(exercise: Exercise): boolean {
  return ['RÁNO', 'RESET', 'NOC'].includes(exercise.name);
}
```

This is used in `SessionCountdown` to show appropriate content:
- Protocols → Description
- Exercises → Tips

**Future:** Will be replaced with `exercise.type === 'protocol'` after DB migration (v2.0).

---

## File Location

**Component:**
```
src/modules/mvp0/components/PresetProtocolButton.tsx
```

**Parent Usage:**
```
src/modules/mvp0/pages/DnesPage.tsx (3x instances)
```

**Related Components:**
```
src/modules/mvp0/components/session-engine/SessionEngineModal.tsx
src/modules/mvp0/components/session-engine/components/SessionCountdown.tsx
```

---

## Development Notes

### Adding New Protocol

1. Add protocol data to `src/shared/exercises/presets.ts`:
```typescript
{
  id: 'new-protocol',
  name: 'NEW PROTOCOL',
  description: 'Protocol description...',
  // ... rest of Exercise interface
}
```

2. Add button to DnesPage:
```tsx
<PresetProtocolButton
  protocol="new"
  icon="icon-name"
  label="NEW PROTOCOL"
  duration="X min"
  onClick={() => handleProtocolClick('NEW PROTOCOL')}
/>
```

3. Add to protocol detection helper:
```typescript
// src/utils/exerciseHelpers.ts
const PRESET_PROTOCOL_NAMES = ['RÁNO', 'RESET', 'NOC', 'NEW PROTOCOL'];
```

---

## Testing

### Manual Testing

1. Click protocol button on Dnes page
2. Verify modal opens immediately
3. Verify countdown starts without intro screens
4. Verify countdown shows protocol description (not tip)
5. Verify active session begins after countdown
6. Verify session works normally (phases, timer, close)

### Regression Testing

1. Click exercise card in Cvičit page
2. Verify normal flow (start screen → mood pick → countdown)
3. Verify countdown shows rotating tips (not description)

---

## Related Documentation

- [Exercise System Spec](../../../../docs/EXERCISE_SYSTEM_SPEC.md) - Protocol vs Exercise distinction
- [Session Engine README](../session-engine/README.md) - SessionEngineModal documentation
- [Dnes Page](../pages/DnesPage.tsx) - Parent component usage

---

**Last Updated:** 2026-01-24  
**Version:** 0.2.0
