# Agent Qualification Test - UI Component

**Kdy použít:** Tvorba nové UI komponenty pro design system

**Obtížnost:** 🟡 Střední

---

## 📋 OTÁZKY (6):

1. **COMPONENT LOCATION:** Kde vytvoříš komponentu? (Platform nebo module-specific?)
2. **DESIGN TOKENS:** Které design tokeny použiješ? Kde jsou definované?
3. **VARIANTS & PROPS:** Jaké varianty? Jaké props? Type safety (TypeScript)?
4. **4 TEMPERAMENTS (COMPONENT LEVEL):** Jak komponenta vyhoví každému? (konkrétně!)
5. **ACCESSIBILITY:** Jak zajistíš accessibility? (ARIA, keyboard, focus)
6. **RESPONSIVE:** Je responsive? Jaké breakpoints?

**Hledej odpovědi v:**
- `src/styles/design-tokens/`
- `docs/design-system/`
- Study Guide pro daný typ komponenty

---

## ✅ TEMPLATE:

```markdown
📚 ODPOVĚDI:
1. Location: src/platform/components/[Name].tsx
2. Tokens: colors.css, spacing.css, typography.css, ...
3. Props: [interface definition]
4. 4 Temperaments:
   - Sangvinik: [animace, barvy]
   - Cholerik: [rychlost, efektivita]
   - Melancholik: [detaily, validace]
   - Flegmatik: [jednoduchost]
5. Accessibility: [ARIA, keyboard shortcuts]
6. Responsive: [320px, 480px, 768px, 1024px, 1440px]

🎨 API KOMPONENTY:
[props, variants, states...]
```

*Last updated: 2026-01-09*
