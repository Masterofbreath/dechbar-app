/**
 * WizardStepper — Vizuální indikátor kroků průvodce
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function WizardStepper({ currentStep, totalSteps, labels }: WizardStepperProps) {
  return (
    <div className="wizard-stepper">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div key={stepNum} className="wizard-stepper__step">
            <div
              className={`wizard-stepper__circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              {isCompleted ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <span className={`wizard-stepper__label ${isActive ? 'active' : ''}`}>
              {labels[i]}
            </span>
            {stepNum < totalSteps && <div className={`wizard-stepper__line ${isCompleted ? 'completed' : ''}`} />}
          </div>
        );
      })}

      <style>{`
        .wizard-stepper {
          display: flex;
          align-items: flex-start;
          gap: 0;
          margin-bottom: 2rem;
          padding: 0 0.25rem;
        }
        .wizard-stepper__step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        .wizard-stepper__circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
          background: #111;
          z-index: 1;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .wizard-stepper__circle.active {
          border-color: var(--dechbar-gold, #f8ca00);
          color: var(--dechbar-gold, #f8ca00);
          background: rgba(248,202,0,0.08);
        }
        .wizard-stepper__circle.completed {
          border-color: #2cbe5a;
          color: #2cbe5a;
          background: rgba(44,190,90,0.1);
        }
        .wizard-stepper__label {
          font-size: 0.6875rem;
          color: #555;
          margin-top: 6px;
          text-align: center;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .wizard-stepper__label.active {
          color: var(--color-text-primary);
          font-weight: 500;
        }
        .wizard-stepper__line {
          position: absolute;
          top: 14px;
          left: calc(50% + 14px);
          right: calc(-50% + 14px);
          height: 2px;
          background: #2a2a2a;
          z-index: 0;
          transition: background 0.2s;
        }
        .wizard-stepper__line.completed {
          background: rgba(44,190,90,0.4);
        }
      `}</style>
    </div>
  );
}
