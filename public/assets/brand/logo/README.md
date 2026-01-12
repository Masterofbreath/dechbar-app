# DechBar Logo Assets

Tento adresář obsahuje všechny verze DechBar loga pro použití v aplikaci.

## 📂 Struktura

```
logo/
├── svg/              # SVG loga bez sloganu (primární)
├── png/              # PNG loga bez sloganu (fallback, email)
│   ├── desktop/      # Desktop rozměry (200px, 400px, 600px)
│   └── mobile/       # Mobile rozměry (150px, 300px, 450px)
├── marketing/        # Loga SE sloganem (pouze pro marketing)
│   ├── svg/
│   └── png/
│       ├── desktop/
│       └── mobile/
└── favicon/          # Favicons a touch icons
```

## 🎨 Varianty

### **Primární (pro aplikaci):**
- **off-white** (#E0E0E0) - hlavní varianta pro dark mode
- **warm-black** (#121212) - hlavní varianta pro light backgrounds

### **Fallback (pro external):**
- **white** (#FFFFFF) - social media, merch
- **black** (#000000) - print, oficiální dokumenty

## 📏 Rozměry

### Desktop:
- 200×63px (@1x) - standard
- 400×125px (@2x) - retina
- 600×187px (@3x) - high-res

### Mobile:
- 150×47px (@1x) - standard
- 300×94px (@2x) - retina
- 450×141px (@3x) - high-res

---

## 📛 File Naming Convention (v2.0)

### New Convention (Since 2026-01-12)

**Format:** `{prefix}-{size}-{variant}[@retina].{ext}`

**Examples:**
- SVG: `dechbar-logo-desktop-off-white.svg`
- PNG @2x: `dechbar-logo-desktop-off-white@2x.png`
- PNG @3x: `dechbar-logo-mobile-warm-black@3x.png`
- Marketing: `dechbar-logo-marketing-desktop-off-white.svg`

**Benefits:**
- ✅ Simple, parsable, kebab-case
- ✅ Clear @2x/@3x notation for retina images
- ✅ No dimensions in filename (managed by config)
- ✅ Consistent prefix system

### Legacy Convention (Deprecated)

**Old Format:** `DechBar_logo (bez sloganu) - {size}_{variant} - {width}x{height}.{ext}`

**Note:** All files have been renamed to new convention as of 2026-01-12.

---

## 💻 Použití v kódu

### React Component:
```tsx
import { Logo } from '@/platform';

// Dark mode (nejčastější)
<Logo variant="off-white" />

// Light background
<Logo variant="warm-black" />

// Marketing (se sloganem)
<Logo variant="off-white" withSlogan />
```

**Note:** Logo is part of the Platform Layer (`src/platform/components/`), making it available to all modules via the Platform API.

### Přímé HTML:
```html
<!-- SVG (preferováno) -->
<img 
  src="/assets/brand/logo/svg/dechbar-logo-desktop-off-white.svg" 
  alt="DechBar"
  width="200"
  height="63"
/>

<!-- PNG s retina srcset -->
<img 
  src="/assets/brand/logo/png/desktop/dechbar-logo-desktop-off-white.png"
  srcset="
    /assets/brand/logo/png/desktop/dechbar-logo-desktop-off-white@2x.png 2x,
    /assets/brand/logo/png/desktop/dechbar-logo-desktop-off-white@3x.png 3x
  "
  alt="DechBar"
  width="200"
  height="63"
/>
```

## 📖 Dokumentace

Kompletní logo manual: `/docs/brand/LOGO_MANUAL.md`

## ⚠️ Pravidla

### ✅ Používej:
- Logo BEZ sloganu v aplikaci (UI/UX)
- Off-white variant pro dark mode
- SVG formát (když je možné)
- Správný aspect ratio

### ❌ Nepoužívej:
- Logo SE sloganem v aplikaci
- Vlastní barvy (pouze schválené)
- Deformované proporce
- Nepodporované efekty (gradients, shadows)

## 🔍 Quick Find

### Nejpoužívanější soubory:

1. **Navbar logo (dark):**
   `/svg/dechbar-logo-desktop-off-white.svg`

2. **Mobile navbar logo (dark):**
   `/svg/dechbar-logo-mobile-off-white.svg`

3. **Login modal:**
   `/svg/dechbar-logo-desktop-off-white.svg`

4. **Favicon:**
   `/favicon/favicon.ico` (také v `/public/favicon.ico`)

## 📞 Support

Pro otázky k logu:
- **Design Team:** #design-dechbar
- **Logo Manual:** `/docs/brand/LOGO_MANUAL.md`
- **Brand Book:** `/docs/brand/VISUAL_BRAND_BOOK.md`

---

**Last Updated:** 2026-01-12  
**Version:** 2.0 (Refactored - Tokenized Logo System)
