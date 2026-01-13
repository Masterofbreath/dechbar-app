# Study Guide: Typography & Text

**Pro agenty implementující:** headings, paragraphs, labels, links, code blocks, quotes

---

## 📚 CO SI NASTUDOVAT:

### **1. Typography Scale** ⭐ KRITICKÉ
```
src/styles/design-tokens/typography.css

Font sizes:
--text-xs: 0.75rem (12px)
--text-sm: 0.875rem (14px)
--text-base: 1rem (16px)
--text-lg: 1.125rem (18px)
--text-xl: 1.25rem (20px)
--text-2xl: 1.5rem (24px)
--text-3xl: 1.875rem (30px)
--text-4xl: 2.25rem (36px)

Font weights:
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700

Line heights:
--leading-tight: 1.25
--leading-normal: 1.5
--leading-relaxed: 1.75
```

### **2. Responsive Typography**
```
docs/design-system/03_TYPOGRAPHY.md

Mobile: --text-base (16px min pro čitelnost)
Desktop: Může být větší

Headings scale responsively:
h1: text-2xl (mobile) → text-4xl (desktop)
h2: text-xl → text-3xl
h3: text-lg → text-2xl
```

### **3. Colors for Text**
```
Primary text: --color-black (#1a1a1a)
Secondary text: gray-600
Links: --color-gold (hover: darker)
```

### **4. 4 Temperaments**
```
🎉 Sangvinik: Bigger headings, playful quotes
⚡ Cholerik: Bold, clear, scannable
📚 Melancholik: Detailed, serif for long reads
🕊️ Flegmatik: Calm, relaxed line-height
```

---

## 🎯 Examples:

```typescript
// Heading component
export const Heading: React.FC<{ level: 1 | 2 | 3; children: React.ReactNode }> = ({ level, children }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizes = {
    1: 'text-2xl md:text-4xl font-bold',
    2: 'text-xl md:text-3xl font-semibold',
    3: 'text-lg md:text-2xl font-medium',
  };
  
  return <Tag className={sizes[level]}>{children}</Tag>;
};

// Paragraph
export const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <p className="text-base leading-relaxed text-gray-800">{children}</p>;
};

// Link
export const Link: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  return (
    <a href={href} className="text-gold hover:text-gold-dark underline">
      {children}
    </a>
  );
};
```

---

## ✅ TEMPLATE:

```markdown
📚 NASTUDOVAL:
- design-tokens/typography.css (scale, weights, line-heights)
- Responsive typography (mobile → desktop)
- Text colors

🎯 NÁVRH:
[Heading/Paragraph/Link] s responsive scale
- Typography tokens
- Mobile-first
- Accessible (contrast, line-height)

🏗️ PLÁN:
1. Component s typography tokens
2. Responsive sizes (mobile → desktop)
3. Color usage (text colors)
4. 4 Temperaments
```

*Last updated: 2026-01-09*
