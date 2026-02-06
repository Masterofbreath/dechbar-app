/**
 * TimeDisplay - MM:SS format time display
 * 
 * - Format: "2:34 / 5:00"
 * - Font: Monospace (SF Mono or system mono)
 * - Size: 14px
 * - Color: Secondary text (#A0A0A0)
 * 
 * @version 2.43.0
 */

import React from 'react';

interface TimeDisplayProps {
  current: number; // seconds
  total: number; // seconds
  variant?: 'default' | 'compact';
}

/**
 * Format seconds to MM:SS
 * Example: 154 → "2:34"
 */
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  current,
  total,
  variant = 'default',
}) => {
  const currentFormatted = formatTime(current);
  const totalFormatted = formatTime(total);

  if (variant === 'compact') {
    return (
      <span className="text-xs font-mono text-text-secondary">
        {currentFormatted}/{totalFormatted}
      </span>
    );
  }

  return (
    <div className="flex justify-between items-center w-full text-sm font-mono text-text-secondary">
      <span>{currentFormatted}</span>
      <span>{totalFormatted}</span>
    </div>
  );
};
