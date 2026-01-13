# Study Guide: Feedback Components

**Pro agenty implementující:** notifications, toasts, alerts, error messages, success messages

---

## 📚 CO SI NASTUDOVAT:

### **1. Toast Patterns**
- Auto-dismiss (3-5 sekund)
- Manual close (X button)
- Stack multiple toasts
- Z-index: 10000+ (nad modály)
- Position: top-right nebo bottom-center

### **2. Semantic Colors**
```
src/styles/design-tokens/colors.css

Success: green (#10b981)
Error: red (#ef4444)
Warning: yellow/orange (#f59e0b)
Info: blue (#3b82f6)
```

### **3. 4 Temperaments**
```
🎉 Sangvinik: Fun icons, slide-in animation
⚡ Cholerik: Quick (auto-dismiss 3s), dismissible
📚 Melancholik: Detailed message, action buttons
🕊️ Flegmatik: Soft colors, calm, no urgency
```

---

## 🎯 Toast Example:

```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  autoClose?: number; // ms
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, autoClose = 3000 }) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`toast ${colors[type]}`} style={{ zIndex: 10002 }}>
      <span>{message}</span>
      <button onClick={onClose}>✕</button>
    </div>
  );
};
```

---

## ✅ TEMPLATE:

```markdown
📚 NASTUDOVAL:
- Toast patterns (auto-dismiss, stack)
- Semantic colors (success/error/warning/info)
- Z-index (nad modály)

🎯 NÁVRH:
Toast notifikace s auto-dismiss
- Types: success, error, warning, info
- Auto-close: 3s
- Manual close (X button)
- Stack multiple

🏗️ PLÁN:
1. Toast component
2. Auto-dismiss timer
3. Z-index: 10002
4. Semantic colors
5. 4 Temperaments (timing, style)
```

*Last updated: 2026-01-09*
