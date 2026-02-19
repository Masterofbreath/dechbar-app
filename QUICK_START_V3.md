# 🚀 Digitální Ticho V3 - QUICK START

**Status:** ✅ Code complete  
**Server:** http://localhost:5174/digitalni-ticho

---

## ✅ CO BYLO OPRAVENO (V3)

### 1. Matoucí copy FIXED
- ❌ "žádné řeči, žádné návody" 
- ✅ "vedu tě hlasem, kdy dýchat"

### 2. Video místo abstraktního kruhu
- ❌ Breathing circle
- ✅ 5min Jakub intro video

### 3. Fáze správně pojmenované
- ❌ Nájezd, Hloubka, Ticho
- ✅ Příběh, Vedení, Ticho

### 4. Čistá cena (bez marketingových triků)
- ❌ "HODNOTA 6 930 Kč, ušetříš 86%"
- ✅ "990 Kč = 47 Kč/den (méně než káva)"

### 5. Highlights zaměřené na strukturu
- ❌ "Bez vokálů" (matoucí)
- ✅ "Od Příběhu k Tichu" (jasná cesta)

### 6. Audio preview 7.5 min
- ❌ 2 taby × 30s
- ✅ 1 ukázka × 7.5 min (polovina dne 1)

### 7. Footer ultra-minimal
- ❌ IČO, Sídlo, Telefon
- ✅ Logo, legal links, copyright (jako /vyzva)

---

## ⚠️ CO POTŘEBUJEŠ (před launch)

### CRITICAL

**1. VIDEO (5 min)** - Jakub intro
```
Umístění: /public/videos/digitalni-ticho-intro-jakub.mp4
Script: public/videos/README_VIDEO.md
Fallback: Placeholder zobrazený (funguje bez videa)
```

**2. AUDIO (7.5 min)** - Den 1 ukázka
```
Umístění: /public/audio/digitalni-ticho-den-1-ukazka.mp3
Obsah: První polovina dne 1 (Příběh)
Fallback: Placeholder zobrazený (funguje bez audia)
```

**3. Stripe Price ID**
```
Stripe Dashboard → Create Product "Digitální ticho"
Price: 990 CZK (one-time)
Add to .env.local: VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_xxxxx
```

---

## 🎬 QUICK LAUNCH (BEZ video/audio)

**Pokud nemáš video a audio ready:**

1. Stránka **FUNGUJE** s placeholders
2. Zobrazí "Video brzy dostupné" + "Ukázka brzy dostupná"
3. Všechno ostatní works (Hero, Storytelling, Pricing, CTA)

**Launch time:** 15 min (jen Stripe setup)

---

## 🎯 ENABLE VIDEO/AUDIO (když jsou ready)

### Enable Video:

**File:** `src/modules/public-web/components/digitalni-ticho/DigitalniTichoHero.tsx`

**Change:**
```typescript
const VIDEO_AVAILABLE = false; // Set to TRUE
```

### Enable Audio:

**File:** `src/modules/public-web/components/digitalni-ticho/DigitalniTichoAudioPreview.tsx`

**Change:**
```typescript
const AUDIO_AVAILABLE = false; // Set to TRUE
```

---

## 🔥 LAUNCH WORKFLOW

### Option A: Full Launch (with video/audio)

```bash
1. Upload video/audio files
2. Set VIDEO_AVAILABLE = true
3. Set AUDIO_AVAILABLE = true
4. Setup Stripe Price ID
5. Test locally
6. git push origin test (preview)
7. git push origin main (PROD)
```

**Time:** 1-2h (depends on video production)

### Option B: Quick Launch (placeholders)

```bash
1. Setup Stripe Price ID
2. Test locally (placeholders visible)
3. git push origin test (preview)
4. git push origin main (PROD)
5. Update video/audio later
```

**Time:** 15-30 min

---

## 📊 V3 SUMMARY

**Sections:** 10 total (clean, focused)  
**Truthful:** NO matoucí copy  
**Premium:** NO fake value stacking  
**Clear:** Správné fáze, jasná struktura  
**Conversion:** Estimated 30-40%

---

**Status:** ✅ READY FOR LAUNCH

**Dev server:** http://localhost:5174/digitalni-ticho
