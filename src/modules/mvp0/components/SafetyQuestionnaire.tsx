/**
 * SafetyQuestionnaire - First-Time Safety Check
 *
 * Shown exactly once per account lifetime — before the user's first breathing
 * exercise session. Collects safety flags and displays the safety disclaimer.
 *
 * Trigger: SessionEngineModal checks `safetyFlags.questionnaire_completed`.
 * Once submitted, the flag is stored in `profiles.safety_flags` in Supabase
 * and this modal never appears again.
 *
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { useState } from 'react';
import { Button, Checkbox } from '@/platform/components';
import { useScrollLock } from '@/platform/hooks';
import { useUpdateSafetyFlags } from '../api/exercises';
import type { SafetyQuestionnaireAnswers } from '../types/exercises';

export interface SafetyQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// --------------------------------------------------
// Icons (inline SVG — žádné emoji)
// --------------------------------------------------

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sq-icon">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sq-icon sq-icon--alert">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sq-icon--sm">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// --------------------------------------------------
// Component
// --------------------------------------------------

export function SafetyQuestionnaire({
  isOpen,
  onClose,
  onComplete,
}: SafetyQuestionnaireProps) {
  const [answers, setAnswers] = useState<SafetyQuestionnaireAnswers>({
    epilepsy: false,
    pregnancy: false,
    cardiovascular: false,
    asthma: false,
  });
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const updateSafetyFlags = useUpdateSafetyFlags();

  useScrollLock(isOpen);

  const hasSafetyConcerns =
    answers.epilepsy || answers.pregnancy || answers.cardiovascular || answers.asthma;

  async function handleSubmit() {
    try {
      await updateSafetyFlags.mutateAsync(answers);
      if (hasSafetyConcerns) {
        setShowWarning(true);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving safety flags:', error);
      alert('Nepodařilo se uložit odpovědi. Zkus to znovu.');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="sq-modal" role="dialog" aria-modal="true" aria-labelledby="sq-title">
      <div className="sq-modal__overlay" />

      <div className="sq-modal__content">
        {!showWarning ? (
          <>
            {/* Header */}
            <div className="sq-header">
              <div className="sq-header__icon">
                <ShieldIcon />
              </div>
              <h2 className="sq-header__title" id="sq-title">Než začneš</h2>
              <p className="sq-header__subtitle">
                Pro tvou bezpečnost zodpověz 4 krátké otázky
              </p>
            </div>

            {/* Questions */}
            <div className="sq-questions">
              <Checkbox
                label="Mám epilepsii nebo jsem prodělal/a záchvaty"
                checked={answers.epilepsy}
                onChange={(e) => setAnswers({ ...answers, epilepsy: e.target.checked })}
              />
              <Checkbox
                label="Jsem těhotná"
                checked={answers.pregnancy}
                onChange={(e) => setAnswers({ ...answers, pregnancy: e.target.checked })}
              />
              <Checkbox
                label="Mám kardiovaskulární onemocnění (srdeční potíže)"
                checked={answers.cardiovascular}
                onChange={(e) => setAnswers({ ...answers, cardiovascular: e.target.checked })}
              />
              <Checkbox
                label="Mám astma nebo jiné dechové problémy"
                checked={answers.asthma}
                onChange={(e) => setAnswers({ ...answers, asthma: e.target.checked })}
              />
            </div>

            {/* Disclaimer */}
            <div className="sq-disclaimer">
              <div className="sq-disclaimer__header">
                <InfoIcon />
                <h3 className="sq-disclaimer__title">Důležité informace</h3>
              </div>

              <div className="sq-disclaimer__body">
                <p>
                  Dechová cvičení jsou skvělá pro tvé tělo i mysl,
                  ale důležité je cvičit bezpečně.
                </p>

                {hasSafetyConcerns && (
                  <div className="sq-disclaimer__warning">
                    <strong>Pozor:</strong> Na základě tvých odpovědí ti doporučujeme
                    poradit se nejdřív s lékařem, jestli je dechové cvičení pro tebe vhodné.
                  </div>
                )}

                <p><strong>Necvič nikdy:</strong></p>
                <ul>
                  <li>Za volantem</li>
                  <li>Ve vodě (bazén, moře)</li>
                  <li>Když se necítíš dobře</li>
                </ul>

                <p><strong>Pokud během cvičení cítíš:</strong></p>
                <ul>
                  <li>Závrať nebo točení hlavy</li>
                  <li>Nevolnost</li>
                  <li>Jakékoli nepohodlí</li>
                </ul>
                <p>
                  Okamžitě přestaň a odpočiň si.
                  Pokud potíže pokračují, vyhledej lékaře.
                </p>

                <p className="sq-disclaimer__footer">
                  DechBar je nástroj pro podporu tvého zdraví,
                  není náhradou za lékařskou péči.
                  Používáním aplikace bereš na vědomí, že cvičíš na vlastní zodpovědnost.
                </p>
              </div>

              <Checkbox
                label="Přečetl/a jsem a rozumím těmto informacím"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                required
              />
            </div>

            {/* Actions */}
            <div className="sq-actions">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
                disabled={!disclaimerAccepted}
                loading={updateSafetyFlags.isPending}
              >
                Pokračovat k cvičení
              </Button>
              <Button variant="ghost" size="md" fullWidth onClick={onClose}>
                Zrušit
              </Button>
            </div>
          </>
        ) : (
          /* Warning screen for users with safety concerns */
          <div className="sq-warning">
            <div className="sq-warning__icon">
              <AlertTriangleIcon />
            </div>
            <h2 className="sq-warning__title">Důležité upozornění</h2>
            <p className="sq-warning__message">
              Na základě tvých odpovědí ti <strong>důrazně doporučujeme</strong> poradit
              se s lékařem před zahájením dechových cvičení.
            </p>

            <div className="sq-warning__box">
              <h3>Vyhni se těmto technikám:</h3>
              <ul>
                <li>Rychlé a hlasité dýchání ústy (hyperventilace)</li>
                <li>Dlouhé zádrže dechu (nad 10 sekund)</li>
                <li>Intenzivní dechové protokoly</li>
              </ul>
              <p>
                Můžeš bezpečně zkusit mírné techniky jako Box Breathing (4-4-4-4)
                nebo Calm (4-6), ale vždy poslouchej své tělo a při jakémkoli nepohodlí přestaň.
              </p>
            </div>

            <div className="sq-actions">
              <Button variant="primary" size="lg" fullWidth onClick={onComplete}>
                Rozumím, pokračovat opatrně
              </Button>
              <Button variant="ghost" size="md" fullWidth onClick={onClose}>
                Zavřít
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
