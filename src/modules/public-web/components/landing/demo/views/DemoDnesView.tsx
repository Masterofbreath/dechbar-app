/**
 * DemoDnesView - Demo "Dnes" Dashboard
 * 
 * Reuses real MVp0 components:
 * - Greeting (with demo user)
 * - PresetProtocolButton (3 protocols)
 * - DailyTipWidget
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { Greeting } from '@/modules/mvp0/components/Greeting';
import { SmartExerciseButton } from '@/modules/mvp0/components/SmartExerciseButton';
import { PresetProtocolButton } from '@/modules/mvp0/components/PresetProtocolButton';
import { DailyTipWidget } from '@/modules/mvp0/components/DailyTipWidget';
import { DEMO_USER } from '../data/demoUser';
import { DEMO_DNES_PROTOCOLS } from '../data/demoExercises';
import type { Exercise } from '@/shared/exercises/types';

export interface DemoDnesViewProps {
  onExerciseClick: (exercise: Exercise) => void;
}

/**
 * DemoDnesView - Dashboard view for demo
 * 
 * @example
 * <DemoDnesView onExerciseClick={handleClick} />
 */
export function DemoDnesView({ onExerciseClick }: DemoDnesViewProps) {
  // Create dummy SMART exercise for demo (always locked)
  const dummySmartExercise: Exercise = {
    id: 'smart-demo',
    name: 'SMART CVIČENÍ',
    duration: 480, // 8 min
    description: 'Personalizované cvičení na základě tvého pokroku',
    category: 'preset',
    subcategory: 'focus',
    difficulty: 'intermediate',
    tags: ['smart', 'ai', 'personalized'],
    locked: true
  };
  
  return (
    <div className="dnes-page">
      {/* Personalized greeting */}
      <Greeting 
        userName={DEMO_USER.name} 
        userNameVocative={DEMO_USER.nameVocative} 
      />
      
      {/* SMART Exercise Button - Always locked in demo */}
      <SmartExerciseButton 
        onClick={() => onExerciseClick(dummySmartExercise)}
      />
      
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
              duration={`${Math.round(exercise.duration / 60)} min`}
              onClick={() => onExerciseClick(exercise)}
            />
          ))}
        </div>
      </section>
      
      {/* Daily tip widget */}
      <DailyTipWidget />
    </div>
  );
}
