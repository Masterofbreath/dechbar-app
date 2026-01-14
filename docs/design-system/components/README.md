# Component Library - Implementation Reference

Všechny Platform komponenty s detailní dokumentací API a příklady použití.

## 📋 Obsah

- [Available Components](#available-components)
- [Quick Reference](#quick-reference)
- [Component Architecture](#component-architecture)
- [Creating New Components](#creating-new-components)

---

## 🧩 Available Components

### Interactive Components
- **[Button](./Button.md)** - Primary, Secondary, Ghost variants s gold theme
- **[IconButton](./IconButton.md)** - Icon-only transparent buttons pro audio controls a toggles
- **[TextLink](./TextLink.md)** - Text links s animovaným podtržením

### Form Controls
- **[Input](./Input.md)** - Premium input s floating label a gold focus glow
- **[Checkbox](./Checkbox.md)** - Soft-square checkbox (6px radius) s gold theme

### Layout Components
- **[Card](./Card.md)** - Liquid glass cards pro modals a content containers

### Feedback Components
- **[Loader](./Loader.md)** - Global loading indicator with breathing animation

---

## ⚡ Quick Reference

| Component   | Import Path                    | Primary Use Case              | Velikosti    |
|-------------|--------------------------------|-------------------------------|--------------|
| Button      | `@/platform/components`        | Hlavní akce (submit, confirm) | sm, md, lg   |
| IconButton  | `@/platform/components`        | Audio controls, password toggle | sm, md, lg |
| TextLink    | `@/platform/components`        | Vedlejší odkazy (forgot password) | -        |
| Input       | `@/platform/components`        | Formuláře (email, password)   | -            |
| Checkbox    | `@/platform/components`        | Souhlasy, preferences         | sm, md, lg   |
| Card        | `@/platform/components`        | Modals, content containers    | -            |

---

## 🏗️ Component Architecture

### Struktura souboru komponenty

```
src/platform/components/
├── ComponentName.tsx          ← React komponenta
└── index.ts                   ← Barrel export

src/styles/components/
└── component-name.css         ← Dedicated CSS (BEM-like classes)

docs/design-system/components/
└── ComponentName.md           ← API dokumentace (tento soubor)

docs/development/implementation-logs/
└── YYYY-MM-DD-component-name-implementation.md  ← Implementation history
```

### 3-Layer CSS Architecture

```
src/styles/
├── globals.css                ← Tailwind + základní utility
├── components/                ← ✨ Dedicated component styles
│   ├── button.css
│   ├── input.css
│   ├── checkbox.css
│   └── icon-button.css
└── modals.css                 ← Modal-specific shared styles
```

**Důležité:**
- ✅ Každá komponenta má dedikovaný CSS soubor
- ✅ CSS používá CSS variables pro customizaci
- ✅ BEM-like naming: `.component-name__element--modifier`
- ✅ Importováno v `src/main.tsx`

---

## 🎨 Design Tokens

Všechny komponenty dodržují společné design tokeny:

### Barvy
```css
--dechbar-gold: #F8CA00;
--dechbar-black: #1a1a1a;
--dechbar-white: #ffffff;
--dechbar-gray: #6b7280;
```

### Border Radius
- **Input:** 16px (moderní, příjemné)
- **Button:** 16px (konzistentní s input)
- **Checkbox:** 6px (soft-square, jasně rozpoznatelný)
- **IconButton:** 8px (default md size)

### Spacing (4px base unit)
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px

### Transitions
```css
--transition-fast: 0.15s ease;
--transition-normal: 0.2s ease;
--transition-slow: 0.3s ease;
```

---

## 🛠️ Creating New Components

### Checklist pro novou komponentu:

#### 1. **Plánování**
- [ ] Přečti tento README
- [ ] Prostuduj existující komponenty (Button, Input)
- [ ] Navrhni API (props, variants, sizes)
- [ ] Vytvoř mockup/wireframe

#### 2. **Implementace**
- [ ] Vytvoř `src/platform/components/ComponentName.tsx`
- [ ] Vytvoř `src/styles/components/component-name.css`
- [ ] Přidej export do `src/platform/components/index.ts`
- [ ] Importuj CSS v `src/main.tsx`

#### 3. **Dokumentace**
- [ ] Vytvoř `docs/design-system/components/ComponentName.md` (API docs)
- [ ] Vytvoř `docs/development/implementation-logs/YYYY-MM-DD-component-name.md` (history)

#### 4. **Testing**
- [ ] Otestuj všechny varianty (primary, secondary, ghost)
- [ ] Otestuj všechny velikosti (sm, md, lg)
- [ ] Otestuj accessibility (keyboard, screen reader)
- [ ] Otestuj responsive (mobile, tablet, desktop)

#### 5. **Review**
- [ ] 4 Temperaments check (Sangvinik, Cholerik, Melancholik, Flegmatik)
- [ ] WCAG AAA contrast check
- [ ] Reduced motion support
- [ ] Dark mode ready (pokud applicable)

---

## 📚 Příklady použití

### Basic Import
```tsx
import { Button, Input, Checkbox } from '@/platform/components';
```

### Kompletní formulář
```tsx
<form>
  <Input
    type="email"
    label="Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />
  
  <Input
    type="password"
    label="Heslo"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />
  
  <Checkbox
    label="Zapamatovat si mě"
    checked={remember}
    onChange={(e) => setRemember(e.target.checked)}
  />
  
  <Button variant="primary" fullWidth>
    Přihlásit se →
  </Button>
  
  <TextLink onClick={handleForgotPassword}>
    Zapomenuté heslo?
  </TextLink>
</form>
```

---

## 🎯 4 Temperaments Design Philosophy

Všechny komponenty musí vyhovovat **všem 4 typům** uživatelů:

### 🎉 Sangvinik (Fun & Social)
- Smooth animations, gold highlights, playful microinteractions

### ⚡ Cholerik (Fast & Efficient)
- Velké klikací oblasti, fast transitions, jasný visual feedback

### 📚 Melancholik (Detail & Quality)
- Premium design, detailed docs, high quality typography

### 🕊️ Flegmatik (Simple & Calm)
- Clean design, calm colors, minimal noise

---

## ♿ Accessibility Standards

Všechny komponenty musí splňovat:

- ✅ **WCAG AAA** pro text kontrast (7:1)
- ✅ **Focus states** pro keyboard navigation
- ✅ **ARIA attributes** pro screen readers
- ✅ **Reduced motion** support
- ✅ **High contrast mode** support

---

## 📞 Support

Máš otázky? Chceš přidat novou komponentu?

1. Přečti si tento README
2. Prostuduj existující komponenty jako vzor
3. Následuj [Creating New Components](#creating-new-components) checklist
4. V případě nejasností konzultuj `docs/development/AI_AGENT_COMPONENT_GUIDE.md`

---

**Poslední aktualizace:** 2026-01-10  
**Maintainer:** DechBar Development Team  
**Related Docs:** 
- [Design System Overview](../00_OVERVIEW.md)
- [Component Development Guide](../../development/AI_AGENT_COMPONENT_GUIDE.md)
- [Implementation Logs](../../development/implementation-logs/README.md)
