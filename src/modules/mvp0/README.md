# MVP0 Module - The Core

**Status:** ✅ Active Development  
**Version:** 0.1.0  
**Type:** Core Module (Free)

## Popis

MVP0 je základní modul DechBar aplikace obsahující nejdůležitější funkce:
- 3 preset protokoly (RÁNO, RESET, NOC)
- SMART cvičení button (locked pro FREE tier)
- Daily tip widget (vědecké fakty)
- Navigační systém (DNES, Cvičit, Akademie, Pokrok)

## Funkce

### FREE Tier
- ✅ 3 preset protokoly (RÁNO 7min, RESET 5min, NOC 10min)
- ✅ Daily tip (vědecké fakty o dýchání)
- ✅ Základní přivítání (dynamický čas)
- ❌ SMART doporučení (locked)

### SMART Tier
- ✅ Všechno z FREE
- ✅ SMART doporučení (AI-powered exercise picks)

### AI_COACH Tier
- ✅ Všechno ze SMART
- ✅ AI personalizované insights (future)

## Struktura

```
mvp0/
├── MODULE_MANIFEST.json
├── README.md
├── CHANGELOG.md
├── index.ts
│
├── pages/              # Main views (routed)
│   ├── DnesPage.tsx    # Dashboard (3 presets + SMART + tip)
│   ├── CvicitPage.tsx  # Exercise library (placeholder)
│   ├── AkademiePage.tsx # Education (placeholder)
│   ├── PokrokPage.tsx  # Progress stats (placeholder)
│   ├── ProfilPage.tsx  # User profile (placeholder)
│   ├── SettingsPage.tsx # Settings (placeholder)
│   └── index.ts
│
├── components/         # MVP0-specific components
│   ├── Greeting.tsx    # Dynamic greeting
│   ├── SmartExerciseButton.tsx # SMART button (locked/unlocked)
│   ├── PresetProtocolButton.tsx # Reusable preset button
│   ├── DailyTipWidget.tsx # Daily tip card
│   ├── LockedFeatureModal.tsx # Universal paywall
│   └── index.ts
│
└── data/
    └── dailyTips.ts    # Daily tip content (10-15 facts)
```

## Usage

```typescript
import { DnesPage } from '@/modules/mvp0/pages';

<AppLayout>
  <DnesPage />
</AppLayout>
```

## Dependencies

- `@/platform/auth` - useAuth (user data)
- `@/platform/membership` - useMembership (tier check)
- `@/platform/components` - Card, NavIcon
- `@/platform/hooks` - useNavigation, useScrollLock
- `@/platform/layouts` - AppLayout

## Next Steps

Po dokončení MVP0:
1. Implementovat Session Engine (audio player)
2. Přidat backend pro protokoly (audio soubory)
3. Implementovat KP měření (MVP1)

## Changelog

viz [CHANGELOG.md](./CHANGELOG.md)
