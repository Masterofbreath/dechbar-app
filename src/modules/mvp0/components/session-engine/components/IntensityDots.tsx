/**
 * IntensityDots — 5-Dot Intensity Level Indicator
 *
 * Visual indicator for current breathing intensity multiplier:
 *
 *   Index:   0     1     2     3     4
 *   Value:  0.5×  0.75× 1.0×  1.25× 1.5×
 *   Color:  low   low   teal  gold  gold
 *
 * Center dot (index 2) is always teal — represents baseline (1.0×).
 * Dots to the right of center light up in gold when intensity increases.
 * Dots to the left of center light up in dimmed teal when intensity decreases.
 * All other dots are ghost (transparent, faint border).
 *
 * @package DechBar_App
 * @subpackage MVP0/SessionEngine/Components
 */

import React from 'react';

interface IntensityDotsProps {
  /** Current step index 0–4 (2 = center/default 1.0×) */
  step: number;
}

export function IntensityDots({ step }: IntensityDotsProps) {
  return (
    <div className="intensity-dots" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => {
        let modifier = '';

        if (i === 2) {
          // Center dot: always teal (baseline)
          modifier = '--center';
        } else if (i > 2 && i <= step) {
          // Right of center: active-high (gold) — intensity increased
          modifier = '--active-high';
        } else if (i < 2 && i >= step) {
          // Left of center: active-low (dimmed teal) — intensity decreased
          modifier = '--active-low';
        }
        // else: ghost dot (no modifier)

        return (
          <span
            key={i}
            className={`intensity-dots__dot${modifier ? ` intensity-dots__dot${modifier}` : ''}`}
          />
        );
      })}
    </div>
  );
}
