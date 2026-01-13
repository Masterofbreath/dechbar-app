# Study Guide: Data Display

**Pro agenty implementující:** tables, lists, grids, charts, progress bars, badges, stats

---

## 📚 CO SI NASTUDOVAT:

### **1. React Query** ⭐ KRITICKÉ
```
package.json → @tanstack/react-query (už nainstalováno!)

Data fetching pattern:
- useQuery() for fetching
- Loading states
- Error handling
- Caching
```

### **2. Supabase API**
```
src/platform/api/supabase.ts

Fetch data:
const { data, error } = await supabase
  .from('table_name')
  .select('*');
```

### **3. 4 Temperaments**
```
🎉 Sangvinik: Colorful charts, animations
⚡ Cholerik: Sortable tables, quick filters
📚 Melancholik: Detailed data, tooltips
🕊️ Flegmatik: Simple lists, clean layout
```

---

## ✅ TEMPLATE:

```markdown
📚 NASTUDOVAL:
- React Query (@tanstack/react-query)
- Supabase data fetching
- Loading/Error states

🎯 NÁVRH:
[Table/List/Chart] s [data source]
- Fetch via useQuery()
- Loading skeleton
- Error boundary

🏗️ PLÁN:
1. useQuery hook
2. Loading/Error states
3. Data display
4. 4 Temperaments
```

*Last updated: 2026-01-09*
