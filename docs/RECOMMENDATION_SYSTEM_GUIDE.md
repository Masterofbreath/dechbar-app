# 🎯 Track Recommendation System - Implementation Guide

## 📊 Přehled nových polí

### **1. `difficulty_level` - Obtížnost cvičení**
```typescript
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'extreme' | null;
```

**Mapování na User Level:**
- `easy` → Level 1-3 (začátečníci)
- `medium` → Level 4-6 (pokročilí)
- `hard` → Level 7-9 (experti)
- `extreme` → Level 10-12 (profíci)

**Použití:**
- Filtrování v knihovně: "Ukázat jen snadné"
- Progressive training: "Dokončil jsi všechny easy → zkus medium"
- AI doporučení: "Tvůj level je 5 → doporučuji medium breathworky"

---

### **2. `kp_suitability` - Vhodnost podle KP**
```typescript
type KPSuitability = 'pod-10s' | '11s-20s' | '20s-30s' | 'nad-30s' | null;
```

**KP (Kontrolní Pauza) ranges:**
- `pod-10s` → KP < 10s (nízké, začátečníci)
- `11s-20s` → KP 11-20s (průměrné)
- `20s-30s` → KP 20-30s (dobré, pokročilí)
- `nad-30s` → KP > 30s (výborné, experti)

**Použití:**
- **Po měření KP:** "Tvé KP je 15s → doporučuji tyto breathworky"
- **Progresivní trénink:** "Tvé KP rostlo z 12s na 22s → zkus náročnější"
- **Smart playlist:** Auto-select tracky podle aktuálního KP

---

### **3. `media_type` - Typ média**
```typescript
type MediaType = 'audio' | 'video';
```

**Rozdíly:**
- `audio` → Pouze zvuk, menší data, rychlejší načítání
- `video` → Vizuální instrukce, větší data

**Použití:**
- Mobilní data saver: "Ukázat jen audio"
- Začátečníci: "Doporuč video (vizuální instrukce)"
- Pokročilí: "Audio stačí"

---

## 🤖 AI Doporučovací Logika

### **Scénář 1: Po prvním přihlášení (nový user)**
```typescript
// User Level 1, KP neměřeno
const recommendedTracks = tracks.filter(t =>
  t.difficulty_level === 'easy' &&      // Snadné cvičení
  t.media_type === 'video' &&           // Vizuální instrukce
  t.mood_category === 'Ráno'            // Ranní start
);

message = "Vítej! Začni s těmito snadnými cvičeními se vizuální instrukcí.";
```

---

### **Scénář 2: Po měření KP**
```typescript
// User změřil KP = 12s
const userKP = 12;
const userLevel = 3;

// Doporuč podle KP + Level
const recommendedTracks = tracks.filter(t =>
  t.kp_suitability === 'pod-10s' ||     // Vhodné pro jeho KP
  t.kp_suitability === '11s-20s'
).filter(t =>
  t.difficulty_level === 'easy' ||       // Odpovídá jeho levelu
  t.difficulty_level === 'medium'
);

message = "Tvé KP je 12s. Zkus tyto breathworky pro zlepšení! 🎯";
```

---

### **Scénář 3: Progresivní trénink (KP roste)**
```typescript
// User měl KP 10s, teď 25s (pokrok!)
const oldKP = 10;
const newKP = 25;

if (newKP > 20 && oldKP < 20) {
  // Upgrade recommendation
  const nextLevelTracks = tracks.filter(t =>
    t.kp_suitability === '20s-30s' &&    // Nová úroveň
    t.difficulty_level === 'hard'         // Náročnější
  );
  
  message = "🔥 Tvé KP roste! Zkus náročnější breathwork pro další pokrok!";
  celebrate = true; // Trigger konfety animace
}
```

---

### **Scénář 4: Smart Morning Routine**
```typescript
// Ranní rutina podle user preferencí
const user = {
  level: 5,
  kp: 18,
  preferredStyle: 'Wim Hof',
  timeAvailable: 15 // minut
};

const morningPlaylist = tracks.filter(t =>
  t.mood_category === 'Ráno' &&
  t.kp_suitability === '11s-20s' &&      // Odpovídá jeho KP
  t.difficulty_level === 'medium' &&     // Odpovídá jeho levelu
  t.duration <= user.timeAvailable * 60 &&
  t.tags.includes('Wim Hof')             // Preferovaný styl
);

message = "☀️ Dobrý ráno! Připravil jsem ti ranní rutinu (15 min).";
```

---

### **Scénář 5: Objevování nových stylů**
```typescript
// User completion rate pro různé styly
const userHistory = {
  'Wim Hof': 90%, // Dokončuje často
  'Box Breathing': 30%, // Zkusil, ale nedokončuje
  '4-7-8': 0% // Nikdy nezkusil
};

// Doporuč nové styly s podobnou obtížností
const newStyles = tracks.filter(t =>
  t.difficulty_level === user.preferredDifficulty &&
  !t.tags.some(tag => user.triedStyles.includes(tag))
);

message = "🌟 Zkus něco nového! Tento styl by se ti mohl líbit.";
```

---

## 🔍 Filtrování v UI (pro admina i uživatele)

### **Admin: TrackTable Filters**
```tsx
<FilterBar>
  <Select name="difficulty">
    <option value="">Všechny obtížnosti</option>
    <option value="easy">Snadné</option>
    <option value="medium">Střední</option>
    <option value="hard">Náročné</option>
    <option value="extreme">Extrémní</option>
  </Select>
  
  <Select name="kp">
    <option value="">Všechna KP</option>
    <option value="pod-10s">Pod 10s</option>
    <option value="11s-20s">11-20s</option>
    <option value="20s-30s">20-30s</option>
    <option value="nad-30s">Nad 30s</option>
  </Select>
  
  <Select name="media_type">
    <option value="">Audio + Video</option>
    <option value="audio">Jen audio</option>
    <option value="video">Jen video</option>
  </Select>
</FilterBar>
```

### **User: Library Filters**
```tsx
<LibraryFilters>
  <Chip>Pro začátečníky</Chip> {/* difficulty=easy */}
  <Chip>Ranní rutina</Chip>     {/* mood=Ráno */}
  <Chip>Wim Hof</Chip>          {/* tags includes "Wim Hof" */}
  <Chip>Jen audio</Chip>        {/* media_type=audio */}
</LibraryFilters>
```

---

## 📈 Analytika (budoucnost)

### **Track Performance Metrics**
```sql
-- Nejpopulárnější obtížnost podle user level
SELECT 
  u.level,
  t.difficulty_level,
  COUNT(*) as play_count
FROM track_completions tc
JOIN tracks t ON t.id = tc.track_id
JOIN profiles u ON u.id = tc.user_id
GROUP BY u.level, t.difficulty_level
ORDER BY u.level, play_count DESC;

-- Nejlepší breathworky pro zlepšení KP
SELECT 
  t.title,
  t.kp_suitability,
  AVG(kp_after.value - kp_before.value) as avg_kp_improvement
FROM tracks t
JOIN track_completions tc ON tc.track_id = t.id
JOIN kp_measurements kp_before ON kp_before.user_id = tc.user_id 
  AND kp_before.measured_at < tc.completed_at
JOIN kp_measurements kp_after ON kp_after.user_id = tc.user_id 
  AND kp_after.measured_at > tc.completed_at
WHERE t.kp_suitability IS NOT NULL
GROUP BY t.id, t.title, t.kp_suitability
HAVING AVG(kp_after.value - kp_before.value) > 0
ORDER BY avg_kp_improvement DESC
LIMIT 10;
```

---

## 🎯 Use Cases

### **1. Onboarding Flow**
```
User registers → 
Measure KP (optional) → 
Show recommended easy tracks → 
Complete 3 tracks → 
Suggest medium difficulty
```

### **2. Daily Routine**
```
Morning: mood=Ráno + user's KP range + user's level
Midday: mood=Energie + short duration (3-9 min)
Evening: mood=Večer + relaxing styles
```

### **3. Progressive Training Plan**
```
Week 1-2: difficulty=easy, KP=pod-10s
Week 3-4: difficulty=easy, KP=11s-20s (if KP improved)
Week 5-8: difficulty=medium, KP=11s-20s
Week 9+: difficulty=hard/extreme (based on progress)
```

### **4. Challenge Recommendations**
```
User completed: "Ranní probuzení 21 dní" (difficulty=easy)
Recommend next: "Wim Hof výzva" (difficulty=medium)
Based on: KP improvement + completion rate + user level
```

---

## ✅ Implementation Checklist

- [x] DB migration created
- [x] TypeScript types updated
- [x] TrackForm UI updated (dropdowns)
- [x] TrackTable columns added (badges)
- [ ] Migrate DB in Supabase DEV
- [ ] Test in UI (create/edit track)
- [ ] Implement filtering in TrackTable
- [ ] Build AI recommendation engine (future)

---

**Status:** ✅ READY FOR MIGRATION  
**Next Step:** Spusť `MANUAL_MIGRATION_BATCH2_20260206.sql` v Supabase SQL Editor  
**Datum:** 2026-02-06  
**Verze:** 2.47.2
