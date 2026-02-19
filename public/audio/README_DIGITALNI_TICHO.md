# Audio Preview Files - Digitální Ticho

**Umístění:** `/public/audio/`

---

## Potřebné soubory

### 1. Tech Minimal Preview (30-45s)

**Název souboru:** `digitalni-ticho-preview-tech-minimal.mp3`

**Specs:**
- Délka: 30-45 sekund
- Formát: MP3
- Bitrate: 320 kbps (premium quality)
- Sample rate: 48 kHz
- Stereo
- Charakter: Tech minimal (A styl - 70-80%)
  - Analog pads (měkké, teplé)
  - Sub sine pulse (strukturální)
  - Minimální shimmer
  - BPM: 52-60
  - Bez vokálů, bez perkusí, bez melodie

### 2. Film Ambient Preview (30-45s)

**Název souboru:** `digitalni-ticho-preview-film-ambient.mp3`

**Specs:**
- Délka: 30-45 sekund
- Formát: MP3
- Bitrate: 320 kbps (premium quality)
- Sample rate: 48 kHz
- Stereo
- Charakter: Film ambient (B styl - 70-80%)
  - Warm analog pads (bohatší)
  - Shimmer výraznější
  - Granulární textura
  - BPM: 52-60
  - Bez vokálů, bez perkusí, bez lead melodie

---

## Fallback (pokud soubory nejsou ready)

**Temporary:** Můžeš použít placeholder nebo disable Audio Preview section.

**V komponentě:**
```typescript
// DigitalniTichoAudioPreview.tsx
const ENABLE_PREVIEW = false; // Set to true when files are ready

if (!ENABLE_PREVIEW) {
  return null; // Don't render section
}
```

**Nebo zobraz notice:**
```tsx
<div className="preview-coming-soon">
  Ukázka bude dostupná brzy.
</div>
```

---

## Jak vytvořit preview v Suno AI

### Tech Minimal Prompt

```
Minimal premium ambient, 58 BPM, warm analog synth pads, subtle sub sine
pulse, clean spacious mix, modern tech-wellbeing, structured calm, slow
evolution, no melody, no vocals, no percussion, no piano, no strings lead, no
spa sounds, no dramatic risers.

Duration: 45 seconds
Style: Deep minimal ambient
Mood: Calm, focused, tech-minimal
```

### Film Ambient Prompt

```
Cinematic minimal ambient, 56 BPM, warm analog pads with gentle shimmer,
subtle low pulse, immersive but clean, slow evolving texture, premium film-
like atmosphere, no melody lead, no vocals, no percussion, no piano, no spa
clichés, no dramatic build/drop.

Duration: 45 seconds
Style: Immersive cinematic ambient
Mood: Introspective, calm, film-like
```

### Export z Suno

1. Generate track
2. Download MP3
3. Trim to best 30-45s segment (middle část, NOT intro/outro)
4. Normalize audio (peak at -3 dB)
5. Fade in first 2s, fade out last 2s
6. Export jako 320 kbps MP3

---

## Upload do projektu

```bash
# Copy files to public/audio/
cp ~/Downloads/digitalni-ticho-preview-tech-minimal.mp3 /Users/DechBar/dechbar-app/public/audio/
cp ~/Downloads/digitalni-ticho-preview-film-ambient.mp3 /Users/DechBar/dechbar-app/public/audio/

# Verify
ls -lh /Users/DechBar/dechbar-app/public/audio/
```

---

**Last Updated:** 2026-02-17  
**Status:** Waiting for audio files
