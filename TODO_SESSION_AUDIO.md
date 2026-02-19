# 📋 TODO List - Session Audio & Haptics System

**Status:** 95% hotovo ✅  
**Zbývá:** Audio files + DB migrace + testing

---

## ✅ CO JE HOTOVO (Nemusíš řešit)

- [x] TypeScript types & infrastructure
- [x] Custom hooks (useHaptics, useBreathingCues, useBackgroundMusic)
- [x] Zustand store (sessionSettingsStore)
- [x] Session Engine integration
- [x] Settings UI (5 grouped cards)
- [x] CSS styling (glassmorphism)
- [x] Documentation (3 guide docs)
- [x] Git commit + push ready
- [x] Build passes ✅
- [x] ESLint passes ✅

---

## 🔴 CO MUSÍŠ UDĚLAT (3 kroky)

### 1️⃣ Aplikovat Database Migrations (5 min)

**Způsob A - Supabase Dashboard (EASY):**

1. Otevři: https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse/sql/new
2. Copy-paste SQL z: `supabase/migrations/APPLY_TO_DEV.sql`
3. Klikni "Run" (zelené tlačítko)
4. Verify: Zkontroluj, že tabulka `background_tracks` existuje (Table Editor)

**Způsob B - CLI (pokud chceš):**

```bash
cd /Users/DechBar/dechbar-app
supabase db push --include-all
# (Pokud hlásí konflikty, použij Způsob A)
```

**Výsledek:**
- ✅ Tabulka `background_tracks` (3 seed tracky)
- ✅ Sloupec `exercises.is_meditation_mode`

---

### 2️⃣ Vytvořit Audio Files (Week 1-2)

**Week 1 (PRIORITY - 5 files):**

📄 **Návod:** `docs/audio/AUDIO_PRODUCTION_SPECS.md` (89 KB)

**Cues (250ms každý, AAC 192kbps):**
1. `inhale-963hz.aac` - Pure sine 963 Hz, -12dB
2. `hold-639hz.aac` - Pure sine 639 Hz, -12dB
3. `exhale-396hz.aac` - Pure sine 396 Hz, -12dB

**Bells:**
4. `start-bell.aac` - 1× strike (528 Hz), 2s
5. `end-bell.aac` - 3× strikes (528/639/963 Hz), 3s

**Tools:**
- Audacity (free): Generate > Tone
- Logic Pro: Test Oscillator
- Online: ToneGen, SoundGenerator

**Week 2 (Ambient tracks):**
6. `nature-forest-120s.aac` - 120s loop
7. `nature-ocean-120s.aac` - 120s loop
8. `tibetan-bowls-90s.aac` - 90s loop

**Upload k Bunny.net:**
```
cdn.dechbar.cz/audio/
├── cues/
│   ├── inhale-963hz.aac
│   ├── hold-639hz.aac
│   └── exhale-396hz.aac
├── bells/
│   ├── start-bell.aac
│   └── end-bell.aac
└── ambient/
    ├── nature-forest-120s.aac
    ├── nature-ocean-120s.aac
    └── tibetan-bowls-90s.aac
```

**Cache headers:**
- Cues/Bells: `Cache-Control: public, max-age=31536000, immutable`
- Ambient: `Cache-Control: public, max-age=86400, must-revalidate`

---

### 3️⃣ Otestovat na Real Device (30 min)

**Web Test (NYNÍ možné):**
```bash
# Terminal 1: Dev server
cd /Users/DechBar/dechbar-app
npm run dev

# Terminal 2: Ngrok tunnel
ngrok http 5173
```

**Co testovat (web):**
1. Settings page → Toggle switches
2. localStorage persistence (reload page)
3. Background music selector (Supabase fetch)
4. Console errors (F12 → Console)

**Native Test (až budeš mít audio):**

**iOS:**
```bash
npm run build
npx cap sync ios
npx cap open ios
# Run na real device (ne simulator - haptics nefungují)
```

**Test checklist:**
- [ ] Vibrace při INHALE/HOLD/EXHALE (display ON)
- [ ] Audio cues play při změně fáze
- [ ] Walking mode dims display
- [ ] Background music loops seamlessly

**Android:**
```bash
npm run build
npx cap sync android
npx cap open android
# Run na device
```

---

## 🧪 JAK OTESTOVAT HAPTIKU

### Web (nemá haptics)
❌ Web browser NEPODPORUJE haptics (jen native mobile)

### iOS/Android (native)

**Quick test:**
1. Build & sync: `npm run build && npx cap sync ios`
2. Open Xcode: `npx cap open ios`
3. Connect iPhone (ne simulator!)
4. Run na device
5. Start breathing exercise (jakékoliv)
6. **Očekávané chování:**
   - NÁDECH: 1× krátká vibrace (200ms)
   - ZADRŽ: 2× krátké vibrace (100ms pause)
   - VÝDECH: 1× dlouhá vibrace (400ms)

**Debug haptics:**

Otevři Safari Web Inspector (na Mac):
1. Safari > Develop > [Your iPhone] > localhost
2. Console tab
3. Měl bys vidět: `[Haptics] Triggered: inhale (medium)`

**Pokud nefunguje:**
- Check: Display je ON (iOS haptics nefungují když locked!)
- Check: Haptics enabled v Settings (app)
- Check: Phone vibrační motor není vypnutý (Settings > Sounds)
- Check: `isNativePlatform` = true (console log)

**Walking Mode test:**
1. Enable "Walking Mode" v Settings
2. Start exercise
3. Display se ztlumí (brightness 0.1)
4. Haptics MUSÍ stále fungovat (display ON = haptics OK)

---

## 🚀 SPUSTIT SERVER + NGROK (NYNÍ)

```bash
# Terminal 1: Dev server
cd /Users/DechBar/dechbar-app
npm run dev
# ✅ Server: http://localhost:5173

# Terminal 2: Ngrok tunnel (nové terminálové okno)
ngrok http 5173
# ✅ Public URL: https://xxxx-xxxx.ngrok.io
```

**Test na mobilu:**
1. Open ngrok URL na telefonu
2. Navigate k Settings
3. Toggle switches → check localStorage
4. Start exercise → visual animation works

**Limitace bez audio files:**
- ❌ Audio cues nebudou hrát (404 na CDN URLs)
- ❌ Background music nebude dostupný
- ✅ Haptics BUDOU fungovat (native only)
- ✅ Visual animations BUDOU fungovat
- ✅ Settings UI BUDE fungovat

---

## 📊 SUMMARY - Co zbývá?

| Task | Status | Estimate | Priority |
|------|--------|----------|----------|
| DB Migrations | ⏳ TODO | 5 min | 🔴 HIGH |
| Audio Cues (3 files) | ⏳ TODO | 2-4 hours | 🔴 HIGH |
| Bells (2 files) | ⏳ TODO | 1-2 hours | 🔴 HIGH |
| Ambient (3 files) | ⏳ TODO | 4-8 hours | 🟡 MEDIUM |
| Upload k Bunny.net | ⏳ TODO | 30 min | 🔴 HIGH |
| iOS test | ⏳ TODO | 30 min | 🟡 MEDIUM |
| Android test | ⏳ TODO | 30 min | 🟢 LOW |

**Timeline:**
- Week 1: DB + Cues + Bells → **Functional haptics + audio cues** ✅
- Week 2: Ambient tracks → **Complete system** 🎵

---

## 🎯 PRVNÍ KROK (NYNÍ):

```bash
# 1. Aplikuj migraci (Supabase Dashboard)
# → https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse/sql/new
# → Copy SQL z: supabase/migrations/APPLY_TO_DEV.sql

# 2. Spusť server
cd /Users/DechBar/dechbar-app
npm run dev

# 3. Spusť ngrok (nový terminál)
ngrok http 5173

# 4. Test na mobilu (ngrok URL)
# → Navigate k Settings
# → Toggle switches
# → Check localStorage (reload page)
```

---

## 📞 HELP

**Audio production:**
- Read: `docs/audio/AUDIO_PRODUCTION_SPECS.md`
- Tools: Audacity (free), Logic Pro, Ableton

**Solfeggio frekvence:**
- Read: `docs/audio/SOLFEGGIO_FREQUENCIES.md`

**Haptics nefungují:**
- Check: Display ON (iOS requirement!)
- Check: Native platform (ne web browser)
- Check: Settings > Haptics Enabled

**Build errors:**
```bash
npm run build
# Pokud chyby → pošli mi error message
```

---

**Jsi v 95% hotovo! Zbývá jen audio files + DB migrace + test. 🚀**
