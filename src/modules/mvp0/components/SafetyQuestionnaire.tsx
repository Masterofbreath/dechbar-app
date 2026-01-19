/**
 * SafetyQuestionnaire - First-Time Safety Check
 * 
 * Shown before user's first breathing exercise session.
 * Collects safety flags (epilepsy, pregnancy, cardiovascular, asthma)
 * and displays disclaimer in DechBar Tone of Voice.
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

/**
 * SafetyQuestionnaire - Safety check modal
 */
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
  
  // Check if user has any safety concerns
  const hasSafetyConcerns = answers.epilepsy || answers.pregnancy || answers.cardiovascular || answers.asthma;
  
  async function handleSubmit() {
    try {
      await updateSafetyFlags.mutateAsync(answers);
      
      // Show warning if safety concerns present
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
    <div className="safety-questionnaire-modal" role="dialog" aria-modal="true">
      <div className="safety-questionnaire-modal__overlay" />
      
      <div className="safety-questionnaire-modal__content">
        {!showWarning ? (
          <>
            {/* Header */}
            <div className="questionnaire-header">
              <h2 className="questionnaire-title">🫁 Než začneš</h2>
              <p className="questionnaire-subtitle">
                Pro tvou bezpečnost, zodpověz prosím 4 krátké otázky
              </p>
            </div>
            
            {/* Questions */}
            <div className="questionnaire-questions">
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
            <div className="disclaimer">
              <h3 className="disclaimer__title">📋 Důležité informace</h3>
              <div className="disclaimer__text">
                <p>
                  Dechová cvičení jsou skvělá pro tvé tělo i mysl, 
                  ale důležité je cvičit bezpečně.
                </p>
                
                {hasSafetyConcerns && (
                  <div className="disclaimer__warning">
                    <strong>⚠️ Pozor:</strong> Na základě tvých odpovědí ti doporučujeme 
                    poradit se nejdřív s lékařem, jestli je dechové cvičení pro tebe vhodné.
                  </div>
                )}
                
                <p><strong>Necvič nikdy:</strong></p>
                <ul>
                  <li>Za volantem</li>
                  <li>Ve vodě (bazén, moře)</li>
                  <li>Když se necítíš dobře</li>
                </ul>
                
                <p><strong>Pokud během cvičení:</strong></p>
                <ul>
                  <li>Se ti točí hlava</li>
                  <li>Máš nevolnost</li>
                  <li>Cítíš nepohodlí</li>
                </ul>
                <p>
                  → Okamžitě přestaň a odpočiň si. 
                  Pokud potíže pokračují, vyhledej lékaře.
                </p>
                
                <p className="disclaimer__footer">
                  💙 DechBar je nástroj pro podporu tvého zdraví, 
                  není náhradou za lékařskou péči.
                  Používáním aplikace bereš na vědomí, 
                  že cvičíš na vlastní zodpovědnost.
                </p>
              </div>
              
            <Checkbox
              label="Přečetl jsem a rozumím těmto informacím"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              required
            />
            </div>
            
            {/* Submit */}
            <div className="questionnaire-actions">
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
              
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={onClose}
              >
                Zrušit
              </Button>
            </div>
          </>
        ) : (
          /* Warning screen for users with safety concerns */
          <div className="safety-warning">
            <div className="safety-warning__icon">⚠️</div>
            <h2 className="safety-warning__title">Důležité upozornění</h2>
            <p className="safety-warning__message">
              Na základě tvých odpovědí ti <strong>důrazně doporučujeme</strong> poradit 
              se s lékařem před zahájením dechových cvičení.
            </p>
            
            <div className="safety-warning__recommendations">
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
            
            <div className="safety-warning__actions">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onComplete}
              >
                Rozumím, pokračovat opatrně
              </Button>
              
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={onClose}
              >
                Zavřít
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
