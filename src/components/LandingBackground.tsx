'use client';

import { memo } from 'react';

// Quiet editorial backdrop: a warm base wash, two slow brand-colour glows,
// a fine grid that fades downward, a whisper of grain and a soft vignette.
// Pure CSS layers — nothing to fetch, nothing to 404, cheap to paint, and
// the same structure works for both themes (only the colour values differ).

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)'/%3E%3C/svg%3E\")";

export default memo(function LandingBackground({ darkMode }: { darkMode: boolean }) {
  const base = darkMode
    ? 'linear-gradient(180deg, #06060d 0%, #0a0a14 55%, #07070f 100%)'
    : 'linear-gradient(180deg, #fdfcf9 0%, #f5f3ef 55%, #faf9f6 100%)';
  const gridLine = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(17,24,39,0.06)';
  const red = darkMode ? 'rgba(228,30,32,0.22)' : 'rgba(228,30,32,0.10)';
  const yellow = darkMode ? 'rgba(255,206,0,0.12)' : 'rgba(255,206,0,0.15)';
  const vignette = darkMode
    ? 'inset 0 0 220px 50px rgba(0,0,0,0.55)'
    : 'inset 0 0 180px 30px rgba(92,72,48,0.10)';

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ background: base }}
    >
      {/* Two soft brand glows, drifting on long lazy loops */}
      <div
        className="ns-bg-glow absolute rounded-full"
        style={{
          width: '72vmax',
          height: '72vmax',
          left: '-14vmax',
          top: '-20vmax',
          background: `radial-gradient(circle, ${red} 0%, transparent 62%)`,
          animation: 'ns-drift-a 46s ease-in-out infinite',
        }}
      />
      <div
        className="ns-bg-glow absolute rounded-full"
        style={{
          width: '60vmax',
          height: '60vmax',
          right: '-16vmax',
          bottom: '-14vmax',
          background: `radial-gradient(circle, ${yellow} 0%, transparent 64%)`,
          animation: 'ns-drift-b 61s ease-in-out infinite',
        }}
      />

      {/* Fine engineering grid, strongest up top, gone by the fold */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(180deg, black 0%, rgba(0,0,0,0.55) 55%, transparent 94%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, rgba(0,0,0,0.55) 55%, transparent 94%)',
        }}
      />

      {/* Paper grain — keeps the flat gradients from looking plastic */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px', opacity: darkMode ? 0.03 : 0.045 }}
      />

      {/* Vignette for depth */}
      <div className="absolute inset-0" style={{ boxShadow: vignette }} />
    </div>
  );
});
