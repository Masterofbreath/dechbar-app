# AI Agent Component Development Guide

> **🤖 Pro AI Agenty:** Tento dokument definuje **přesný postup** pro vytváření, editaci a dokumentování Platform komponent v DechBar App projektu.

---

## 📚 ALWAYS READ FIRST

Před vytvořením/editací komponenty **MUSÍŠ přečíst:**

1. ✅ **Tento dokument** (`AI_AGENT_COMPONENT_GUIDE.md`) - celý!
2. ✅ `docs/design-system/components/README.md` - Component Library Reference
3. ✅ Existující komponenty ve `src/platform/components/` - jako vzor (Button, Input)
4. ✅ `FOUNDATION/04_DESIGN_STANDARDS.md` - Design tokens a standardy

---

## 🎯 Co je Platform Component?

**Platform Component** = Reusable UI komponenta používaná napříč celou aplikací.

### Příklady:
- ✅ Button, Input, Checkbox (form controls)
- ✅ Modal, Card, Drawer (layout)
- ✅ IconButton, TextLink (interactive)
- ❌ LoginView, RegisterView (feature-specific → patří do `src/components/`)

---

## 📂 File Structure - KAM CO PATŘÍ?

### 1. **React Component** → `src/platform/components/`

```
src/platform/components/
├── Button.tsx              ← React komponenta
├── Input.tsx
├── Checkbox.tsx
├── IconButton.tsx
└── index.ts                ← Barrel export (VŽDY aktualizuj!)
```

**Naming Convention:**
- PascalCase pro soubor: `ComponentName.tsx`
- PascalCase pro komponentu: `export const ComponentName = () => { ... }`

### 2. **CSS Styles** → `src/styles/components/`

```
src/styles/components/
├── button.css              ← Dedicated CSS pro Button
├── input.css
├── checkbox.css
└── icon-button.css
```

**Naming Convention:**
- kebab-case pro soubor: `component-name.css`
- BEM-like classes: `.component-name__element--modifier`

### 3. **API Documentation** → `docs/design-system/components/`

```
docs/design-system/components/
├── README.md               ← Index všech komponent (VŽDY aktualizuj!)
├── Button.md               ← API dokumentace pro Button
├── Input.md
└── Checkbox.md
```

**Content:** JAK POUŽÍVAT komponentu (API, props, examples)

### 4. **Implementation Log** → `docs/development/implementation-logs/`

```
docs/development/implementation-logs/
├── README.md               ← Chronologický index (VŽDY aktualizuj!)
├── 2026-01-10-button-premium-design.md
└── 2026-01-10-input-premium-design.md
```

**Content:** CO BYLO UDĚLÁNO a PROČ (history, decisions, before/after)

### 5. **Import v Main** → `src/main.tsx`

```typescript
import './styles/components/button.css';
import './styles/components/input.css';
// ... VŽDY přidej import pro nový CSS!
```

---

## 🛠️ Step-by-Step: Creating New Component

### **KROK 1: Plánování (POVINNÉ!)**

#### 1.1 Zodpověz tyto otázky:

- **Účel:** Co komponenta dělá?
- **API:** Jaké props bude mít?
- **Variants:** Bude mít varianty? (primary/secondary, sm/md/lg)
- **States:** Jaké stavy? (hover, focus, disabled, loading, error)
- **Use cases:** Kde se použije? (auth forms, settings, player controls)

#### 1.2 Prostuduj existující komponenty

```bash
# Přečti tyto soubory jako vzor:
src/platform/components/Button.tsx
src/styles/components/button.css
docs/design-system/components/README.md
docs/development/implementation-logs/2026-01-10-button-premium-design.md
```

---

### **KROK 2: Implementace React Komponenty**

#### 2.1 Vytvoř `src/platform/components/ComponentName.tsx`

**Template:**

```tsx
import React from 'react';

export interface ComponentNameProps {
  /**
   * Content of the component
   */
  children?: React.ReactNode;
  
  /**
   * Visual variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost';
  
  /**
   * Size of the component
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * ComponentName - Short description
 * 
 * @example
 * <ComponentName variant="primary" size="md">
 *   Content
 * </ComponentName>
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
}) => {
  const componentClass = [
    'component-name',                    // Base class
    `component-name--${variant}`,        // Variant modifier
    `component-name--${size}`,           // Size modifier
    disabled && 'component-name--disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={componentClass}
      disabled={disabled}
      onClick={onClick}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
```

**Klíčové body:**
- ✅ TypeScript interface pro props
- ✅ JSDoc komentáře (pro IDE autocomplete)
- ✅ Default values pro props
- ✅ BEM-like CSS classes (`.component-name--variant`)
- ✅ Accessibility attributes (`aria-*`)

#### 2.2 Přidej export do `src/platform/components/index.ts`

```typescript
// Přidej na konec souboru:
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

---

### **KROK 3: Implementace CSS Stylů**

#### 3.1 Vytvoř `src/styles/components/component-name.css`

**Template:**

```css
/* ============================================================
   ComponentName Styles
   Modern Premium Wellness Design
   ============================================================ */

/* ============================================================
   CSS Variables
   ============================================================ */
:root {
  /* Colors */
  --component-name-primary-bg: #F8CA00;
  --component-name-primary-color: #1a1a1a;
  --component-name-secondary-bg: transparent;
  --component-name-secondary-color: #1a1a1a;
  
  /* Sizing */
  --component-name-padding-sm: 10px 20px;
  --component-name-padding-md: 14px 28px;
  --component-name-padding-lg: 16px 32px;
  
  --component-name-font-size-sm: 14px;
  --component-name-font-size-md: 16px;
  --component-name-font-size-lg: 18px;
  
  --component-name-border-radius: 16px;
  
  /* Transitions */
  --component-name-transition: all 0.2s ease;
}

/* ============================================================
   Base Styles
   ============================================================ */
.component-name {
  /* Reset */
  margin: 0;
  border: none;
  outline: none;
  
  /* Typography */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 600;
  font-size: var(--component-name-font-size-md);
  line-height: 1.5;
  
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--component-name-padding-md);
  border-radius: var(--component-name-border-radius);
  
  /* Interaction */
  cursor: pointer;
  user-select: none;
  transition: var(--component-name-transition);
  
  /* Appearance */
  background: var(--component-name-primary-bg);
  color: var(--component-name-primary-color);
}

/* ============================================================
   Variants
   ============================================================ */

/* Primary (default) */
.component-name--primary {
  background: #F8CA00;
  color: #1a1a1a;
  box-shadow: 0 8px 24px rgba(248, 202, 0, 0.3);
}

.component-name--primary:hover:not(:disabled) {
  background: #FFD633;
  box-shadow: 0 12px 32px rgba(248, 202, 0, 0.4);
  transform: translateY(-2px);
}

/* Secondary */
.component-name--secondary {
  background: transparent;
  color: #1a1a1a;
  border: 2px solid #e5e7eb;
}

.component-name--secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #F8CA00;
  transform: translateY(-1px);
}

/* ============================================================
   Sizes
   ============================================================ */
.component-name--sm {
  padding: var(--component-name-padding-sm);
  font-size: var(--component-name-font-size-sm);
  border-radius: 12px;
}

.component-name--md {
  padding: var(--component-name-padding-md);
  font-size: var(--component-name-font-size-md);
}

.component-name--lg {
  padding: var(--component-name-padding-lg);
  font-size: var(--component-name-font-size-lg);
}

/* ============================================================
   States
   ============================================================ */

/* Focus */
.component-name:focus-visible {
  outline: 3px solid #F8CA00;
  outline-offset: 2px;
}

/* Active (pressed) */
.component-name:active:not(:disabled) {
  transform: scale(0.98);
}

/* Disabled */
.component-name--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================================
   Responsive Design
   ============================================================ */
@media (max-width: 480px) {
  .component-name {
    padding: var(--component-name-padding-sm);
    font-size: var(--component-name-font-size-sm);
  }
}

/* ============================================================
   Accessibility
   ============================================================ */

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .component-name {
    transition: none;
  }
  
  .component-name:hover {
    transform: none;
  }
}

/* High Contrast */
@media (prefers-contrast: high) {
  .component-name {
    border-width: 3px;
  }
}
```

**Klíčové body:**
- ✅ CSS Variables na začátku (pro customizaci)
- ✅ BEM-like naming (`.component-name--variant`)
- ✅ Všechny stavy (hover, focus, active, disabled)
- ✅ Responsive design (mobile-first)
- ✅ Accessibility (reduced motion, high contrast)
- ✅ Komentáře pro navigaci

#### 3.2 Importuj CSS v `src/main.tsx`

```typescript
// Přidej import (za ostatní component CSS):
import './styles/components/component-name.css';
```

---

### **KROK 4: Dokumentace - API Reference**

#### 4.1 Vytvoř `docs/design-system/components/ComponentName.md`

**Template:**

```markdown
# ComponentName

Short description (1-2 sentences).

## Import

\`\`\`tsx
import { ComponentName } from '@/platform/components';
\`\`\`

## API

### Props

| Prop       | Type                          | Default    | Description                  |
|------------|-------------------------------|------------|------------------------------|
| variant    | 'primary' \| 'secondary'      | 'primary'  | Visual style variant         |
| size       | 'sm' \| 'md' \| 'lg'          | 'md'       | Size of the component        |
| disabled   | boolean                       | false      | Disable interaction          |
| className  | string                        | ''         | Additional CSS classes       |
| onClick    | () => void                    | -          | Click handler                |

## Variants

### Primary
Default variant with gold background.

\`\`\`tsx
<ComponentName variant="primary">
  Primary Action
</ComponentName>
\`\`\`

### Secondary
Outline variant with transparent background.

\`\`\`tsx
<ComponentName variant="secondary">
  Secondary Action
</ComponentName>
\`\`\`

## Sizes

### Small (sm)
Compact size for tight layouts.

\`\`\`tsx
<ComponentName size="sm">Small</ComponentName>
\`\`\`

### Medium (md) - Default
Standard size for most use cases.

\`\`\`tsx
<ComponentName size="md">Medium</ComponentName>
\`\`\`

### Large (lg)
Prominent size for primary actions.

\`\`\`tsx
<ComponentName size="lg">Large</ComponentName>
\`\`\`

## Examples

### Basic Usage
\`\`\`tsx
<ComponentName onClick={handleClick}>
  Click Me
</ComponentName>
\`\`\`

### With Loading State
\`\`\`tsx
<ComponentName loading={isLoading}>
  Submit
</ComponentName>
\`\`\`

### Disabled
\`\`\`tsx
<ComponentName disabled>
  Disabled
</ComponentName>
\`\`\`

## Design Tokens

- **Border-radius:** 16px
- **Font-weight:** 600 (semi-bold)
- **Transition:** 0.2s ease
- **Gold color:** #F8CA00

## Accessibility

- ✅ Keyboard accessible (Tab, Enter, Space)
- ✅ Screen reader friendly (ARIA attributes)
- ✅ Focus visible state
- ✅ Reduced motion support

## 4 Temperaments

### 🎉 Sangvinik
- Smooth animations, gold highlights

### ⚡ Cholerik
- Large click area, fast transitions

### 📚 Melancholik
- Premium design, detailed docs

### 🕊️ Flegmatik
- Clean, calm aesthetic

## Related Components

- [Button](./Button.md)
- [IconButton](./IconButton.md)

---

**Status:** ✅ Production Ready  
**Since:** YYYY-MM-DD  
**Maintainer:** DechBar Team
\`\`\`

#### 4.2 Aktualizuj `docs/design-system/components/README.md`

Přidej komponentu do seznamu:

\`\`\`markdown
### Interactive Components
- **[ComponentName](./ComponentName.md)** - Short description
\`\`\`

---

### **KROK 5: Implementation Log**

#### 5.1 Vytvoř `docs/development/implementation-logs/YYYY-MM-DD-component-name.md`

**Template:** Viz `docs/development/implementation-logs/README.md` → Template section

**Obsah MUSÍ obsahovat:**
1. ✅ Co bylo implementováno
2. 📁 Vytvořené/upravené soubory
3. 🎨 Designové rozhodnutí (Proč X místo Y?)
4. 📊 Před vs. Po (tabulka)
5. 🧪 Testování (browser, mobile, accessibility)
6. 🚀 Výsledek
7. Metadata (autor, datum, status)

#### 5.2 Aktualizuj `docs/development/implementation-logs/README.md`

Přidaj do Timeline:

\`\`\`markdown
### YYYY-MM-DD - ComponentName Implementation

1. **[ComponentName Implementation](./YYYY-MM-DD-component-name.md)**
   - Short summary of changes
   - Key highlights
\`\`\`

---

## ✅ Checklist - Před Commitem

### Files Created/Modified:

- [ ] `src/platform/components/ComponentName.tsx` ✨
- [ ] `src/platform/components/index.ts` 🔧 (export přidán)
- [ ] `src/styles/components/component-name.css` ✨
- [ ] `src/main.tsx` 🔧 (CSS import přidán)
- [ ] `docs/design-system/components/ComponentName.md` ✨
- [ ] `docs/design-system/components/README.md` 🔧 (component přidán do seznamu)
- [ ] `docs/development/implementation-logs/YYYY-MM-DD-component-name.md` ✨
- [ ] `docs/development/implementation-logs/README.md` 🔧 (log přidán do timeline)

### Testing:

- [ ] **Browser:** Všechny varianty fungují (primary, secondary, ghost)
- [ ] **Sizes:** sm, md, lg správně zobrazeny
- [ ] **States:** hover, focus, active, disabled fungují
- [ ] **Mobile:** Testováno na 375px, 768px
- [ ] **Desktop:** Testováno na 1280px, 1920px
- [ ] **Accessibility:**
  - [ ] Keyboard navigation (Tab, Enter)
  - [ ] Focus visible state
  - [ ] Screen reader friendly (ARIA)
  - [ ] Reduced motion support
  - [ ] High contrast mode

### Design Compliance:

- [ ] **4 Temperaments:** Vyhovuje všem 4 typům
- [ ] **WCAG AAA:** Kontrast 7:1+ pro text
- [ ] **Design Tokens:** Používá `--dechbar-gold`, atd.
- [ ] **Border-radius:** Konzistentní (16px pro buttons/inputs, 6px pro checkboxes)
- [ ] **Gold Theme:** #F8CA00 pro primary actions

### Documentation:

- [ ] **API Docs:** Props, variants, sizes, examples
- [ ] **Implementation Log:** Detailní historie, před/po
- [ ] **Screenshots:** Pokud applicable
- [ ] **Comments:** Vysvětlení v kódu (TSDoc, CSS komentáře)

---

## 🚨 Common Mistakes - AVOID!

### ❌ DON'T:

1. **Netvořit documentation**
   - ❌ Implementuješ komponentu, ale zapomeneš na API docs nebo implementation log
   - ✅ VŽDY vytvoř oba soubory (API + Log)

2. **Házet .md soubory do rootu**
   - ❌ `ComponentName_SUMMARY.md` v rootu projektu
   - ✅ `docs/development/implementation-logs/YYYY-MM-DD-component-name.md`

3. **CSS přímo v komponentě (inline Tailwind)**
   - ❌ `<button className="bg-gold-500 hover:bg-gold-600 rounded-lg">`
   - ✅ `<button className="button button--primary button--md">`

4. **Zapomenout na import CSS v main.tsx**
   - ❌ Komponenta nefunguje, protože CSS není loadnutý
   - ✅ Vždy přidej `import './styles/components/component-name.css';`

5. **Ignorovat 4 Temperaments**
   - ❌ Design vyhovuje jen jednomu typu uživatele
   - ✅ Check všechny 4 typy (Sangvinik, Cholerik, Melancholik, Flegmatik)

6. **Špatný naming**
   - ❌ `src/styles/components/ButtonStyles.css` (PascalCase)
   - ✅ `src/styles/components/button.css` (kebab-case)

7. **Chybějící accessibility**
   - ❌ Žádné `aria-*` attributes, focus states
   - ✅ VŽDY implementuj keyboard navigation, focus states, ARIA

---

## 📚 Reference Examples

Prostuduj tyto komponenty jako **GOLD STANDARD:**

### 1. Button Component
- **React:** `src/platform/components/Button.tsx`
- **CSS:** `src/styles/components/button.css`
- **API Docs:** `docs/design-system/components/README.md` (TODO: vytvořit Button.md)
- **Log:** `docs/development/implementation-logs/2026-01-10-button-premium-design.md`

**Co je ukázkové:**
- ✅ 3 varianty (primary, secondary, ghost)
- ✅ 3 velikosti (sm, md, lg)
- ✅ Loading state
- ✅ Ripple effect (microinteraction)
- ✅ Gold theme + accessibility

### 2. Input Component
- **React:** `src/platform/components/Input.tsx`
- **CSS:** `src/styles/components/input.css`
- **Log:** `docs/development/implementation-logs/2026-01-10-input-premium-design.md`

**Co je ukázkové:**
- ✅ Floating label system
- ✅ Gold focus glow effect
- ✅ Password toggle s IconButton
- ✅ Helper text a error messages
- ✅ Accessibility (aria-invalid, aria-describedby)

### 3. Checkbox Component
- **React:** `src/platform/components/Checkbox.tsx`
- **CSS:** `src/styles/components/checkbox.css`
- **Log:** `docs/development/implementation-logs/2026-01-10-checkbox-premium-design.md`

**Co je ukázkové:**
- ✅ Soft-square design (6px radius)
- ✅ Custom SVG checkmark
- ✅ ReactNode label (pro odkazy v GDPR)
- ✅ 3 velikosti + error state

---

## 🎯 Design Philosophy Reminder

### 4 Temperaments (ALWAYS!)

Každá komponenta MUSÍ vyhovovat všem 4 typům:

#### 🎉 Sangvinik (Fun & Social)
- Smooth animations
- Gold highlights
- Playful microinteractions (hover bounce, ripple)

#### ⚡ Cholerik (Fast & Efficient)
- Velké klikací oblasti (větší padding)
- Fast transitions (0.2s)
- Jasný visual feedback

#### 📚 Melancholik (Detail & Quality)
- Premium design (16px border-radius, ne 4px)
- Detailed documentation (API, examples)
- High quality typography (font-weight: 600)

#### 🕊️ Flegmatik (Simple & Calm)
- Clean, minimal design
- Calm color palette (gray, white, gold)
- Minimal visual noise

---

## 💡 Pro Tips

### 1. **Start with Existing Component**
Zkopíruj existující komponentu (např. Button) a uprav ji místo psání od nuly.

### 2. **CSS Variables for Customization**
Vždy používej CSS variables na začátku souboru - umožní to snadnou customizaci.

### 3. **Mobile-First Approach**
Defaultní styly pro desktop, media queries pro mobile (`@media (max-width: 480px)`).

### 4. **Test in Real Browser**
Nejen v DevTools! Otevři localhost:5173 a proklikej všechny stavy.

### 5. **Screenshots in Logs**
Pokud je komponenta vizuální, přidej screenshots do implementation logu.

---

## 🔗 Related Documentation

- [Component Library Reference](../design-system/components/README.md)
- [Implementation Logs](./implementation-logs/README.md)
- [Design System Overview](../design-system/00_OVERVIEW.md)
- [4 Temperaments Philosophy](../../FOUNDATION/02_PHILOSOPHY_4_TEMPERAMENTS.md)
- [Design Standards](../../FOUNDATION/04_DESIGN_STANDARDS.md)

---

## 📞 Questions?

Pokud si nejsi jistý:

1. ✅ Přečti si tento guide znovu
2. ✅ Prostuduj existující komponenty (Button, Input, Checkbox)
3. ✅ Check implementation logs pro context
4. ✅ Ptej se uživatele (DechBar týmu) při nejasnostech

---

**Poslední aktualizace:** 2026-01-10  
**Maintainer:** DechBar Development Team  
**Version:** 1.0

---

**🎉 Hotovo! Teď máš vše pro vytváření world-class Platform komponent!** 🚀
