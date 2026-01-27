/**
 * DemoKPReady - Initial KP Measurement Ready Screen
 * 
 * Demo version of KPReady view for unregistered users.
 * - Always shows empty state (no previous KP)
 * - Help link to instructions
 * - "Začít měření" CTA
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo/Components
 */

import { Button, TextLink } from '@/platform/components';
import { BreathingCircle } from '@/components/shared/BreathingCircle';

export interface DemoKPReadyProps {
  onStartMeasurement: () => void;
  onShowInstructions: () => void;
}

/**
 * DemoKPReady Component
 */
export function DemoKPReady({
  onStartMeasurement,
  onShowInstructions,
}: DemoKPReadyProps) {
  return (
    <>
      <h2 className="demo-kp-center__title">Kontrolní pauza</h2>
      
      {/* KP Description */}
      <p className="demo-kp-center__description">
        Změř svou dechovou kondici a sleduj svůj pokrok.
      </p>
      
      {/* Static Breathing Circle + Start Button */}
      <div className="demo-kp-center__measurement-area">
        {/* Real BreathingCircle component with empty state */}
        <BreathingCircle variant="static" size={280}>
          <div className="kp-center__circle-empty">--</div>
        </BreathingCircle>
        
        {/* Help Link - ABOVE button */}
        <div className="demo-kp-center__help">
          <TextLink onClick={onShowInstructions}>
            Jak měřit?
          </TextLink>
        </div>
        
        <Button 
          variant="primary" 
          size="lg"
          fullWidth 
          onClick={onStartMeasurement}
        >
          Začít měření
        </Button>
      </div>
    </>
  );
}
