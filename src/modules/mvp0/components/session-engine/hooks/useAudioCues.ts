/**
 * useAudioCues - Audio management for session engine
 * 
 * Handles bell audio cues on phase transitions
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine/Hooks
 */

import { useEffect, useRef, useCallback } from 'react';

export function useAudioCues() {
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Preload bell sound (Web Audio API ready for MVP2)
    // For MVP1: Using simple HTML5 Audio
    bellAudioRef.current = new Audio('/sounds/bell.mp3');
    bellAudioRef.current.volume = 0.5;
    
    return () => {
      if (bellAudioRef.current) {
        bellAudioRef.current.pause();
        bellAudioRef.current = null;
      }
    };
  }, []);
  
  const playBell = useCallback(() => {
    if (bellAudioRef.current) {
      bellAudioRef.current.currentTime = 0;
      bellAudioRef.current.play().catch(err => {
        console.warn('Bell audio play failed:', err);
      });
    }
  }, []);
  
  return { playBell };
}
