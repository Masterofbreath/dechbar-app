/**
 * DailyTipWidget - Daily Breathing Tip Card
 * 
 * Displays one random scientific fact per day.
 * Educates users about breathing science.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.1.0
 */

import { getDailyTip } from '../data/dailyTips';

/**
 * DailyTipWidget - Educational tip card
 * 
 * @example
 * <DailyTipWidget />
 */
export function DailyTipWidget() {
  const tip = getDailyTip();
  
  return (
    <div className="daily-tip-widget">
      <div className="daily-tip-widget__icon" aria-hidden="true">
        💡
      </div>
      <div className="daily-tip-widget__content">
        <h3 className="daily-tip-widget__title">
          Věděl jsi, že...
        </h3>
        <p className="daily-tip-widget__text">
          {tip.text}
        </p>
      </div>
    </div>
  );
}
