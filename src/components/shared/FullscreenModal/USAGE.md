# FullscreenModal - Usage Guide

## 📋 Varianty modalu

FullscreenModal podporuje 2 varianty pomocí modifier classes:

### **1. Default (Breathing Exercises)**
- Centered content
- Fixed dimensions (480px max-width)
- No scrolling (content is centered vertically)

```tsx
<FullscreenModal isOpen={true} onClose={handleClose}>
  <FullscreenModal.TopBar>
    <FullscreenModal.Title>Dechové cvičení</FullscreenModal.Title>
    <FullscreenModal.CloseButton onClick={handleClose} />
  </FullscreenModal.TopBar>
  
  <FullscreenModal.ContentZone>
    {/* Centered content (breathing circle, countdown, etc.) */}
  </FullscreenModal.ContentZone>
  
  <FullscreenModal.BottomBar>
    {/* Progress bar */}
  </FullscreenModal.BottomBar>
</FullscreenModal>
```

---

### **2. Form Variant (Admin Forms)**
- Top-aligned scrollable content
- Wider modal (720px max-width)
- Sticky TopBar + BottomBar
- Scrollable ContentZone

```tsx
<FullscreenModal 
  isOpen={true} 
  onClose={handleClose}
  className="fullscreen-modal--form fullscreen-modal--wide"
>
  <FullscreenModal.TopBar>
    <FullscreenModal.Title>Upravit track</FullscreenModal.Title>
    <FullscreenModal.CloseButton onClick={handleClose} />
  </FullscreenModal.TopBar>
  
  <FullscreenModal.ContentZone>
    <form className="my-form">
      {/* Scrollable form fields */}
    </form>
  </FullscreenModal.ContentZone>
  
  <FullscreenModal.BottomBar>
    <button type="submit">Uložit</button>
  </FullscreenModal.BottomBar>
</FullscreenModal>
```

---

## 🎨 Modifier Classes

### **`.fullscreen-modal--form`**
Změny:
- ✅ `justify-content: flex-start` (top alignment)
- ✅ `align-items: stretch` (full width)
- ✅ `overflow-y: auto` (scrollable)
- ✅ `padding: 0` (form si řídí vlastní padding)
- ✅ Smooth scrolling (iOS touch scrolling)

### **`.fullscreen-modal--wide`**
Změny:
- ✅ `max-width: 720px` (wider modal)
- ✅ `max-width: 100%` (mobile fullscreen)

---

## 📐 Layout Chování

### **TopBar (Fixed)**
```
┌────────────────────────┐
│  Title        [X]      │ ← 70px (60px mobile)
│  flex-shrink: 0        │
└────────────────────────┘
```

### **ContentZone (Scrollable)**
```
┌────────────────────────┐
│                        │
│  overflow-y: auto      │ ← flex: 1
│  (scrollable content)  │
│                        │
└────────────────────────┘
```

### **BottomBar (Fixed)**
```
┌────────────────────────┐
│  [Submit Button]       │ ← 70px (60px mobile)
│  flex-shrink: 0        │
└────────────────────────┘
```

---

## 🔧 Responsive Breakpoints

- **Mobile (<768px):** Single column grid, fullscreen modal
- **Desktop (≥768px):** 2 column grid (form layouts), centered modal

---

## ✅ Best Practices

1. **Vždy používej modifiers pro formuláře:**
   ```tsx
   className="fullscreen-modal--form fullscreen-modal--wide"
   ```

2. **Form padding nastavuje form, ne ContentZone:**
   ```css
   .my-form {
     padding: 1.5rem; /* Desktop */
   }
   ```

3. **Grid layout pro responsive formy:**
   ```css
   .my-form {
     grid-template-columns: 1fr; /* Mobile */
   }
   
   @media (min-width: 768px) {
     .my-form {
       grid-template-columns: 1fr 1fr; /* Desktop */
     }
   }
   ```

4. **Submit button jde vždy do BottomBar:**
   ```tsx
   <FullscreenModal.BottomBar>
     <button type="submit">Uložit</button>
   </FullscreenModal.BottomBar>
   ```

---

## 📦 Příklady použití

### **TrackForm**
```tsx
<FullscreenModal 
  className="fullscreen-modal--form fullscreen-modal--wide"
>
  {/* See: TrackForm.tsx */}
</FullscreenModal>
```

### **AlbumForm**
```tsx
<FullscreenModal 
  className="fullscreen-modal--form fullscreen-modal--wide"
>
  {/* See: AlbumForm.tsx */}
</FullscreenModal>
```

### **Breathing Exercise**
```tsx
<FullscreenModal>
  {/* Default styling (no modifiers needed) */}
</FullscreenModal>
```

---

## 🎯 Škálovatelnost

Tento systém je navržen pro **dlouhodobou škálovatelnost**:

- ✅ **Reusable:** Stejné modifiers pro všechny admin formuláře
- ✅ **Non-breaking:** Default chování zůstává nezměněné
- ✅ **DRY:** Žádná duplikace CSS
- ✅ **Mobile-first:** Responsive design built-in
- ✅ **Apple premium:** Smooth scrolling, sticky bars, čistý layout

---

**Autor:** AI Agent  
**Datum:** 2026-02-06  
**Verze:** 2.47.1
