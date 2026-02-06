# 🐰 Bunny.net CDN Integration - DechBar App

**Version:** 2.48.0  
**Last Updated:** 2026-02-06  
**Maintainer:** DechBar Team  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture](#2-architecture)
3. [Configuration](#3-configuration)
4. [File Structure](#4-file-structure)
5. [API Reference](#5-api-reference)
6. [Code Implementation](#6-code-implementation)
7. [Security & Best Practices](#7-security--best-practices)
8. [Troubleshooting](#8-troubleshooting)
9. [Monitoring](#9-monitoring)
10. [Costs & Limits](#10-costs--limits)
11. [Future Roadmap](#11-future-roadmap)
12. [Resources](#12-resources)

---

## 1. 🌐 Introduction

### Co je Bunny.net?

**Bunny.net** je globální CDN (Content Delivery Network) provider s focus na:
- ⚡️ Rychlost (edge locations po celém světě)
- 💰 Nízké ceny ($0.01/GB)
- 🔒 Bezpečnost (DDoS protection, encryption)
- 🛠️ Jednoduchost API

### Proč Bunny.net? (vs AWS S3, Cloudflare)

| Kritérium | Bunny.net | AWS S3 | Cloudflare R2 |
|-----------|-----------|--------|---------------|
| **Cena bandwidth** | $0.01/GB | $0.09/GB | $0.00 (!) |
| **Cena storage** | $0.01/GB/m | $0.023/GB/m | $0.015/GB/m |
| **Setup komplexita** | ⭐️⭐️⭐️⭐️⭐️ Snadné | ⭐️⭐️ Složité | ⭐️⭐️⭐️ Střední |
| **API jednoduchost** | ⭐️⭐️⭐️⭐️⭐️ RESTful | ⭐️⭐️ XML-based | ⭐️⭐️⭐️⭐️ S3-compatible |
| **Edge locations** | 100+ | 400+ | 300+ |
| **DechBar verdict** | ✅ **Vítěz** | ❌ Drahé | ⚠️ Nový (2022) |

**Rozhodnutí:** Bunny.net = nejlepší poměr cena/výkon/jednoduchost pro startup.

### Use Case v DechBar

| Typ obsahu | Velikost | Měsíční objem | Bunny.net path |
|-----------|----------|---------------|----------------|
| **Audio tracky** | 5-50 MB | 100 souborů | `audio/tracks/` |
| **Breathwork audio** | 50-150 MB | 20 souborů | `audio/breathwork/` |
| **Cover obrázky** | 50-500 KB | 120 souborů | `images/covers/` |
| **Video kurzy** | 500MB-2GB | 10 souborů | `video/courses/` (budoucí) |

**Celkový objem:** ~10 GB storage + ~500 GB bandwidth/měsíc = **$15/měsíc**

---

## 2. 🏗️ Architecture

### Request Flow Diagram

```
┌─────────────┐                    ┌──────────────────┐
│   Admin     │ ──── Upload ────▶ │  Bunny Storage   │
│   Panel     │   (PUT request)    │  (Origin)        │
│ (localhost) │                    │ storage.bunny.   │
└─────────────┘                    └──────────────────┘
                                            │
                                            │ Sync
                                            ▼
┌─────────────┐                    ┌──────────────────┐
│   User      │ ◀─── Deliver ───── │   Bunny CDN      │
│   App       │   (GET request)    │   (Edge nodes)   │
│ (mobile)    │                    │ dechbar-cdn.     │
└─────────────┘                    └──────────────────┘
```

### Components

#### **Storage Zone** (Backend)
- **Name:** `dechbar-audio`
- **Region:** Europe (Falkenstein, DE)
- **Purpose:** Original file storage
- **Access:** Password-protected (Storage Zone Password)

#### **Pull Zone** (CDN)
- **Name:** `dechbar-cdn`
- **URL:** `https://dechbar-cdn.b-cdn.net`
- **Purpose:** Global content delivery
- **Access:** Public (referrer-protected)

#### **Edge Locations**
- **Europe:** 25+ locations (Prague, Vienna, Frankfurt, ...)
- **Americas:** 30+ locations
- **Asia:** 20+ locations
- **Oceania:** 5+ locations

**Latency:** ~20-50ms (90% requests)

---

## 3. 🔑 Configuration

### Environment Variables

**File:** `dechbar-app/.env.local`

```env
# Bunny.net CDN Configuration
# IMPORTANT: Use Storage Zone PASSWORD (FTP password), NOT API Key!
VITE_BUNNY_STORAGE_ZONE=dechbar-audio
VITE_BUNNY_ACCESS_KEY=fba2725e-a291-4e49-a092932921cc-2cc6-4de4
VITE_BUNNY_CDN_URL=https://dechbar-cdn.b-cdn.net
VITE_BUNNY_HOSTNAME=storage.bunnycdn.com
```

### Credentials (2 types)

#### **1. Storage Zone Password** (✅ Používáme)
- **Použití:** Upload/Delete files přes Storage API
- **Hodnota:** `fba2725e-a291-4e49-a092932921cc-2cc6-4de4`
- **Kde najít:** Bunny Dashboard → Storage → dechbar-audio → FTP & API Access
- **Formát:** UUID-like string

#### **2. API Key** (❌ NEpoužíváme pro upload)
- **Použití:** Management operace (create zones, stats, billing)
- **Hodnota:** `f0fc7e19-3cbf-46ec-b7b6-f6aa3114aaaec4967aae-c4df-4725-9bd2-3bbf65203328`
- **Kde najít:** Bunny Dashboard → Account → API
- **Formát:** Dlouhý hexadecimal string

⚠️ **KRITICKÉ:** Pro upload/delete používej **Storage Zone Password**, NE API Key!

### Security Settings (Bunny Dashboard)

#### **Allowed Referrers** (CDN Security)
```
localhost:5173
127.0.0.1:5173
zdravedychej.cz
*.zdravedychej.cz
```

**Kde nastavit:**
```
Bunny Dashboard → Pull Zones → dechbar-cdn → Security → 
Allowed Referrers → Add
```

#### **CORS Settings**
```
Enable CORS: ✅ Yes
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, PUT, DELETE
```

---

## 4. 📁 File Structure

### Folder Hierarchy

```
dechbar-audio/                    # Storage Zone root
├── audio/
│   ├── tracks/                   # Běžné tracky (<60 min)
│   │   ├── ad536100-4595-4270-94d3-5329da4cd8f4.mp3
│   │   ├── 14ae4f42-38af-44db-9335-342ee39b4e4e.m4a
│   │   └── ...
│   └── breathwork/               # Dlouhé breathworky (>60 min)
│       ├── 7c8f9e21-12ab-4cd3-89ef-a1b2c3d4e5f6.mp3
│       └── ...
├── images/
│   ├── covers/                   # Track/Album cover images
│   │   ├── 8d805fdb-1113-4b4e-8894-9c14b6bbd1a5.jpg
│   │   ├── a2f6dcd9-d3a4-45f5-8dc1-3c35cf179fff.jpg
│   │   └── ...
│   └── albums/                   # Album-specific images (budoucí)
│       └── ...
└── video/                        # Video obsah (budoucí)
    └── courses/                  # Vzdělávací kurzy
        └── ...
```

### File Naming Convention

**Format:** `{uuid}.{extension}`

**Příklady:**
```
ad536100-4595-4270-94d3-5329da4cd8f4.mp3  # Audio track
8d805fdb-1113-4b4e-8894-9c14b6bbd1a5.jpg  # Cover image
7c8f9e21-12ab-4cd3-89ef-a1b2c3d4e5f6.m4a  # Breathwork audio
```

**Proč UUID?**
- ✅ Prevence kolizí (2 admini nahrají `ranní-dech.mp3`)
- ✅ Bezpečnost (nelze uhodnout URL)
- ✅ Tracking (jednoduché logování)
- ✅ Database reference (1:1 mapování)

### Automatic Path Detection

**Logic:**
```typescript
// uploadService.ts - uploadAudio()
const path = duration > 3600 ? 'audio/breathwork' : 'audio/tracks';

// Examples:
duration: 300s (5 min) → audio/tracks/
duration: 1800s (30 min) → audio/tracks/
duration: 5400s (90 min) → audio/breathwork/
```

**Proč:**
- Breathworky (>1h) jsou velké (50-150MB) → separátní složka
- Tracks (<1h) jsou menší (5-50MB) → hlavní složka
- Snadnější analytics a backup

---

## 5. 📡 API Reference

### Base URLs

```
Storage API: https://storage.bunnycdn.com/{storageZone}/{path}
CDN delivery: https://dechbar-cdn.b-cdn.net/{path}
```

### 5.1 Upload File (PUT)

**Endpoint:**
```
PUT https://storage.bunnycdn.com/dechbar-audio/{path}/{filename}
```

**Headers:**
```http
AccessKey: fba2725e-a291-4e49-a092932921cc-2cc6-4de4
Content-Type: audio/mpeg (or image/jpeg, video/mp4)
```

**Body:**
```
Binary file data (raw bytes)
```

**Response:**
- `201 Created` - Success
- `401 Unauthorized` - Invalid AccessKey (check password!)
- `403 Forbidden` - Storage zone permission denied
- `413 Payload Too Large` - File exceeds limit

**Example (curl):**
```bash
curl -X PUT \
  -H "AccessKey: fba2725e-a291-4e49-a092932921cc-2cc6-4de4" \
  -H "Content-Type: audio/mpeg" \
  --data-binary "@morning-breathing.mp3" \
  "https://storage.bunnycdn.com/dechbar-audio/audio/tracks/test.mp3"
```

**Example (JavaScript):**
```typescript
const xhr = new XMLHttpRequest();
xhr.open('PUT', 'https://storage.bunnycdn.com/dechbar-audio/audio/tracks/test.mp3');
xhr.setRequestHeader('AccessKey', 'fba2725e-...');
xhr.setRequestHeader('Content-Type', 'audio/mpeg');
xhr.send(file);
```

---

### 5.2 Delete File (DELETE)

**Endpoint:**
```
DELETE https://storage.bunnycdn.com/dechbar-audio/{path}/{filename}
```

**Headers:**
```http
AccessKey: fba2725e-a291-4e49-a092932921cc-2cc6-4de4
```

**Response:**
- `200 OK` - Success
- `404 Not Found` - File doesn't exist (považováno za úspěch)
- `401 Unauthorized` - Invalid AccessKey

**Example:**
```bash
curl -X DELETE \
  -H "AccessKey: fba2725e-..." \
  "https://storage.bunnycdn.com/dechbar-audio/audio/tracks/old-file.mp3"
```

---

### 5.3 List Files (GET)

**Endpoint:**
```
GET https://storage.bunnycdn.com/dechbar-audio/{path}/
```

**Headers:**
```http
AccessKey: fba2725e-a291-4e49-a092932921cc-2cc6-4de4
Accept: application/json
```

**Response:**
```json
[
  {
    "Guid": "ad536100-4595-4270-94d3-5329da4cd8f4",
    "ObjectName": "ad536100-4595-4270-94d3-5329da4cd8f4.mp3",
    "Length": 5242880,
    "LastChanged": "2026-02-06T10:30:00Z",
    "IsDirectory": false
  }
]
```

---

### 5.4 CDN Delivery (GET)

**Endpoint:**
```
GET https://dechbar-cdn.b-cdn.net/{path}/{filename}
```

**Headers:** (žádné nutné, public CDN)

**Response:**
- `200 OK` - File delivered
- `403 Forbidden` - Referrer not allowed
- `404 Not Found` - File doesn't exist

**Example:**
```html
<audio src="https://dechbar-cdn.b-cdn.net/audio/tracks/test.mp3"></audio>
<img src="https://dechbar-cdn.b-cdn.net/images/covers/cover.jpg" />
```

---

## 6. 💻 Code Implementation

### 6.1 uploadService.ts

**File:** `src/platform/services/upload/uploadService.ts`

```typescript
const BUNNY_CONFIG = {
  storageZone: import.meta.env.VITE_BUNNY_STORAGE_ZONE || 'dechbar-audio',
  hostname: import.meta.env.VITE_BUNNY_HOSTNAME || 'storage.bunnycdn.com',
  accessKey: import.meta.env.VITE_BUNNY_ACCESS_KEY || '', // Storage Zone PASSWORD
  cdnUrl: import.meta.env.VITE_BUNNY_CDN_URL || 'https://dechbar-cdn.b-cdn.net',
};

export const uploadService = {
  uploadAudio(file, duration, onProgress),    // Upload audio → CDN URL
  uploadImage(file, type, onProgress),        // Upload image → CDN URL
  deleteFile(cdnUrl),                         // Delete from CDN
  extractAudioMetadata(file | url),           // Extract duration
};
```

---

### 6.2 Upload Audio (Full Implementation)

```typescript
async uploadAudio(
  file: File,
  duration: number,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // 1. Validate file type
  const allowedTypes = ['mp3', 'm4a', 'wav', 'aac'];
  if (!validateFileType(file, allowedTypes)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // 2. Auto-detect storage path based on duration
  const path = duration > 3600 ? 'audio/breathwork' : 'audio/tracks';
  const filename = crypto.randomUUID() + '.' + getExtension(file.name);
  const storagePath = `${path}/${filename}`;
  
  // 3. Build upload URL
  const uploadUrl = `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageZone}/${storagePath}`;

  // 4. Upload using XMLHttpRequest (for progress tracking)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Progress event
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    });

    // Success/Error handlers
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    // Send request
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('AccessKey', BUNNY_CONFIG.accessKey);
    xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');
    xhr.send(file);
  });

  // 5. Return CDN URL
  return `${BUNNY_CONFIG.cdnUrl}/${storagePath}`;
}
```

**Key points:**
- ✅ XMLHttpRequest místo fetch (progress tracking)
- ✅ UUID filename (prevence kolizí)
- ✅ Auto-path detection (duration-based)
- ✅ Error handling (401, 403, network)

---

### 6.3 Upload Image

```typescript
async uploadImage(
  file: File,
  type: 'cover' | 'album' = 'cover'
): Promise<string> {
  // 1. Validate
  const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
  if (!validateFileType(file, allowedTypes)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // 2. Determine path
  const path = type === 'album' ? 'images/albums' : 'images/covers';
  const filename = crypto.randomUUID() + '.' + getExtension(file.name);
  const storagePath = `${path}/${filename}`;
  
  // 3. Upload
  const uploadUrl = `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageZone}/${storagePath}`;
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'AccessKey': BUNNY_CONFIG.accessKey,
      'Content-Type': file.type || 'image/jpeg',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  // 4. Return CDN URL
  return `${BUNNY_CONFIG.cdnUrl}/${storagePath}`;
}
```

**Note:** Image upload používá `fetch()` (ne XMLHttpRequest), protože jsou menší a progress není tak kritický.

---

### 6.4 Delete File

```typescript
async deleteFile(url: string): Promise<void> {
  // 1. Extract path from CDN URL
  const cdnUrlPrefix = BUNNY_CONFIG.cdnUrl;
  if (!url.startsWith(cdnUrlPrefix)) {
    throw new Error('Invalid CDN URL');
  }

  const path = url.replace(cdnUrlPrefix + '/', '');
  
  // 2. Build delete URL
  const deleteUrl = `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageZone}/${path}`;

  // 3. Send DELETE request
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'AccessKey': BUNNY_CONFIG.accessKey,
    },
  });

  // 4. Handle response (404 = already deleted = OK)
  if (!response.ok && response.status !== 404) {
    throw new Error(`Delete failed with status ${response.status}`);
  }
}
```

**Example usage:**
```typescript
// Delete old track audio
await uploadService.deleteFile('https://dechbar-cdn.b-cdn.net/audio/tracks/old.mp3');

// Delete old cover
await uploadService.deleteFile('https://dechbar-cdn.b-cdn.net/images/covers/old.jpg');
```

---

### 6.5 Extract Audio Metadata

```typescript
async extractAudioMetadata(source: File | string): Promise<AudioMetadata> {
  if (source instanceof File) {
    // From local file
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(source);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          duration: Math.floor(audio.duration),
          size: source.size,
        });
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load audio metadata'));
      });

      audio.src = objectUrl;
    });
  } else {
    // From URL
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener('loadedmetadata', () => {
        resolve({
          duration: Math.floor(audio.duration),
        });
      });

      audio.addEventListener('error', () => {
        reject(new Error('Failed to load audio from URL'));
      });

      audio.crossOrigin = 'anonymous';
      audio.src = source;
    });
  }
}
```

**Usage:**
```typescript
// From file
const metadata = await uploadService.extractAudioMetadata(file);
console.log(metadata.duration); // 315 seconds

// From URL
const metadata = await uploadService.extractAudioMetadata('https://dechbar-cdn.b-cdn.net/audio/tracks/test.mp3');
console.log(metadata.duration); // 315 seconds
```

---

### 6.6 Usage in Components

**TrackForm.tsx:**
```typescript
const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setIsUploading(true);

    // 1. Extract metadata first
    const metadata = await uploadService.extractAudioMetadata(file);
    handleChange('duration', metadata.duration);

    // 2. Upload file with progress
    const cdnUrl = await uploadService.uploadAudio(file, metadata.duration, (progress) => {
      setUploadProgress(progress.percent);
    });

    // 3. Update form
    handleChange('audio_url', cdnUrl);
    alert('✅ Audio nahráno na CDN!');
  } catch (err) {
    console.error('Upload failed:', err);
    setError('Nepodařilo se nahrát audio');
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};
```

**AlbumForm.tsx:**
```typescript
const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setIsUploading(true);
    const cdnUrl = await uploadService.uploadImage(file, 'cover', (progress) => {
      setUploadProgress(progress.percent);
    });
    handleChange('cover_url', cdnUrl);
    alert('✅ Cover nahrán na CDN!');
  } catch (err) {
    console.error('Upload failed:', err);
    alert('Nepodařilo se nahrát cover');
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};
```

---

## 7. 🔒 Security & Best Practices

### 7.1 Authentication

**✅ DO:**
- Používej Storage Zone Password pro upload/delete
- Uchovávej credentials v `.env.local` (NEVER commit!)
- Ověřuj file types před uploadem
- Limituj file sizes (audio: 100MB, images: 5MB)

**❌ DON'T:**
- Nepoužívej API Key pro upload (nebude fungovat!)
- Necommituj `.env.local` do gitu
- Nenahrávej exekutovatelné soubory (.exe, .sh)
- Nedůvěřuj MIME types (ověř extension)

---

### 7.2 Referrer Policy

**Proč:**
- CDN je public (kdo zná URL, může stáhnout)
- Referrer policy blokuje hotlinking (jiné weby nemohou používat naše CDN)

**Jak nastavit:**
```
Bunny Dashboard → Pull Zones → dechbar-cdn → Security →
Allowed Referrers → Add:
  - localhost:5173
  - 127.0.0.1:5173
  - zdravedychej.cz
  - *.zdravedychej.cz
```

**Test:**
```bash
# Should work (correct referrer)
curl -H "Referer: https://localhost:5173" \
  https://dechbar-cdn.b-cdn.net/audio/tracks/test.mp3

# Should fail with 403 (wrong referrer)
curl -H "Referer: https://evil-site.com" \
  https://dechbar-cdn.b-cdn.net/audio/tracks/test.mp3
```

---

### 7.3 File Validation

```typescript
// File type validation
const ALLOWED_AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav'];
const ALLOWED_IMAGES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm'];

// Size limits
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

// Example validation
if (file.size > MAX_AUDIO_SIZE) {
  throw new Error('Audio file too large (max 100MB)');
}

if (!ALLOWED_AUDIO.includes(file.type)) {
  throw new Error('Invalid audio format');
}
```

---

### 7.4 Error Handling

```typescript
try {
  const cdnUrl = await uploadService.uploadAudio(file, duration, onProgress);
  // Success
} catch (err) {
  if (err.message.includes('401')) {
    // Invalid AccessKey
    console.error('Chyba autentizace! Zkontroluj VITE_BUNNY_ACCESS_KEY v .env.local');
  } else if (err.message.includes('403')) {
    // Forbidden (referrer, permissions)
    console.error('Přístup zamítnut! Zkontroluj Referrer Policy v Bunny Dashboard');
  } else if (err.message.includes('413')) {
    // File too large
    console.error('Soubor je příliš velký! Max 100MB pro audio');
  } else {
    // Network error
    console.error('Upload selhal:', err.message);
  }
}
```

---

## 8. 🐛 Troubleshooting

### Error: 401 Unauthorized

**Příčina:** Špatný AccessKey  
**Řešení:**
1. Zkontroluj `.env.local`: `VITE_BUNNY_ACCESS_KEY=fba2725e-...`
2. Ověř, že používáš **Storage Zone Password**, NE API Key
3. Najdi správný password: Bunny Dashboard → Storage → dechbar-audio → FTP & API Access → Password
4. Restartuj dev server: `npm run dev`

**Debug:**
```bash
# Test curl
curl -X PUT \
  -H "AccessKey: YOUR_PASSWORD_HERE" \
  --data-binary "@test.mp3" \
  "https://storage.bunnycdn.com/dechbar-audio/audio/tracks/test.mp3"

# Expected: 201 Created
# If 401: Špatný password
```

---

### Error: 403 Forbidden (CDN delivery)

**Příčina:** Referrer blokován  
**Řešení:**
1. Otevři Bunny Dashboard → Pull Zones → dechbar-cdn → Security
2. Zkontroluj "Allowed Referrers"
3. Přidej chybějící doménu:
   - Dev: `localhost:5173`, `127.0.0.1:5173`
   - Prod: `zdravedychej.cz`
4. Vyčkej 1-2 minuty (cache invalidation)
5. Hard refresh (Cmd+Shift+R)

**Debug:**
```javascript
// Console
fetch('https://dechbar-cdn.b-cdn.net/audio/tracks/test.mp3', {
  headers: { 'Referer': 'http://localhost:5173' }
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Error:', e));

// Expected: Status: 200
// If 403: Referrer not allowed
```

---

### Error: Upload failed (generic)

**Možné příčiny:**

1. **Network timeout**
   - Řešení: Retry logic, chunked upload

2. **File too large**
   - Řešení: Compress audio/image, nebo implementuj chunked upload

3. **CORS error**
   - Řešení: Zapni CORS v Bunny Dashboard

4. **Invalid filename**
   - Řešení: Use ASCII only (UUID je safe)

---

### Error: CORS Policy

**Příčina:** CORS vypnutý v Bunny Dashboard  
**Řešení:**
```
Bunny Dashboard → Pull Zones → dechbar-cdn → 
Cache → CORS → Enable CORS: ✅ Yes
```

**Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: AccessKey, Content-Type
```

---

## 9. 📊 Monitoring

### 9.1 Bunny.net Dashboard

**Metrics k sledování:**

#### **Storage Zone Statistics**
```
Bunny Dashboard → Storage → dechbar-audio → Statistics
```
- Total files count
- Total storage used (GB)
- Upload/delete operations
- Bandwidth usage

#### **Pull Zone Statistics**
```
Bunny Dashboard → Pull Zones → dechbar-cdn → Statistics
```
- Requests per day/month
- Bandwidth delivered
- Cache hit ratio (ideally >95%)
- Geographic distribution

---

### 9.2 Application Metrics

**Track v DechBar:**
```typescript
// adminApi.ts
const uploadMetrics = {
  totalUploads: 0,
  failedUploads: 0,
  averageUploadTime: 0,
  totalBandwidth: 0,
};

// Log každý upload
async uploadAudio() {
  const startTime = Date.now();
  try {
    const result = await uploadService.uploadAudio(...);
    uploadMetrics.totalUploads++;
    uploadMetrics.averageUploadTime = (Date.now() - startTime);
    return result;
  } catch (err) {
    uploadMetrics.failedUploads++;
    throw err;
  }
}
```

---

### 9.3 Alerts

**Kdy poslat alert:**
- Upload success rate < 95% (problém s CDN)
- Storage use > 80% limitu (doplatit kapacitu)
- Bandwidth spike (neočekávaný traffic)
- 401/403 errors (security issue)

---

## 10. 💰 Costs & Limits

### Pricing (2026)

| Služba | Cena | DechBar usage | Měsíční cost |
|--------|------|---------------|-------------|
| **Storage** | $0.01/GB/měsíc | 10 GB | $0.10 |
| **Bandwidth** (EU) | $0.01/GB | 500 GB | $5.00 |
| **Requests** | Free | Unlimited | $0.00 |
| **API calls** | Free | ~1000/měsíc | $0.00 |
| **CELKEM** | - | - | **~$5/měsíc** |

### Estimated Growth

| Milestone | Users | Storage | Bandwidth | Cost/měsíc |
|-----------|-------|---------|-----------|-----------|
| **MVP** (now) | 100 | 10 GB | 50 GB | $1 |
| **Launch** | 1,000 | 15 GB | 500 GB | $5 |
| **Scale** | 10,000 | 25 GB | 5,000 GB | $50 |
| **Growth** | 100,000 | 50 GB | 50,000 GB | $500 |

**Break-even point:** ~5,000 users → zvážit vlastní CDN infrastrukturu.

---

### Limits

| Limit | Hodnota | Poznámka |
|-------|---------|----------|
| **Max file size** | 500 GB | Per file (nerelevantní pro nás) |
| **Upload speed** | No limit | Depends on client bandwidth |
| **API rate limit** | 1,000 req/min | Per storage zone |
| **Concurrent uploads** | No limit | Client-side limitováno |
| **Storage capacity** | No limit | Pay as you grow |

---

## 11. 🚀 Future Roadmap

### Phase 2: Enhanced Uploads

#### **Chunked Upload** (files >100MB)
```typescript
// Break file into 10MB chunks
const CHUNK_SIZE = 10 * 1024 * 1024;
const chunks = Math.ceil(file.size / CHUNK_SIZE);

for (let i = 0; i < chunks; i++) {
  const start = i * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, file.size);
  const chunk = file.slice(start, end);
  
  await uploadChunk(chunk, i, chunks);
}
```

**Benefits:**
- Resume interrupted uploads
- Better progress tracking
- Handles large files (>100MB breathwork videos)

---

### Phase 3: Image Optimization

#### **Auto WebP Conversion**
```typescript
// Before upload: Convert JPG/PNG → WebP
const webpBlob = await convertToWebP(file, { quality: 0.8 });
await uploadService.uploadImage(webpBlob, 'cover');

// Result: 70% smaller file size
// Before: 500 KB JPG → After: 150 KB WebP
```

#### **Responsive Images**
```typescript
// Generate multiple sizes
await uploadService.uploadImage(file, 'cover', {
  sizes: [
    { width: 400, suffix: '-sm' },   // Mobile
    { width: 800, suffix: '-md' },   // Tablet
    { width: 1200, suffix: '-lg' },  // Desktop
  ]
});

// Result:
// cover-ad536100-sm.webp (400px)
// cover-ad536100-md.webp (800px)
// cover-ad536100-lg.webp (1200px)
```

---

### Phase 4: Video Streaming

#### **Bunny Stream Integration**
```typescript
// Upload to Bunny Stream (video hosting platform)
const videoId = await bunnyStream.upload(videoFile);

// Get adaptive bitrate playlist
const playlistUrl = `https://video.bunnycdn.com/${videoId}/playlist.m3u8`;

// Embed in app
<video src={playlistUrl} controls />
```

**Benefits:**
- Adaptive bitrate (auto quality based on connection)
- DRM protection
- Analytics (watch time, completion rate)
- Thumbnails generation

---

### Phase 5: CDN Purge API

```typescript
// Purge file from cache (after update)
await bunnyApi.purgeFile('https://dechbar-cdn.b-cdn.net/audio/tracks/updated.mp3');

// Purge entire folder
await bunnyApi.purgeFolder('audio/tracks');

// Purge entire pull zone
await bunnyApi.purgePullZone('dechbar-cdn');
```

**Use case:** Admin nahraje novou verzi tracku → purge old version z cache.

---

## 12. 📖 Resources

### Official Documentation
- [Bunny.net Storage API](https://docs.bunny.net/reference/storage-api)
- [Bunny.net Pull Zones](https://docs.bunny.net/docs/pull-zones)
- [Bunny.net Security](https://docs.bunny.net/docs/cdn-security)

### DechBar Internal Docs
- [uploadService.ts](/src/platform/services/upload/uploadService.ts)
- [TrackForm.tsx](/src/platform/pages/admin/components/TrackForm.tsx)
- [AlbumForm.tsx](/src/platform/pages/admin/components/AlbumForm.tsx)

### Bunny.net Dashboard
- [Dashboard](https://dash.bunny.net/)
- [Storage Zone](https://dash.bunny.net/storage/dechbar-audio)
- [Pull Zone](https://dash.bunny.net/pullzone/dechbar-cdn)

### Support
- Bunny.net Support: support@bunny.net
- DechBar Team: dev@zdravedychej.cz

---

## 🎯 Quick Start for New Agents

### Step 1: Read this doc (you are here!)

### Step 2: Check credentials
```bash
cd dechbar-app/
cat .env.local | grep BUNNY
```

### Step 3: Test upload
```bash
# Open browser console on http://localhost:5173
# Run:
const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
const url = await uploadService.uploadAudio(file, 300);
console.log('CDN URL:', url);
```

### Step 4: Verify in Bunny Dashboard
```
Bunny Dashboard → Storage → dechbar-audio → audio/tracks/
→ Should see uploaded test.mp3
```

### Step 5: Ready to work!
- Read `uploadService.ts` for implementation details
- Check `TrackForm.tsx` for UI integration examples
- Follow security best practices (section 7)

---

## ✅ Checklist for New Agents

Před začátkem práce s Bunny.net:

- [ ] Přečetl jsem tento dokument kompletně
- [ ] Rozumím rozdílu mezi Storage Zone Password a API Key
- [ ] Vím, jak funguje auto-path detection (`audio/tracks` vs `audio/breathwork`)
- [ ] Zkontroloval jsem `.env.local` credentials
- [ ] Vím, kde najít uploadService.ts
- [ ] Rozumím referrer policy (localhost + zdravedychej.cz)
- [ ] Vím, jak řešit 401 a 403 errors
- [ ] Vím, jak testovat upload (curl nebo browser console)

---

## 🔥 Common Mistakes (VYHNI SE!)

### ❌ Mistake 1: Použít API Key místo Password
```typescript
// ŠPATNĚ (nebude fungovat!)
AccessKey: 'f0fc7e19-3cbf-46ec-b7b6-...' // API Key

// SPRÁVNĚ
AccessKey: 'fba2725e-a291-4e49-a092...' // Storage Zone Password
```

### ❌ Mistake 2: Zapomenout na referrer policy
```
403 Forbidden → Přidej localhost:5173 do Allowed Referrers!
```

### ❌ Mistake 3: Hardcoded paths
```typescript
// ŠPATNĚ
const path = 'audio/tracks';

// SPRÁVNĚ (auto-detection)
const path = duration > 3600 ? 'audio/breathwork' : 'audio/tracks';
```

### ❌ Mistake 4: Commitnout credentials
```bash
# NIKDY necommituj .env.local!
# Zkontroluj .gitignore:
cat .gitignore | grep .env.local
```

---

## 📞 Support & Help

### Mám problém s uploadem

1. **Zkontroluj Console** (F12) → Network tab
2. **Najdi failed request** → klikni → Headers
3. **Zkontroluj:**
   - Request URL správná?
   - AccessKey header přítomný?
   - Status code? (401, 403, 413, 5xx)
4. **Najdi error v tabulce výše** (section 8)
5. **Aplikuj řešení**

### Mám problém s CDN delivery

1. **Zkontroluj URL** v browseru:
   ```
   https://dechbar-cdn.b-cdn.net/audio/tracks/test.mp3
   ```
2. **Pokud 403:**
   - Zkontroluj Referrer Policy
   - Přidej doménu do Allowed Referrers
3. **Pokud 404:**
   - Zkontroluj, že soubor existuje v Storage Zone
   - Vyčkej 30s (CDN propagation)

### Nevím, co dělám

1. Přečti tento dokument znovu (sections 1-6)
2. Pusť `npm run dev`
3. Otevři admin panel → Media → Tracks → Nový track
4. Zkus nahrát testovací audio
5. Sleduj Console pro errors
6. Konzultuj section 8 (Troubleshooting)

---

## 🎉 Congratulations!

Nyní rozumíš Bunny.net integraci v DechBar! 🎯

**Next steps:**
- Implementuj nové features s uploadService
- Sleduj monitoring metriky
- Optimalizuj costs při růstu uživatelů

**Questions?** Přečti si tento dokument znovu nebo kontaktuj DechBar tým.

---

*Dokument vytvořen: 2026-02-06*  
*Pro aktualizace: Edituj tento soubor a commitni do git*  
*Verze: 2.48.0*
