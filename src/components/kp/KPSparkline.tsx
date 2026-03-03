/**
 * KPSparkline - Lightweight SVG Area Chart for KP trend
 *
 * Draw-in animace zleva doprava, žádné osy, žádné popisky.
 * Poslední bod zvýrazněn zlatou tečkou.
 * Responsive — přizpůsobuje se šířce kontejneru.
 *
 * Data: nejstarší první (measurements.slice(0,10).reverse().map(m => m.value_seconds))
 *
 * @package DechBar_App
 * @subpackage Components/KP
 */

import { useEffect, useRef, useState } from 'react';

export interface KPSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  startLabel?: string;
  endLabel?: string;
}

function buildPath(
  data: number[],
  w: number,
  h: number,
  padding = 4,
): { linePath: string; areaPath: string; firstX: number; firstY: number; lastX: number; lastY: number } {
  if (data.length < 2) {
    const y = h / 2;
    return {
      linePath: `M 0,${y} L ${w},${y}`,
      areaPath: `M 0,${y} L ${w},${y} L ${w},${h} L 0,${h} Z`,
      firstX: 0, firstY: y,
      lastX: w,
      lastY: y,
    };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max === min ? 1 : max - min;

  const toX = (i: number) => (i / (data.length - 1)) * w;
  const toY = (v: number) =>
    h - padding - ((v - min) / range) * (h - padding * 2);

  const points = data.map((v, i) => ({ x: toX(i), y: toY(v) }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaPath =
    linePath +
    ` L ${lastPt.x.toFixed(1)},${h} L 0,${h} Z`;

  return { linePath, areaPath, firstX: firstPt.x, firstY: firstPt.y, lastX: lastPt.x, lastY: lastPt.y };
}

export function KPSparkline({
  data,
  width,
  height = 48,
  color = 'var(--color-accent)',
  startLabel,
  endLabel,
}: KPSparklineProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const [svgWidth, setSvgWidth] = useState(width ?? 200);
  const [lineLength, setLineLength] = useState(0);
  const [drawn, setDrawn] = useState(false);

  // ResizeObserver — responsive šířka
  useEffect(() => {
    if (width !== undefined) {
      const t = setTimeout(() => setSvgWidth(width), 0);
      return () => clearTimeout(t);
    }
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setSvgWidth(w);
    });
    ro.observe(el);
    const initialW = el.getBoundingClientRect().width;
    if (initialW > 0) {
      const t = setTimeout(() => setSvgWidth(initialW), 0);
      return () => { ro.disconnect(); clearTimeout(t); };
    }
    return () => ro.disconnect();
  }, [width]);

  // Změřit délku linky po renderu
  useEffect(() => {
    if (!lineRef.current) return;
    const len = lineRef.current.getTotalLength();
    setLineLength(len);
    // Spustit draw-in animaci
    const t = setTimeout(() => setDrawn(true), 50);
    return () => clearTimeout(t);
  }, [svgWidth, data]);

  if (!data || data.length === 0) return null;

  const LABEL_H = 14;
  const { linePath, areaPath, firstX, firstY, lastX, lastY } = buildPath(data, svgWidth, height, 4);

  return (
    <div ref={wrapperRef} className="kp-sparkline" style={{ width: width ?? '100%', height: height + LABEL_H }}>
      <svg
        className="kp-sparkline__svg"
        width={svgWidth}
        height={height + LABEL_H}
        viewBox={`0 ${-LABEL_H} ${svgWidth} ${height + LABEL_H}`}
        role="img"
        aria-label={`Vývoj KP — posledních ${data.length} měření`}
        overflow="visible"
      >
        {/* Oblast pod čárou */}
        <path
          className={`kp-sparkline__area${drawn ? ' kp-sparkline__area--visible' : ''}`}
          d={areaPath}
          fill={color}
        />

        {/* Hlavní linka */}
        <path
          ref={lineRef}
          className={`kp-sparkline__line${drawn ? ' kp-sparkline__line--drawn' : ''}`}
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            lineLength > 0
              ? { strokeDasharray: lineLength, strokeDashoffset: drawn ? 0 : lineLength }
              : undefined
          }
        />

        {/* První bod — malá tečka + label hodnoty */}
        {data.length >= 2 && drawn && startLabel && (
          <>
            <circle
              cx={firstX}
              cy={firstY}
              r={2.5}
              fill="rgba(255,255,255,0.3)"
            />
            <text
              x={firstX}
              y={firstY - 5}
              fontSize="9"
              fontWeight="500"
              fill="rgba(255,255,255,0.4)"
              textAnchor="middle"
              style={{ fontFamily: 'inherit' }}
            >
              {startLabel}
            </text>
          </>
        )}

        {/* Poslední bod — zlatá tečka + label */}
        {data.length >= 2 && (
          <>
            <circle
              className={`kp-sparkline__dot${drawn ? ' kp-sparkline__dot--visible' : ''}`}
              cx={lastX}
              cy={lastY}
              r={3}
              fill={color}
            />
            {drawn && endLabel && (
              <text
                x={Math.min(lastX, svgWidth - 16)}
                y={lastY - 6}
                fontSize="9"
                fontWeight="600"
                fill="rgba(248,202,0,0.85)"
                textAnchor="middle"
                style={{ fontFamily: 'inherit' }}
              >
                {endLabel}
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
