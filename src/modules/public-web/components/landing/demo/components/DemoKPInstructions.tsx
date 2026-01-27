/**
 * DemoKPInstructions - How to Measure KP Guide
 * 
 * Demo version of KPInstructions (1:1 copy from real app).
 * 6-step guide + morning tip + back button.
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo/Components
 */

import { Button } from '@/platform/components';
import { MiniTip } from '@/platform/components/shared/MiniTip';

export interface DemoKPInstructionsProps {
  onBack: () => void;
}

/**
 * DemoKPInstructions Component
 */
export function DemoKPInstructions({ onBack }: DemoKPInstructionsProps) {
  return (
    <>
      <h2 className="demo-kp-center__title">Kontrolní pauza - jak měřit?</h2>
      
      <div className="demo-kp-center__instructions-fullscreen">
        <ol className="demo-kp-center__instructions-list">
          <li>Proveď tři normální nádechy a výdechy</li>
          <li>Po třetím výdechu zadrž dech a spusť stopky</li>
          <li>Zacpi nos a zavři oči</li>
          <li>
            Čekej na první signál potřeby nádechu
            <br />
            <span className="demo-kp-center__instructions-detail">
              (Kopnutí bránice, potřeba polknout či myšlenka na nádech)
            </span>
          </li>
          <li>Zastav měření při prvním signálu</li>
          <li className="demo-kp-center__instructions-check">
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
