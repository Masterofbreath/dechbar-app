/**
 * PresetProtocolButton - Preset Breathing Protocol Button
 * 
 * Reusable button for 3 core protocols:
 * - RÁNO (Morning activation)
 * - RESET (Midday reset)
 * - NOC (Evening relaxation)
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.1.0
 */

import { NavIcon } from '@/platform/components';

export interface PresetProtocolButtonProps {
  /**
   * Protocol ID
   */
  protocol: 'rano' | 'klid' | 'vecer';
  
  /**
   * Icon name
   */
  icon: 'sun' | 'wind' | 'moon';
  
  /**
   * Protocol label (uppercase)
   */
  label: string;
  
  /**
   * Duration text
   */
  duration: string;
  
  /**
   * Click handler (opens Session Engine modal)
   */
  onClick?: () => void;
}

/**
 * PresetProtocolButton - Clickable protocol card
 * 
 * @example
 * <PresetProtocolButton
 *   protocol="rano"
 *   icon="sun"
 *   label="RÁNO"
 *   duration="7 min"
 *   onClick={handleStart}
 * />
 */
export function PresetProtocolButton({
  protocol,
  icon,
  label,
  duration,
  onClick
}: PresetProtocolButtonProps) {
  
  function handleClick() {
    // TODO: Open Session Engine modal (MVP1)
    console.log(`Starting protocol: ${protocol}`);
    onClick?.();
  }
  
  return (
    <button
      className="preset-protocol-button"
      onClick={handleClick}
      aria-label={`Spustit ${label} protokol (${duration})`}
      type="button"
    >
      <div className="preset-protocol-button__icon">
        <NavIcon name={icon} size={32} />
      </div>
      <h3 className="preset-protocol-button__label">{label}</h3>
      <span className="preset-protocol-button__duration">{duration}</span>
    </button>
  );
}
