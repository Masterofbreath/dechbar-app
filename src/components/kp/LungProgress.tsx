/**
 * LungProgress - Animated SVG Lung Fill Visualization
 *
 * Zobrazuje naplnění plic podle KP hodnoty (0s = 0%, 50s = 100%).
 * Dvě stylizované plíce s trachejí + milestone markery (13s/25s/40s).
 * Procentuální teploměr vlevo od plic.
 * Liquid glass efekt — deep blue tekutina.
 * Social-ready: size='sm' funguje bez animated prop.
 *
 * @package DechBar_App
 * @subpackage Components/KP
 */

import { useEffect, useRef, useState } from 'react';

export interface LungProgressProps {
  valueSeconds: number;
  maxSeconds?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

const SIZE_MAP = {
  sm: { width: 60,  height: 70,  svgWidth: 120, svgHeight: 140 },
  md: { width: 80,  height: 93,  svgWidth: 120, svgHeight: 140 },
  lg: { width: 120, height: 140, svgWidth: 120, svgHeight: 140 },
  xl: { width: 322, height: 354, svgWidth: 120, svgHeight: 140 },
};

// Levá plíce — zaoblený tvar, střed vlevo, s výřezem pro tracheus nahoře
const LEFT_LUNG =
  'M56,18 C54,14 50,12 46,13 C38,14 28,20 20,32 ' +
  'C12,44 8,60 8,78 C8,100 16,114 26,120 ' +
  'C34,125 44,126 52,122 C56,120 58,116 58,110 ' +
  'L58,22 C58,20 57,18 56,18 Z';

// Pravá plíce — zrcadlová
const RIGHT_LUNG =
  'M64,18 C66,14 70,12 74,13 C82,14 92,20 100,32 ' +
  'C108,44 112,60 112,78 C112,100 104,114 94,120 ' +
  'C86,125 76,126 68,122 C64,120 62,116 62,110 ' +
  'L62,22 C62,20 63,18 64,18 Z';

// Milestones — seconds, barva markeru, desc
const MILESTONES: Array<{ seconds: number; pct: number; markerColor: string; glowColor: string; opacity: number; desc: string }> = [
  { seconds: 13, pct: 26,  markerColor: 'rgba(200,200,220,0.5)',  glowColor: 'rgba(200,200,220,0.9)',  opacity: 0.5,  desc: 'Průměr společnosti' },
  { seconds: 25, pct: 50,  markerColor: 'rgba(56,189,248,0.65)', glowColor: 'rgba(56,189,248,1)',     opacity: 0.65, desc: 'První funkčnost' },
  { seconds: 40, pct: 80,  markerColor: 'rgba(248,202,0,0.7)',   glowColor: 'rgba(248,202,0,1)',      opacity: 0.7,  desc: 'Tvůj cíl' },
];

export function LungProgress({
  valueSeconds,
  maxSeconds = 50,
  size = 'md',
  animated = true,
}: LungProgressProps) {
  const dims = SIZE_MAP[size];
  const percent = Math.min(100, Math.max(0, (valueSeconds / maxSeconds) * 100));
  const fillY = (1 - percent / 100) * dims.svgHeight;

  const [mounted, setMounted] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValueRef = useRef<number>(valueSeconds);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (prevValueRef.current === valueSeconds) return;
    prevValueRef.current = valueSeconds;
    if (!animated) return;

    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => {
      setIsPulsing(true);
      pulseTimerRef.current = setTimeout(() => setIsPulsing(false), 400);
    }, 0);

    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [valueSeconds, mounted, animated]);

  const glowOpacity = percent * 0.004;
  const displayPercent = Math.round(percent);
  const gradientId = `lung-gradient-${size}`;
  const clipId = `lung-clip-${size}`;
  const innerGlowId = `lung-inner-glow-${size}`;
  const glassGlowId = `lung-glass-${size}`;
  const thermId = `lung-therm-${size}`;
  const fillYAnimated = animated && mounted ? fillY : dims.svgHeight;

  // Vlna — jemná jako hladina vody
  const waveAmplitude = 1.5;
  const waveWidth = dims.svgWidth * 2;
  function buildWavePath(yBase: number, w: number, amp: number): string {
    const steps = 8;
    const stepW = w / steps;
    let d = `M 0,${yBase}`;
    for (let i = 0; i <= steps; i++) {
      const x1 = i * stepW - stepW * 0.5;
      const x2 = i * stepW;
      const yC = i % 2 === 0 ? yBase - amp : yBase + amp;
      d += ` C ${(x1).toFixed(1)},${yC.toFixed(1)} ${(x1 + stepW * 0.3).toFixed(1)},${yC.toFixed(1)} ${x2.toFixed(1)},${yBase}`;
    }
    d += ` L ${w},${dims.svgHeight} L 0,${dims.svgHeight} Z`;
    return d;
  }

  const wrapperClass = [
    'lung-progress',
    `lung-progress--${size}`,
    isPulsing ? 'lung-progress--pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Teploměr: šířka pruhu, x pozice, výška
  // THERM_X = -26: teploměr blíže k plicím, viewBox symetrizován kolem x=60 (střed plic)
  const THERM_X = -26;
  const THERM_W = 4;
  const THERM_H = dims.svgHeight - 16;
  const THERM_Y_TOP = 8;
  const thermFillH = (percent / 100) * THERM_H;

  // Popisky teploměru — 0%, milníkové %, 100%
  const THERM_LABELS = [
    { pct: 0,   label: '0%' },
    { pct: 26,  label: '26%' },
    { pct: 50,  label: '50%' },
    { pct: 80,  label: '80%' },
    { pct: 100, label: '100%' },
  ];

  return (
    <div
      className={wrapperClass}
      style={{ width: dims.width, height: dims.height }}
      aria-label={`Kontrolní pauza: ${valueSeconds}s (${displayPercent}%)`}
    >
      {/* Ambient glow */}
      <div
        className="lung-progress__glow"
        style={{ opacity: animated && mounted ? glowOpacity : 0 }}
      />

      <svg
        className="lung-progress__svg"
        viewBox={`-55 0 230 ${dims.svgHeight}`}
        width={dims.width}
        height={dims.height}
        role="img"
        aria-label={`Kontrolní pauza: ${valueSeconds}s (${displayPercent}%)`}
        aria-hidden="true"
        overflow="visible"
      >
        <defs>
          {/* Deep blue liquid glass gradient */}
          <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#1D4ED8" stopOpacity="0.92" />
            <stop offset="50%"  stopColor="#3B82F6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.75" />
          </linearGradient>

          {/* Inner glow — jemný záblesk ze středu */}
          <radialGradient id={innerGlowId} cx="50%" cy="60%" r="55%">
            <stop offset="0%"   stopColor="#93C5FD" stopOpacity="0.18" />
            <stop offset="50%"  stopColor="#60A5FA" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>

          {/* Liquid glass — horní highlight */}
          <radialGradient id={`${innerGlowId}-top`} cx="50%" cy="10%" r="45%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
            <stop offset="60%"  stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Glass refraction — boční záblesk */}
          <linearGradient id={glassGlowId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.12)" />
            <stop offset="30%"  stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Teploměr gradient */}
          <linearGradient id={thermId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#1D4ED8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.9" />
          </linearGradient>

          {/* ClipPath pro výplň — obě plíce */}
          <clipPath id={clipId}>
            <path d={LEFT_LUNG} />
            <path d={RIGHT_LUNG} />
          </clipPath>
        </defs>

        {/* ── Teploměr vlevo od plic ── */}
        {size !== 'sm' && (
          <g className="lung-progress__thermometer">
            {/* % labely nalevo od pruhu */}
            {THERM_LABELS.map(({ pct, label }) => {
              const labelY = THERM_Y_TOP + THERM_H - (pct / 100) * THERM_H;
              const isCurrentPct = Math.abs(displayPercent - pct) <= 3;
              const isMilestonePct = [26, 50, 80].includes(pct);
              const isReachedPct = percent >= pct;
              return (
                <text
                  key={pct}
                  x={THERM_X - 10}
                  y={labelY + 3}
                  fontSize={isCurrentPct ? 13 : 10.5}
                  fontWeight={isCurrentPct ? '700' : isMilestonePct && isReachedPct ? '600' : '400'}
                  fill={isCurrentPct
                    ? 'rgba(255,255,255,0.9)'
                    : isMilestonePct && isReachedPct
                    ? 'rgba(255,255,255,0.55)'
                    : 'rgba(255,255,255,0.2)'}
                  textAnchor="end"
                  style={{ fontFamily: 'inherit', pointerEvents: 'none' }}
                >
                  {label}
                </text>
              );
            })}

            {/* Pozadí pruhu */}
            <rect
              x={THERM_X}
              y={THERM_Y_TOP}
              width={THERM_W}
              height={THERM_H}
              rx={THERM_W / 2}
              fill="rgba(255,255,255,0.06)"
            />
            {/* Výplňový pruh — animovaný */}
            <rect
              className="lung-progress__therm-fill"
              x={THERM_X}
              y={animated && mounted
                ? THERM_Y_TOP + THERM_H - thermFillH
                : THERM_Y_TOP + THERM_H}
              width={THERM_W}
              height={animated && mounted ? thermFillH : 0}
              rx={THERM_W / 2}
              fill={`url(#${thermId})`}
            />
            {/* Milníkové tečky na teploměru */}
            {MILESTONES.map((m) => {
              const dotY = THERM_Y_TOP + THERM_H - (m.pct / 100) * THERM_H;
              const isReached = percent >= m.pct;
              return (
                <circle
                  key={m.seconds}
                  cx={THERM_X + THERM_W / 2}
                  cy={dotY}
                  r={isReached ? 3.5 : 2.5}
                  fill={isReached ? m.glowColor : 'rgba(255,255,255,0.25)'}
                  className={isReached ? 'lung-progress__therm-dot--reached' : ''}
                />
              );
            })}
            {/* Aktuální % hladina — gold tečka se září na teploměru */}
            {percent > 2 && percent < 98 && (
              <g>
                {/* Halo záře */}
                <circle
                  cx={THERM_X + THERM_W / 2}
                  cy={THERM_Y_TOP + THERM_H - thermFillH}
                  r="6"
                  fill="rgba(248,202,0,0.12)"
                />
                {/* Zlatá tečka */}
                <circle
                  cx={THERM_X + THERM_W / 2}
                  cy={THERM_Y_TOP + THERM_H - thermFillH}
                  r="3.5"
                  fill="rgba(248,202,0,1)"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(248,202,0,0.9))' }}
                />
              </g>
            )}
          </g>
        )}

        {/* ── Výplňový rect + vlnová hrana ── */}
        <g clipPath={`url(#${clipId})`}>
          <rect
            className="lung-progress__fill-rect"
            x="0"
            y={fillYAnimated + waveAmplitude}
            width={dims.svgWidth}
            height={dims.svgHeight}
            fill={`url(#${gradientId})`}
          />
          {animated && percent > 0 && (
            <path
              className={`lung-progress__wave${mounted ? ' lung-progress__wave--active' : ''}`}
              d={buildWavePath(fillYAnimated, waveWidth, waveAmplitude)}
              fill={`url(#${gradientId})`}
            />
          )}
        </g>

        {/* ── Inner glow ── */}
        <rect
          x="0" y="0"
          width={dims.svgWidth}
          height={dims.svgHeight}
          fill={`url(#${innerGlowId})`}
          clipPath={`url(#${clipId})`}
          opacity="0.9"
          style={{ pointerEvents: 'none' }}
        />

        {/* ── Liquid glass — horní záblesk ── */}
        <rect
          x="0" y="0"
          width={dims.svgWidth}
          height={dims.svgHeight * 0.42}
          fill={`url(#${innerGlowId}-top)`}
          clipPath={`url(#${clipId})`}
          style={{ pointerEvents: 'none' }}
        />

        {/* ── Glass refraction — levý boční záblesk ── */}
        <rect
          x="0" y="0"
          width={dims.svgWidth * 0.35}
          height={dims.svgHeight}
          fill={`url(#${glassGlowId})`}
          clipPath={`url(#${clipId})`}
          style={{ pointerEvents: 'none' }}
        />

        {/* ── Milestone markery ── */}
        {size !== 'sm' && MILESTONES.map((m) => {
          const markerY = (1 - m.seconds / maxSeconds) * dims.svgHeight;
          const isReached = valueSeconds >= m.seconds;
          const valSize = size === 'xl' ? 11 : 7;
          const descSize = size === 'xl' ? 9.5 : 6;
          return (
            <g key={m.seconds}>
              {/* Čára přes plíce */}
              <line
                x1="6" y1={markerY}
                x2="114" y2={markerY}
                stroke={isReached ? m.glowColor : m.markerColor}
                strokeWidth={isReached ? 1.5 : 0.8}
                strokeDasharray={isReached ? 'none' : '3 3'}
                opacity={isReached ? 0.9 : m.opacity}
                clipPath={`url(#${clipId})`}
                style={{ pointerEvents: 'none' }}
              />
              {/* Glow při dosažení — extra záblesk */}
              {isReached && (
                <line
                  x1="6" y1={markerY}
                  x2="114" y2={markerY}
                  stroke={m.glowColor}
                  strokeWidth="4"
                  opacity="0.15"
                  clipPath={`url(#${clipId})`}
                  className="lung-progress__milestone-glow"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Popisek vpravo — sekundy + název, odsazeno od pravé plíce (x=112) */}
              <text
                x="122"
                y={markerY + 1}
                fontSize={valSize}
                fontWeight="700"
                fill={isReached ? m.glowColor : m.markerColor}
                opacity={isReached ? 1 : 0.8}
                textAnchor="start"
                style={{ pointerEvents: 'none', fontFamily: 'inherit' }}
              >
                {m.seconds}s
              </text>
              <text
                x="122"
                y={markerY + valSize + 2}
                fontSize={descSize}
                fontWeight={isReached ? '500' : '400'}
                fill={isReached ? m.glowColor : m.markerColor}
                opacity={isReached ? 0.85 : 0.65}
                textAnchor="start"
                style={{ pointerEvents: 'none', fontFamily: 'inherit' }}
              >
                {m.desc}
              </text>
            </g>
          );
        })}

        {/* ── Obrysy plic ── */}
        <path
          className={`lung-progress__outline-path${animated && mounted ? ' lung-progress__outline-path--drawn' : ''}`}
          d={LEFT_LUNG}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          className={`lung-progress__outline-path lung-progress__outline-path--right${animated && mounted ? ' lung-progress__outline-path--drawn' : ''}`}
          d={RIGHT_LUNG}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* ── Tracheus ── */}
        {size !== 'sm' && (
          <line
            x1="60" y1="4"
            x2="60" y2="20"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}
