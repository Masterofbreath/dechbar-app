# Study Guide: UI Components

**Pro agenty implementující:** buttons, inputs, forms, checkboxes, toggles, sliders, dropdowns

---

## 📚 CO SI NASTUDOVAT (v tomto pořadí):

### **1. Design Tokens** ⭐ KRITICKÉ

```
src/styles/design-tokens/
├── colors.css        (button colors, input borders)
├── spacing.css       (padding, margins pro inputs)
├── typography.css    (font sizes, weights)
├── shadows.css       (focus states, hover effects)
└── effects.css       (glassmorphism pro inputs)
```

**Klíčové CSS variables:**
```css
--color-gold          (primary buttons)
--color-black         (text)
--color-white         (backgrounds)
--spacing-xs až --spacing-xl
--shadow-sm, --shadow-md (focus states)
```

---

### **2. Form Patterns**

```
docs/design-system/06_COMPONENTS.md
└── Sekce: "Forms & Inputs"
```

**Klíčové koncepty:**
- Validation states (error, success, warning)
- Required fields indicator
- Helper text
- Disabled states
- Loading states

---

### **3. Accessibility** ⭐ KRITICKÉ

```
docs/design-system/06_COMPONENTS.md
└── Sekce: "Accessibility"
```

**Povinné:**
- ARIA labels (`aria-label`, `aria-describedby`)
- Keyboard navigation (Tab, Enter, Space)
- Focus states (visible outline)
- Screen reader support
- Error announcements

---

### **4. TypeScript Types**

```
src/platform/types/
```

**Props definice:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

---

### **5. 4 Temperaments for UI** ⭐ KRITICKÉ

```
docs/design-system/01_PHILOSOPHY.md
```

**Jak UI prvky vyhoví všem 4:**

```
🎉 SANGVINIK (Fun & Playful):
   - Animace při hover (spring bounce)
   - Gold barvy (--color-gold)
   - Vizuální feedback (ripple effect)
   
⚡ CHOLERIK (Fast & Efficient):
   - Keyboard shortcuts (Enter submits)
   - Rychlá odezva (instant feedback)
   - Clear labels (no ambiguity)
   
📚 MELANCHOLIK (Detailed & Quality):
   - Validation messages (error details)
   - Helper text (tooltips)
   - Clear states (disabled, loading)
   
🕊️ FLEGMATIK (Simple & Calm):
   - Clean design (no clutter)
   - Soft colors (grays)
   - Optional fields (no pressure)
```

---

### **6. Responsive Design**

```
docs/design-system/05_BREAKPOINTS.md
```

**Breakpoints:**
```css
320px  (xs) - Mobil narrow
480px  (sm) - Mobil
768px  (md) - Tablet
1024px (lg) - Desktop
1440px (xl) - Wide
```

**Touch-friendly:**
- Min height: 44px (Apple guideline)
- Min width: 44px pro buttons
- Dostatečný padding

---

## 🎯 KLÍČOVÉ KONCEPTY:

### **Button Component Example:**

```typescript
// src/platform/components/Button.tsx

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  children,
}) => {
  const baseClasses = 'btn'; // Uses Tailwind + design tokens
  const variantClasses = {
    primary: 'bg-gold text-black hover:bg-gold-dark',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300',
    ghost: 'bg-transparent text-black hover:bg-gray-100',
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};
```

---

### **Input Component Example:**

```typescript
// src/platform/components/Input.tsx

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  label,
  error,
  required = false,
  disabled = false,
  value,
  onChange,
}) => {
  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? 'error-message' : undefined}
        className={`input ${error ? 'input--error' : ''}`}
      />
      {error && (
        <span id="error-message" className="input-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
```

---

## 📋 CHECKLIST PŘED IMPLEMENTACÍ:

- [ ] Četl jsem design tokens (colors, spacing, typography, shadows)
- [ ] Rozumím 4 temperamentům pro UI prvky
- [ ] Vím, jak implementovat accessibility (ARIA, keyboard)
- [ ] Rozumím validation states (error, success)
- [ ] Vím, kde vytvořím komponentu (src/platform/components/)
- [ ] Rozumím responsive breakpoints (5 velikostí)
- [ ] Vím, jak testovat (všechny viewports)
- [ ] TypeScript typy jsou jasné

---

## ✅ TEMPLATE ODPOVĚDI (zkopíruj a vyplň):

```markdown
📚 CO JSEM NASTUDOVAL:
- src/styles/design-tokens/ (colors, spacing, typography, shadows)
- docs/design-system/06_COMPONENTS.md (Form patterns)
- docs/design-system/01_PHILOSOPHY.md (4 Temperaments)
- docs/design-system/05_BREAKPOINTS.md (Responsive)

🎯 MŮJ NÁVRH:
[Popište, jak komponenta bude vypadat a fungovat]

Varianta: [primary/secondary/ghost]
Props: [seznam props s typy]
States: [disabled, loading, error, atd.]

🏗️ IMPLEMENTAČNÍ PLÁN:
1. Vytvoření [Název].tsx v src/platform/components/
2. TypeScript interface pro props
3. Implementace základní UI s Tailwind
4. Přidání accessibility (ARIA, keyboard)
5. Implementace 4 temperamentů:
   - 🎉 Sangvinik: [animace, barvy]
   - ⚡ Cholerik: [keyboard shortcuts, rychlost]
   - 📚 Melancholik: [validace, tooltips]
   - 🕊️ Flegmatik: [jednoduchost, klid]
6. Responsive testing (5 breakpoints)
7. Update src/platform/components/index.ts

📝 SOUBORY, KTERÉ VYTVOŘÍM:
- src/platform/components/[Název].tsx
- Update src/platform/components/index.ts

📱 RESPONSIVE PLAN:
- 320px: [mobile narrow design]
- 480px: [mobile design]
- 768px: [tablet design]
- 1024px+: [desktop design]

♿ ACCESSIBILITY:
- ARIA labels: [které použiju]
- Keyboard navigation: [Tab, Enter, Space]
- Focus states: [visible outline]
- Screen reader: [announcements]

❓ OTÁZKY:
[Tvé dotazy, pokud něco není jasné]
```

---

**Až toto napíšeš → čekej na schválení uživatele!**

**NIKDY nezačínej implementovat bez schválení plánu!**

---

*Last updated: 2026-01-09*
