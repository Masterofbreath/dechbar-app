/**
 * DnesPage - Main Dashboard
 * 
 * MVP0 Core: 4 essential elements
 * 1. Greeting (dynamic time-based)
 * 2. SMART exercise button (tier-gated)
 * 3. 3 Preset protocols (RÁNO, KLID, VEČER)
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
  TodaysChallengeButton,
  PresetProtocolButton, 
  DailyTipWidget,
  SessionEngineModal
} from '../components';
import { useExercises } from '../api/exercises';
import { unlockSharedAudioContext } from '../utils/sharedAudioContext';
import type { Exercise, SmartSessionConfig } from '../types/exercises';

/**
 * Převede sekundy na "X min" label.
 * Používá Math.round — 570s → "10 min", 330s → "6 min", 420s → "7 min".
 */
function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '';
  return `${Math.round(seconds / 60)} min`;
}

export function DnesPage() {
  const { user } = useAuth();
  const { data: exercises, isLoading, error } = useExercises();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [skipFlow, setSkipFlow] = useState(false);
  const [smartConfig, setSmartConfig] = useState<SmartSessionConfig | undefined>(undefined);
  // True while computeAndBuild is in flight — modal is open but SmartPrepState shows loading
  const [smartLoading, setSmartLoading] = useState(false);

  // Dynamické délky z DB — aktualizují se automaticky když se změní protokol
  const ranoExercise = exercises?.find(ex => ex.name === 'RÁNO');
  const klidExercise = exercises?.find(ex => ex.name === 'KLID');
  const vecerExercise = exercises?.find(ex => ex.name === 'VEČER');

  // Called synchronously on SMART button click (within gesture stack) —
  // opens modal immediately so unlockAudio() runs before any awaits.
  function handleSmartEarlyOpen() {
    unlockSharedAudioContext(); // extra safety unlock — idempotent
    setSmartLoading(true);
    setSmartConfig(undefined);
    setSkipFlow(false);
    // Open modal immediately with a loading placeholder
    setSelectedExercise({ id: '__smart_loading__' } as Exercise);
  }

  // Called after computeAndBuild resolves — updates modal with real config
  function handleSmartStart(config: SmartSessionConfig, exercise: Exercise) {
    setSmartLoading(false);
    setSmartConfig(config);
    setSkipFlow(false);
    setSelectedExercise(exercise);
  }

  // Handle protocol button clicks - open SessionEngineModal
  function handleProtocolClick(protocolName: string) {
    if (!exercises) return;
    
    let exercise = exercises.find(ex => ex.name === protocolName);
    if (!exercise) {
      exercise = exercises.find(ex => ex.name.toLowerCase() === protocolName.toLowerCase());
    }
    
    if (exercise) {
      setSmartConfig(undefined);
      setSkipFlow(true);
      setSelectedExercise(exercise);
    }
  }

  if (isLoading) {
    // loading state handled by buttons gracefully
  }
  
  if (error) {
    console.error('[DnesPage] Chyba při načítání cvičení:', error);
  }
  
  return (
    <div className="dnes-page">
      {/* 1. Greeting — header shodný s Cvičit a Akademie */}
      <div className="dnes-page__header">
        <Greeting
          userName={user?.full_name}
          userNameVocative={user?.vocative_name}
        />
      </div>

      {/* Content — všechen obsah pod headerem */}
      <div className="dnes-page__content">
        {/* 2. SMART Exercise Button (tier-aware) */}
        <SmartExerciseButton
          onSmartStart={handleSmartStart}
          onEarlyOpen={handleSmartEarlyOpen}
        />
        
        {/* 2.5 Daily Program — section s diskrétním labelem */}
        <section className="dnes-page__section dnes-page__section--daily">
          <h2 className="dnes-page__section-label">Denní program</h2>
          <TodaysChallengeButton />
        </section>
        
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
              duration={formatDuration(ranoExercise?.total_duration_seconds)}
              onClick={() => handleProtocolClick('RÁNO')}
            />
            <PresetProtocolButton
              protocol="klid"
              icon="wind"
              label="KLID"
              duration={formatDuration(klidExercise?.total_duration_seconds)}
              onClick={() => handleProtocolClick('KLID')}
            />
            <PresetProtocolButton
              protocol="vecer"
              icon="moon"
              label="VEČER"
              duration={formatDuration(vecerExercise?.total_duration_seconds)}
              onClick={() => handleProtocolClick('VEČER')}
            />
          </div>
        </section>
        
        {/* 4. Daily Tip Widget */}
        <DailyTipWidget />
      </div>
      
      {/* Session Engine Modal — preset protocols and SMART sessions */}
      {selectedExercise && (
        <SessionEngineModal
          exercise={selectedExercise}
          skipFlow={skipFlow}
          smartConfig={smartConfig}
          smartLoading={smartLoading}
          onClose={() => {
            setSelectedExercise(null);
            setSkipFlow(false);
            setSmartConfig(undefined);
            setSmartLoading(false);
          }}
        />
      )}
    </div>
  );
}
