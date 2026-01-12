# Agent Qualification Test - Module Creation

**Kdy použít:** Tvorba nového standalone modulu (Studio, Challenges, atd.)

**Obtížnost:** 🔴 Pokročilé

---

## 📋 OTÁZKY (8):

1. **MODULE ARCHITECTURE:** Co je rozdíl mezi "Platform" a "Module"? Kde vytvoříš modul?
2. **MODULE MANIFEST:** Co je MODULE_MANIFEST.json? Jaké info musí obsahovat?
3. **LAZY LOADING:** Jak bude modul načítán? Proč lazy loading?
4. **DATABASE SCHEMA:** Potřebuješ nové DB tabulky? Jak je pojmenuješ? (prefix!)
5. **MODULE PRICING:** Kde se ukládá cena modulu? (POZOR: kód nebo DB?)
6. **PLATFORM API:** Které Platform services použiješ? (useAuth, useMembership?)
7. **MODULE INDEPENDENCE:** Jak zajistíš, že modul funguje i když jsou jiné vypnuté?
8. **4 TEMPERAMENTS (MODULE LEVEL):** Jak celý modul vyhoví všem 4? (features pro každý typ)

**Hledej odpovědi v:**
- `PROJECT_GUIDE.md`
- `docs/architecture/02_MODULES.md`
- `src/modules/README.md`
- `docs/architecture/03_DATABASE.md`

---

## ✅ TEMPLATE:

```markdown
📚 ODPOVĚDI:
1. Platform vs Module: [...]
2. MODULE_MANIFEST: [struktura JSON]
3. Lazy loading: [vysvětlení]
4. DB tables: [prefix]_[table_name]
5. Pricing: V DATABASE (modules table)! ⭐
6. Platform API: [useAuth, useMembership, useModules]
7. Independence: [izolace, API komunikace]
8. 4 Temperaments: [features pro každý typ]

🏗️ ARCHITEKTONICKÝ PLÁN:
[detailní design...]
```

*Last updated: 2026-01-09*
