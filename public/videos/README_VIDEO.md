# Video & Audio Assets - Digitální Ticho

**Required files for landing page**

---

## 1. JAKUB INTRO VIDEO (5 min)

### Files needed:

```
/public/videos/digitalni-ticho-intro-jakub.mp4
/public/videos/digitalni-ticho-intro-jakub.webm (optional fallback)
/public/images/digitalni-ticho-video-poster.jpg
```

### Video Specs:

- **Resolution:** 1080p (1920×1080) nebo 720p (1280×720)
- **Format:** MP4 (H.264 codec)
- **Bitrate:** 2-4 Mbps
- **Duration:** ~5 minutes
- **File size:** ~50-100 MB

### Script Outline:

**0:00-0:30** - Hook
- "Ahoj, jsem Jakub. Hlava plná šumu? Tady je reset."

**0:30-2:00** - Pain Point
- Popis problému (hluk, stress, den plný chaosu)

**2:00-3:30** - Solution
- Co je Digitální ticho (15 min, 21 dní, vedení hlasem + zvuk)

**3:30-4:30** - Transformation
- Co se změní (dech, hlava, klid)
- 3 fáze: Příběh → Vedení → Ticho

**4:30-5:00** - CTA
- "Program startuje 1.3. Předprodej 990 Kč. Klikni na tlačítko."

### Poster Image (thumbnail):

- **Size:** 1920×1080 nebo 1280×720 (match video resolution)
- **Format:** JPG nebo WebP
- **Content:** Freeze frame z videa (Jakub speaking) nebo custom thumbnail

---

## 2. AUDIO UKÁZKA - Den 1 (7.5 min)

### File needed:

```
/public/audio/digitalni-ticho-den-1-ukazka.mp3
```

### Audio Specs:

- **Duration:** 7.5 minutes (přesně polovina z 15 min)
- **Format:** MP3
- **Bitrate:** 320 kbps (premium quality)
- **Sample rate:** 48 kHz
- **Stereo:** Yes

### Content:

- První polovina nahrávky z Dne 1 (Týden 1: Příběh)
- Include: Brand Intro Sting → Počátek (first 7.5 min)
- Fade out na konci (smooth ending, ne hard cut)

### Jak vytvořit:

1. Vezmi kompletní nahrávku Dne 1 (15 min)
2. Vyřízni first 7.5 min
3. Apply fade out (last 3 seconds)
4. Export jako 320 kbps MP3
5. Upload to `/public/audio/`

---

## 🚨 FALLBACK (pokud files nejsou ready)

### Video Placeholder

**Create file:** `src/modules/public-web/components/digitalni-ticho/VideoPlaceholder.tsx`

```typescript
export function VideoPlaceholder() {
  return (
    <div className="digitalni-ticho-hero__video-wrapper">
      <div className="video-placeholder">
        <p>Video intro s Jakubem</p>
        <p className="video-placeholder__note">
          (5 minut - proč program REŽIM funguje)
        </p>
        <p className="video-placeholder__coming">
          Brzy dostupné
        </p>
      </div>
    </div>
  );
}
```

### Audio Placeholder

**In DigitalniTichoAudioPreview.tsx:**

```typescript
const AUDIO_AVAILABLE = false; // Set to true when file ready

if (!AUDIO_AVAILABLE) {
  return (
    <section className="digitalni-ticho-preview">
      <div className="digitalni-ticho-preview__container">
        <h2>Ukázka z prvního dne</h2>
        <p>7,5 minuty z programu. Brzy dostupné.</p>
      </div>
    </section>
  );
}
```

---

## ✅ CHECKLIST

### Video Production
- [ ] Script napsán (5 min outline)
- [ ] Video natočeno (Jakub speaking)
- [ ] Edited (5 min final cut)
- [ ] Exported (MP4 + WebM)
- [ ] Poster image vytvořen
- [ ] Uploaded to `/public/videos/`

### Audio Production
- [ ] Den 1 nahrávka hotová (15 min)
- [ ] First 7.5 min vyříznuto
- [ ] Fade out aplikován
- [ ] Exported (320 kbps MP3)
- [ ] Uploaded to `/public/audio/`

### Testing
- [ ] Video plays v browseru
- [ ] Audio plays v browseru
- [ ] Mobile responsive (video width)
- [ ] File sizes OK (video <100 MB, audio <20 MB)

---

**Last Updated:** 2026-02-17  
**Status:** Waiting for assets
