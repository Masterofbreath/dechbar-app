/**
 * KPOnboarding - 3-Screen Onboarding for KP Measurement
 * 
 * Vysvětlí kdy a jak měřit KP. Zobrazí se pouze při prvním použití.
 * Swipe na mobilu, click na desktopu.
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

import { useState } from 'react';
import { Button } from '@/platform/components';

export interface KPOnboardingProps {
  /**
   * Callback po dokončení onboardingu
   */
  onComplete: () => void;
}

/**
 * KPOnboarding Component
 * 
 * 3 screens:
 * 1. Kdy měřit?
 * 2. Jak měřit?
 * 3. Důležité!
 */
export function KPOnboarding({ onComplete }: KPOnboardingProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  
  const handleNext = () => {
    if (currentScreen < 2) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };
  
  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };
  
  const handleSkip = () => {
    onComplete();
  };
  
  return (
    <div className="kp-onboarding">
      {/* Progress Indicator */}
      <div className="kp-onboarding__progress">
        {[0, 1, 2].map(i => (
          <div 
            key={i} 
            className={`kp-onboarding__progress-dot ${i <= currentScreen ? 'kp-onboarding__progress-dot--active' : ''}`}
          />
        ))}
      </div>
      
      {/* Screens Container */}
      <div 
        className="kp-onboarding__screens"
        style={{ transform: `translateX(-${currentScreen * 100}%)` }}
      >
        {/* Screen 1: Kdy měřit? */}
        <div className="kp-onboarding__screen">
          <div className="kp-onboarding__icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="kp-onboarding__title">Kdy měřit KP?</h2>
          <ul className="kp-onboarding__list">
            <li>Ráno (4-9h)</li>
            <li>Hned po probuzení</li>
            <li>Nalačno</li>
          </ul>
        </div>
        
        {/* Screen 2: Jak měřit? */}
        <div className="kp-onboarding__screen">
          <div className="kp-onboarding__icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            </svg>
          </div>
          <h2 className="kp-onboarding__title">Jak měřit?</h2>
          <ol className="kp-onboarding__steps">
            <li>3 klidné nádechy a výdechy</li>
            <li>Výdech + zádrž (spustí se stopky)</li>
            <li>Ucpat nos + zavřít oči</li>
            <li>
              Čekat na první signál:
              <ul className="kp-onboarding__substeps">
                <li>Bránice se pohne</li>
                <li>Potřeba polknout</li>
                <li>Myšlenka na nádech</li>
              </ul>
            </li>
            <li>Otevřít oči + zastavit</li>
          </ol>
        </div>
        
        {/* Screen 3: Důležité! */}
        <div className="kp-onboarding__screen">
          <div className="kp-onboarding__icon kp-onboarding__icon--warning">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
            </svg>
          </div>
          <h2 className="kp-onboarding__title">Důležité!</h2>
          <div className="kp-onboarding__content">
            <div className="kp-onboarding__tip kp-onboarding__tip--success">
              <strong>Po měření:</strong>
              <p>Tichý klidný nádech</p>
            </div>
            
            <div className="kp-onboarding__tip kp-onboarding__tip--error">
              <strong>Pokud lapáš po dechu:</strong>
              <p>Měřil jsi špatně (za hranou)</p>
              <p>Příště zastav dřív</p>
            </div>
            
            <div className="kp-onboarding__tip kp-onboarding__tip--info">
              <strong>Pro maximální přesnost:</strong>
              <p>Změř 3x (doporučeno)</p>
              <p>Nebo jen 1x (rychlé měření)</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="kp-onboarding__nav">
        {currentScreen > 0 && (
          <Button variant="ghost" onClick={handleBack}>
            Zpět
          </Button>
        )}
        
        {currentScreen < 2 && (
          <Button variant="ghost" onClick={handleSkip} className="kp-onboarding__skip">
            Přeskočit
          </Button>
        )}
        
        <Button variant="primary" onClick={handleNext}>
          {currentScreen === 2 ? 'Začít měření' : 'Další'}
        </Button>
      </div>
    </div>
  );
}
