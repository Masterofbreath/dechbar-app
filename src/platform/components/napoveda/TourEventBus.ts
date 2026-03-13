/**
 * TourEventBus — globální event systém pro interaktivní Tour kroky
 *
 * Jak funguje:
 * - Kdekoliv v appce (ProfilPage, KPCenter, FeedbackModal) zavoláš:
 *     tourEventBus.emit('nickname_saved', { value: 'Honza' })
 *
 * - TourOverlay naslouchá a automaticky posune Tour na další krok.
 *
 * Podporované eventy (viz SPEC — INTERAKTIVNÍ KROKY):
 *   measure_kp          → uživatel změřil KP
 *   nickname_saved      → uživatel uložil přezdívku
 *   vocative_saved      → uživatel uložil oslovení
 *   safety_flags_saved  → uživatel vyplnil zdravotní dotazník
 *   feedback_submitted  → uživatel odeslal podnět
 *   exercise_session_started → uživatel spustil cvičení (Fáze 2)
 *
 * Pattern: singleton EventTarget — nulové závislosti, funguje napříč celou app.
 */

export type TourEventType =
  | 'measure_kp'
  | 'nickname_saved'
  | 'vocative_saved'
  | 'safety_flags_saved'
  | 'feedback_submitted'
  | 'exercise_session_started';

export interface TourEventPayload {
  type: TourEventType;
  data?: Record<string, unknown>;
}

class TourEventBusClass extends EventTarget {
  emit(type: TourEventType, data?: Record<string, unknown>): void {
    this.dispatchEvent(
      new CustomEvent('tour-action', {
        detail: { type, data } satisfies TourEventPayload,
      })
    );
  }

  onAction(callback: (payload: TourEventPayload) => void): () => void {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<TourEventPayload>).detail;
      callback(payload);
    };
    this.addEventListener('tour-action', handler);
    return () => this.removeEventListener('tour-action', handler);
  }
}

/** Singleton — importuj kdekoliv v appce */
export const tourEventBus = new TourEventBusClass();
