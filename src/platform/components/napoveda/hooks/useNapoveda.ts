/**
 * useNapoveda — hlavní hook pro Nápověda & Tour System
 *
 * Poskytuje přístup k NapovedaContext:
 * - bulbState: aktuální stav žárovičky ('lit' | 'dim' | 'hidden')
 * - startTour: spustí Tour od aktuálního nebo prvního kroku
 * - pauseTour: pozastaví Tour
 * - currentStep: aktuální krok průvodce
 * - progress: % dokončení (0–100)
 * - tourState: celý user_tour_state objekt
 * - isActive: je Tour právě aktivní?
 */

import { useContext } from 'react';
import { NapovedaContext, type NapovedaContextValue } from '../NapovedaProvider';

export function useNapoveda(): NapovedaContextValue {
  const ctx = useContext(NapovedaContext);
  if (!ctx) {
    throw new Error('useNapoveda musí být použit uvnitř <NapovedaProvider>');
  }
  return ctx;
}
