/**
 * KPResult - Display Result After Measurement
 * 
 * Speciální UX pro první měření (trophy icon).
 * Normální zobrazení pro opakované měření.
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

import { formatSeconds, formatAttempts, formatTrend } from '@/utils/kp';
import { Button } from '@/platform/components';

export interface KPResultProps {
  /**
   * Final KP value (average or single)
   */
  value: number;
  
  /**
   * Is this the first measurement ever?
   */
  isFirst: boolean;
  
  /**
   * Previous KP value (for trend)
   */
  previousKP: number | null;
  
  /**
   * Individual attempts
   */
  attempts: (number | null)[];
  
  /**
   * Callback pro zavření
   */
  onClose: () => void;
}

/**
 * Trophy SVG Icon (custom, ne emoji)
 */
function TrophyIcon() {
  return (
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="kp-result__trophy"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

/**
 * KPResult Component
 */
export function KPResult({ 
  value, 
  isFirst, 
  previousKP, 
  attempts,
  onClose,
}: KPResultProps) {
  const trend = previousKP !== null ? value - previousKP : 0;
  const attemptsText = formatAttempts(attempts);
  
  return (
    <div className="kp-result">
      {/* První měření - Speciální */}
      {isFirst ? (
        <>
          <div className="kp-result__trophy-container">
            <TrophyIcon />
          </div>
          <h2 className="kp-result__title kp-result__title--first">
            Tvoje první KP!
          </h2>
          <div className="kp-result__value kp-result__value--first">
            {formatSeconds(value)}
          </div>
          <p className="kp-result__message">
            Tohle je tvůj výchozí bod. Sleduj pokrok!
          </p>
          {attempts.length > 1 && (
            <p className="kp-result__attempts">
              Měření: {attemptsText}
            </p>
          )}
        </>
      ) : (
        /* Opakované měření - Normální */
        <>
          <div className="kp-result__value">
            {formatSeconds(value)}
          </div>
          {previousKP !== null && (
            <div className={`kp-result__trend kp-result__trend--${trend >= 0 ? 'positive' : 'negative'}`}>
              {formatTrend(trend)}
            </div>
          )}
          {attempts.length > 1 && (
            <p className="kp-result__attempts">
              Měření: {attemptsText}
            </p>
          )}
        </>
      )}
      
      {/* Close Button */}
      <div className="kp-result__actions">
        <Button variant="secondary" fullWidth onClick={onClose}>
          Zavřít
        </Button>
      </div>
    </div>
  );
}
