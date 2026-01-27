/**
 * Demo Exercises Data
 * 
 * Filters preset exercises for demo display.
 * Auto-syncs with shared constants.
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { PRESET_EXERCISES } from '@/shared/exercises/presets';

/**
 * Dnes View Protocols (3 protocols)
 * RÁNO, RESET, NOC
 */
export const DEMO_DNES_PROTOCOLS = PRESET_EXERCISES.filter(ex =>
  ['RÁNO', 'RESET', 'NOC'].includes(ex.name)
);

/**
 * Cvičit View Exercises (3 free exercises)
 * Box Breathing, Uklidnění, Srdeční koherence
 */
export const DEMO_CVICIT_EXERCISES = PRESET_EXERCISES.filter(ex =>
  ['Box Breathing', 'Uklidnění', 'Srdeční koherence'].includes(ex.name)
);

/**
 * All demo exercises (6 total)
 */
export const DEMO_ALL_EXERCISES = [
  ...DEMO_DNES_PROTOCOLS,
  ...DEMO_CVICIT_EXERCISES,
];

/**
 * Demo History Sessions (fake data for social proof)
 * Shows what history tracking looks like after registration
 */
export const DEMO_HISTORY_SESSIONS = [
  {
    id: 'demo-session-1',
    exercise_name: 'RÁNO',
    duration_min: 7,
    started_at: '2026-01-22T08:30:00',  // Dnes ráno
    was_completed: true,
    mood_after: 'calm' as const,
    mood_label: 'Výborně',
    notes: 'Cítil jsem se skvěle, hluboký dech.' // Demo note
  },
  {
    id: 'demo-session-2',
    exercise_name: 'NOC',
    duration_min: 10,
    started_at: '2026-01-21T22:15:00',  // Včera večer
    was_completed: true,
    mood_after: 'energized' as const,
    mood_label: 'Skvěle'
    // No notes (ukázka, že není vždy)
  }
];
