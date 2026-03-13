/**
 * useTourAction — hook pro emitování Tour eventů z libovolné komponenty
 *
 * Použití:
 * ```tsx
 * // V KPCenter.tsx — po úspěšném změření KP:
 * const { emitTourAction } = useTourAction();
 * // ...po uložení:
 * emitTourAction('measure_kp', { value: kpSeconds });
 * ```
 *
 * Hook nic nepotřebuje z kontextu — pouze wrappuje tourEventBus.emit()
 * pro typovou bezpečnost a konzistenci.
 */

import { useCallback } from 'react';
import { tourEventBus, type TourEventType } from '../TourEventBus';

export function useTourAction() {
  const emitTourAction = useCallback(
    (type: TourEventType, data?: Record<string, unknown>) => {
      tourEventBus.emit(type, data);
    },
    []
  );

  return { emitTourAction };
}
