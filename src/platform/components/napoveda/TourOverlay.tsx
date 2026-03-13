/**
 * TourOverlay — Driver.js wrapper pro Spotlight efekt
 *
 * Zodpovídá za:
 * - Inicializaci driver.js instance
 * - Mapování kroků z NapovedaContext na DriveStep[]
 * - iOS touch fix (povinný — blokuje touch průchod skrz overlay)
 * - Sync stavu s Supabase (completed, deferred) přes NapovedaContext
 *
 * POVINNÝ iOS FIX: touchstart capture listener — testovat na fyzickém iPhone!
 */

import { useEffect, useRef, useCallback, useContext } from 'react';
import { driver as createDriver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useOnboarding } from '@onboardjs/react';
import { NapovedaContext } from './NapovedaProvider';
import { TourTooltip } from './TourTooltip';
import { tourEventBus, type TourEventType } from './TourEventBus';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';

export function TourOverlay() {
  const driverRef = useRef<Driver | null>(null);
  const userId = useAuthStore((s) => s.user?.id);
  const napovedaCtx = useContext(NapovedaContext);
  const { state, next, previous, skip } = useOnboarding();

  // ===================================================
  // iOS TOUCH FIX — POVINNÁ SOUČÁST (viz SPEC)
  // Blokuje touch průchod skrz overlay na non-tooltip elementy.
  // Testovat na fyzickém iPhone — ne simulátor, ne Chrome DevTools.
  // ===================================================
  useEffect(() => {
    const iosDriverFix = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.driver-popover') === null &&
        document.querySelector('.driver-popover') !== null
      ) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    document.addEventListener('touchstart', iosDriverFix, {
      capture: true,
      passive: false,
    });
    return () =>
      document.removeEventListener('touchstart', iosDriverFix, true);
  }, []);

  // Uložení completed stepu do Supabase
  const markStepCompleted = useCallback(
    async (stepId: string, chapterSlug: string) => {
      if (!userId || !napovedaCtx) return;

      const { data: chapter } = await supabase
        .from('tour_chapters')
        .select('id, level_id')
        .eq('slug', chapterSlug)
        .single();

      if (!chapter) return;

      await supabase.from('user_tour_progress').upsert(
        {
          user_id: userId,
          step_id: stepId,
          chapter_id: chapter.id,
          level_id: chapter.level_id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          view_context: window.location.pathname,
        },
        { onConflict: 'user_id,step_id' }
      );

      await supabase.rpc('update_tour_session_count' as never, {
        p_user_id: userId,
      } as never);
    },
    [userId, napovedaCtx]
  );

  // ===================================================
  // TourEventBus — automatický posun pro interaktivní kroky
  // ===================================================
  useEffect(() => {
    const currentStep = state?.currentStep;
    if (!currentStep) return;

    const payload = currentStep.payload as {
      stepType?: string;
      interactiveAction?: string | null;
      chapterSlug?: string;
    } | undefined;

    if (payload?.stepType !== 'interactive' || !payload.interactiveAction) return;

    const expectedAction = payload.interactiveAction as TourEventType;

    const unsubscribe = tourEventBus.onAction((event) => {
      if (event.type === expectedAction) {
        void markStepCompleted(
          String(currentStep.id),
          payload.chapterSlug ?? ''
        );
        void next();
      }
    });

    return unsubscribe;
  }, [state?.currentStep, next, markStepCompleted]);

  // Sestavení driver.js kroků z OnboardJS stavu
  const buildDriveSteps = useCallback((): DriveStep[] => {
    if (!state?.context) return [];

    const currentStep = state.currentStep;
    if (!currentStep) return [];

    const payload = currentStep.payload as {
      domSelector?: string | null;
      title?: Record<string, string>;
      description?: Record<string, string>;
      stepType?: string;
      chapterSlug?: string;
    } | undefined;

    if (!payload) return [];

    const titleText = payload.title?.cs ?? payload.title?.en ?? '';
    const descText = payload.description?.cs ?? payload.description?.en ?? '';

    return [
      {
        element: payload.domSelector ?? undefined,
        popover: {
          title: titleText,
          description: descText,
          showButtons: [],
          showProgress: false,
        },
        disableActiveInteraction: payload.stepType !== 'interactive',
      },
    ];
  }, [state]);

  // Inicializace / aktualizace driver.js při změně kroku
  useEffect(() => {
    const steps = buildDriveSteps();
    if (steps.length === 0) return;

    if (!driverRef.current) {
      driverRef.current = createDriver({
        animate: true,
        overlayOpacity: 0.75,
        allowClose: false,
        allowKeyboardControl: false,
        showButtons: [],
        showProgress: false,
        stagePadding: 8,
        stageRadius: 12,
      });
    }

    const driverInstance = driverRef.current;
    driverInstance.setSteps(steps);
    driverInstance.drive(0);

    return () => {
      if (driverInstance.isActive()) {
        driverInstance.destroy();
      }
    };
  }, [buildDriveSteps]);

  // Destroy driver při unmount (Tour zavřena)
  useEffect(() => {
    return () => {
      if (driverRef.current?.isActive()) {
        driverRef.current.destroy();
      }
      driverRef.current = null;
    };
  }, []);

  // Handlery pro tlačítka v TourTooltip
  const handleNext = useCallback(async () => {
    const currentStep = state?.currentStep;
    if (currentStep && napovedaCtx?.currentStep) {
      await markStepCompleted(
        String(currentStep.id),
        napovedaCtx.currentStep.chapterSlug
      );
    }

    if (state?.isLastStep) {
      napovedaCtx?.completeTour();
      if (driverRef.current?.isActive()) {
        driverRef.current.destroy();
      }
    } else {
      await next();
    }
  }, [state, napovedaCtx, markStepCompleted, next]);

  const handlePrev = useCallback(async () => {
    await previous();
  }, [previous]);

  const handleDefer = useCallback(async () => {
    await skip();
    napovedaCtx?.pauseTour();
    if (driverRef.current?.isActive()) {
      driverRef.current.destroy();
    }
  }, [skip, napovedaCtx]);

  // TourOverlay renderuje TourTooltip přes portal — overlay samotný je driver.js
  // Tooltip se zobrazuje přes driver.js onPopoverRender nebo jako vlastní UI vedle overlay
  // Pro custom design renderujeme vlastní komponentu vedle driver.js overlay
  const currentStepData = napovedaCtx?.currentStep;
  const isLastStep = state?.isLastStep ?? false;
  const isFirstStep = state?.isFirstStep ?? true;
  const progress = state?.progressPercentage ?? 0;
  const currentStepNum = state?.currentStepNumber ?? 1;
  const totalSteps = state?.totalSteps ?? 1;

  if (!currentStepData) return null;

  return (
    <TourTooltip
      step={currentStepData}
      stepNumber={currentStepNum}
      totalSteps={totalSteps}
      progress={progress}
      isFirst={isFirstStep}
      isLast={isLastStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onDefer={handleDefer}
    />
  );
}
