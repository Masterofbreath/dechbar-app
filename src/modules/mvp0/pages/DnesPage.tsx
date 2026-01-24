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
  const { data: exercises, isLoading, error } = useExercises();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [skipFlow, setSkipFlow] = useState(false); // NEW: Track if direct start
  
  // Handle protocol button clicks - open SessionEngineModal
  function handleProtocolClick(protocolName: string) {
    // Debug logging
    console.log('🔍 [DnesPage] Hledám cvičení:', protocolName);
    console.log('📦 [DnesPage] Načtená cvičení:', exercises?.length || 0, 'celkem');
    console.log('📋 [DnesPage] Dostupné názvy:', exercises?.map(ex => ex.name).join(', '));
    
    if (!exercises) {
      console.warn('⚠️ [DnesPage] Exercises ještě nejsou načteny');
      return;
    }
    
    // Try exact match first
    let exercise = exercises.find(ex => ex.name === protocolName);
    
    // Fallback: case-insensitive search
    if (!exercise) {
      console.log('🔄 [DnesPage] Zkouším case-insensitive search...');
      exercise = exercises.find(ex => 
        ex.name.toLowerCase() === protocolName.toLowerCase()
      );
    }
    
    if (exercise) {
      console.log('✅ [DnesPage] Cvičení nalezeno:', exercise.name, `(${exercise.id})`);
      setSkipFlow(true); // NEW: Enable direct start for preset protocols
      setSelectedExercise(exercise);
    } else {
      console.error('❌ [DnesPage] Cvičení nenalezeno:', protocolName);
      console.log('💡 [DnesPage] Tip: Zkontroluj názvy v databázi (exercises table)');
    }
  }
  
  // Show loading state
  if (isLoading) {
    console.log('⏳ [DnesPage] Načítám cvičení...');
  }
  
  // Show error in console
  if (error) {
    console.error('🚨 [DnesPage] Chyba při načítání cvičení:', error);
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
          skipFlow={skipFlow} // NEW: Pass skipFlow flag
          onClose={() => {
            setSelectedExercise(null);
            setSkipFlow(false); // Reset on close
          }}
        />
      )}
    </div>
  );
}
