# Logo Manual – DechBar

**Version:** 1.0  
**Last Updated:** 2026-01-12  
**Author:** DechBar Team

---

## 📋 Table of Contents

1. [Logo Variants](#logo-variants)
2. [Color Specifications](#color-specifications)
3. [Usage Guidelines](#usage-guidelines)
4. [File Structure](#file-structure)
5. [Code Examples](#code-examples)
6. [Prohibited Uses](#prohibited-uses)

---

## 🎨 Logo Variants

### **1. Primary Logo (Without Slogan)**

**Použití:** 95% případů v aplikaci

```
✅ Navbar
✅ Login modal
✅ Dashboard
✅ Footer
✅ Loading screens
✅ Email signatures
```

**Varianty:**
- **Off-white (#E0E0E0)** - primární pro dark mode
- **Warm-black (#121212)** - primární pro light backgrounds
- **Pure white (#FFFFFF)** - fallback pro external použití
- **Pure black (#000000)** - fallback pro print

---

### **2. Marketing Logo (With Slogan)**

**Slogan:** "DECH JE NOVÝ KOFEIN."

**Použití:** Marketing materiály

```
✅ Landing page hero
✅ Social media posts
✅ Reklamní bannery
✅ Prezentace
```

**Kdy NEPOUŽÍVAT:**
```
❌ V aplikaci (UI/UX)
❌ Navbar
❌ Modals
❌ Small spaces (< 150px width)
```

---

## 🎨 Color Specifications

### **Off-White (Primary for Dark Mode)**
```css
Color: #E0E0E0
Opacity: 87% white
Usage: Dark backgrounds (#121212, #1E1E1E, #2A2A2A)
```

**Proč off-white místo pure white?**
- Reduces visual vibration
- More comfortable for extended viewing
- Professional, premium appearance
- Material Design best practice

---

### **Warm-Black (Primary for Light Backgrounds)**
```css
Color: #121212
Usage: Light backgrounds, print on white paper
```

**Proč #121212 místo #000000?**
- Allows subtle shadows
- Reduces eye strain
- Premium aesthetic
- Material Design recommendation

---

### **Pure White (Fallback)**
```css
Color: #FFFFFF
Usage: Social media dark mode, merch, extreme cases
```

---

### **Pure Black (Fallback)**
```css
Color: #000000
Usage: Official documents, invoices, contracts, print
```

---

## 📏 Size Guidelines

### **Desktop Sizes:**
```
Primary: 200×63px (@1x)
Retina: 400×125px (@2x)
High-res: 600×187px (@3x)
```

### **Mobile Sizes:**
```
Primary: 150×47px (@1x)
Retina: 300×94px (@2x)
High-res: 450×141px (@3x)
```

### **Minimum Sizes (Readable):**
```
Desktop: 150px width minimum
Mobile: 100px width minimum
Favicon: 32×32px minimum
```

---

## 📂 File Structure

```
public/assets/brand/logo/
├── svg/                               # SVG loga bez sloganu
│   ├── DechBar_logo (bez sloganu) - desktop_off-white - 200x63.svg
│   ├── DechBar_logo (bez sloganu) - desktop_warm-black - 200x63.svg
│   ├── DechBar_logo (bez sloganu) - desktop_white - 200x63.svg
│   ├── DechBar_logo (bez sloganu) - desktop_black - 200x63.svg
│   ├── DechBar_logo (bez sloganu) - mobile_off-white - 150x47.svg
│   ├── DechBar_logo (bez sloganu) - mobile_warm-black - 150x47.svg
│   ├── DechBar_logo (bez sloganu) - mobile_white - 150x47.svg
│   └── DechBar_logo (bez sloganu) - mobile_black - 150x47.svg
│
├── png/                               # PNG loga bez sloganu
│   ├── desktop/
│   │   ├── DechBar_logo (bez sloganu) - desktop_off-white - 200x63.png
│   │   ├── DechBar_logo (bez sloganu) - desktop_off-white - 400x125.png
│   │   ├── DechBar_logo (bez sloganu) - desktop_off-white - 600x187.png
│   │   └── ... (warm-black, white, black variants)
│   │
│   └── mobile/
│       ├── DechBar_logo (bez sloganu) - mobile_off-white - 150x47.png
│       ├── DechBar_logo (bez sloganu) - mobile_off-white - 300x94.png
│       ├── DechBar_logo (bez sloganu) - mobile_off-white - 450x141.png
│       └── ... (warm-black, white, black variants)
│
├── marketing/                         # Loga SE sloganem
│   ├── svg/
│   │   └── ... (stejná struktura jako hlavní svg/)
│   │
│   └── png/
│       ├── desktop/
│       └── mobile/
│
└── favicon/                           # Favicony
    ├── favicon.ico
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon.png
    ├── android-chrome-192x192.png
    └── android-chrome-512x512.png
```

---

## 🔧 Design Tokens & Configuration

### CSS Custom Properties

All logo parameters are defined as design tokens in [`src/styles/design-tokens/logo.css`](../../src/styles/design-tokens/logo.css):

**Dimensions:**
- `--logo-width-desktop`, `--logo-height-desktop`
- `--logo-width-mobile`, `--logo-height-mobile`

**Spacing:**
- `--logo-spacing-top`, `--logo-spacing-bottom`, `--logo-clear-space`

**Constraints:**
- `--logo-min-width-desktop`, `--logo-max-width-desktop`
- `--logo-min-width-mobile`, `--logo-max-width-mobile`

**Colors:**
- Linked to `--color-text-primary` (off-white)
- Linked to `--color-background` (warm-black)

### TypeScript Configuration

Central config in [`src/config/logo.ts`](../../src/config/logo.ts):

```typescript
import { LOGO_CONFIG } from '@/config/logo';

// Access dimensions
LOGO_CONFIG.sizes.desktop.width // 200
LOGO_CONFIG.sizes.mobile.height // 47

// Access variants
LOGO_CONFIG.variants['off-white'].hex // '#E0E0E0'

// Access defaults
LOGO_CONFIG.defaults.variant // 'off-white'
```

### Utility Functions

Available in [`src/utils/logo.ts`](../../src/utils/logo.ts):

- **`buildLogoPath()`** - Generate logo file paths
- **`useLogoBreakpoint()`** - React hook for responsive detection
- **`getLogoDimensions()`** - Get current size config

```typescript
import { buildLogoPath, useLogoBreakpoint } from '@/utils/logo';

// Build path
const path = buildLogoPath({ 
  variant: 'off-white', 
  size: 'desktop', 
  format: 'svg' 
});
// Returns: '/assets/brand/logo/svg/dechbar-logo-desktop-off-white.svg'

// Use breakpoint hook
const isMobile = useLogoBreakpoint(); // true if <768px
```

---

## 📛 File Naming Convention (v2.0)

### New Convention (Since 2026-01-12)

**Format:** `{prefix}-{size}-{variant}[@retina].{ext}`

**Examples:**
```
✅ dechbar-logo-desktop-off-white.svg
✅ dechbar-logo-desktop-off-white@2x.png
✅ dechbar-logo-desktop-off-white@3x.png
✅ dechbar-logo-marketing-mobile-warm-black.svg
✅ dechbar-logo-marketing-mobile-warm-black@2x.png
```

**Benefits:**
- ✅ Simple, parsable, kebab-case
- ✅ Clear @2x/@3x notation
- ✅ No dimensions in filename (managed by config)
- ✅ Consistent prefix system

### Legacy Convention (Deprecated)

**Format:** `DechBar_logo (bez sloganu) - {size}_{variant} - {width}x{height}.{ext}`

**Example:**
```
❌ DechBar_logo (bez sloganu) - desktop_off-white - 200x63.svg (OLD)
✅ dechbar-logo-desktop-off-white.svg (NEW)
```

**Note:** All files have been renamed to the new convention as of v2.0 refactoring (2026-01-12).

---

## 💻 Code Examples

### **React Component (Responsive Logo)**

```tsx
import { useState, useEffect } from 'react';

interface LogoProps {
  variant?: 'off-white' | 'warm-black' | 'white' | 'black';
  className?: string;
}

export function Logo({ variant = 'off-white', className = '' }: LogoProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const size = isMobile ? 'mobile' : 'desktop';
  const logoPath = `/assets/brand/logo/svg/DechBar_logo (bez sloganu) - ${size}_${variant} - ${isMobile ? '150x47' : '200x63'}.svg`;

  return (
    <img
      src={logoPath}
      alt="DechBar"
      className={className}
      loading="lazy"
    />
  );
}
```

---

### **HTML (Static)**

```html
<!-- Desktop Logo (off-white for dark mode) -->
<img 
  src="/assets/brand/logo/svg/DechBar_logo (bez sloganu) - desktop_off-white - 200x63.svg" 
  alt="DechBar"
  width="200"
  height="63"
/>

<!-- Mobile Logo (off-white for dark mode) -->
<img 
  src="/assets/brand/logo/svg/DechBar_logo (bez sloganu) - mobile_off-white - 150x47.svg" 
  alt="DechBar"
  width="150"
  height="47"
/>

<!-- With srcset for retina displays -->
<img 
  src="/assets/brand/logo/png/desktop/DechBar_logo (bez sloganu) - desktop_off-white - 200x63.png"
  srcset="
    /assets/brand/logo/png/desktop/DechBar_logo (bez sloganu) - desktop_off-white - 200x63.png 1x,
    /assets/brand/logo/png/desktop/DechBar_logo (bez sloganu) - desktop_off-white - 400x125.png 2x,
    /assets/brand/logo/png/desktop/DechBar_logo (bez sloganu) - desktop_off-white - 600x187.png 3x
  "
  alt="DechBar"
  width="200"
  height="63"
/>
```

---

### **CSS Background**

```css
.navbar-logo {
  width: 200px;
  height: 63px;
  background-image: url('/assets/brand/logo/svg/DechBar_logo (bez sloganu) - desktop_off-white - 200x63.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

@media (max-width: 768px) {
  .navbar-logo {
    width: 150px;
    height: 47px;
    background-image: url('/assets/brand/logo/svg/DechBar_logo (bez sloganu) - mobile_off-white - 150x47.svg');
  }
}
```

---

## ✅ Usage Guidelines

### **When to Use Each Variant:**

| Context | Variant | Reason |
|---------|---------|--------|
| Dark mode navbar | Off-white | Primary, optimal contrast |
| Dark mode modals | Off-white | Consistent with UI text |
| Light backgrounds | Warm-black | Primary, premium look |
| Social media | Pure white/black | Platform standards |
| Print materials | Pure black | High contrast for print |
| Email (dark mode) | Off-white | Matches app experience |
| Email (light mode) | Warm-black | Readable, professional |

---

### **Spacing & Clear Space:**

**Minimum clear space:** 1× logo height

```
┌─────────────────────────────────┐
│                                 │
│     ┌─────────────┐             │
│     │   DECHBAR   │             │
│     └─────────────┘             │
│                                 │
└─────────────────────────────────┘
     ↑               ↑
   1× height      1× height
```

---

### **Responsive Breakpoints:**

```css
/* Mobile: < 768px */
@media (max-width: 767px) {
  logo-width: 150px;
  logo-height: 47px;
}

/* Desktop: ≥ 768px */
@media (min-width: 768px) {
  logo-width: 200px;
  logo-height: 63px;
}
```

---

## 🚫 Prohibited Uses

### **NEVER:**

❌ **Neměň barvy**
```
Používej pouze schválené barvy:
- Off-white (#E0E0E0)
- Warm-black (#121212)
- Pure white (#FFFFFF)
- Pure black (#000000)
```

❌ **Nedeformuj proporce**
```
Vždy zachovej aspect ratio (poměr stran)
```

❌ **Nepřidávej efekty**
```
- Žádné stíny (kromě subtle elevation)
- Žádné gradienty
- Žádné obrysy
- Žádné animace (kromě fade in/out)
```

❌ **Neumisťuj na rušivé pozadí**
```
Logo musí být čitelné
Minimální kontrast: 4.5:1 (WCAG AA)
```

❌ **Nepoužívej slogan v aplikaci**
```
Slogan jen pro marketing!
V aplikaci vždy logo BEZ sloganu
```

❌ **Nerotuj logo**
```
Logo vždy horizontálně
Výjimka: Vertical stacked (future)
```

---

## 🔧 For Developers: Global Logo Control

### Architecture

Logo is now part of the **Platform Layer** (`src/platform/components/Logo.tsx`), making it available to all modules via the Platform API.

**Import path:**
```tsx
import { Logo } from '@/platform';
```

**Why Platform Layer?**
- ✅ Shared across ALL modules (Studio, Challenges, AI Coach, etc.)
- ✅ Single source of truth for logo rendering
- ✅ Proper architectural separation (modules import from `@/platform`)
- ✅ Type-safe imports with TypeScript
- ✅ Consistent behavior across entire app

---

### How to Change Logo Dimensions Globally

**Single change location:** `src/styles/design-tokens/logo.css`

```css
:root {
  --logo-width-desktop: 200px;  /* ← Change here */
  --logo-height-desktop: 63px;  /* ← Change here */
  --logo-width-mobile: 150px;   /* ← Change here */
  --logo-height-mobile: 47px;   /* ← Change here */
}
```

→ **All `<Logo />` components update automatically across the entire app!**

**Example:** If you change `--logo-width-desktop` to `250px`, every logo in the app instantly becomes 250px wide on desktop screens.

---

### How to Change Logo Breakpoint

**Single change location:** `src/config/logo.ts`

```typescript
sizes: {
  mobile: { width: 150, height: 47, breakpoint: 768 }, // ← Change breakpoint here
  desktop: { width: 200, height: 63 },
}
```

**Example:** Change `breakpoint: 768` to `breakpoint: 1024` and logos will switch to desktop size at 1024px instead of 768px.

---

### How to Change Logo Colors

**Linked to Brand colors:** `src/styles/design-tokens/colors.css`

```css
--logo-color-off-white: var(--color-text-primary);  /* Links to main text color */
--logo-color-warm-black: var(--color-background);   /* Links to main background */
```

**What this means:**
- When you change `--color-text-primary`, all off-white logos update
- When you change `--color-background`, all warm-black logos update
- Colors are synchronized with your app's theme

---

### File Paths Generation

All logo file paths are generated dynamically from config:

**Function:** `buildLogoPath()` in `src/utils/logo.ts`

```typescript
const logoPath = buildLogoPath({
  variant: 'off-white',
  size: 'desktop',
  format: 'svg',
  withSlogan: false,
});
// Returns: '/assets/brand/logo/svg/dechbar-logo-desktop-off-white.svg'
```

**This means:**
- No hardcoded paths in components
- Easy to rename files (just update config)
- Consistent naming across entire app

---

## ✅ Developer Validation Checklist

Before using logo in a new component:

- [ ] Import from `@/platform` (not `@/components/shared`)
- [ ] Use `<Logo />` component (not direct `<img />`)
- [ ] Variant matches background:
  - `off-white` on dark backgrounds (#121212, #1E1E1E)
  - `warm-black` on light backgrounds (white, light grays)
- [ ] Logo has proper `alt` text (handled automatically ✅)
- [ ] Lazy loading enabled (handled automatically ✅)
- [ ] Test on mobile + desktop breakpoints
- [ ] Check console for errors
- [ ] Verify responsive behavior (resize browser window)
- [ ] Network tab: SVG loads successfully

---

## 🎯 Platform Integration

Logo is exported from Platform API:

```typescript
// src/platform/index.ts
export { Logo, type LogoProps } from './components';
```

**This means:**
- ✅ All modules can use Logo via `@/platform`
- ✅ Consistent across entire app
- ✅ Single source of truth
- ✅ Type-safe imports

**Usage in modules:**

```tsx
// In any module (Studio, Challenges, AI Coach, etc.)
import { Logo } from '@/platform';

function ModuleHeader() {
  return (
    <header>
      <Logo variant="off-white" />
      <nav>...</nav>
    </header>
  );
}
```

**Usage in Platform components:**

```tsx
// In platform-level components (AuthModal, Navbar, etc.)
import { Logo } from '@/platform';

function AuthModal() {
  return (
    <div className="modal">
      <Logo variant="off-white" />
      <form>...</form>
    </div>
  );
}
```

---

## 📱 Platform-Specific Guidelines

### **iOS:**
- Use SVG for scalability
- Provide @2x and @3x retina assets
- Off-white variant for dark mode support

### **Android:**
- Provide adaptive icon (future)
- Use PNG for compatibility
- Ensure clear space around logo

### **Web:**
- Prefer SVG over PNG (scalable, smaller file size)
- Use `<img>` with proper `alt` text
- Lazy load when below the fold
- Provide retina `srcset` for PNG fallbacks

### **Email:**
- Use PNG (better email client support)
- Inline dimensions (width/height attributes)
- Alt text for accessibility
- Dark mode variant with `prefers-color-scheme`

---

## 🔍 Accessibility

### **Alt Text:**

```html
<!-- Good -->
<img src="logo.svg" alt="DechBar" />

<!-- Better (context-specific) -->
<img src="logo.svg" alt="DechBar - Dechová cvičení a wellbeing" />

<!-- Best (for screen readers) -->
<a href="/" aria-label="DechBar - Domovská stránka">
  <img src="logo.svg" alt="DechBar logo" />
</a>
```

### **Contrast Ratios:**

| Variant | Background | Contrast | WCAG |
|---------|------------|----------|------|
| Off-white (#E0E0E0) | #121212 | 12.6:1 | ✅ AAA |
| Off-white (#E0E0E0) | #1E1E1E | 11.8:1 | ✅ AAA |
| Warm-black (#121212) | #FFFFFF | 16.1:1 | ✅ AAA |

---

## 📊 Performance

### **File Sizes:**

| Format | Size | Use Case |
|--------|------|----------|
| SVG | ~2-10 KB | Web (primary) |
| PNG @1x | ~10-15 KB | Fallback, email |
| PNG @2x | ~30-50 KB | Retina displays |
| PNG @3x | ~60-90 KB | High-res displays |

### **Optimization Tips:**

```bash
# Optimize SVG
svgo logo.svg -o logo-optimized.svg

# Compress PNG
pngquant logo.png --quality=80-90 --output logo-compressed.png

# Convert to WebP (future)
cwebp logo.png -q 90 -o logo.webp
```

---

## 🎯 Quick Reference

### **Most Common Use Cases:**

```typescript
// 1. Navbar (dark mode)
<Logo variant="off-white" />

// 2. Footer (dark mode)
<Logo variant="off-white" className="opacity-60" />

// 3. Login modal (dark mode)
<Logo variant="off-white" />

// 4. Light background page
<Logo variant="warm-black" />

// 5. Email signature
<img src="logo-off-white.png" srcset="logo-off-white@2x.png 2x" alt="DechBar" />
```

---

## 📞 Questions?

**Contact:** Design Team  
**Slack:** #design-dechbar  
**Email:** design@dechbar.cz

**Version History:**
- v1.0 (2026-01-12): Initial logo manual, off-white & warm-black variants

---

**Last Updated:** 2026-01-12  
**Next Review:** 2026-04-12
