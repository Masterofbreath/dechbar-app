/**
 * MVP0 Hooks - Barrel Export
 * 
 * All MVP0-specific custom hooks.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

export { useActiveChallenge } from './useActiveChallenge';
export { useIntensityControl } from '../components/session-engine/hooks/useIntensityControl';
export type { IntensityControlReturn } from '../components/session-engine/hooks/useIntensityControl';
export { useActiveDailyProgram } from './useActiveDailyProgram';
export type {
  ActiveDailyProgramData,
  ActiveDailyProgramInfo,
  UseActiveDailyProgramReturn,
} from './useActiveDailyProgram';
export { usePlatformFeaturedProgram } from './usePlatformFeaturedProgram';
export type {
  FeaturedProgramData,
  UsePlatformFeaturedProgramReturn,
} from './usePlatformFeaturedProgram';
export { usePlatformDailyOverride } from './usePlatformDailyOverride';
export type { DailyOverrideData, UsePlatformDailyOverrideReturn } from './usePlatformDailyOverride';
