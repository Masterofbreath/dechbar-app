# 🚀 LAUNCH DNES VEČER - Digitální Ticho

**Status:** ✅ Code ready  
**Zbývá:** Stripe setup (5 min) + Deploy (15 min)

---

## ⚡ 20 MINUT K LAUNCHI

### ✅ 1. Stripe (5 min)

```
1. Jdi na: https://dashboard.stripe.com
2. Products → + Add Product
3. Name: "Digitální ticho"
4. Price: 990 CZK (one-time)
5. Copy Price ID: price_xxxxx
6. Přidej do .env.local:

VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_xxxxx

7. Restart dev server:
npm run dev
```

---

### ✅ 2. Test (5 min)

```
http://localhost:5174/digitalni-ticho

Klikni CTA → Stripe modal → Test card:
4242 4242 4242 4242

Funguje? → Pokračuj deploy
```

---

### ✅ 3. Deploy (10 min)

```bash
cd /Users/DechBar/dechbar-app
git checkout test
git add .
git commit -m "feat: Digitální ticho V3 FINAL"
git push origin test

# Wait 2 min → test preview URL

git checkout main
git merge test
git push origin main

# ✅ LIVE: https://dechbar.cz/digitalni-ticho
```

---

## 📹 VIDEO/AUDIO (OPTIONAL - můžeš později)

**Stránka funguje BEZ videa/audia!**

Placeholders zobrazí:
- "Video intro s Jakubem - brzy dostupné"
- "Ukázka bude dostupná brzy"

**Když budeš mít video/audio:**
1. Upload to `/public/videos/` a `/public/audio/`
2. Set `VIDEO_AVAILABLE = true` + `AUDIO_AVAILABLE = true`
3. Redeploy

---

## ✅ HOTOVO!

**Launch:** 20 min  
**URL:** https://dechbar.cz/digitalni-ticho

**Dokumentace pro později:**
- `START_HERE_NEW_AGENT.md` - Pro nového agenta
- `README_DIGITALNI_TICHO.md` - Master spec

---

**LET'S GO! 🚀**
