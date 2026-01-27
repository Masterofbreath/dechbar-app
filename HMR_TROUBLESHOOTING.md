# 🔥 HMR Troubleshooting Guide

## 🎯 **Optimalizováno pro DechBar Development**

Tento projekt má optimalizovaný Vite config pro stabilní Hot Module Replacement (HMR).

---

## ⚡ **Během Developmentu:**

### **1. Disable Browser Cache (DŮLEŽITÉ!)**

**Chrome DevTools:**
1. Otevři DevTools: `F12` nebo `Cmd+Option+I` (Mac)
2. Přejdi na **Network** tab
3. Zaškrtni **"Disable cache"**
4. **Nech DevTools otevřené** během celého developmentu

**Proč:** Eliminuje 90% HMR problémů.

---

## 🚀 **Development Scripts:**

### **Normální start:**
```bash
npm run dev
```
Použij pro běžný development. HMR by měl fungovat spolehlivě díky optimalizacím v `vite.config.ts`.

### **Start s čistou cache:**
```bash
npm run dev:clean
```
Použij když:
- HMR nefunguje (změny se nepropagují)
- CSS updates se nezobrazují
- Vidíš divné chování (staré + nové změny mix)

**Doporučení:** Používej `dev:clean` 1x denně na začátku dne.

### **Full refresh (nuclear option):**
```bash
npm run dev:fresh
```
Použij jen když:
- `dev:clean` nepomohl
- Vidíš dependency errors
- Po `npm install` nových packages

---

## 🛠️ **Když HMR Nefunguje (řešení v pořadí):**

### **1. Soft Refresh (90% případů):**
```
Browser: Cmd+R (Mac) / Ctrl+R (Windows)
```

### **2. Hard Refresh (95% případů):**
```
Browser: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

### **3. Restart s čistou cache (99% případů):**
```bash
Ctrl+C  # Zastav server
npm run dev:clean  # Start s čistou cache
```

### **4. Full reinstall (100% vyřeší):**
```bash
Ctrl+C  # Zastav server
npm run dev:fresh  # Full reinstall + start
```

---

## 🔍 **Monitoruj Vite Output:**

Po každé změně souboru by měl terminal ukázat:
```
[vite] hmr update /src/modules/public-web/styles/challenge.css
```

**Pokud tohle nevidíš** = Vite změnu nezaregistroval → použij `dev:clean`.

---

## ✅ **Optimalizace v Projektu:**

### **`vite.config.ts` obsahuje:**
- ✅ HMR overlay (error display)
- ✅ File watching optimalizace (macOS)
- ✅ Explicitní cache directory
- ✅ Pre-bundled dependencies (React, React DOM, React Router)

### **Helper scripts:**
- ✅ `dev:clean` - Clear cache + start
- ✅ `dev:fresh` - Full reinstall + start

---

## 💡 **Best Practices:**

1. **Vždy měj otevřené DevTools s "Disable cache"**
2. **Sleduj terminal output** (měl bys vidět HMR updates)
3. **Používej `dev:clean` na začátku dne** (preventivní cache clear)
4. **Po změně `vite.config.ts` vždy restartuj server**
5. **Pokud HMR selže 2x po sobě** → `dev:clean`

---

## 🚨 **Časté Problémy:**

### **CSS změny se nepropagují:**
```bash
# Hard reload v browseru
Cmd+Shift+R

# Nebo restart
npm run dev:clean
```

### **React component updates nefungují:**
- Zkontroluj, že exportuješ jen React komponenty z `.tsx`
- Fast Refresh bail-out pokud exportuješ non-components

### **Config changes se neprojeví:**
```bash
# Po změně vite.config.ts VŽDY restartuj
Ctrl+C
npm run dev
```

---

## 📊 **Expected Behavior:**

**✅ Správně fungující HMR:**
- CSS změny: Instant update (bez reload)
- React komponenty: Instant update (preserve state)
- Config soubory: Vyžaduje manuální restart

**❌ Známky problému:**
- Změny se neprojeví vůbec
- Mix starých + nových změn
- Terminal neukazuje `[vite] hmr update`
- Browser console errors o HMR

---

## 🎯 **TL;DR (Quick Reference):**

```bash
# Běžný development
npm run dev + DevTools "Disable cache"

# Když HMR nefunguje
1. Cmd+Shift+R (hard reload)
2. npm run dev:clean
3. npm run dev:fresh (last resort)
```

---

**Happy coding! 🚀**

*Last updated: 2026-01-26*
