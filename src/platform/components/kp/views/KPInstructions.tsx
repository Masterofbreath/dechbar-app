/**
 * KPInstructions - KP measurement instructions screen
 * 
 * Step-by-step guide on how to measure Control Pause
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/KP/Views
 * @since 0.3.0
 */

import { Button } from '@/platform/components';
import { MiniTip } from '../../shared/MiniTip';

export interface KPInstructionsProps {
  onBack: () => void;
}

export function KPInstructions({ onBack }: KPInstructionsProps) {
  return (
    <>
      <h2 className="kp-center__title">Kontrolní pauza - jak měřit?</h2>
      
      <div className="kp-center__instructions-fullscreen">
        <ol className="kp-center__instructions-list">
          <li>Proveď tři normální nádechy a výdechy</li>
          <li>Po třetím výdechu zadrž dech a spusť stopky</li>
          <li>Zacpi nos a zavři oči</li>
          <li>
            Čekej na první signál potřeby nádechu
            <br />
            <span className="kp-center__instructions-detail">
              (Kopnutí bránice, potřeba polknout či myšlenka na nádech)
            </span>
          </li>
          <li>Zastav měření při prvním signálu</li>
          <li className="kp-center__instructions-check">
            <strong>Kontrola:</strong> První nádech po zádrži by měl být tichý a jemný.
          </li>
        </ol>
        
        <Button 
          variant="primary" 
          fullWidth
          size="lg"
          onClick={onBack}
        >
          Zpět k měření
        </Button>
        
        <MiniTip variant="absolute">
          <strong>Tip:</strong> Pro nejpřesnější výsledky měř KP ráno hned po probuzení.
        </MiniTip>
      </div>
    </>
  );
}
