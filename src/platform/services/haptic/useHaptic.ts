/**
 * useHaptic Hook
 * 
 * React hook for accessing haptic feedback service.
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Haptic
 */

import { useCallback } from 'react';
import HapticService from './HapticService';
import type { HapticPattern, HapticConfig } from './types';

/**
 * useHaptic - Access haptic feedback service
 * 
 * @example
 * const { trigger } = useHaptic();
 * trigger('light'); // Button tap feedback
 */
export function useHaptic() {
  const service = HapticService.getInstance();
  
  const trigger = useCallback((pattern: HapticPattern, force: boolean = false) => {
    service.trigger(pattern, force);
  }, [service]);
  
  const updateConfig = useCallback((config: Partial<HapticConfig>) => {
    service.updateConfig(config);
  }, [service]);
  
  const getConfig = useCallback(() => {
    return service.getConfig();
  }, [service]);
  
  return {
    trigger,
    updateConfig,
    config: getConfig(),
  };
}
