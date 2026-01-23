/**
 * Haptic Context (Optional - for React Context pattern)
 * 
 * Provides haptic service through React context.
 * Currently not required as useHaptic accesses singleton directly.
 * 
 * Reserved for future if we need React-specific state management.
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Haptic
 */

import { createContext, useContext, type ReactNode } from 'react';
import HapticService from './HapticService';
import type { HapticPattern, HapticConfig } from './types';

interface HapticContextValue {
  trigger: (pattern: HapticPattern, force?: boolean) => void;
  updateConfig: (config: Partial<HapticConfig>) => void;
  config: HapticConfig;
}

const HapticContext = createContext<HapticContextValue | undefined>(undefined);

export interface HapticProviderProps {
  children: ReactNode;
}

/**
 * HapticProvider - Wrap app to provide haptic context (optional)
 * 
 * Note: Not required as useHaptic() accesses singleton directly.
 * Use if you need React-specific features in the future.
 * 
 * @example
 * <HapticProvider>
 *   <App />
 * </HapticProvider>
 */
export function HapticProvider({ children }: HapticProviderProps) {
  const service = HapticService.getInstance();
  
  const value: HapticContextValue = {
    trigger: (pattern, force) => service.trigger(pattern, force),
    updateConfig: (config) => service.updateConfig(config),
    config: service.getConfig(),
  };
  
  return (
    <HapticContext.Provider value={value}>
      {children}
    </HapticContext.Provider>
  );
}

/**
 * useHapticContext - Access haptic context
 * 
 * Note: Use useHaptic() instead for simpler singleton access.
 */
export function useHapticContext(): HapticContextValue {
  const context = useContext(HapticContext);
  if (!context) {
    throw new Error('useHapticContext must be used within HapticProvider');
  }
  return context;
}