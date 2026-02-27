/**
 * BillingToggle Component
 *
 * Pill-style toggle for switching between monthly and annual billing periods.
 * Active state renders via pure CSS (gold background + dark text).
 * No JS slider — eliminates flash-of-invisible-text on first render.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

export type BillingInterval = 'monthly' | 'annual';

export interface BillingToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
}

export function BillingToggle({ value, onChange, className = '' }: BillingToggleProps) {
  return (
    <div className={`billing-toggle ${className}`} role="group" aria-label="Frekvence platby">
      <div className="billing-toggle__track">
        {/* Monthly button */}
        <button
          type="button"
          className={`billing-toggle__button ${value === 'monthly' ? 'billing-toggle__button--active' : ''}`}
          onClick={() => onChange('monthly')}
          aria-pressed={value === 'monthly'}
        >
          <span className="billing-toggle__text-full">Měsíčně</span>
          <span className="billing-toggle__text-narrow">Měsíc</span>
        </button>

        {/* Annual button */}
        <button
          type="button"
          className={`billing-toggle__button ${value === 'annual' ? 'billing-toggle__button--active' : ''}`}
          onClick={() => onChange('annual')}
          aria-pressed={value === 'annual'}
        >
          <span className="billing-toggle__text-full">
            Ročně <span className="billing-toggle__discount" aria-hidden="true">(-50 %)</span>
          </span>
          <span className="billing-toggle__text-narrow">Rok</span>
        </button>
      </div>
    </div>
  );
}
