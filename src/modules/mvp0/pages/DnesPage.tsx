/**
 * DnesPage - Main Dashboard
 * 
 * MVP0 Core: 4 essential elements
 * 1. Greeting (dynamic time-based)
 * 2. SMART exercise button (tier-gated)
 * 3. 3 Preset protocols (RÁNO, RESET, NOC)
 * 4. Daily tip widget
 * 
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.1.0
 */

import { useState } from 'react';
import { useAuth } from '@/platform/auth';
import { 
  Greeting, 
  SmartExerciseButton, 
  PresetProtocolButton, 
  DailyTipWidget,
  SessionEngineModal
} from '../components';
import { useExercises } from '../api/exercises';
import type { Exercise } from '../types/exercises';

/**
 * DnesPage - Dashboard with core protocols
 * 
 * @example
 * <AppLayout>
 *   <DnesPage />
 * </AppLayout>
 */
export function DnesPage() {
  const { user } = useAuth();
  const { data: exercises } = useExercises();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // Handle protocol button clicks - open SessionEngineModal
  function handleProtocolClick(protocolName: string) {
    const exercise = exercises?.find(ex => ex.name === protocolName);
    if (exercise) {
      setSelectedExercise(exercise);
    }
  }
  
  return (
    <div className="dnes-page">
      {/* 1. Greeting */}
      <Greeting userName={user?.full_name} />
      
      {/* 2. SMART Exercise Button (tier-aware) */}
      <SmartExerciseButton 
        onClick={() => console.log('SMART exercise clicked')}
      />
      
      {/* 3. Preset Protocols Section */}
      <section className="dnes-page__section">
        <h2 className="dnes-page__section-title">
          Doporučené protokoly
        </h2>
        
        <div className="dnes-page__protocols">
          <PresetProtocolButton
            protocol="rano"
            icon="sun"
            label="RÁNO"
            duration="7 min"
            onClick={() => handleProtocolClick('RÁNO')}
          />
          <PresetProtocolButton
            protocol="reset"
            icon="refresh"
            label="RESET"
            duration="5 min"
            onClick={() => handleProtocolClick('RESET')}
          />
          <PresetProtocolButton
            protocol="noc"
            icon="moon"
            label="NOC"
            duration="10 min"
            onClick={() => handleProtocolClick('NOC')}
          />
        </div>
      </section>
      
      {/* 4. Daily Tip Widget */}
      <DailyTipWidget />
      
      {/* Session Engine Modal */}
      {selectedExercise && (
        <SessionEngineModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
}
