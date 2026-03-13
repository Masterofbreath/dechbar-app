/**
 * TourOverlay — Driver.js wrapper pro Spotlight efekt
 *
 * FIX: tourStep čten přímo z state.currentStep (OnboardJS state),
 * ne z napovedaCtx.currentStep (které je null při prvním kroku —
 * onStepChange se nevolá pro inicializaci, jen pro změny).
 */

import { useEffect, useRef, useCallback, useContext } from 'react';
import { driver as createDriver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useOnboarding } from '@onboardjs/react';
import { NapovedaContext } from './NapovedaProvider';
import type { TourStep } from './NapovedaProvider';
import { TourTooltip } from './TourTooltip';
import { tourEventBus, type TourEventType } from './TourEventBus';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';

/** Extrahuje TourStep z OnboardJS OnboardingStep.payload */
function extractTourStep(state: ReturnType<typeof useOnboarding>['state']): TourStep | null {
  const current = state?.currentStep;
  if (!current) return null;

  const p = current.payload as Record<string, unknown> | undefined;
  if (!p) return null;

  return {
    id: String(current.id),
    title: (p.title as Record<string, string>) ?? {},
    description: (p.description as Record<string, string>) ?? {},
    domSelector: (p.domSelector as string | null) ?? null,
    stepType: ((p.stepType ?? current.type ?? 'highlight') as TourStep['stepType']),
    interactiveAction: (p.interactiveAction as string | null) ?? null,
    isRequiredForReward: (p.isRequiredForReward as boolean) ?? false,
    orderIndex: (p.orderIndex as number) ?? 0,
    chapterSlug: (p.chapterSlug as string) ?? '',
    chapterTitle: (p.chapterTitle as Record<string, string>) ?? {},
    totalInChapter: (p.totalInChapter as number) ?? 0,
  };
}

export function TourOverlay() {
  const driverRef = useRef<Driver | null>(null);
  const hasStartedRef = useRef(false);
  const userId = useAuthStore((s) => s.user?.id);
  const napovedaCtx = useContext(NapovedaContext);

  const onboarding = useOnboarding() as ReturnType<typeof useOnboarding> & { start?: () => void };
  const { state, next, previous, skip } = onboarding;

  // ===================================================
  // KRITICKÝ FIX: Spustit OnboardJS flow při mountu
  // (start = přejde na první aktivní krok)
  // ===================================================
  useEffect(() => {
    if (hasStartedRef.current) return;
    if (typeof onboarding.start === 'function') {
      hasStartedRef.current = true;
      onboarding.start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // iOS TOUCH FIX
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
    document.addEventListener('touchstart', iosDriverFix, { capture: true, passive: false });
    return () => document.removeEventListener('touchstart', iosDriverFix, true);
  }, []);

  // Uložení completed stepu do Supabase
  const markStepCompleted = useCallback(
    async (stepId: string, chapterSlug: string) => {
      if (!userId) return;
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
    },
    [userId]
  );

  // ===================================================
  // TourEventBus — interaktivní kroky
  // ===================================================
  useEffect(() => {
    const currentStep = state?.currentStep;
    if (!currentStep) return;
    const payload = currentStep.payload as { stepType?: string; interactiveAction?: string | null; chapterSlug?: string } | undefined;
    if (payload?.stepType !== 'interactive' || !payload.interactiveAction) return;
    const expectedAction = payload.interactiveAction as TourEventType;
    const unsubscribe = tourEventBus.onAction((event) => {
      if (event.type === expectedAction) {
        void markStepCompleted(String(currentStep.id), payload.chapterSlug ?? '');
        void next();
      }
    });
    return unsubscribe;
  }, [state?.currentStep, next, markStepCompleted]);

  // Driver.js — sestavení kroků z aktuálního stavu
  const buildDriveSteps = useCallback((): DriveStep[] => {
    const current = state?.currentStep;
    if (!current) return [];
    const payload = current.payload as { domSelector?: string | null; stepType?: string } | undefined;
    if (!payload) return [];
    return [
      {
        element: payload.domSelector ?? undefined,
        popover: {
          title: '',
          description: '',
          showButtons: [],
          showProgress: false,
        },
        disableActiveInteraction: payload.stepType !== 'interactive',
      },
    ];
  }, [state?.currentStep]);

  // Inicializace / update driver.js při každé změně kroku
  useEffect(() => {
    const steps = buildDriveSteps();
    if (steps.length === 0) {
      if (driverRef.current?.isActive()) driverRef.current.destroy();
      return;
    }

    if (!driverRef.current) {
      driverRef.current = createDriver({
        animate: true,
        overlayOpacity: 0.78,
        allowClose: false,
        allowKeyboardControl: false,
        showButtons: [],
        showProgress: false,
        stagePadding: 10,
        stageRadius: 8,
      });
    }

    const driverInstance = driverRef.current;
    driverInstance.setSteps(steps);
    driverInstance.drive(0);

    return () => {
      if (driverInstance.isActive()) driverInstance.destroy();
    };
  }, [buildDriveSteps]);

  useEffect(() => {
    return () => {
      if (driverRef.current?.isActive()) driverRef.current.destroy();
      driverRef.current = null;
    };
  }, []);

  // Handlery — čteme ze state.currentStep přímo
  const handleNext = useCallback(async () => {
    const current = state?.currentStep;
    if (current) {
      const p = current.payload as { chapterSlug?: string } | undefined;
      await markStepCompleted(String(current.id), p?.chapterSlug ?? '');
    }
    if (state?.isLastStep) {
      napovedaCtx?.completeTour();
      driverRef.current?.destroy();
    } else {
      await next();
    }
  }, [state, napovedaCtx, markStepCompleted, next]);

  const handlePrev = useCallback(async () => { await previous(); }, [previous]);

  const handleDefer = useCallback(async () => {
    await skip();
    napovedaCtx?.pauseTour();
    driverRef.current?.destroy();
  }, [skip, napovedaCtx]);

  // ===================================================
  // FIX: tourStep pochází přímo z state.currentStep
  // (ne z napovedaCtx.currentStep — ten je null pro první krok)
  // ===================================================
  const tourStep = extractTourStep(state);

  const isLastStep = state?.isLastStep ?? false;
  const isFirstStep = state?.isFirstStep ?? true;
  const progress = state?.progressPercentage ?? 0;
  const currentStepNum = state?.currentStepNumber ?? 1;
  const totalSteps = state?.totalSteps ?? 1;

  // Čekáme až OnboardJS inicializuje první krok (async Supabase plugin)
  if (!tourStep) return null;

  return (
    <TourTooltip
      step={tourStep}
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
