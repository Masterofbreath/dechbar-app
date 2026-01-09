# Studio Module

**Build custom breathing exercises**

## Overview

Studio module allows users to create their own breathing exercises with customizable patterns, durations, and audio guidance.

## Features

- **Exercise Builder** - Visual builder for breathing patterns
- **Custom Patterns** - Set inhale, hold, exhale, rest durations
- **Audio Player** - Guided audio playback
- **Session Tracking** - Track completed sessions
- **Statistics** - View your progress and stats

## Pricing

**Type:** Lifetime purchase  
**Price:** Loaded from database (`modules` table)

See `MODULE_MANIFEST.json` for technical details.

## Database Tables

This module uses:
- `exercises` - User-created exercises
- `exercise_sessions` - Completed exercise sessions

## Routes

- `/studio` - Module home
- `/studio/exercises` - Exercise list
- `/studio/exercises/:id` - Exercise detail
- `/studio/builder` - Exercise builder

## Dependencies

**Platform:**
- `auth` - User authentication required
- `membership` - Module access control

**Modules:**
- None (standalone)

## Implementation Status

- [ ] Exercise builder UI
- [ ] Audio player
- [ ] Session tracking
- [ ] Statistics dashboard

## See Also

- [Module System](../README.md)
- [Platform API](../../docs/api/PLATFORM_API.md)
