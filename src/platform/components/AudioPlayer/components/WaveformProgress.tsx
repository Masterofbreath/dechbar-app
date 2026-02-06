/**
 * WaveformProgress - 80-bar seekable waveform
 * 
 * Apple Premium Style:
 * - 80 vertical bars (flex layout)
 * - Colors: Gold (#D6A23A) played, Teal (#2CBEC6) unplayed
 * - Seekable: onClick → jump to time
 * - Hover: scaleY(1.15) animation
 * 
 * @version 2.43.0
 */

import React from 'react';

interface WaveformProgressProps {
  peaks: number[]; // 80 values (0-1 range)
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

/**
 * Generate simple waveform peaks if not provided
 * Creates visual wave pattern (higher in middle, lower at edges)
 */
const generateSimplePeaks = (count: number = 80): number[] => {
  return Array.from({ length: count }, (_, i) => {
    const position = i / count; // 0 to 1
    const wave = Math.sin(position * Math.PI); // Bell curve
    const random = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
    return wave * random;
  });
};

export const WaveformProgress: React.FC<WaveformProgressProps> = ({
  peaks: providedPeaks,
  currentTime,
  duration,
  onSeek,
}) => {
  // Use provided peaks or generate simple ones
  const peaks = providedPeaks && providedPeaks.length > 0 
    ? providedPeaks 
    : generateSimplePeaks(80);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="waveform flex items-center justify-between gap-0.5 h-20 w-full px-2"
      role="slider"
      aria-label="Pozice v tracku"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
    >
      {peaks.map((peak, index) => {
        const barProgress = (index / peaks.length) * 100;
        const isPlayed = barProgress <= progressPercent;
        
        // Bar height (min 4px for visibility)
        const height = Math.max(peak * 100, 4);

        return (
          <button
            key={index}
            className={`
              waveform-bar
              flex-1 
              rounded-sm
              transition-all duration-150 ease-out
              hover:opacity-60 hover:scale-y-115
              active:scale-y-95
              ${isPlayed 
                ? 'bg-accent opacity-100' 
                : 'bg-primary opacity-30'
              }
            `}
            style={{ 
              height: `${height}%`,
              minHeight: '4px',
            }}
            onClick={() => {
              const seekTime = (index / peaks.length) * duration;
              onSeek(seekTime);
            }}
            aria-label={`Přejít na ${Math.floor(barProgress)}%`}
          />
        );
      })}
    </div>
  );
};
