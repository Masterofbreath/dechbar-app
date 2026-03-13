/**
 * NapovedaProvider — Context + OnboardJS + Supabase persistence
 *
 * Zodpovídá za:
 * - Detekci nového uživatele → zobrazení WelcomeSlide
 * - Inicializaci user_tour_state při prvním přihlášení
 * - Načtení bulb_state + globálního is_enabled přepínače
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
import { WelcomeSlide } from './WelcomeSlide';

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
  /** Zobrazit WelcomeSlide? (nový uživatel, první přihlášení) */
  showWelcome: boolean;
  /** Aktuální krok (null pokud Tour neběží) */
  currentStep: TourStep | null;
  /** % dokončení aktuální úrovně (0–100) */
  progressPercent: number;
  /** Spustí Tour od aktuálního nebo prvního kroku */
  startTour: () => void;
  /** Pozastaví Tour (deferred) */
  pauseTour: () => Promise<void>;
  /** Ukončí Tour (completed / hidden) */
  completeTour: () => Promise<void>;
  /** WelcomeSlide: "Jdeme na to" */
  handleWelcomeStart: () => Promise<void>;
  /** WelcomeSlide: "Přeskočit vše" */
  handleWelcomeSkip: () => Promise<void>;
}

export const NapovedaContext = createContext<NapovedaContextValue | undefined>(
  undefined
);

interface NapovedaProviderProps {
  children: ReactNode;
}

/**
 * Singleton Supabase plugin — mimo komponentu aby se nevytvářel při každém re-renderu.
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

/** Placeholder kroky dokud se kroky z DB nenačtou */
const PLACEHOLDER_STEPS: OnboardingStep[] = [
  {
    id: '__loading__',
    type: 'info',
    payload: { title: { cs: 'Načítám…' }, description: { cs: '' } },
  },
];

export function NapovedaProvider({ children }: NapovedaProviderProps) {
  const userId = useAuthStore((s) => s.user?.id);

  // Dev preview: ?preview_welcome=1 → zobraz WelcomeSlide okamžitě (neovlivní DB)
  const isDevPreview =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview_welcome') === '1';

  const [isActive, setIsActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(isDevPreview);
  const [bulbState, setBulbState] = useState<BulbState>(isDevPreview ? 'lit' : 'lit');
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(PLACEHOLDER_STEPS);

  // ===================================================
  // 1. Načtení stavu — globální přepínač + user_tour_state
  // ===================================================
  useEffect(() => {
    if (!userId) return;

    // Dev preview: stav je nastaven při inicializaci (useState), přeskočíme DB fetch
    if (isDevPreview) return;

    let cancelled = false;

    async function loadState() {
      const [{ data: settings }, { data: tourState }] = await Promise.all([
        supabase
          .from('napoveda_settings')
          .select('is_enabled')
          .eq('id', 1)
          .single(),
        supabase
          .from('user_tour_state')
          .select('bulb_state, show_bulb_preference, onboarding_shown_at')
          .eq('user_id', userId!)
          .single(),
      ]);

      if (cancelled) return;

      // Globálně vypnuto adminem → vždy hidden, žádný WelcomeSlide
      const globalEnabled =
        (settings as { is_enabled?: boolean } | null)?.is_enabled ?? true;
      if (!globalEnabled) {
        setBulbState('hidden');
        setShowWelcome(false);
        return;
      }

      if (!tourState) {
        // Nový uživatel — žádný user_tour_state → zobraz WelcomeSlide
        setShowWelcome(true);
        setBulbState('lit');
        return;
      }

      const state = tourState as {
        bulb_state: BulbState;
        show_bulb_preference: boolean;
        onboarding_shown_at: string | null;
      };

      // Uživatel existuje, ale WelcomeSlide ještě neviděl (edge case: stav vytvořen jinak)
      if (!state.onboarding_shown_at) {
        setShowWelcome(true);
      }

      const effectiveBulb: BulbState =
        !state.show_bulb_preference ? 'hidden' : state.bulb_state;
      setBulbState(effectiveBulb);
    }

    void loadState();

    return () => {
      cancelled = true;
    };
  }, [userId, isDevPreview]);

  // ===================================================
  // 2. Načtení kroků z DB pro OnboardingProvider
  // ===================================================
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadSteps() {
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

  // ===================================================
  // 3. Inicializace user_tour_state (nový uživatel)
  // ===================================================
  const initTourState = useCallback(
    async (onboardingShownAt: string) => {
      if (!userId) return;
      await supabase.from('user_tour_state').upsert(
        {
          user_id: userId,
          onboarding_shown_at: onboardingShownAt,
          bulb_state: 'lit',
          show_bulb_preference: true,
          sessions_count: 1,
          last_session_at: onboardingShownAt,
          created_at: onboardingShownAt,
          updated_at: onboardingShownAt,
        },
        { onConflict: 'user_id' }
      );
    },
    [userId]
  );

  // ===================================================
  // 4. WelcomeSlide handlers
  // ===================================================
  const handleWelcomeStart = useCallback(async () => {
    const now = new Date().toISOString();
    await initTourState(now);
    setShowWelcome(false);
    setBulbState('lit');
    setIsActive(true);
  }, [initTourState]);

  const handleWelcomeSkip = useCallback(async () => {
    const now = new Date().toISOString();
    await initTourState(now);
    setShowWelcome(false);
    setBulbState('lit');
    // Toast info — žárovička zůstává aktivní
    // (toast systém přes useToast není dostupný mimo Toast Provider — skip info se zobrazí jinak)
  }, [initTourState]);

  // ===================================================
  // 5. Tour ovládání
  // ===================================================
  const startTour = useCallback(() => {
    if (!userId) return;
    setIsActive(true);
    // Increment sessions_count
    void supabase
      .from('user_tour_state')
      .update({
        sessions_count: 999, // bude přepsáno DB triggerem nebo edge function v Sprint 5
        last_session_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }, [userId]);

  const pauseTour = useCallback(async () => {
    setIsActive(false);
    if (!userId) return;
    await supabase
      .from('user_tour_state')
      .update({
        deferred_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }, [userId]);

  const completeTour = useCallback(async () => {
    setIsActive(false);
    setBulbState('hidden');
    if (!userId) return;
    await supabase
      .from('user_tour_state')
      .update({
        bulb_state: 'hidden',
        tour_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }, [userId]);

  // ===================================================
  // 6. OnboardJS step change callback
  // ===================================================
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

  const contextValue: NapovedaContextValue = {
    bulbState,
    isActive,
    showWelcome,
    currentStep,
    progressPercent,
    startTour,
    pauseTour,
    completeTour,
    handleWelcomeStart,
    handleWelcomeSkip,
  };

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
        {/* WelcomeSlide — fullscreen, nový uživatel */}
        <WelcomeSlide />
        {/* TourOverlay — driver.js spotlight */}
        {isActive && <TourOverlay />}
      </OnboardingProvider>
    </NapovedaContext.Provider>
  );
}
