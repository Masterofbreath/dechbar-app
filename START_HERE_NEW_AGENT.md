# 🚀 START HERE - Nový Agent pro Digitální Ticho

**Jsi nový agent? Čti TENTO soubor PRVNÍ!**

---

## ⚡ TL;DR (30 sekund)

**Co:** Landing page pro "Digitální ticho" (21denní audio program)  
**Kde:** http://localhost:5174/digitalni-ticho  
**Status:** ✅ Code COMPLETE, čeká na assets (video/audio)  
**Positioning:** **"Trénink odpočinku pro moderního člověka"**

**Main doc:** `README_DIGITALNI_TICHO.md` ⭐

---

## 📖 JAK ZAČÍT

### 1. Přečti master dokumentaci (5 min)

```
README_DIGITALNI_TICHO.md  ⭐ START HERE!
```

**Obsahuje:**
- Positioning ("Trénink odpočinku")
- Struktura (10 sekcí)
- Design specs
- Messages config location
- Assets needed
- Deployment guide

---

### 2. Spusť dev server (1 min)

```bash
cd /Users/DechBar/dechbar-app
npm run dev
# → http://localhost:5174/digitalni-ticho
```

---

### 3. Prozkoumej kód (10 min)

**Main files:**
```
src/config/messages.ts             ⭐ Všechny UI texty
src/modules/public-web/pages/DigitalniTichoPage.tsx  ⭐ Main page
src/modules/public-web/components/digitalni-ticho/  ⭐ 10 komponent
src/modules/public-web/styles/digitalni-ticho.css   ⭐ CSS
```

---

## 🎯 TYPICKÉ ÚKOLY

### "Změnit text"

```typescript
// Edit: src/config/messages.ts
MESSAGES.digitalniTicho.hero.headline = "Nový headline"
```

### "Přidat sekci"

1. Create component v `/components/digitalni-ticho/`
2. Add messages do `messages.ts`
3. Import v `DigitalniTichoPage.tsx`
4. Add CSS do `digitalni-ticho.css`

### "Nahrát video/audio"

```bash
# Upload files:
/public/videos/digitalni-ticho-intro-jakub.mp4
/public/audio/digitalni-ticho-den-1-ukazka.mp3

# Enable v komponentách:
DigitalniTichoHero.tsx: VIDEO_AVAILABLE = true
DigitalniTichoAudioPreview.tsx: AUDIO_AVAILABLE = true
```

---

## ⚠️ KRITICKÁ PRAVIDLA

### Positioning (NIKDY neměnit!)

```
✅ "Trénink odpočinku"
✅ "Umění odpočinku"
✅ "Neurověda + fyziologie"
✅ "Program REŽIM"
✅ "Regulace nervového systému"

❌ "Meditace"
❌ "Ezo/spiritualita"
❌ "Spa relax"
❌ "Audio nahrávky" (bez "trénink" contextu)
```

### Fáze (NIKDY neměnit názvy!)

```
✅ Týden 1: Příběh
✅ Týden 2: Vedení
✅ Týden 3: Ticho

❌ Nájezd, Hloubka (wrong!)
```

### Pricing (NO fake values!)

```
✅ 990 Kč = 47 Kč/den
❌ "HODNOTA 6 930 Kč, ušetříš 86%" (není áčkové!)
```

---

## 📁 DOKUMENTY (podle priority)

### Must Read (před změnami)
1. ⭐ `README_DIGITALNI_TICHO.md` - Master doc
2. `QUICK_START_V3.md` - Launch guide
3. `Brand Book`: `docs/brand/VISUAL_BRAND_BOOK.md`
4. `Tone of Voice`: `docs/design-system/TONE_OF_VOICE.md`

### Optional (reference)
5. `DIGITALNI_TICHO_V3_COMPLETE.md` - V3 changes
6. `STRIPE_SETUP_DIGITALNI_TICHO.md` - Stripe how-to
7. `public/videos/README_VIDEO.md` - Video/audio specs

---

## 🔧 DEV COMMANDS

```bash
# Start dev
npm run dev

# Build test
npm run build

# Deploy preview
git checkout test
git push origin test

# Deploy PROD
git checkout main
git merge test
git push origin main
```

---

## 📊 SUCCESS METRICS

**Conversion target:** 30-40%  
**Revenue target (week 1):** 50-100 sales = 49 500 - 99 000 Kč

**Monitor:**
- Stripe Dashboard (payments)
- Vercel Analytics (traffic)
- GA/Plausible (funnel)

---

## 🆘 TROUBLESHOOTING

### "Stránka nefunguje"
→ Check: `npm run dev` běží?  
→ Check: Routes v `src/routes/index.tsx` přidané?

### "Stripe modal se neotevírá"
→ Check: Price ID v `.env.local`?  
→ Check: Console errors (F12)?

### "Video/audio se nezobrazují"
→ Check: Files v `/public/videos/` a `/public/audio/`?  
→ Check: `VIDEO_AVAILABLE` / `AUDIO_AVAILABLE` = true?

### "TypeScript errors"
→ Read: `ReadLints` tool na changed files  
→ Fix: Messages.ts type mismatches

---

## 💰 COST AWARENESS

**Tento projekt použil ~380k tokens (z 1M limitu).**

**Pro nového agenta:**
- Start s jasným úkolem (ne exploratory)
- Read jen nutné soubory (ne all docs)
- Minimalizuj context (Ask mode kde možné)
- Batch changes (ne file-by-file)

---

**Status:** ✅ HANDOFF READY  
**Next Agent:** Read `README_DIGITALNI_TICHO.md` → Code!

**Poslední update:** 2026-02-17 13:35  
**Agent:** V3 FINAL Implementation Complete
