# Audio System Documentation

**Location:** `dechbar-app/docs/audio/`  
**Purpose:** Dokumentace audio asset production a Solfeggio frekvencí

---

## 📚 Quick Links

### For Audio Production
**File:** `AUDIO_PRODUCTION_SPECS.md`  
**Use when:** Vytváříš nebo upravuješ audio soubory (cues, bells, ambient tracks)

**Contains:**
- Technical specs (AAC 128kbps stereo, 48kHz sample rate)
- File naming conventions
- Duration requirements (cues: 250ms, bells: 2s, ambient: 120s loops)
- CDN structure (`cdn.dechbar.cz/audio/`)
- Looping requirements (perfect seamless loops)
- Testing checklist (gap detection, frequency validation)

---

### For Understanding Frequencies
**File:** `SOLFEGGIO_FREQUENCIES.md`  
**Use when:** Potřebuješ pochopit proč používáme 963/639/396 Hz

**Contains:**
- History of Solfeggio frequencies
- Digital sum rule (3, 6, 9)
- Individual frequency meanings:
  - 963 Hz (Inhale) - Probuzení, aktivace
  - 639 Hz (Hold) - Harmonie, rovnováha
  - 396 Hz (Exhale) - Uvolnění, odpuštění
- Scientific background
- Why DechBar uses these specific frequencies

---

## 🎵 Audio Assets Location

### CDN Base URL
```
https://cdn.dechbar.cz/audio/
```

### Directory Structure
```
audio/
├── cues/              # Breathing phase cues (250ms tones)
│   ├── inhale-963hz.aac
│   ├── hold-639hz.aac
│   └── exhale-396hz.aac
│
├── bells/             # Session bells (2s)
│   ├── start-bell.aac
│   └── end-bell.aac
│
└── ambient/           # Background tracks (120s perfect loops)
    ├── nature-forest.aac
    ├── ocean-waves.aac
    └── tibetan-bowls.aac
```

---

## 🔗 Related Documentation

### For Integration
**File:** `../features/SESSION_AUDIO_HAPTICS.md`  
**Use when:** Integruješ audio/haptics do nové komponenty

**Contains:**
- Architecture overview
- Hook usage (`useBreathingCues`, `useBackgroundMusic`)
- Code examples
- Testing guides

---

### For Implementation Details
**File:** `../development/implementation-logs/2026-02-06-session-audio-haptics.md`  
**Use when:** Debugguješ issues nebo updatuješ systém

**Contains:**
- Implementation log (všechny změny)
- Known issues & resolutions
- Troubleshooting guide
- Future roadmap

---

## 🚀 Quick Start

### I Need to Create Audio Files
1. Read `AUDIO_PRODUCTION_SPECS.md` (všechny technical requirements)
2. Use DAW (Audacity, Logic Pro, Ableton) nebo AI tool (ElevenLabs, Suno)
3. Export as AAC 128kbps stereo, 48kHz
4. Upload to Bunny.net CDN (`cdn.dechbar.cz/audio/`)
5. Test in app (Settings → Audio Cues → Start session)

---

### I Need to Understand Why Solfeggio
1. Read `SOLFEGGIO_FREQUENCIES.md` (complete reference)
2. Key takeaway: 963/639/396 Hz mají wellbeing účinky (scientifically studied)
3. Digital sum rule: 9+6+3=18→9, 6+3+9=18→9, 3+9+6=18→9 (all sum to 9)

---

### I Need to Integrate Audio into Component
1. Read `../features/SESSION_AUDIO_HAPTICS.md` (feature guide)
2. Import hooks: `useBreathingCues()` nebo `useBackgroundMusic()`
3. Follow code examples in feature guide
4. Test on real device (haptics require native platform)

---

## 📝 File Manifest

| File | Lines | Purpose |
|------|-------|---------|
| `AUDIO_PRODUCTION_SPECS.md` | 608 | Technical specs for audio creation |
| `SOLFEGGIO_FREQUENCIES.md` | 474 | Reference guide on frequencies |
| `README.md` (this file) | ~100 | Navigation & quick start |

---

**Last Updated:** 6. února 2026  
**Maintained by:** DechBar Team
