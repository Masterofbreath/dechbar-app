# Agent Qualification Test - Bug Fix / Refactor

**Kdy použít:** Oprava bugu, refaktorování kódu, performance optimization

**Obtížnost:** 🟡 Střední

---

## 📋 OTÁZKY (5):

1. **ROOT CAUSE ANALYSIS:** Kde jsi našel dokumentaci k této části? Jaká je root cause?
2. **TESTING STRATEGY:** Jak otestuješ, že fix funguje? Jak zajistíš, že nic nerozbilo?
3. **BREAKING CHANGES:** Bude fix breaking change? Jak to zdokumentuješ?
4. **GIT WORKFLOW:** Je to hotfix (urgent) nebo běžná oprava? Jak to ovlivní workflow?
5. **CHANGELOG:** Jak zapíšeš změnu do CHANGELOG.md? (Fixed/Changed/Security?)

**Hledej odpovědi v:**
- Relevantní source code
- `WORKFLOW.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`

---

## ✅ TEMPLATE:

```markdown
📚 ODPOVĚDI:

1. ROOT CAUSE:
   - Dokumentace: [kde jsi četl]
   - Příčina: [co způsobilo bug]

2. TESTING:
   - Test plan: [jak otestuješ]
   - Regression test: [co zkontrolovat]

3. BREAKING CHANGES:
   - Ano/Ne: [...]
   - Dokumentace: [jak oznámit]

4. WORKFLOW:
   - Type: [hotfix/běžná oprava]
   - Branch: [test nebo hotfix/...]
   - Process: [LOCAL → PREVIEW → PROD nebo rychlý hotfix]

5. CHANGELOG:
   - Sekce: [Fixed/Changed/Security]
   - Zápis: [text do CHANGELOG]

🔧 FIX PLÁN:
[detailní popis co a jak opravíš...]
```

*Last updated: 2026-01-09*
