/**
 * NapovedaProvider — Context + OnboardJS + Supabase persistence
 *
 * Zodpovídá za:
 * - Načtení user_tour_state z Supabase (bulb_state, aktuální krok)
 * - Inicializaci OnboardingProvider s Supabase pluginem
 * - Poskytnutí NapovedaContext všem children komponentám
 * - Řízení TourOverlay (startTour, pauseTour)
 *
 * Umístění: obaluje children v AppLayout.tsx
 */

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { OnboardingProvider } from '@onboardjs/react';
import { createSupabasePlugin } from '@onboardjs/supabase-plugin';
import type { OnboardingStep } from '@onboardjs/react';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';
import { TourOverlay } from './TourOverlay';

/** Stav žárovičky v TopNav */
export type BulbState = 'lit' | 'dim' | 'hidden';

/** Aktuální krok Tour (načtený z DB) */
export interface TourStep {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  domSelector: string | null;
  stepType: 'highlight' | 'interactive' | 'info';
  interactiveAction: string | null;
  isRequiredForReward: boolean;
  orderIndex: number;
  chapterSlug: string;
  chapterTitle: Record<string, string>;
  totalInChapter: number;
}

export interface NapovedaContextValue {
  /** Stav žárovičky: lit / dim / hidden */
  bulbState: BulbState;
  /** Je Tour právě spuštěna? */
  isActive: boolean;
  /** Aktuální krok (null pokud Tour neběží) */
  currentStep: TourStep | null;
  /** % dokončení aktuální úrovně (0–100) */
  progressPercent: number;
  /** Spustí Tour od aktuálního nebo prvního kroku */
  startTour: () => void;
  /** Pozastaví Tour (deferred) */
  pauseTour: () => void;
  /** Ukončí Tour (completed / hidden) */
  completeTour: () => void;
}

export const NapovedaContext = createContext<NapovedaContextValue | undefined>(
  undefined
);

interface NapovedaProviderProps {
  children: ReactNode;
}

/**
 * Vytvoří Supabase plugin pro OnboardJS persistence.
 * Singleton — vytváříme mimo komponentu aby nedocházelo k re-vytváření.
 */
const supabasePlugin = createSupabasePlugin({
  client: supabase,
  tableName: 'user_tour_onboarding_state',
  userIdColumn: 'user_id',
  stateDataColumn: 'flow_data',
  useSupabaseAuth: true,
  onError: (error, operation) => {
    console.error(`[Tour] Supabase ${operation} failed:`, error.message);
  },
});

/**
 * Prázdný fallback kroky-seznam — dokud se kroky z DB nenačtou.
 * OnboardingProvider vyžaduje neprázdné steps, takže použijeme placeholder.
 */
const EMPTY_STEPS: OnboardingStep[] = [
  {
    id: '__loading__',
    type: 'info',
    payload: { title: 'Načítám...', description: '' },
  },
];

export function NapovedaProvider({ children }: NapovedaProviderProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const [isActive, setIsActive] = useState(false);
  const [bulbState, setBulbState] = useState<BulbState>('lit');
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(EMPTY_STEPS);

  // Načtení user_tour_state z Supabase
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadTourState() {
      const { data } = await supabase
        .from('user_tour_state')
        .select('bulb_state, show_bulb_preference')
        .eq('user_id', userId)
        .single();

      if (cancelled) return;

      if (data) {
        const state = data as { bulb_state: BulbState; show_bulb_preference: boolean };
        // Pokud uživatel vypnul žárovičku v Settings → hidden
        const effectiveBulb: BulbState =
          !state.show_bulb_preference ? 'hidden' : state.bulb_state;
        setBulbState(effectiveBulb);
      }
      // Pokud user_tour_state neexistuje → nový uživatel, bulb_state = 'lit' (default)
    }

    void loadTourState();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Načtení kroků z Supabase pro OnboardingProvider
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadSteps() {
      // Načteme kroky Úrovně 1 (basic) — aktivní, seřazené
      const { data: chapters } = await supabase
        .from('tour_chapters')
        .select(`
          id, slug, title, order_index,
          tour_levels!inner(slug, requires_plan),
          tour_steps(
            id, order_index, title, description,
            dom_selector, step_type, interactive_action, is_required_for_reward, is_active
          )
        `)
        .eq('is_active', true)
        .eq('tour_levels.slug', 'basic')
        .order('order_index');

      if (cancelled || !chapters) return;

      // Převod na OnboardingProvider steps formát
      const onboardingSteps: OnboardingStep[] = [];

      for (const chapter of chapters) {
        const chapterData = chapter as {
          id: string;
          slug: string;
          title: Record<string, string>;
          order_index: number;
          tour_steps: Array<{
            id: string;
            order_index: number;
            title: Record<string, string>;
            description: Record<string, string>;
            dom_selector: string | null;
            step_type: 'highlight' | 'interactive' | 'info';
            interactive_action: string | null;
            is_required_for_reward: boolean;
            is_active: boolean;
          }>;
        };

        const activeSteps = chapterData.tour_steps
          .filter((s) => s.is_active)
          .sort((a, b) => a.order_index - b.order_index);

        for (const step of activeSteps) {
          onboardingSteps.push({
            id: step.id,
            type: step.step_type,
            payload: {
              title: step.title,
              description: step.description,
              domSelector: step.dom_selector,
              interactiveAction: step.interactive_action,
              isRequiredForReward: step.is_required_for_reward,
              orderIndex: step.order_index,
              chapterSlug: chapterData.slug,
              chapterTitle: chapterData.title,
              totalInChapter: activeSteps.length,
            },
          });
        }
      }

      if (onboardingSteps.length > 0) {
        setSteps(onboardingSteps);
      }
    }

    void loadSteps();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const startTour = useCallback(() => {
    setIsActive(true);
  }, []);

  const pauseTour = useCallback(async () => {
    setIsActive(false);
    // Uložit deferred_until = now + 24h
    if (userId) {
      await supabase
        .from('user_tour_state')
        .upsert({
          user_id: userId,
          deferred_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
  }, [userId]);

  const completeTour = useCallback(async () => {
    setIsActive(false);
    setBulbState('hidden');
    if (userId) {
      await supabase
        .from('user_tour_state')
        .upsert({
          user_id: userId,
          bulb_state: 'hidden',
          tour_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
  }, [userId]);

  const contextValue: NapovedaContextValue = {
    bulbState,
    isActive,
    currentStep,
    progressPercent,
    startTour,
    pauseTour,
    completeTour,
  };

  // Callback pro OnboardingProvider — aktualizuje currentStep a progress
  const handleStepChange = useCallback(
    (step: OnboardingStep | null | undefined, state: { progressPercentage?: number }) => {
      if (!step) {
        setCurrentStep(null);
        return;
      }
      const payload = step.payload as Partial<TourStep> | undefined;
      if (payload) {
        setCurrentStep({
          id: String(step.id),
          title: (payload.title as Record<string, string>) ?? {},
          description: (payload.description as Record<string, string>) ?? {},
          domSelector: payload.domSelector ?? null,
          stepType: (payload.stepType ?? step.type ?? 'highlight') as TourStep['stepType'],
          interactiveAction: payload.interactiveAction ?? null,
          isRequiredForReward: payload.isRequiredForReward ?? false,
          orderIndex: payload.orderIndex ?? 0,
          chapterSlug: payload.chapterSlug ?? '',
          chapterTitle: payload.chapterTitle ?? {},
          totalInChapter: payload.totalInChapter ?? 0,
        });
      }
      if (state.progressPercentage !== undefined) {
        setProgressPercent(state.progressPercentage);
      }
    },
    []
  );

  return (
    <NapovedaContext.Provider value={contextValue}>
      <OnboardingProvider
        steps={steps}
        plugins={[supabasePlugin]}
        flowId="dechbar-napoveda-v1"
        flowName="DechBar Nápověda"
        onStepChange={(event) => handleStepChange(event.newStep, {})}
        onFlowComplete={completeTour}
      >
        {children}
        {isActive && <TourOverlay />}
      </OnboardingProvider>
    </NapovedaContext.Provider>
  );
}
