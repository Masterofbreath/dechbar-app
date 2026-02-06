/**
 * AudioPlayer - DechBar Audio Player Component
 * 
 * Professional audio player for guided breathing exercises.
 * Supports fullscreen and sticky modes, 80% completion tracking.
 * 
 * @package DechBar
 * @version 2.43.0
 * @status ✅ IMPLEMENTED
 */

// Main components
export { AudioPlayer } from './AudioPlayer';
export { StickyAudioPlayer } from './StickyPlayer';
export { FullscreenPlayer } from './FullscreenPlayer';

// UI components
export { PlayPauseButton } from './components/PlayPauseButton';
export { WaveformProgress } from './components/WaveformProgress';
export { TimeDisplay } from './components/TimeDisplay';
export { FavouriteButton } from './components/FavouriteButton';
export { VolumeControl } from './components/VolumeControl';

// Core types (database models and main component props)
export type {
  Track,
  Album,
  TrackProgress,
  TrackCompletion,
  TrackFavourite,
  ChallengeProgress,
  AudioPlayerProps,
  AudioPlayerState,
} from './types';

// Hooks
export { useAudioPlayer } from './hooks/useAudioPlayer';
export { useAudioTracking } from './hooks/useAudioTracking';

// Store
export { useAudioPlayerStore } from './store';

