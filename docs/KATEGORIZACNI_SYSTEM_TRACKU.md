# 🎯 Kompletní kategorizační systém tracků (9 polí)

**Verze:** 2.48.0  
**Datum:** 2026-02-06  
**Status:** ✅ Implementováno

---

## 📋 Přehled systému

DechBar používá **9-polový kategorizační systém** pro tracky, který umožňuje:
- 🎯 Precizní filtrování podle potřeb uživatele
- 🤖 AI doporučení na míru (podle KP, nálady, zkušenosti)
- 📊 Datovou analytiku (nejoblíbenější typy cvičení, trendy)
- 🔍 Flexibilní vyhledávání (kombinace kritérií)

---

## 🧩 Struktura 9 kategorií

### 1️⃣ **duration_category** (Kategorie délky)
**Typ:** `'3-9' | '10-25' | '26-60' | 'kurz' | 'reels' | null`  
**Účel:** Rychlé filtrování podle času, který má uživatel k dispozici  
**Příklady:**
- `'3-9'` → Ranní rychlá probuzovka (5 min)
- `'10-25'` → Oběd break (15 min)
- `'26-60'` → Večerní meditace (45 min)
- `'kurz'` → Dlouhý vzdělávací obsah (90+ min)
- `'reels'` → Instagram/TikTok snippety (<1 min)

---

### 2️⃣ **mood_category** (Nálada / Denní doba)
**Typ:** `'Ráno' | 'Energie' | 'Klid' | 'Soustředění' | 'Večer' | 'Special' | null`  
**Účel:** Doporučení podle nálady nebo denní doby  
**Příklady:**
- `'Ráno'` → Funkční probuzení (6:00)
- `'Energie'` → Před prezentací (14:00)
- `'Klid'` → Po stresujícím dni (18:00)
- `'Soustředění'` → Před deep work (9:00)
- `'Večer'` → Před spaním (22:00)
- `'Special'` → Wim Hof Ice Bath Protocol

---

### 3️⃣ **difficulty_level** (Technická obtížnost)
**Typ:** `'easy' | 'medium' | 'hard' | 'extreme' | null`  
**Účel:** Bezpečné doporučení podle zkušenosti uživatele  
**Příklady:**
- `'easy'` → Začátečníci (koherentní dýchání 6:6)
- `'medium'` → Pokročilí (4-7-8 technika)
- `'hard'` → Experti (Tummo breathwork)
- `'extreme'` → Profíci (60min Holotropic Breathwork)

**⚠️ Důležité:** Extreme cviky vyžadují:
- Zkušenost 6+ měsíců
- Lékařské potvrzení
- Supervision

---

### 4️⃣ **kp_suitability** (Vhodnost podle KP)
**Typ:** `'pod-10s' | '11s-20s' | '20s-30s' | 'nad-30s' | null`  
**Účel:** AI doporučení po měření Kontrolního Pozdravu  
**Logika:**
```
Pokud uživatel má KP 8s:
→ Doporuč tracky s kp_suitability='pod-10s'
→ Cíl: Postupně zvyšovat KP na 10s+

Pokud uživatel má KP 25s:
→ Doporuč tracky s kp_suitability='20s-30s'
→ Cíl: Udržovat pokročilou úroveň
```

**Příklady:**
- `'pod-10s'` → Základní koherentní dýchání (začátečníci)
- `'11s-20s'` → Střední pokročilost (průměrný uživatel)
- `'20s-30s'` → Vysoká pokročilost (experti)
- `'nad-30s'` → Profesionální úroveň (trenéři, instruktoři)

---

### 5️⃣ **media_type** (Typ média)
**Typ:** `'audio' | 'video'`  
**Účel:** Filtrace podle dostupnosti zařízení  
**Příklady:**
- `'audio'` → Dechpresso při chůzi (poslouchat na sluchátkách)
- `'video'` → Jóga + dýchání (sledovat na tabletu)

**Use case:**
- Uživatel v autě → `media_type='audio'`
- Uživatel doma na podložce → `media_type='video'` nebo `'audio'`

---

### 6️⃣ **exercise_format** (Typ cvičení) ⭐️ **NOVÉ**
**Typ:** `'dechpresso' | 'meditace' | 'breathwork' | null`  
**Účel:** Hlavní kategorizace produktů DechBar  
**Definice:**

| Typ | Délka | Intenzita | Účel |
|-----|-------|-----------|------|
| **Dechpresso** | 3-15 min | Vysoká/Extrémní | Rychlé vzpružení, energie |
| **Meditace** | 15-30 min | Jemná/Střední | Klid, soustředění, relaxace |
| **Breathwork** | 30-90 min | Střední/Vysoká | Transformace, uvolnění emocí |

**Příklady:**
- `'dechpresso'` → 5min Wim Hof před ranní sprchou
- `'meditace'` → 20min funkční dýchání + mindfulness
- `'breathwork'` → 60min Holotropic Breathwork (s instruktorem)

---

### 7️⃣ **intensity_level** (Fyzická intenzita) ⭐️ **NOVÉ**
**Typ:** `'jemna' | 'stredni' | 'vysoka' | 'extremni' | null`  
**Účel:** Varování před fyzicky náročnými cviky  
**Příklady:**
- `'jemna'` → Koherentní dýchání vleže (relaxace)
- `'stredni'` → Box breathing v sedu (soustředění)
- `'vysoka'` → Wim Hof 4 rundy (aktivace)
- `'extremni'` → Tummo + Ice Bath (výzva)

**⚠️ Kombinace s `difficulty_level`:**
```
difficulty_level: 'easy' + intensity_level: 'jemna'
→ Ideální pro začátečníky s úzkostí

difficulty_level: 'extreme' + intensity_level: 'extremni'
→ Pouze pro profesionály (Wim Hof Ice Challenge)
```

---

### 8️⃣ **narration_type** (Styl narace) ⭐️ **NOVÉ**
**Typ:** `'pribeh' | 'bez-pribehu' | 'guided' | null`  
**Účel:** Personalizace podle preferencí uživatele  
**Definice:**

| Typ | Popis | Příklad |
|-----|-------|---------|
| **Příběh** | Příběhové vedení s metaforami | "Představ si, že stojíš na vrcholu hory..." |
| **Bez příběhu** | Pouze stručné pokyny | "Nádech 4s, výdech 6s" |
| **Guided** | Detailní krok-za-krokem vedení | "Nejprve natáhni ruce nad hlavu, hluboký nádech..." |

**Preference podle temperamentu:**
- **Sangvinik** → `'pribeh'` (kreativita, emoce)
- **Cholerik** → `'bez-pribehu'` (rychlost, efektivita)
- **Melancholik** → `'guided'` (detail, přesnost)
- **Flegmatik** → `'pribeh'` nebo `'guided'` (klid, structure)

---

### 9️⃣ **tags** (Multi-tagy)
**Typ:** `string[]` (array)  
**Účel:** Flexibilní cross-kategorizace  
**Příklady:**
```json
["Ráno", "Energie", "Wim Hof"]
["Večer", "Spánek", "Relaxace"]
["Focus", "Deep Work", "Soustředění"]
["Začátečníci", "Úzkost", "Klid"]
```

**Use case:**
- Uživatel hledá: "Ráno + Energie"
- Výsledek: Tracky s `tags=['Ráno', 'Energie']` nebo `mood_category='Ráno'` + `mood_category='Energie'`

---

## 🎯 Praktické kombinace (AI logika)

### Scénář 1: **Ranní vstávání (začátečník)**
```typescript
{
  duration_category: '3-9',
  mood_category: 'Ráno',
  difficulty_level: 'easy',
  kp_suitability: 'pod-10s',
  exercise_format: 'dechpresso',
  intensity_level: 'stredni',
  narration_type: 'guided',
  tags: ['Probuzení', 'Energie', 'Začátečníci']
}
```

### Scénář 2: **Večerní relaxace (pokročilý)**
```typescript
{
  duration_category: '26-60',
  mood_category: 'Večer',
  difficulty_level: 'medium',
  kp_suitability: '20s-30s',
  exercise_format: 'meditace',
  intensity_level: 'jemna',
  narration_type: 'pribeh',
  tags: ['Spánek', 'Relaxace', 'Mindfulness']
}
```

### Scénář 3: **Transformační breathwork (expert)**
```typescript
{
  duration_category: '26-60',
  mood_category: 'Special',
  difficulty_level: 'extreme',
  kp_suitability: 'nad-30s',
  exercise_format: 'breathwork',
  intensity_level: 'extremni',
  narration_type: 'guided',
  tags: ['Holotropic', 'Transformace', 'Emoce']
}
```

---

## 🧪 Databázová struktura

### SQL Schema
```sql
CREATE TABLE tracks (
  -- ... základní pole ...
  
  -- 9-polový kategorizační systém
  duration_category TEXT CHECK (duration_category IN ('3-9', '10-25', '26-60', 'kurz', 'reels')),
  mood_category TEXT CHECK (mood_category IN ('Ráno', 'Energie', 'Klid', 'Soustředění', 'Večer', 'Special')),
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'extreme')),
  kp_suitability TEXT CHECK (kp_suitability IN ('pod-10s', '11s-20s', '20s-30s', 'nad-30s')),
  media_type TEXT CHECK (media_type IN ('audio', 'video')) DEFAULT 'audio',
  exercise_format TEXT CHECK (exercise_format IN ('dechpresso', 'meditace', 'breathwork')),
  intensity_level TEXT CHECK (intensity_level IN ('jemna', 'stredni', 'vysoka', 'extremni')),
  narration_type TEXT CHECK (narration_type IN ('pribeh', 'bez-pribehu', 'guided')),
  tags TEXT[] DEFAULT '{}',
  
  -- Indexes pro rychlé filtrování
  CREATE INDEX idx_tracks_duration_category ON tracks(duration_category);
  CREATE INDEX idx_tracks_mood_category ON tracks(mood_category);
  CREATE INDEX idx_tracks_difficulty_level ON tracks(difficulty_level);
  CREATE INDEX idx_tracks_kp_suitability ON tracks(kp_suitability);
  CREATE INDEX idx_tracks_exercise_format ON tracks(exercise_format);
  CREATE INDEX idx_tracks_intensity_level ON tracks(intensity_level);
  CREATE INDEX idx_tracks_tags ON tracks USING GIN(tags);
);
```

---

## 🔍 Filtry v Admin UI

### TrackTable sloupce
1. **Cover** (48x48px)
2. **Název** (title)
3. **Typ cvičení** (exercise_format badge)
4. **Intenzita** (intensity_level badge)
5. **Obtížnost** (difficulty_level badge)
6. **KP** (kp_suitability badge)
7. **Délka** (duration + duration_category)
8. **Status** (is_published)
9. **Vytvořeno** (created_at)
10. **Akce** (Přehrát, Upravit, Smazat)

### TrackForm sekce
**Základní info:**
- Název, Album, Audio soubor, Cover, Popis

**Kategorizace (9 polí):**
1. Kategorie délky (duration_category)
2. Kategorie nálady (mood_category)
3. Obtížnost cvičení (difficulty_level)
4. Vhodnost podle KP (kp_suitability)
5. Typ média (media_type)
6. **Typ cvičení** (exercise_format) ⭐️
7. **Fyzická intenzita** (intensity_level) ⭐️
8. **Styl narace** (narration_type) ⭐️
9. **Tagy** (multi-select)

---

## 🤖 AI doporučovací logika

### Vstup (User Context)
```typescript
{
  kp_score: 12, // z posledního měření
  time_of_day: 'Ráno', // 6:00-10:00
  available_time: 10, // minut
  experience_level: 'beginner', // z profilu
  preferred_narration: 'guided', // z preferencí
  mood: 'Energie' // z dotazníku
}
```

### Výstup (Recommended Track)
```typescript
// AI query:
SELECT * FROM tracks
WHERE
  kp_suitability = 'pod-10s' -- podle KP skóre
  AND mood_category = 'Ráno' -- podle denní doby
  AND duration_category = '3-9' -- podle dostupného času
  AND difficulty_level IN ('easy', 'medium') -- podle zkušenosti
  AND narration_type = 'guided' -- podle preference
  AND (tags @> ARRAY['Energie'] OR mood_category = 'Energie') -- podle nálady
  AND is_published = true
ORDER BY play_count DESC -- nejoblíbenější
LIMIT 3;
```

---

## 📊 Datová analytika

### Top queries pro insights
```sql
-- 1. Nejoblíbenější typy cvičení
SELECT exercise_format, COUNT(*) as total_plays
FROM tracks
GROUP BY exercise_format
ORDER BY total_plays DESC;

-- 2. Průměrné KP podle typu cvičení
SELECT exercise_format, AVG(user_kp_after_exercise) as avg_kp_improvement
FROM track_completions
JOIN tracks ON track_completions.track_id = tracks.id
GROUP BY exercise_format;

-- 3. Nejúčinnější kombinace pro začátečníky
SELECT difficulty_level, intensity_level, narration_type, AVG(user_satisfaction) as avg_rating
FROM track_completions
JOIN tracks ON track_completions.track_id = tracks.id
WHERE difficulty_level = 'easy'
GROUP BY difficulty_level, intensity_level, narration_type
ORDER BY avg_rating DESC;
```

---

## ✅ Kontrolní checklist

Před publikováním tracku zkontroluj:

- [ ] **duration_category** odpovídá skutečné délce (`duration`)
- [ ] **difficulty_level** + **intensity_level** jsou v souladu (ne `easy` + `extremni`)
- [ ] **exercise_format** odpovídá struktuře (`dechpresso` = 3-15min, `breathwork` = 30-90min)
- [ ] **kp_suitability** je konzistentní s **difficulty_level** (ne `pod-10s` + `extreme`)
- [ ] **narration_type** odpovídá skutečnému obsahu audia
- [ ] **tags** obsahují min. 2-3 relevantní klíčová slova
- [ ] **mood_category** má smysl pro denní dobu (ne `Ráno` pro 90min breathwork)
- [ ] **is_published** = `true` pouze pokud track prošel QA testem

---

## 🚀 Next Steps (Post-MVP)

1. **Inteligentní doporučovací engine**
   - Machine learning model (TensorFlow.js)
   - Personalizace podle historie uživatele
   - A/B testing variant tracklistů

2. **Prediktivní filtry**
   - "Tracky, které ti pomůžou s úzkostí"
   - "Nejúčinnější breathwork pro tvé KP"

3. **Gamifikace**
   - Odznaky: "Dokončil 10 Dechpress"
   - Levely: "Breathwork Beginner → Master"

4. **Analytický dashboard pro adminy**
   - Heatmapa: Které kombinace kategorií fungují nejlépe
   - Trendy: Rostoucí zájem o `narration_type='pribeh'`

---

**✨ Výsledek:** Nejpokročilejší kategorizační systém pro dechové cvičení v ČR! 🇨🇿🎯
