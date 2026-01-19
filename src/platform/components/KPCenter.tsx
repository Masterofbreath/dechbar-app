/**
 * KPCenter - Kontrolní Pauza Measurement & History
 * 
 * Modal for:
 * - Starting new KP measurement test
 * - Viewing current KP value + status
 * - History timeline with trend
 * - Integration with Pokrok module stats
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.3.0
 */

import { useNavigation } from '@/platform/hooks';

export function KPCenter() {
  const { isKPDetailOpen, closeKPDetail } = useNavigation();
  
  if (!isKPDetailOpen) return null;
  
  // Mock data - TODO: Replace with Supabase
  const currentKP = 35;
  
  return (
    <div className="modal-overlay" onClick={closeKPDetail}>
      <div className="kp-center" onClick={e => e.stopPropagation()}>
        <h2>Kontrolní pauza</h2>
        
        <div className="kp-center__current">
          <div className="kp-center__value">{currentKP}s</div>
          <p className="kp-center__status">Dobrý stav</p>
        </div>
        
        <button className="kp-center__start-test">
          Změřit novou KP
        </button>
        
        <div className="kp-center__history">
          <h3>Historie měření</h3>
          {/* Timeline component */}
          <p className="kp-center__empty">Zatím nemáš historii měření</p>
        </div>
        
        <button 
          className="kp-center__close"
          onClick={closeKPDetail}
        >
          Zavřít
        </button>
      </div>
    </div>
  );
}
