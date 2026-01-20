# 🤖 Development Automation Guide

## 📋 Obsah
- [Přehled](#přehled)
- [Co je nastaveno](#co-je-nastaveno)
- [Jak to funguje](#jak-to-funguje)
- [Dostupné příkazy](#dostupné-příkazy)
- [Troubleshooting](#troubleshooting)
- [Pro AI agenty](#pro-ai-agenty)

---

## 🎯 Přehled

DechBar App má nastavenu **automatickou kontrolu kvality kódu**, která zabraňuje častým chybám:
- ❌ TypeScript errors na Vercelu
- ❌ Hardcoded `rgba()` hodnoty mimo design tokeny
- ❌ Nekonzistentní BEM naming conventions
- ❌ Formátovací chyby

**Výsledek:** Build na Vercelu projde napoprvé! ✅

---

## 🏗️ Co je nastaveno

### **1. Pre-commit Hooks (Husky)** 🪝

Před KAŽDÝM commitem se automaticky spustí:

```bash
git commit -m "feat: new feature"
  ↓
🔍 Running pre-commit checks...
  ↓
✅ TypeScript check... OK
✅ ESLint check... OK  
✅ Stylelint check... OK
  ↓
✅ Commit allowed!
```

**Pokud najde chybu:**

```bash
git commit -m "feat: new feature"
  ↓
🔍 Running pre-commit checks...
  ↓
❌ TypeScript error found!
❌ Commit blocked!
  ↓
Fix the error → Try commit again
```

### **2. Stylelint - Design Token Enforcement** 🎨

**Zakázáno:**
```css
.my-class {
  background: rgba(44, 190, 198, 0.15);  /* ❌ Error! */
}
```

**Povoleno:**
```css
.my-class {
  background: var(--glow-primary-shadow-subtle);  /* ✅ OK! */
}
```

**Výjimky:**
- `design-tokens/colors.css` - Může obsahovat `rgba()` (tam se definují tokeny)
- `_mobile.css` - Může obsahovat `!important` (pro overrides)

### **3. Lint-staged - Rychlé kontroly** ⚡

Kontroluje **pouze soubory, které committuješ** (ne celý projekt).

**Před:**
- Kontrola celého projektu = 30 sekund ⏰

**Po:**
- Kontrola 3 změněných souborů = 2 sekundy ⚡

### **4. BEM Naming Convention** 📝

**Zakázáno:**
```css
.MyClass { }           /* ❌ PascalCase */
.my_class { }          /* ❌ Snake case */
.myClass { }           /* ❌ CamelCase */
```

**Povoleno:**
```css
.my-class { }                        /* ✅ Block */
.my-class__element { }               /* ✅ Element */
.my-class__element--modifier { }     /* ✅ Modifier */
```

---

## ⚙️ Jak to funguje

### **Workflow:**

```
┌─────────────────────────────────────────────────────────────┐
│  1. Developer / AI Agent                                    │
│     ↓                                                        │
│  2. git add .                                               │
│     ↓                                                        │
│  3. git commit -m "message"                                 │
│     ↓                                                        │
│  4. 🪝 Pre-commit hook (Husky)                              │
│     ├── lint-staged (checks only staged files)             │
│     ├── TypeScript check (tsc --noEmit)                     │
│     ├── ESLint (with auto-fix)                             │
│     └── Stylelint (with auto-fix)                          │
│     ↓                                                        │
│  5. ✅ All OK → Commit created                              │
│     OR                                                       │
│     ❌ Error → Commit blocked, fix required                 │
│     ↓                                                        │
│  6. git push origin dev                                     │
│     ↓                                                        │
│  7. Vercel Build (always succeeds! ✅)                       │
└─────────────────────────────────────────────────────────────┘
```

### **Proč to funguje:**

1. **TypeScript check** - Zachytí všechny type errors PŘED pushem
2. **ESLint** - Opraví běžné chyby automaticky
3. **Stylelint** - Vynutí použití design tokenů
4. **Lint-staged** - Rychlé = používáš to častěji = méně bugů

---

## 📚 Dostupné příkazy

### **Běžné použití:**

```bash
# Auto-fix všech problémů (doporučeno před commitem)
npm run lint:fix

# Zkontrolovat TypeScript typy
npm run type-check

# Zkontrolovat CSS
npm run lint:css
```

### **Pro debugging:**

```bash
# Pouze ESLint check (bez opravy)
npm run lint

# Pouze Stylelint check (bez opravy)
npm run lint:css

# TypeScript check s verbose output
npx tsc --noEmit
```

### **Pro bypass (NEDOPORUČENO):**

```bash
# Přeskočit pre-commit hooks (POUZE v extrémních případech!)
git commit --no-verify -m "emergency fix"
```

⚠️ **POZOR:** `--no-verify` obchází všechny kontroly! Použij jen v emergency.

---

## 🧪 Testování

### **Test 1: TypeScript Error Detection**

```bash
# 1. Vytvoř záměrnou chybu
echo "const x: number = 'string';" >> src/test.ts

# 2. Pokus se commitnout
git add .
git commit -m "test"

# 3. Očekávaný výstup:
❌ TypeScript error detected!
❌ Commit blocked!
```

### **Test 2: CSS Token Enforcement**

```bash
# 1. Vytvoř hardcoded rgba()
echo ".test { background: rgba(0,0,0,0.5); }" >> src/test.css

# 2. Pokus se commitnout
git add .
git commit -m "test"

# 3. Očekávaný výstup:
❌ Use CSS tokens instead of hardcoded rgba()
❌ Commit blocked!
```

### **Test 3: Auto-fix**

```bash
# 1. Vytvoř chybu, kterou lze auto-fixnout
echo "const unused = 123" >> src/test.ts

# 2. Spusť auto-fix
npm run lint:fix

# 3. Chyba je automaticky opravena ✅
```

---

## 🐛 Troubleshooting

### **Problém: "Husky not found"**

```bash
# Řešení:
npm install
npx husky install
```

### **Problém: "Pre-commit hook doesn't run"**

```bash
# Řešení:
chmod +x .husky/pre-commit
git config core.hooksPath .husky
```

### **Problém: "Stylelint fails on colors.css"**

```bash
# Toto je OK! colors.css MŮŽE obsahovat rgba()
# Je to výjimka v stylelint.config.js
```

### **Problém: "Commit takes too long"**

```bash
# lint-staged by měl být rychlý (2-5 sec)
# Pokud trvá >30 sec, zkontroluj:
cat package.json | grep lint-staged

# Mělo by kontrolovat POUZE staged files, ne celý projekt
```

### **Problém: "Can't commit at all"**

```bash
# Emergency bypass (POUZE když je nutné pushnout urgentně):
git commit --no-verify -m "emergency fix"

# Pak MUSÍŠ opravit problémy a commitnout fix:
npm run lint:fix
git commit -m "fix: resolve linting issues"
```

---

## 🤖 Pro AI agenty

### **Když děláš novou feature:**

```bash
# 1. Před commitem VŽDY spusť:
npm run lint:fix

# 2. Zkontroluj TypeScript:
npm run type-check

# 3. Pokud vše OK, commitni:
git add .
git commit -m "feat: description"

# 4. Pre-commit hook ti dá final check
#    Pokud projde → push
#    Pokud ne → oprav a zkus znovu
```

### **Když přidáváš nové CSS:**

**✅ SPRÁVNĚ:**
```css
.session-engine__header {
  background: var(--glow-primary-shadow-subtle);
  box-shadow: 0 4px 12px var(--overlay-black-medium);
}
```

**❌ ŠPATNĚ:**
```css
.sessionEngineHeader {  /* ❌ Není BEM */
  background: rgba(44, 190, 198, 0.15);  /* ❌ Hardcoded */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);  /* ❌ Hardcoded */
}
```

### **Když najdeš chybu:**

```bash
# Stylelint error?
# → Přečti si design-tokens/colors.css
# → Najdi správný token
# → Použij var(--token-name)

# TypeScript error?
# → Přečti si error message
# → Oprav type
# → Zkontroluj: npm run type-check

# ESLint error?
# → Většinu opraví: npm run lint:fix
# → Pokud ne, přečti error message
```

---

## 📊 Metriky úspěchu

**Cíle:**
- ✅ 95%+ commitů projde napoprvé
- ✅ 0 failed Vercel builds kvůli TypeScript
- ✅ 0 hardcoded rgba() hodnot v produkci
- ✅ Konzistentní BEM naming napříč projektem

**Měření:**
```bash
# Počet commitů za měsíc
git log --since="1 month ago" --oneline | wc -l

# Počet failed builds na Vercelu
# (kontroluj Vercel dashboard)

# Počet hardcoded rgba() v projektu
grep -r "rgba(" src --include="*.css" | wc -l
# (mělo by být 0, kromě colors.css)
```

---

## 🔄 Aktualizace

Tento systém je **self-updating**:
- `npm install` automaticky nainstaluje nové dependencies
- `npm run prepare` automaticky nastaví Husky hooks
- Žádná manuální konfigurace potřeba!

**Při aktualizaci projektu:**
```bash
git pull origin dev
npm install  # ← Automaticky nastaví hooks
```

---

## 📞 Kontakt

**Problémy s automatizací?**
- Zkontroluj: `scripts/setup-dev-automation.sh`
- Spusť znovu setup: `./scripts/setup-dev-automation.sh`
- Přečti: `stylelint.config.js` pro CSS pravidla

**Dokumentace:**
- ESLint: `eslint.config.js`
- Stylelint: `stylelint.config.js`
- Husky: `.husky/` folder
- Lint-staged: `package.json` → `lint-staged` sekce

---

**Poslední aktualizace:** 2026-01-20  
**Verze:** 0.2.1  
**Status:** ✅ Active
