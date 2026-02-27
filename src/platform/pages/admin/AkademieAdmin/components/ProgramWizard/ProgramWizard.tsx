/**
 * ProgramWizard — Orchestrátor průvodce pro vytvoření programu
 *
 * Kroky:
 *   1. Výběr/vytvoření kategorie
 *   2. Základní info + atomický create (DB + Stripe + Ecomail)
 *   3. Série (volitelné)
 *   4. Lekce (volitelné)
 *   Shrnutí → Publikovat / Draft
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import type { ProgramWizardState, AkademieCategory } from '@/platform/services/admin/types';
import { WizardStepper } from './WizardStepper';
import { Step1Category } from './Step1Category';
import { Step2Program } from './Step2Program';
import { Step3Series } from './Step3Series';
import { Step4Lessons } from './Step4Lessons';
import { StepSummary } from './StepSummary';

const WIZARD_LABELS = ['Kategorie', 'Program', 'Série', 'Lekce', 'Shrnutí'];

const initialState: ProgramWizardState = {
  step: 1,
  category: {},
  program: {
    name: '',
    slug: '',
    description: '',
    price_czk: 990,
    is_published: false,
  },
  series: [],
  lessons: {},
};

interface ProgramWizardProps {
  onClose: () => void;
}

export function ProgramWizard({ onClose }: ProgramWizardProps) {
  const [wizardState, setWizardState] = useState<ProgramWizardState>(initialState);
  const [selectedCategory, setSelectedCategory] = useState<AkademieCategory | null>(null);

  const currentStepNum = wizardState.step === 'summary' ? 5 : (wizardState.step as number);

  const updateCategory = (patch: Partial<ProgramWizardState['category']>) => {
    setWizardState((prev) => ({ ...prev, category: { ...prev.category, ...patch } }));
  };

  const updateProgram = (patch: Partial<ProgramWizardState['program']>) => {
    setWizardState((prev) => ({ ...prev, program: { ...prev.program, ...patch } }));
  };

  const updateSeries = (series: ProgramWizardState['series']) => {
    setWizardState((prev) => ({ ...prev, series }));
  };

  const updateLessons = (seriesIdx: number, lessons: ProgramWizardState['lessons'][number]) => {
    setWizardState((prev) => ({
      ...prev,
      lessons: { ...prev.lessons, [seriesIdx]: lessons },
    }));
  };

  // Resolve selected category when category state changes
  useEffect(() => {
    const id = wizardState.category.existingCategoryId;
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategory(null);
      return;
    }
    let cancelled = false;
    adminApi.akademie.categories.getAll().then((cats) => {
      if (!cancelled) {
        setSelectedCategory(cats.find((c) => c.id === id) ?? null);
      }
    }).catch(() => {
      if (!cancelled) {
        setSelectedCategory(null);
      }
    });
    return () => { cancelled = true; };
  }, [wizardState.category.existingCategoryId]);

  const categorySlug =
    selectedCategory?.slug ?? wizardState.category.slug ?? 'akademie';

  const handleComplete = () => {
    onClose();
  };

  return (
    <div className="aa-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="aa-modal aa-modal--wide">
        <div className="aa-modal__header">
          <h2 className="aa-modal__title">Nový program — Průvodce</h2>
          <button className="aa-btn--icon" onClick={onClose} aria-label="Zavřít">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="aa-modal__body">
          <WizardStepper
            currentStep={currentStepNum}
            totalSteps={5}
            labels={WIZARD_LABELS}
          />

          {wizardState.step === 1 && (
            <Step1Category
              state={wizardState}
              onChange={updateCategory}
              onNext={() => setWizardState((prev) => ({ ...prev, step: 2 }))}
            />
          )}

          {wizardState.step === 2 && (
            <Step2Program
              state={wizardState}
              category={selectedCategory}
              onChange={updateProgram}
              onCreated={(result) => {
                // Only store result — don't advance yet (user clicks "Pokračovat" on done screen)
                updateProgram(result);
              }}
              onNext={() => setWizardState((prev) => ({ ...prev, step: 3 }))}
              onBack={() => setWizardState((prev) => ({ ...prev, step: 1 }))}
            />
          )}

          {wizardState.step === 3 && (
            <Step3Series
              state={wizardState}
              onChange={updateSeries}
              onNext={() => setWizardState((prev) => ({ ...prev, step: 4 }))}
              onSkip={() => setWizardState((prev) => ({ ...prev, step: 'summary' }))}
              onBack={() => setWizardState((prev) => ({ ...prev, step: 2 }))}
            />
          )}

          {wizardState.step === 4 && (
            <Step4Lessons
              state={wizardState}
              categorySlug={categorySlug}
              onLessonsChange={updateLessons}
              onNext={() => setWizardState((prev) => ({ ...prev, step: 'summary' }))}
              onSkip={() => setWizardState((prev) => ({ ...prev, step: 'summary' }))}
              onBack={() => setWizardState((prev) => ({ ...prev, step: 3 }))}
            />
          )}

          {wizardState.step === 'summary' && (
            <StepSummary
              state={wizardState}
              onComplete={handleComplete}
              onBack={() => setWizardState((prev) => ({ ...prev, step: 4 }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
