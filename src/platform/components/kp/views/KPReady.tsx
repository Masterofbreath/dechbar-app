/**
 * KPReady - Initial KP measurement ready screen
 * 
 * Displays current KP value, trend, and start button
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/KP/Views
 * @since 0.3.0
 */

import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { Button, TextLink } from '@/platform/components';
import { formatSeconds, formatTrend } from '@/utils/kp';

export interface KPReadyProps {
  currentKP: number | null;
  previousKP: number | null;
  trend: number;
  isSaving: boolean;
  onStartMeasurement: () => void;
  onShowInstructions: () => void;
}

export function KPReady({
  currentKP,
  previousKP,
  trend,
  isSaving,
  onStartMeasurement,
  onShowInstructions,
}: KPReadyProps) {
  return (
    <>
      <h2 className="kp-center__title">Kontrolní pauza</h2>
      
      {/* KP Description */}
      <p className="kp-center__description">
        Změř svou dechovou kondici a sleduj svůj pokrok.
      </p>
      
      {/* Static Breathing Circle + Start Button */}
      <div className="kp-center__measurement-area">
        <BreathingCircle variant="static" size={280}>
          {currentKP !== null ? (
            <>
              <div className="kp-center__circle-value">{formatSeconds(currentKP)}</div>
              {previousKP !== null && (
                <div className={`kp-center__circle-trend kp-center__circle-trend--${trend >= 0 ? 'positive' : 'negative'}`}>
                  {formatTrend(trend)}
                </div>
              )}
            </>
          ) : (
            <div className="kp-center__circle-empty">--</div>
          )}
        </BreathingCircle>
        
        {/* Help Link - ABOVE button */}
        <div className="kp-center__help">
          <TextLink onClick={onShowInstructions}>
            Jak měřit?
          </TextLink>
        </div>
        
        <Button 
          variant="primary" 
          size="lg"
          fullWidth 
          onClick={onStartMeasurement}
          disabled={isSaving}
        >
          Začít měření
        </Button>
      </div>
    </>
  );
}
