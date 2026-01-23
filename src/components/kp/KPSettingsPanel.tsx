/**
 * KPSettingsPanel - Measurement Settings
 * 
 * Umožní uživateli zvolit: 1x měření (rychlé) nebo 3x měření (přesné).
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

import { useState } from 'react';
import { Button } from '@/platform/components';

export interface KPSettingsPanelProps {
  /**
   * Callback s vybraným počtem měření
   */
  onStart: (attemptsCount: 1 | 3) => void;
  
  /**
   * Default počet měření
   * @default 3
   */
  defaultAttempts?: 1 | 3;
}

/**
 * KPSettingsPanel Component
 */
export function KPSettingsPanel({ onStart, defaultAttempts = 3 }: KPSettingsPanelProps) {
  const [selectedAttempts, setSelectedAttempts] = useState<1 | 3>(defaultAttempts);
  
  const handleStart = () => {
    onStart(selectedAttempts);
  };
  
  return (
    <div className="kp-settings-panel">
      <h3 className="kp-settings-panel__title">Kolik měření?</h3>
      <p className="kp-settings-panel__subtitle">
        3 měření poskytnou přesnější výsledek
      </p>
      
      <div className="kp-settings-panel__options">
        {/* 1x Option */}
        <button
          className={`kp-settings-panel__option ${selectedAttempts === 1 ? 'kp-settings-panel__option--active' : ''}`}
          onClick={() => setSelectedAttempts(1)}
          type="button"
        >
          <div className="kp-settings-panel__option-number">1x</div>
          <div className="kp-settings-panel__option-label">Rychlé</div>
        </button>
        
        {/* 3x Option */}
        <button
          className={`kp-settings-panel__option ${selectedAttempts === 3 ? 'kp-settings-panel__option--active' : ''}`}
          onClick={() => setSelectedAttempts(3)}
          type="button"
        >
          <div className="kp-settings-panel__option-number">3x</div>
          <div className="kp-settings-panel__option-label">Přesné</div>
          <div className="kp-settings-panel__option-badge">Doporučeno</div>
        </button>
      </div>
      
      <Button 
        variant="primary" 
        fullWidth 
        onClick={handleStart}
      >
        Pokračovat
      </Button>
    </div>
  );
}
