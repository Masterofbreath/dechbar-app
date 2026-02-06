# 🚀 Bunny.net Quick Start - Pro nové agenty

**Čas na přečtení:** 5 minut  
**Pro full dokumentaci:** `BUNNYNET_CDN_INTEGRATION.md`

---

## ⚡️ 30-Second Overview

**Co:** Bunny.net = CDN pro audio tracky, cover obrázky, video kurzy  
**Kde:** `dechbar-audio` (storage) → `dechbar-cdn.b-cdn.net` (delivery)  
**Jak:** `uploadService.ts` → PUT request → CDN URL  

---

## 🔑 Credentials (CRITICAL!)

**`.env.local` obsahuje:**
```env
VITE_BUNNY_STORAGE_ZONE=dechbar-audio
VITE_BUNNY_ACCESS_KEY=fba2725e-a291-4e49-a092932921cc-2cc6-4de4
VITE_BUNNY_CDN_URL=https://dechbar-cdn.b-cdn.net
VITE_BUNNY_HOSTNAME=storage.bunnycdn.com
```

⚠️ **DŮLEŽITÉ:** `ACCESS_KEY` = **Storage Zone PASSWORD**, NE API Key!

---

## 📁 File Structure

```
dechbar-audio/
├── audio/
│   ├── tracks/          # Tracky <60 min
│   └── breathwork/      # Breathworky >60 min
└── images/
    └── covers/          # Cover obrázky
```

**Auto-detection:**
```typescript
duration > 3600s (1h) → audio/breathwork/
duration ≤ 3600s      → audio/tracks/
```

---

## 💻 Jak použít (Code)

### Upload audio:
```typescript
const cdnUrl = await uploadService.uploadAudio(file, duration, (progress) => {
  console.log(`${progress.percent}%`);
});
// Result: 'https://dechbar-cdn.b-cdn.net/audio/tracks/uuid.mp3'
```

### Upload image:
```typescript
const cdnUrl = await uploadService.uploadImage(file, 'cover');
// Result: 'https://dechbar-cdn.b-cdn.net/images/covers/uuid.jpg'
```

### Delete file:
```typescript
await uploadService.deleteFile('https://dechbar-cdn.b-cdn.net/audio/tracks/old.mp3');
```

### Extract duration:
```typescript
const metadata = await uploadService.extractAudioMetadata(fileOrUrl);
console.log(metadata.duration); // 315 seconds
```

---

## 🐛 Common Errors

| Error | Řešení |
|-------|--------|
| **401 Unauthorized** | Zkontroluj `VITE_BUNNY_ACCESS_KEY` v `.env.local` (musí být Storage Password!) |
| **403 Forbidden** | Přidej `localhost:5173` do Allowed Referrers v Bunny Dashboard |
| **Upload failed** | Zkontroluj file type (MP3, M4A, WAV pro audio; JPG, PNG, WebP pro images) |

---

## 🧪 Test Upload (5 minut)

### 1. Otevři admin panel
```
http://localhost:5173 → Login → Settings → Administrace → Media → Tracks
```

### 2. Klikni "Nový track"

### 3. Nahraj testovací audio
- Klikni "Nahrát audio"
- Vyber MP3 soubor
- Sleduj progress bar
- Mělo by se zobrazit: "✅ Audio nahráno na CDN!"

### 4. Ověř v Bunny Dashboard
```
Bunny Dashboard → Storage → dechbar-audio → audio/tracks/
→ Měl by se objevit nový soubor s UUID názvem
```

### 5. Otestuj CDN delivery
```
Zkopíruj CDN URL z formuláře → Vlož do browseru → Měl by se přehrát audio
```

---

## 📚 Full Documentation

**Pro detailní info čti:**
`docs/infrastructure/BUNNYNET_CDN_INTEGRATION.md`

**Obsahuje:**
- Architecture diagram
- Complete API reference
- Security best practices
- Troubleshooting guide
- Monitoring & costs
- Future roadmap

---

## ✅ Ready to Work!

Nyní víš:
- ✅ Co je Bunny.net a proč ho používáme
- ✅ Kde jsou credentials (`.env.local`)
- ✅ Jak použít `uploadService.ts`
- ✅ Jak řešit 401/403 errors
- ✅ Jak otestovat upload

**Můžeš začít pracovat s Bunny.net integracemi!** 🎉

---

*Pro otázky: Přečti full docs nebo kontaktuj DechBar tým*
