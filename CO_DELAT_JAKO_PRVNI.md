# ✅ CO DĚLAT JAKO PRVNÍ - Digitální Ticho

**Quick checklist pro launch dnes večer**

---

## 🎯 3 KROKY K LAUNCHI (30 min celkem)

### 1. STRIPE PRICE ID (5 min) ⚠️ CRITICAL

```bash
# Jdi na: https://dashboard.stripe.com
# Products → + Add Product

Name: Digitální ticho
Price: 990 CZK (one-time payment)

# Copy Price ID: price_xxxxxxxxxxxxx

# Add to file: .env.local
VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_xxxxxxxxxxxxx

# Restart dev server:
# Ctrl+C (kill current)
npm run dev
```

**Guide:** `STRIPE_SETUP_DIGITALNI_TICHO.md`

---

### 2. TEST LOKÁLNĚ (10 min)

```bash
# Dev server: http://localhost:5174/digitalni-ticho

# Zkontroluj:
✅ Headline: "Program, který učí moderního člověka umění odpočinku"
✅ Video placeholder visible
✅ Storytelling: "Regulace nervového systému"
✅ Timeline: Příběh, Vedení, Ticho
✅ Pricing: "Digitální ticho", DOŽIVOTNĚ first
✅ FAQ: "Proč bych do toho měl jít?" (2026 přestimulování)
✅ Footer: "Trénink odpočinku pro moderního člověka"

# Test Stripe:
Klikni CTA → Modal otevře → Test card: 4242 4242 4242 4242
```

---

### 3. DEPLOY (15 min)

```bash
cd /Users/DechBar/dechbar-app

# PREVIEW (test branch)
git checkout test
git add .
git commit -m "feat: Digitální ticho V3 FINAL - Trénink odpočinku

- Positioning: Umění odpočinku (skill v 2026)
- Neurověda (ne ezo)  
- Video placeholder (Jakub 5min)
- Audio 7.5min single preview
- Clean pricing (no fake values)
- 7denní garance
- Footer ultra-minimal"

git push origin test

# Wait 2 min → Vercel preview URL

# PROD (main branch)
git checkout main
git merge test
git push origin main

# ✅ LIVE: https://dechbar.cz/digitalni-ticho
```

---

## 📹 OPTIONAL (pokud máš čas)

### Video/Audio Upload

**Video (5 min):**
```
/public/videos/digitalni-ticho-intro-jakub.mp4
Script: public/videos/README_VIDEO.md
Enable: DigitalniTichoHero.tsx → VIDEO_AVAILABLE = true
```

**Audio (7.5 min):**
```
/public/audio/digitalni-ticho-den-1-ukazka.mp3
Enable: DigitalniTichoAudioPreview.tsx → AUDIO_AVAILABLE = true
```

**Fallback:** Placeholders fungují! Launch i bez videa/audia.

---

## 🆘 QUICK TROUBLESHOOTING

### "Stripe modal se neotevírá"
→ Check: Price ID v `.env.local`?  
→ Restart: `npm run dev`

### "Video/audio placeholder"
→ OK! Placeholders jsou záměrné  
→ Upload files later + enable

### "TypeScript error"
→ Run: `npm run build` (check error)  
→ Fix: v messages.ts nebo komponentách

---

## 📞 DOKUMENTACE PRO NOVÉHO AGENTA

**Main entry point:**
```
START_HERE_NEW_AGENT.md  ⭐ Nový agent začíná tady!
```

**Master spec:**
```
README_DIGITALNI_TICHO.md  ⭐ Kompletní dokumentace
```

**Index:**
```
DOCS_INDEX_DIGITALNI_TICHO.md  ⭐ Co číst kdy
```

---

## ✅ FINAL CHECKLIST

- [✅] Code implemented (V3 FINAL)
- [✅] Copy updated ("trénink odpočinku")
- [✅] TypeScript passes (no errors)
- [✅] Dev server runs
- [✅] Placeholders work (video/audio optional)
- [✅] Documentation complete (13 files)
- [✅] Handoff ready (START_HERE created)

---

## 🚀 NEXT STEPS (tvoje akce)

**CRITICAL:**
1. ⚠️ Setup Stripe Price ID (5 min) - nutné pro checkout!

**OPTIONAL:**
2. Nahraj video (5 min intro)
3. Nahraj audio (7.5 min ukázka)

**LAUNCH:**
4. Test locally (10 min)
5. Deploy preview (5 min)
6. Deploy PROD (5 min)

**Total time:** 30 min (bez video/audio) NEBO 2h (s video/audio)

---

## 💰 COST AWARENESS

**Tento session:** ~385k tokens  
**Zbývá:** ~615k tokens v budgetu

**Tip pro příště:**
- Start nový chat po velkých úkolech
- Ask mode když stačí konzultace
- Batch změny (ne iterativně)

---

## 📱 KONTAKT NA DEV SERVER

**URL:** http://localhost:5174/digitalni-ticho  
**Běží:** Ano (port 5174)

**Chceš vidět?** Otevři browser na http://localhost:5174/digitalni-ticho

---

**Status:** ✅ SESSION COMPLETE  
**Handoff:** READY FOR NEW AGENT  
**Launch:** READY TONIGHT

**Děkuji za práci! 🚀**
