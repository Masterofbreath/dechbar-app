# Audio Production Specifications - DechBar App

**Producer:** Martin (DechBar founder)  
**Format:** AAC-LC (iOS/Android compatible)  
**Delivery:** Bunny.net CDN upload  
**Date:** 2026-02-06

---

## Overview

Technical specifications for producing audio files for breathing exercise app.

**Total Files:** 8 files (3 cues + 2 bells + 3 ambient tracks)  
**Total Size:** ~11 MB  
**Timeline:** Week 1 (cues + bells), Week 2 (ambient tracks)

---

## 1. AUDIO CUES (Solfeggio Frequencies)

### Technical Specs

```yaml
Format: AAC-LC (best compatibility iOS/Android)
Bitrate: 192 kbps (premium quality)
Sample Rate: 44.1 kHz (CD quality)
Channels: Stereo (centered, L=R identical)
Duration: 250ms per tone
Fade: 25ms fade-in + 25ms fade-out (smooth edges)
Waveform: Pure sine wave (no overtones)
Amplitude: -12 dB (comfortable, not fatiguing)
```

### Frequencies (Tesla 3-6-9 Pattern)

**File 1: inhale-963hz.aac**
- Frequency: 963 Hz (pure sine)
- Digital sum: 9+6+3 = 18 → 1+8 = 9
- Meaning: Highest frequency, activation, opening
- Duration: 250ms
- Fade: 25ms in/out
- Level: -12 dB
- Expected size: ~40 KB

**File 2: hold-639hz.aac**
- Frequency: 639 Hz (pure sine)
- Digital sum: 6+3+9 = 18 → 1+8 = 9
- Meaning: Connection, balance, holding space
- Duration: 250ms
- Fade: 25ms in/out
- Level: -12 dB (slightly softer for hold)
- Expected size: ~40 KB

**File 3: exhale-396hz.aac**
- Frequency: 396 Hz (pure sine)
- Digital sum: 3+9+6 = 18 → 1+8 = 9
- Meaning: Foundation, liberation, release
- Duration: 250ms
- Fade: 25ms in/out
- Level: -12 dB
- Expected size: ~40 KB

### Production Notes

**Tools:**
- Audacity: Generate > Tone (sine wave)
- Logic Pro: Test Oscillator
- Pro Tools: Signal Generator

**Process:**
1. Generate pure sine wave at exact frequency
2. Set duration to 250ms
3. Apply 25ms linear fade-in at start
4. Apply 25ms linear fade-out at end
5. Normalize to -12 dB (not -6 dB!)
6. Ensure stereo (duplicate mono to L/R)
7. Export as AAC-LC 192 kbps
8. Verify no clicks/pops at start/end

**Quality Check:**
- Listen with headphones (check for clicks)
- Spectrum analyzer (verify pure sine, no harmonics)
- File size ~40 KB per tone

---

## 2. BELLS (Start/End)

### Start Bell

**File: start-bell.aac**

```yaml
Type: Single Tibetan singing bowl strike
Base Frequency: 528 Hz (Love frequency, solfeggio)
Duration: 2000ms (natural decay, don't cut early)
Fade: NO fade (natural attack/release envelope)
Format: AAC-LC 192 kbps, Stereo
Level: -14 dB (slightly softer than cues)
Expected size: ~80 KB
```

**Production:**
- Record real Tibetan bowl OR synthesize
- Single clean strike (mallet on rim)
- Let ring naturally for 2 full seconds
- Harmonic overtones are natural and welcome
- NO artificial fade (natural decay only)
- Stereo recording (room ambience OK)

### End Bell

**File: end-bell.aac**

```yaml
Type: Triple Tibetan bowl strikes (ascending)
Frequencies: 528 Hz → 639 Hz → 963 Hz (solfeggio triad)
Timing: 
  - Strike 1 at 0ms (528 Hz)
  - Strike 2 at 600ms (639 Hz)
  - Strike 3 at 1200ms (963 Hz)
Duration: 3000ms total (let final strike decay)
Fade: NO fade (natural decay)
Format: AAC-LC 192 kbps, Stereo
Level: -14 dB
Expected size: ~120 KB
```

**Production:**
- 3 separate strikes with ascending pitch
- Each strike rings naturally (overlapping OK)
- Timing: 600ms between strikes
- Stereo recording (spatial placement optional)
- Export as single 3-second file

**Alternative if recording:**
- Use 3 different bowls (high/medium/low)
- Ensure harmonic relationship (interval of 4th or 5th)

---

## 3. BACKGROUND TRACKS (Ambient)

### General Specs

```yaml
Format: AAC-LC (iOS/Android compatible)
Bitrate: 192 kbps (premium quality)
Sample Rate: 44.1 kHz
Channels: Stereo (spatial, immersive)
Duration: 120 seconds minimum (90s for Tibetan bowls)
Loop: PERFECT (end → start seamless, NO crossfade)
Normalization: -14 LUFS (streaming standard)
Peak: -1 dB (no clipping, headroom for summing)
```

### CRITICAL: Perfect Loop Requirements

**Why perfect loops:**
- User requested NO crossfade
- Premium quality standard
- Seamless meditative experience

**How to create:**
1. Record/create 120s+ material
2. Find loop point where waveform matches:
   - End waveform should align with start waveform
   - Check zero-crossing points
   - Use spectrum analyzer (match frequency content)
3. Trim to exact loop point
4. NO fade-in/fade-out at loop point
5. Test: Play 3× consecutive → should sound continuous (no "click" or "gap")

**Tools for loop matching:**
- Audacity: View > Show Clipping, find matching waveforms
- Logic Pro: Flex Time > Loop Browser
- Pro Tools: AudioSuite > Normalize, check waveforms
- Ableton Live: Warp Markers

---

### Track 1: Nature - Forest

**File: nature-forest-120s.aac**

```yaml
Name: Příroda - Les
Duration: 120 seconds (2 minutes)
Tier: ZDARMA
Category: nature
Expected size: ~4 MB
```

**Content:**
- Birds chirping (foreground, varied species)
- Wind through leaves (background, gentle)
- Optional: Distant stream water (very subtle)

**Mix:**
- Birds: 3-4 different species, staggered (not all at once)
- Wind: Consistent base layer, occasional gusts
- Balance: 60% birds, 30% wind, 10% water (if used)

**EQ:**
- High-pass filter: 80 Hz (remove rumble)
- Gentle boost: 2-4 kHz (bird clarity, natural presence)
- Gentle roll-off: 12 kHz+ (no harsh highs)

**Reverb:**
- Type: Natural forest space (short decay)
- Decay time: 1-2 seconds
- Wet/Dry: 20% wet (subtle, not overwhelming)

**Mood:** Calm, peaceful, morning freshness, energizing but gentle

---

### Track 2: Nature - Ocean

**File: nature-ocean-120s.aac**

```yaml
Name: Příroda - Oceán
Duration: 120 seconds
Tier: ZDARMA
Category: nature
Expected size: ~4 MB
```

**Content:**
- Ocean waves (rhythmic, gentle, NOT storm)
- Seagulls (distant, occasional - 2-3 calls per loop)
- Beach ambience (subtle sand/pebbles)

**Mix:**
- Waves: Main element (70%), rhythmic pattern
- Seagulls: Occasional accent (10%), distant
- Ambience: Subtle texture (20%)

**EQ:**
- Natural full spectrum (no harsh cuts)
- Slight boost: 200-500 Hz (wave body, warmth)
- Gentle roll-off: 10 kHz+ (smooth, not harsh)

**Reverb:**
- Type: Open beach space (medium decay)
- Decay time: 2-3 seconds
- Wet/Dry: 15% wet (spacious but not washed out)

**Mood:** Expansive, flowing, meditative, grounding

---

### Track 3: Tibetan Bowls

**File: tibetan-bowls-90s.aac**

```yaml
Name: Tibetské mísy
Duration: 90 seconds (exception: shorter is OK for bowls)
Tier: ZDARMA
Category: tibetan
Expected size: ~3 MB
```

**Content:**
- Singing bowls (3-4 different sizes)
- Notes: C, G, F (calming harmonic triad)
- Base tuning: 528 Hz (solfeggio-aligned)
- Strikes: Gentle, spaced out (NOT busy)

**Pattern:**
- Every 15-20 seconds: New strike/singing
- Let each bowl ring fully before next
- Some overlap is natural and welcome

**EQ:**
- Natural (preserve all harmonics and overtones)
- Optional gentle boost: 400-600 Hz (warmth, body)
- NO high-frequency roll-off (overtones are essential)

**Reverb:**
- Type: Temple space (large, sacred, long decay)
- Decay time: 3-4 seconds
- Wet/Dry: 30% wet (spacious, immersive)

**Mood:** Sacred, deep, timeless, spiritual

---

## 4. PRODUCTION WORKFLOW

### Step-by-Step Process

**Week 1: Cues + Bells (Priority)**

1. **Day 1: Solfeggio Cues**
   - Generate 3 sine wave tones (963/639/396 Hz)
   - Apply fades (25ms)
   - Normalize to -12 dB
   - Export as AAC 192 kbps
   - Test playback (no clicks)

2. **Day 2: Bells**
   - Record or synthesize Tibetan bowls
   - Create start bell (single strike, 528 Hz)
   - Create end bell (triple strike, 528/639/963 Hz)
   - Normalize to -14 dB
   - Test timing (end bell = 3 distinct strikes)

3. **Day 3: Upload to Bunny.net**
   - Upload all 5 files to CDN
   - Set cache headers
   - Test streaming URLs
   - Verify in app

**Week 2: Ambient Tracks**

4. **Day 1-2: Forest Track**
   - Source/record bird sounds
   - Layer with wind
   - Create 120s perfect loop
   - Test loop seamlessness (3× playback)

5. **Day 3-4: Ocean Track**
   - Source/record wave sounds
   - Add seagull accents
   - Create 120s perfect loop
   - Test loop

6. **Day 5-6: Tibetan Bowls Track**
   - Record or synthesize bowls
   - Create 90s perfect loop
   - Heavy reverb (temple space)
   - Test loop

7. **Day 7: Upload & Test**
   - Upload all 3 tracks to CDN
   - Test in app
   - Verify loops are seamless

---

## 5. BUNNY.NET CDN STRUCTURE

### Upload Locations

```
Storage Zone: dechbar-audio
Base URL: https://cdn.dechbar.cz/audio/

Folder Structure:
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

### Cache Headers (Set in Bunny.net)

**For Cues & Bells (never change):**
```
Cache-Control: public, max-age=31536000, immutable
```
- Browser: Cache forever (1 year)
- CDN: Edge cache forever
- Update: Change filename (cache busting)

**For Ambient Tracks (may update):**
```
Cache-Control: public, max-age=86400, must-revalidate
```
- Browser: Cache 24 hours
- CDN: Re-validate daily
- Update: Propagates within 24h

### File Naming Convention

**Rules:**
- NO spaces (use hyphens)
- Lowercase only
- Include duration in filename
- Format: `{type}-{descriptor}-{duration}s.{ext}`

**Examples:**
- `inhale-963hz.aac` ✅
- `nature-forest-120s.aac` ✅
- `Nature Forest 120s.aac` ❌ (spaces, capitals)

---

## 6. QUALITY CHECKLIST

### Before Delivery

**Audio Cues:**
- [ ] Pure sine wave (spectrum shows single frequency)
- [ ] Exact frequencies: 963 Hz, 639 Hz, 396 Hz (±1 Hz tolerance)
- [ ] 250ms duration (exact)
- [ ] 25ms fade in/out (linear fade)
- [ ] Stereo (L=R channels identical)
- [ ] -12 dB level (use loudness meter)
- [ ] AAC-LC 192 kbps
- [ ] File size ~40 KB each
- [ ] No clicks/pops (listen with headphones)

**Bells:**
- [ ] Natural attack/decay (NO artificial fade)
- [ ] Correct frequencies (528 Hz base for start, 528/639/963 Hz for end)
- [ ] -14 dB level
- [ ] AAC-LC 192 kbps stereo
- [ ] End bell: 3 distinct strikes at 0ms, 600ms, 1200ms
- [ ] File sizes: start ~80 KB, end ~120 KB

**Ambient Tracks:**
- [ ] Perfect loop verified (play 3× consecutive, no gap/click)
- [ ] 120s duration (90s for bowls)
- [ ] -14 LUFS normalization (use loudness meter, not peak)
- [ ] Peak level < -1 dB (headroom)
- [ ] No audible clicks/pops anywhere
- [ ] Stereo imaging natural (check mono compatibility)
- [ ] AAC-LC 192 kbps
- [ ] File size ~3-4 MB per track

---

## 7. TESTING AFTER UPLOAD

### CDN Test Checklist

1. **URL Accessibility**
   - [ ] Open URLs in browser (should stream immediately)
   - [ ] Check HTTPS (not HTTP)
   - [ ] Verify CORS headers (allow origin *)

2. **Streaming Test**
   - [ ] Chrome desktop (Windows/Mac)
   - [ ] Safari (macOS/iOS)
   - [ ] Chrome Android

3. **Cache Headers**
   - [ ] Open DevTools > Network tab
   - [ ] Refresh page
   - [ ] Check Cache-Control header matches specs

4. **Loop Playback**
   - [ ] Use HTML5 audio element with `loop=true`
   - [ ] Play for 5+ minutes
   - [ ] Listen for any gap/click at loop point

5. **File Sizes**
   - [ ] Match expectations (cues ~40KB, bells ~80-120KB, ambient ~3-4MB)
   - [ ] If too large: Re-export with lower bitrate (try 128 kbps)

---

## 8. ROYALTY-FREE SOURCES (If Needed)

### For Nature Sounds:
- Freesound.org (CC0 license)
- Zapsplat.com (royalty-free)
- BBC Sound Effects (free for personal/commercial)

### For Tibetan Bowls:
- Record yourself (best quality control)
- Purchase sample pack (Loopmasters, Splice)
- Synthesize (Pure Data, Max/MSP)

### For Solfeggio Tones:
- Generate yourself (100% safe, no copyright)
- OR purchase from: Gumroad, AudioJungle (CC0)

**Legal Note:** Only use CC0 (public domain) or content you own 100%. No YouTube downloads!

---

## 9. DELIVERY

### Upload Instructions

1. **Log into Bunny.net**
   - URL: https://panel.bunny.net
   - Storage Zone: `dechbar-audio`

2. **Create folder structure**
   ```
   /cues/
   /bells/
   /ambient/
   ```

3. **Upload files**
   - Drag & drop OR use upload button
   - Ensure correct folder placement

4. **Set cache headers**
   - Select file → Settings → HTTP Headers
   - Add: `Cache-Control: public, max-age=31536000, immutable` (cues/bells)
   - Add: `Cache-Control: public, max-age=86400, must-revalidate` (ambient)

5. **Test URLs**
   - Copy public URL
   - Open in browser
   - Should stream immediately

6. **Update app** (if needed)
   - URLs are hardcoded in `useBreathingCues.ts`
   - Ambient tracks in database (`background_tracks` table)

---

## 10. TROUBLESHOOTING

### Issue: Audio doesn't play in app

**Cause:** CORS not enabled on Bunny.net
**Fix:** Storage Zone Settings > Enable CORS > Allow Origin: *

### Issue: File size too large

**Cause:** Bitrate too high or duration too long
**Fix:** 
- Re-export with 128 kbps (instead of 192)
- Trim silence at end (for ambient)
- Verify loop point (may have extra padding)

### Issue: Loop has audible gap

**Cause:** Start/end waveforms don't match
**Fix:**
- Find better loop point (zero-crossing alignment)
- Use "Find Loop" feature in DAW
- May need to re-record with loop in mind

### Issue: Clicks/pops in playback

**Cause:** No fade or waveform discontinuity
**Fix:**
- Add 25ms fade in/out
- Check for DC offset (remove if present)
- Normalize properly

---

## 11. REFERENCE - Solfeggio Frequencies Complete

For future sound packs:

```
174 Hz (1+7+4=12→3) - Pain relief, foundation
285 Hz (2+8+5=15→6) - Healing, regeneration
396 Hz (3+9+6=18→9) - Liberation from fear ✅ USED (exhale)
417 Hz (4+1+7=12→3) - Change, transformation
528 Hz (5+2+8=15→6) - Love, DNA repair ✅ USED (bells)
639 Hz (6+3+9=18→9) - Connection, relationships ✅ USED (hold)
741 Hz (7+4+1=12→3) - Expression, solutions
852 Hz (8+5+2=15→6) - Intuition, awakening
963 Hz (9+6+3=18→9) - Divine consciousness ✅ USED (inhale)
```

**Current Pack:** Tesla 3-6-9 (963/639/396 Hz)  
**Future Packs:** Root-Heart-Crown (396/528/852 Hz), Full spectrum (all 9)

---

## 12. TIMELINE & MILESTONES

**Week 1 (February 6-12):**
- [ ] Day 1: Generate solfeggio tones (3 files)
- [ ] Day 2: Create bells (2 files)
- [ ] Day 3: Upload to Bunny.net + test
- [ ] Milestone: App can play cues & bells ✅

**Week 2 (February 13-19):**
- [ ] Day 1-2: Produce Forest track
- [ ] Day 3-4: Produce Ocean track
- [ ] Day 5-6: Produce Tibetan Bowls track
- [ ] Day 7: Upload + test all tracks
- [ ] Milestone: Background music system complete ✅

---

## SUPPORT

**Questions about specs?**
- Technical: Check this document
- Creative: Experiment and iterate
- Testing: Use dev build first

**File format issues?**
- Convert with: ffmpeg, Audacity, Logic Pro
- Verify with: MediaInfo, ffprobe

---

**Good luck with production! 🎵**

*Last updated: 2026-02-06*  
*Version: 1.0*
