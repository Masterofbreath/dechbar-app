# Agent Qualification Test - Feature Implementation

**Kdy použít:** Implementace nové funkce (Login, Dashboard, stránka)

**Obtížnost:** 🟡 Střední

---

## 📋 OTÁZKY (7):

### **1. GIT WORKFLOW**
Na jaký branch budeš commitovat? Co když bych řekl "pushni rovnou na main"?

**Hledej v:** `WORKFLOW.md`, `.cursorrules`

---

### **2. FILE STRUCTURE**
Kde vytvoříš nové soubory? Proč tam a ne jinde? Jakou naming convention použiješ?

**Hledej v:** `PROJECT_GUIDE.md`, `docs/architecture/01_PLATFORM.md`

---

### **3. DESIGN SYSTEM**
Jak zajistíš konzistentní design? Které design tokeny použiješ?

**Hledej v:** `src/styles/design-tokens/`, `docs/design-system/`

---

### **4. 4 TEMPERAMENTS**
Jak tvá implementace vyhoví VŠEM 4 temperamentům? (konkrétní příklady)

**Hledej v:** `docs/design-system/01_PHILOSOPHY.md`

---

### **5. TESTING**
Jak otestuješ funkci před pushem? Jaké viewport sizes?

**Hledej v:** `WORKFLOW.md`, `docs/design-system/05_BREAKPOINTS.md`

---

### **6. COMMIT MESSAGE**
Jak bude vypadat tvůj první commit message?

**Hledej v:** `CONTRIBUTING.md`

---

### **7. DEPENDENCIES**
Budeš potřebovat nové npm balíčky? Jak je nainstaluješ?

**Hledej v:** `package.json`, `docs/development/00_QUICK_START.md`

---

## ✅ TEMPLATE ODPOVĚDI:

```markdown
📚 ODPOVĚDI:

1. GIT: test branch, NIKDY main bez dotazu
2. FILES: src/[path], naming: [convention]
3. DESIGN: design-tokens/[colors/spacing/...]
4. 4 TEMPERAMENTS:
   - Sangvinik: [...]
   - Cholerik: [...]
   - Melancholik: [...]
   - Flegmatik: [...]
5. TESTING: [viewports, checklist]
6. COMMIT: "feat(scope): description"
7. DEPENDENCIES: [seznam nebo "žádné nové"]

🏗️ IMPLEMENTAČNÍ PLÁN:
[tvůj detailní plán...]
```

*Last updated: 2026-01-09*
