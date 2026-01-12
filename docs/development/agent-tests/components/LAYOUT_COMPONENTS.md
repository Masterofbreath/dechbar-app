# Study Guide: Layout Components

**Pro agenty implementující:** cards, modals, dialogs, drawers, sidebars, containers, panels, accordions

---

## 📚 CO SI NASTUDOVAT:

### **1. Design Tokens**
- `src/styles/design-tokens/effects.css` (glassmorphism)
- `src/styles/design-tokens/shadows.css` (z-index, shadows)
- `tailwind.config.js` (z-index layers)

### **2. Z-Index Layers** ⭐ KRITICKÉ
```
docs/design-system/02_COLORS.md nebo tailwind.config.js

z-index layers:
--z-bottomnav: 1000
--z-topnav: 1001
--z-sticky-player: 999
--z-modal-backdrop: 10000
--z-modal-content: 10001
--z-tooltip: 10002
```

### **3. Modal Patterns**
- Overlay (backdrop blur)
- Focus trap (accessibility)
- ESC key to close
- Click outside to close
- Scroll lock (body)

### **4. 4 Temperaments**
```
🎉 Sangvinik: Slide-in animation, gold accents
⚡ Cholerik: ESC closes, quick open/close
📚 Melancholik: Detailed content, scrollable
🕊️ Flegmatik: Soft backdrop, calm transitions
```

---

## 🎯 Modal Example:

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Scroll lock
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ zIndex: 10001 }}>
        {title && <h2>{title}</h2>}
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
```

---

## ✅ TEMPLATE ODPOVĚDI:

```markdown
📚 NASTUDOVAL:
- design-tokens/effects.css, shadows.css
- Z-index layers
- Modal patterns (focus trap, ESC, click outside)

🎯 NÁVRH:
[Modal/Card/Drawer] s glassmorphism
- Z-index: [správná layer]
- Backdrop blur
- ESC closes, click outside closes
- Scroll lock

🏗️ PLÁN:
1. [ComponentName].tsx v src/platform/components/
2. Props: isOpen, onClose, title, children
3. Glassmorphism + shadows
4. Focus trap + keyboard (ESC)
5. 4 Temperaments
6. Responsive

🎨 DESIGN:
- Backdrop: blur + dark overlay
- Content: glass-card
- Z-index: var(--z-modal-backdrop), var(--z-modal-content)

❓ OTÁZKY: [...]
```

*Last updated: 2026-01-09*
