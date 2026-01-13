# Study Guide: Animations & Effects

**Pro agenty implementující:** transitions, hover effects, loading spinners, skeletons, fade/slide animations

---

## 📚 CO SI NASTUDOVAT:

### **1. Spring Animations** ⭐ KRITICKÉ
```
src/styles/design-tokens/effects.css

CSS variables:
--spring-bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55)
--apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1)

Usage:
transition: transform 0.3s var(--spring-bounce);
```

### **2. Loading States**
- Skeleton screens (placeholder)
- Spinners
- Progress bars
- Shimmer effect

### **3. 4 Temperaments**
```
🎉 Sangvinik: Bounce animations, playful
⚡ Cholerik: Fast (0.15s), no delay
📚 Melancholik: Smooth (0.3s), elegant
🕊️ Flegmatik: Subtle (0.5s), calm
```

---

## 🎯 Example:

```css
/* Spring bounce button */
.btn {
  transition: transform 0.2s var(--spring-bounce);
}

.btn:active {
  transform: scale(0.95);
}

/* Skeleton loading */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## ✅ TEMPLATE:

```markdown
📚 NASTUDOVAL:
- design-tokens/effects.css (spring animations)
- Loading patterns (skeleton, spinner)

🎯 NÁVRH:
[Animation type] s [duration] a [easing]
- Spring bounce nebo Apple ease
- 4 Temperaments timing

🏗️ PLÁN:
1. CSS transitions/animations
2. Design tokens usage
3. 4 Temperaments (timing differences)
```

*Last updated: 2026-01-09*
