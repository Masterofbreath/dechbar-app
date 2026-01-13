# Study Guide: Navigation

**Pro agenty implementující:** menu, breadcrumbs, pagination, tabs, bottom bar, top bar

---

## 📚 CO SI NASTUDOVAT:

### **1. React Router** ⭐ KRITICKÉ
```
package.json → react-router-dom v7 (už nainstalováno!)

src/App.tsx - routing setup
- <Route>, <Link>, <Navigate>
- useNavigate() hook
- Protected routes
```

### **2. Z-Index for Navigation**
```
tailwind.config.js nebo design-tokens

Navigation layers:
--z-topnav: 1001
--z-bottomnav: 1000
```

### **3. Mobile Navigation** ⭐ KRITICKÉ
```
Bottom navigation (preferred for mobile):
- Fixed position bottom
- 3-5 items max
- Icons + labels
- Active state highlighting
- Min height: 56px (iOS safe area)
```

### **4. 4 Temperaments**
```
🎉 Sangvinik: Gold active state, icons
⚡ Cholerik: Quick access (max 5 items)
📚 Melancholik: Breadcrumbs, clear hierarchy
🕊️ Flegmatik: Simple menu, no clutter
```

---

## 🎯 Bottom Nav Example:

```typescript
const BottomNav = () => {
  const location = useLocation();
  
  const items = [
    { path: '/dashboard', icon: '🏠', label: 'Home' },
    { path: '/studio', icon: '🎵', label: 'Studio' },
    { path: '/profile', icon: '👤', label: 'Profil' },
  ];
  
  return (
    <nav className="bottom-nav" style={{ zIndex: 1000 }}>
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};
```

---

## ✅ TEMPLATE:

```markdown
📚 NASTUDOVAL:
- React Router v7 (routing, hooks)
- Z-index layers (navigation)
- Mobile patterns (bottom nav)

🎯 NÁVRH:
[Bottom/Top] Navigation s [počet] items
- React Router Link
- Active state (gold)
- Z-index: var(--z-[topnav/bottomnav])

🏗️ PLÁN:
1. Navigation component
2. React Router integration
3. Active state styling
4. Mobile-first (bottom nav)
5. 4 Temperaments
```

*Last updated: 2026-01-09*
