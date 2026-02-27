/**
 * DemoDnesView - Demo "Dnes" Dashboard
 *
 * Mirrors the structure of the real DnesPage:
 *   dnes-page
 *     ├── dnes-page__header   (Greeting)
 *     └── dnes-page__content  (SmartBtn / DenníProgram / Protocols / Tip)
 *
 * Uses static/hardcoded data — no API calls.
 *
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { Greeting } from '@/modules/mvp0/components/Greeting';
import { SmartExerciseButton } from '@/modules/mvp0/components/SmartExerciseButton';
import { PresetProtocolButton } from '@/modules/mvp0/components/PresetProtocolButton';
import { DailyTipWidget } from '@/modules/mvp0/components/DailyTipWidget';
import { DemoDailyProgramCard } from '../components/DemoDailyProgramCard';
import { DEMO_USER } from '../data/demoUser';
import { DEMO_DNES_PROTOCOLS } from '../data/demoExercises';
import type { Exercise } from '@/shared/exercises/types';

export interface DemoDnesViewProps {
  onExerciseClick: (exercise: Exercise) => void;
}

export function DemoDnesView({ onExerciseClick }: DemoDnesViewProps) {
  const dummySmartExercise: Exercise = {
    id: 'smart-demo',
    name: 'SMART CVIČENÍ',
    duration: 480,
    description: 'Personalizované cvičení na základě tvého pokroku',
    category: 'preset' as const,
    subcategory: 'focus' as const,
    difficulty: 'intermediate' as const,
    tags: ['smart', 'ai', 'personalized'],
    locked: true,
    total_duration_seconds: 480,
    phase_count: 1,
    created_by: null,
    is_public: true,
    required_tier: 'SMART' as const,
    deleted_at: null,
    contraindications: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    breathing_pattern: {
      version: '1.0',
      type: 'simple' as const,
      phases: [{
        order: 1,
        type: 'breathing' as const,
        name: 'SMART Protocol',
        description: 'AI-optimized pattern',
        pattern: {
          inhale_seconds: 4,
          hold_after_inhale_seconds: 4,
          exhale_seconds: 6,
          hold_after_exhale_seconds: 2,
        },
        duration_seconds: 480,
        cycles_count: 30,
      }],
      metadata: {
        total_duration_seconds: 480,
        phase_count: 1,
        difficulty: 'intermediate' as const,
        tags: ['smart', 'ai', 'personalized'],
      },
    },
  };

  // Dummy exercise used to open the conversion modal on program card click
  const dummyProgramExercise: Exercise = {
    ...dummySmartExercise,
    id: 'program-demo',
    name: 'Digitální ticho',
    description: '21denní program pro lepší spánek a klid',
  };

  return (
    <div className="dnes-page">
      {/* Header — same wrapper as real DnesPage */}
      <div className="dnes-page__header">
        <Greeting
          userName={DEMO_USER.name}
          userNameVocative={DEMO_USER.nameVocative}
        />
      </div>

      {/* Content — gap:24px from dnes-page__content CSS */}
      <div className="dnes-page__content">
        {/* SMART Exercise Button */}
        <SmartExerciseButton
          onClick={() => onExerciseClick(dummySmartExercise)}
        />

        {/* DENNÍ PROGRAM */}
        <section className="dnes-page__section dnes-page__section--daily">
          <h2 className="dnes-page__section-label">Denní program</h2>
          <DemoDailyProgramCard onClick={() => onExerciseClick(dummyProgramExercise)} />
        </section>

        {/* Preset protocols section */}
        <section className="dnes-page__section">
          <h2 className="dnes-page__section-title">
            Doporučené protokoly
          </h2>

          <div className="dnes-page__protocols">
            {DEMO_DNES_PROTOCOLS.map(exercise => (
              <PresetProtocolButton
                key={exercise.id}
                protocol={exercise.id as 'rano' | 'reset' | 'noc'}
                icon={exercise.icon as 'sun' | 'refresh' | 'moon'}
                label={exercise.name}
                duration={`${Math.round((exercise.duration || exercise.total_duration_seconds) / 60)} min`}
                onClick={() => onExerciseClick(exercise)}
              />
            ))}
          </div>
        </section>

        {/* Daily tip widget */}
        <DailyTipWidget />
      </div>
    </div>
  );
}
