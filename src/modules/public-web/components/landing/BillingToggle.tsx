/**
 * BillingToggle Component
 * 
 * Pill-style toggle for switching between monthly and annual billing periods.
 * Features animated gold slider and responsive text labels.
 * 
 * Design: Inspired by WordPress pill navigation, adapted with DechBar design tokens.
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useLayoutEffect, useRef } from 'react';

export type BillingInterval = 'monthly' | 'annual';

export interface BillingToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
}

export function BillingToggle({ value, onChange, className = '' }: BillingToggleProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLSpanElement>(null);
  const monthlyBtnRef = useRef<HTMLButtonElement>(null);
  const annualBtnRef = useRef<HTMLButtonElement>(null);

  // useLayoutEffect runs synchronously before paint → eliminates flash of dark text on dark bg
  useLayoutEffect(() => {
    const slider = sliderRef.current;
    const track = trackRef.current;
    const activeButton = value === 'monthly' ? monthlyBtnRef.current : annualBtnRef.current;

    if (!slider || !track || !activeButton) return;

    const buttonWidth = activeButton.offsetWidth;
    const buttonLeft = activeButton.offsetLeft - track.offsetLeft;

    slider.style.width = `${buttonWidth}px`;
    slider.style.transform = `translateX(${buttonLeft}px)`;

    // Mark track as ready → CSS switches active text to dark (readable on gold)
    track.closest('.billing-toggle')?.classList.add('billing-toggle--ready');
  }, [value]);

  return (
    <div className={`billing-toggle ${className}`} role="group" aria-label="Frekvence platby">
      <div className="billing-toggle__track" ref={trackRef}>
        {/* Animated slider */}
        <span 
          className="billing-toggle__slider" 
          ref={sliderRef}
          aria-hidden="true"
        />

        {/* Monthly button */}
        <button
          ref={monthlyBtnRef}
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
          ref={annualBtnRef}
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
