/**
 * DigitalniTichoCountdown Component
 *
 * Zobrazuje počet dní do startu programu (1. 3. 2026)
 * Jednoduchý, neagresivní countdown bez manipulace
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState, useEffect } from 'react';

const LAUNCH_DATE = new Date('2026-03-01T00:00:00');

function getDaysUntil(target: Date): number | null {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function DigitalniTichoCountdown() {
  const [daysLeft, setDaysLeft] = useState<number | null>(() => getDaysUntil(LAUNCH_DATE));

  useEffect(() => {
    const interval = setInterval(() => {
      setDaysLeft(getDaysUntil(LAUNCH_DATE));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (daysLeft === null || daysLeft < 0) return null;

  if (daysLeft === 0) {
    return <span className="digitalni-ticho-countdown">Start dnes</span>;
  }

  if (daysLeft === 1) {
    return <span className="digitalni-ticho-countdown">Start zítra</span>;
  }

  const daysLabel = daysLeft >= 2 && daysLeft <= 4 ? 'dny' : 'dní';
  return (
    <span className="digitalni-ticho-countdown">
      Start za {daysLeft} {daysLabel}
    </span>
  );
}
