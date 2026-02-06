/**
 * VolumeControl - Volume slider (desktop) or mute button (mobile)
 * 
 * Responsive:
 * - Desktop (≥768px): Range slider (0-1)
 * - Mobile (<768px): Mute/unmute button
 * 
 * @version 2.43.0
 */

import React from 'react';

interface VolumeControlProps {
  volume: number; // 0 to 1
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  variant?: 'slider' | 'button'; // slider (desktop), button (mobile)
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
  variant,
}) => {
  // Auto-detect variant based on screen size if not provided
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const effectiveVariant = variant || (isMobile ? 'button' : 'slider');

  if (effectiveVariant === 'button') {
    // Mobile: Mute button
    return (
      <button
        onClick={onMuteToggle}
        className="
          w-11 h-11
          rounded-full
          flex items-center justify-center
          transition-all duration-200
          hover:bg-surface-elevated
          active:scale-95
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        "
        aria-label={isMuted ? 'Zapnout zvuk' : 'Vypnout zvuk'}
      >
        {isMuted || volume === 0 ? (
          // Muted icon
          <svg
            className="w-6 h-6 text-text-secondary"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          // Volume icon
          <svg
            className="w-6 h-6 text-text-secondary"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>
    );
  }

  // Desktop: Slider
  return (
    <div className="flex items-center gap-2 w-32">
      <button
        onClick={onMuteToggle}
        className="
          w-8 h-8
          rounded-full
          flex items-center justify-center
          transition-all duration-200
          hover:bg-surface-elevated
          active:scale-95
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        "
        aria-label={isMuted ? 'Zapnout zvuk' : 'Vypnout zvuk'}
      >
        {isMuted || volume === 0 ? (
          <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
        )}
      </button>
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="
          flex-1
          h-1
          rounded-full
          appearance-none
          bg-surface-elevated
          cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-accent
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-accent
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer
        "
        aria-label="Hlasitost"
      />
    </div>
  );
};
