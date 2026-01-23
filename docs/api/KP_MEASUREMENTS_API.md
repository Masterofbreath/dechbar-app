# KP Measurements API Documentation

## 📋 Overview

Public API pro práci s KP (Kontrolní Pauza) měřeními napříč celou aplikací.

**Single Source of Truth** pro KP data používaná v:
- TOP NAV (KPDisplay component)
- Pokrok Module (detailní statistiky)
- School Module (učitel vidí studenta)
- AI Coach (personalizace based on KP)

## 🎯 Quick Start

```typescript
import { useKPMeasurements } from '@/platform/api';

function MyComponent() {
  const { currentKP, measurements, saveKP, stats } = useKPMeasurements();
  
  return (
    <div>
      <p>Current KP: {currentKP}s</p>
      <p>Average: {stats.averageKP}s</p>
      <p>Best: {stats.bestKP}s</p>
    </div>
  );
}
```

## 📖 API Reference

### `useKPMeasurements()`

React Query hook pro práci s KP měřeními.

#### Returns

```typescript
{
  // Current state
  currentKP: number | null,       // Poslední validní KP (null pokud žádné měření)
  firstKP: number | null,          // První KP ever (null pokud žádné)
  
  // All measurements (sorted, newest first, limit 100)
  measurements: KPMeasurement[],
  
  // Statistics
  stats: KPStats,
  
  // Actions
  saveKP: (data: SaveKPData) => Promise<KPMeasurement>,
  
  // Loading states
  isLoading: boolean,              // Načítání dat
  isSaving: boolean,               // Ukládání probíhá
  
  // Errors
  error: Error | null,
}
```

### Types

#### `KPMeasurement`

```typescript
interface KPMeasurement {
  id: string;
  user_id: string;
  value_seconds: number;
  measured_at: string;              // ISO timestamp
  attempt_1_seconds: number;
  attempt_2_seconds: number | null;
  attempt_3_seconds: number | null;
  attempts_count: number;           // 1, 2, nebo 3
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  is_morning_measurement: boolean;  // TRUE = 4-9h
  is_valid: boolean;                // FALSE = mimo ranní okno
  is_first_measurement: boolean;    // TRUE jen pro první měření
  device_type?: 'mobile' | 'desktop' | 'tablet';
  measurement_type?: 'manual' | 'hrv' | 'smart';
  notes?: string;
  created_at: string;
}
```

#### `KPStats`

```typescript
interface KPStats {
  currentKP: number | null;        // Poslední validní KP
  firstKP: number | null;          // První KP ever
  averageKP: number;               // Průměr validních měření
  bestKP: number;                  // Nejvyšší KP
  totalMeasurements: number;       // Celkový počet
  validMeasurements: number;       // Jen validní (ranní)
  weeklyStreak: number;            // Kolik týdnů v řadě měřil
  trend: number;                   // +/- od minulého měření
}
```

#### `SaveKPData`

```typescript
interface SaveKPData {
  value_seconds: number;
  attempt_1_seconds: number;
  attempt_2_seconds?: number;
  attempt_3_seconds?: number;
  attempts_count: number;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  is_morning_measurement: boolean;
  is_valid: boolean;
  hour_of_measurement: number;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  measurement_duration_ms?: number;
  notes?: string;
  measured_in_context?: 'homepage_demo' | 'top_nav' | 'pokrok_module';
}
```

## 🔧 Usage Examples

### Example 1: Display Current KP

```typescript
function KPBadge() {
  const { currentKP, isLoading } = useKPMeasurements();
  
  if (isLoading) return <span>Loading...</span>;
  if (!currentKP) return <span>No KP yet</span>;
  
  return <span>KP: {currentKP}s</span>;
}
```

### Example 2: Save New Measurement

```typescript
function MeasurementButton() {
  const { saveKP, isSaving } = useKPMeasurements();
  
  const handleMeasurement = async () => {
    const data: SaveKPData = {
      value_seconds: 35,
      attempt_1_seconds: 33,
      attempt_2_seconds: 36,
      attempt_3_seconds: 36,
      attempts_count: 3,
      time_of_day: 'morning',
      is_morning_measurement: true,
      is_valid: true,
      hour_of_measurement: 7,
      device_type: 'mobile',
      measured_in_context: 'top_nav',
    };
    
    await saveKP(data);
  };
  
  return (
    <button onClick={handleMeasurement} disabled={isSaving}>
      {isSaving ? 'Saving...' : 'Save KP'}
    </button>
  );
}
```

### Example 3: Show Trend

```typescript
function KPTrend() {
  const { stats } = useKPMeasurements();
  
  const trendColor = stats.trend >= 0 ? 'green' : 'red';
  const trendSymbol = stats.trend >= 0 ? '+' : '';
  
  return (
    <div>
      <p>Current: {stats.currentKP}s</p>
      <p style={{ color: trendColor }}>
        Trend: {trendSymbol}{stats.trend}s
      </p>
    </div>
  );
}
```

### Example 4: Weekly Streak

```typescript
function StreakDisplay() {
  const { stats } = useKPMeasurements();
  
  return (
    <div>
      <p>Weekly streak: {stats.weeklyStreak} týdnů</p>
      {stats.weeklyStreak > 4 && <span>Skvělá konzistence! 🔥</span>}
    </div>
  );
}
```

## 🗄️ Database Schema

### Table: `kp_measurements`

Full schema v migration:  
`supabase/migrations/20260123000000_create_kp_measurements.sql`

**Klíčové fieldy:**
- `value_seconds` - Průměr nebo single value (10-180s)
- `is_morning_measurement` - TRUE = 4-9h
- `is_valid` - FALSE = mimo ranní okno
- `is_first_measurement` - TRUE jen pro první měření
- `attempts_count` - Kolik pokusů (1, 2, nebo 3)

**RLS Policies:**
- User vlastní jen svoje data
- Teacher může vidět studenta (budoucnost)

**Helper Functions:**
- `get_current_kp(user_id)` - Poslední validní KP
- `get_first_kp(user_id)` - První KP
- `calculate_weekly_streak(user_id)` - Týdenní streak

## 🔄 Data Flow

```
KPMeasurementEngine (component)
  ↓ onComplete callback
  ↓
KPCenter (saves via useKPMeasurements)
  ↓ saveKP mutation
  ↓
Supabase (kp_measurements table)
  ↓ React Query invalidation
  ↓
TOP NAV KPDisplay (auto-updates)
Pokrok Module (auto-updates)
```

## ⚡ Performance

- **Query Stale Time:** 1 minute
- **Query Limit:** 100 measurements (newest first)
- **Auto-invalidation:** Po každém save

## 🔐 Security

- Row Level Security (RLS) enabled
- User vlastní jen svoje měření
- Prepared statements (SQL injection safe)
- Validace na backendu i frontendu

## 📝 Notes

- **Morning Window:** 4-9h (validní data)
- **Streak Calculation:** 1x týdně (ne denně!)
- **First Measurement:** Automaticky detekováno
- **Device Type:** Auto-detekováno z user agent

## 🚀 Future Enhancements

- HRV integration (heart rate variability)
- Smart KP (AI-estimated from activity)
- School Module (teacher-student access)
- Export do CSV/PDF

---

**Version:** 0.3.0  
**Last Updated:** 2026-01-23  
**Author:** DechBar Team
