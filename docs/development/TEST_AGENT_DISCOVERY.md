# 🧪 Test Scenario - Agent Documentation Discovery

**Purpose:** Ověřit, že nový agent dokáže z klíčových slov najít správnou dokumentaci  
**Created:** 6. února 2026

---

## Test Case 1: Zadání s klíčovým slovem "haptika"

### User Input:
```
"Potřebuju upravit vibrace při dechových cvičeních - 
chci aby výdech vibroval 3× místo 1×"
```

### Expected Agent Behavior:

**Step 1: Identifikace klíčových slov**
- ✅ "vibrace" → haptika
- ✅ "dechová cvičení" → breathing exercises
- ✅ "upravit" → modifikace existujícího systému

**Step 2: Hledání dokumentace**
Agent by měl:
1. Otevřít `docs/development/AI_AGENT_ONBOARDING.md`
2. Najít sekci "Session Audio & Haptics"
3. Identifikovat klíčová slova: "haptika, vibrace, dechové cvičení"
4. Přečíst `docs/features/SESSION_AUDIO_HAPTICS.md`

**Step 3: Navigace v feature guide**
Agent by měl najít:
- Sekce "Components → useHaptics()" (jak funguje)
- Sekce "How to Integrate → Example 2: Modify haptic patterns" (code example)
- Lokace souboru: `src/modules/mvp0/hooks/useHaptics.ts`

**Step 4: Implementation**
Agent by měl:
1. Otevřít `useHaptics.ts`
2. Najít funkci `trigger()` → sekci `phase === 'exhale'`
3. Upravit pattern z 1× heavy na 3× heavy taps
4. Otestovat na real device (iOS/Android)

**✅ SUCCESS CRITERIA:**
- Agent našel dokumentaci bez dalších otázek
- Agent pochopil architekturu (hooks, Capacitor)
- Agent věděl, že musí testovat na real device (ne simulator)

---

## Test Case 2: Zadání s klíčovým slovem "zvuk" + "dechové cvičení"

### User Input:
```
"Chci přidat nový zvuk pro změnu rytmu dechu - 
místo Solfeggio chci tibetské mísy"
```

### Expected Agent Behavior:

**Step 1: Identifikace klíčových slov**
- ✅ "zvuk" → audio
- ✅ "změna rytmu dechu" → breathing cues
- ✅ "přidat nový" → nový sound pack

**Step 2: Hledání dokumentace**
Agent by měl:
1. Otevřít `AI_AGENT_ONBOARDING.md`
2. Najít "Session Audio & Haptics" → klíčová slova: "audio, Solfeggio"
3. Přečíst `docs/features/SESSION_AUDIO_HAPTICS.md`

**Step 3: Navigace v feature guide**
Agent by měl najít:
- Sekce "How to Integrate → Example 3: Add new audio cue sound pack"
- Kroky: Update types → Update CDN URLs → Add UI option → Upload files

**Step 4: Otázka na audio files**
Agent by se měl zeptat:
- "Máš už vytvořené tibetské mísy audio soubory?"
- Pokud ne → odkázat na `docs/audio/AUDIO_PRODUCTION_SPECS.md`

**✅ SUCCESS CRITERIA:**
- Agent našel integration example pro nový sound pack
- Agent pochopil pipeline: code → upload → test
- Agent věděl, kde najít audio production specs

---

## Test Case 3: Zadání jen "audio" (ambiguous)

### User Input:
```
"Potřebuju něco udělat s audio v aplikaci"
```

### Expected Agent Behavior:

**Step 1: Disambiguace**
Agent by se měl zeptat:
```
"Můžeš upřesnit? Myslíš:
1. Audio cues (zvuky změny rytmu) při dechových cvičeních?
2. Background music (hudba na pozadí)?
3. Audio player (přehrávání tracků)?
4. Něco jiného?"
```

**Step 2: Po upřesnění**
Pokud user odpoví "1. Audio cues":
- → Přečíst `docs/features/SESSION_AUDIO_HAPTICS.md`

Pokud user odpoví "3. Audio player":
- → Hledat jinou dokumentaci (ne Session Audio & Haptics)

**✅ SUCCESS CRITERIA:**
- Agent se zeptal na upřesnění (neuhádnul)
- Po odpovědi našel správnou dokumentaci

---

## Test Case 4: Zadání "vytvoř audio soubory"

### User Input:
```
"Potřebuju vytvořit audio soubory pro dechová cvičení - 
jaké mají být specifikace?"
```

### Expected Agent Behavior:

**Step 1: Identifikace klíčových slov**
- ✅ "vytvořit audio soubory" → production
- ✅ "dechová cvičení" → breathing exercises
- ✅ "specifikace" → technical specs

**Step 2: Hledání dokumentace**
Agent by měl:
1. Otevřít `AI_AGENT_ONBOARDING.md`
2. Najít "Session Audio & Haptics" → Audio Specs: `docs/audio/`
3. Otevřít `docs/audio/README.md` (index)
4. Najít "For Audio Production" → `AUDIO_PRODUCTION_SPECS.md`

**Step 3: Navigace v audio specs**
Agent by měl najít:
- File format: AAC 128kbps stereo, 48kHz sample rate
- Duration: Cues 250ms, Bells 2s, Ambient 120s
- Naming convention: `inhale-963hz.aac`
- CDN structure: `cdn.dechbar.cz/audio/cues/`

**✅ SUCCESS CRITERIA:**
- Agent našel audio production specs bez dalších otázek
- Agent pochopil complete pipeline: DAW → export → upload → test
- Agent věděl o Solfeggio frequencies (`SOLFEGGIO_FREQUENCIES.md`)

---

## Test Case 5: Debug scenario

### User Input:
```
"Haptics nefungují na iOS - co mám zkontrolovat?"
```

### Expected Agent Behavior:

**Step 1: Identifikace problému**
- ✅ "haptics" → vibrace
- ✅ "nefungují" → troubleshooting
- ✅ "iOS" → platform-specific issue

**Step 2: Hledání dokumentace**
Agent by měl:
1. Otevřít `docs/features/SESSION_AUDIO_HAPTICS.md`
2. Najít sekci "Troubleshooting → Issue 1: Haptics not working"

**Step 3: Debugging checklist**
Agent by měl poskytnout:
1. Check platform: `isNativePlatform` must be `true`
2. Check settings: `Settings → Haptics → ON`
3. Test on **real device** (not simulator!)
4. Check iOS permissions

**✅ SUCCESS CRITERIA:**
- Agent našel troubleshooting sekci
- Agent věděl, že simulator nepodporuje haptics
- Agent poskytl step-by-step checklist

---

## Summary

**Všechny test cases ověřují:**
- ✅ Agent dokáže z klíčových slov najít správnou dokumentaci
- ✅ `AI_AGENT_ONBOARDING.md` obsahuje Session Audio & Haptics jako decision tree branch
- ✅ Feature guide (`SESSION_AUDIO_HAPTICS.md`) je kompletní a navigovatelný
- ✅ Audio docs (`docs/audio/`) mají README.md jako index

**Dokumentace je považována za úspěšnou, pokud:**
- Nový agent najde dokumentaci do 3 kroků (onboarding → decision tree → feature guide)
- Agent nepotřebuje additional guidance od usera
- Agent pochopí architekturu, integration points, a testing requirements

---

**Last Updated:** 6. února 2026  
**Maintained by:** DechBar Team
