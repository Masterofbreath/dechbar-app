/**
 * DailyTipWidget - Daily Breathing Tip Card
 * 
 * Displays one random scientific fact per day.
 * Educates users about breathing science.
 * Can be dismissed for the day (stored in localStorage).
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.1.0
 */

import { useState, useEffect } from 'react';
import { CloseButton } from '@/components/shared';
import { getDailyTip } from '../data/dailyTips';

export function DailyTipWidget() {
  const tip = getDailyTip();
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Check if already dismissed today
  useEffect(() => {
    const dismissedKey = `daily-tip-dismissed-${new Date().toDateString()}`;
    const dismissed = localStorage.getItem(dismissedKey);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);
  
  const handleDismiss = () => {
    const dismissedKey = `daily-tip-dismissed-${new Date().toDateString()}`;
    localStorage.setItem(dismissedKey, 'true');
    
    // TODO: Award points/EXP when gamification ready
    console.log('Daily tip acknowledged - award 5 XP (future)');
    
    setIsDismissed(true);
  };
  
  if (isDismissed) return null;
  
  return (
    <div className="daily-tip-widget">
      <CloseButton
        onClick={handleDismiss}
        ariaLabel="Přečteno"
        size={20}
        className="daily-tip-widget__dismiss"
      />
      <div className="daily-tip-widget__icon" aria-hidden="true">
        💡
      </div>
      <div className="daily-tip-widget__content">
        <h3 className="daily-tip-widget__title">
          Víš, že...
        </h3>
        <p className="daily-tip-widget__text">
          {tip.text}
        </p>
      </div>
    </div>
  );
}
