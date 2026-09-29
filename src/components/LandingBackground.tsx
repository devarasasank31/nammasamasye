'use client';

import { memo, useEffect, useState } from 'react';
import { heritage } from '@/lib/heritage';

// Fixed, full-viewport backdrop that cross-fades through seven scenes of
// Karnataka as the page is scrolled. Everything is inline SVG so nothing is
// fetched, nothing can 404, and it stays sharp at any size.

const PARTICLES = [
  { l: 6, t: 18, d: 0 }, { l: 17, t: 62, d: 1.4 }, { l: 26, t: 30, d: 2.6 },
  { l: 34, t: 74, d: 0.7 }, { l: 43, t: 22, d: 3.1 }, { l: 52, t: 56, d: 1.9 },
  { l: 61, t: 34, d: 2.2 }, { l: 69, t: 78, d: 0.4 }, { l: 77, t: 26, d: 3.6 },
  { l: 86, t: 60, d: 1.1 }, { l: 93, t: 38, d: 2.8 }, { l: 48, t: 88, d: 1.6 },
];

interface SceneProps {
  index: number;
  tone: string;
  glow: string;
}

function Badami({ tone }: { tone: string }) {
  const caves = [300, 640, 980];
  return (
    <g>
      <path
        d="M0,520 L0,236 L70,222 L140,244 L215,208 L300,236 L385,204 L470,242 L560,214 L650,242 L745,220 L835,248 L925,226 L1015,252 L1105,230 L1195,254 L1285,234 L1375,258 L1440,240 L1440,520 Z"
        fill={tone}
      />
      <path
        d="M0,300 L120,290 L240,306 L360,288 L480,304 L600,286 L720,302 L840,284 L960,304 L1080,288 L1200,306 L1320,292 L1440,308 L1440,340 L0,340 Z"
        fill="rgba(0,0,0,0.16)"
      />
      {caves.map(x => (
        <path key={x} d={`M${x},470 L${x},378 A52,52 0 0 1 ${x + 104},378 L${x + 104},470 Z`} fill="rgba(0,0,0,0.55)" />
      ))}
      {caves.map(x => (
        <rect key={`c${x}`} x={x + 40} y={400} width={24} height={70} fill="rgba(0,0,0,0.35)" />
      ))}
      <rect x="0" y="468" width="1440" height="52" fill="rgba(255,255,255,0.10)" />
      <rect x="140" y="486" width="360" height="3" fill="rgba(255,255,255,0.22)" />
      <rect x="720" y="500" width="480" height="3" fill="rgba(255,255,255,0.16)" />
    </g>
  );
}

function Hampi({ tone }: { tone: string }) {
  const boulders = [
    { x: 60, y: 430, rx: 90, ry: 62 }, { x: 210, y: 452, rx: 74, ry: 48 },
    { x: 1240, y: 434, rx: 96, ry: 66 }, { x: 1380, y: 456, rx: 70, ry: 46 },
    { x: 470, y: 464, rx: 64, ry: 40 }, { x: 960, y: 468, rx: 58, ry: 36 },
  ];
  return (
    <g>
      {boulders.map((b, i) => (
        <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={tone} />
      ))}
      <g fill={tone}>
        <rect x="640" y="300" width="160" height="180" />
        <rect x="656" y="264" width="128" height="44" />
        <rect x="672" y="232" width="96" height="38" />
        <rect x="688" y="204" width="64" height="34" />
        <rect x="704" y="180" width="32" height="30" />
        <path d="M720,150 L744,180 L696,180 Z" />
        <rect x="600" y="440" width="240" height="40" />
        <rect x="580" y="470" width="280" height="18" />
      </g>
      <path d="M700,480 L700,410 A20,20 0 0 1 740,410 L740,480 Z" fill="rgba(0,0,0,0.5)" />
      <rect x="666" y="330" width="26" height="46" fill="rgba(0,0,0,0.4)" />
      <rect x="748" y="330" width="26" height="46" fill="rgba(0,0,0,0.4)" />
      <rect x="0" y="486" width="1440" height="34" fill="rgba(0,0,0,0.22)" />
    </g>
  );
}

function MysorePalace({ tone }: { tone: string }) {
  const minarets = [180, 340, 1100, 1260];
  return (
    <g>
      <g fill={tone}>
        <rect x="380" y="330" width="680" height="150" />
        <rect x="350" y="452" width="740" height="30" />
        <rect x="330" y="478" width="780" height="24" />
        <rect x="560" y="286" width="320" height="60" />
        <path d="M720,150 C790,150 830,206 830,252 C830,282 786,300 720,300 C654,300 610,282 610,252 C610,206 650,150 720,150 Z" />
        <rect x="712" y="118" width="16" height="40" />
        <circle cx="720" cy="112" r="12" />
        {minarets.map(x => (
          <g key={x}>
            <rect x={x} y="250" width="34" height="230" />
            <path d={`M${x + 17},214 C${x + 40},214 ${x + 50},244 ${x + 50},262 L${x - 16},262 C${x - 16},244 ${x - 6},214 ${x + 17},214 Z`} />
            <rect x={x - 8} y="360" width="50" height="14" />
          </g>
        ))}
        {[470, 560, 650, 790, 880, 970].map(x => (
          <path key={x} d={`M${x},470 L${x},404 A34,34 0 0 1 ${x + 68},404 L${x + 68},470 Z`} fill="rgba(0,0,0,0.42)" />
        ))}
      </g>
      <rect x="0" y="496" width="1440" height="24" fill="rgba(0,0,0,0.24)" />
    </g>
  );
}

function Tipu({ tone }: { tone: string }) {
  const crenels = Array.from({ length: 36 }, (_, i) => i * 40 + 8);
  return (
    <g>
      <g fill="rgba(0,0,0,0.30)">
        <circle cx="250" cy="366" r="62" />
        <rect x="243" y="366" width="14" height="124" />
        <circle cx="1180" cy="352" r="74" />
        <rect x="1172" y="352" width="16" height="138" />
      </g>
      <g fill={tone}>
        <rect x="0" y="404" width="1440" height="88" />
        <rect x="0" y="386" width="1440" height="22" />
        {crenels.map(x => (
          <rect key={x} x={x} y="366" width="22" height="22" />
        ))}
        <rect x="560" y="300" width="320" height="106" />
        <path d="M720,258 L744,300 L696,300 Z" />
        <rect x="548" y="394" width="344" height="16" />
      </g>
      {[160, 480, 800, 1120, 1300].map(x => (
        <path key={x} d={`M${x},492 L${x},438 A38,38 0 0 1 ${x + 76},438 L${x + 76},492 Z`} fill="rgba(0,0,0,0.5)" />
      ))}
      <rect x="0" y="492" width="1440" height="28" fill="rgba(0,0,0,0.26)" />
    </g>
  );
}

function Formation({ tone }: { tone: string }) {
  const columns = Array.from({ length: 22 }, (_, i) => i * 46 + 150);
  return (
    <g>
      <g fill={tone}>
        <rect x="120" y="352" width="1200" height="120" />
        <rect x="96" y="458" width="1248" height="34" />
        <rect x="70" y="486" width="1300" height="26" />
        <rect x="620" y="272" width="200" height="84" />
        <path d="M720,166 C778,166 812,214 812,250 C812,274 776,288 720,288 C664,288 628,274 628,250 C628,214 662,166 720,166 Z" />
        <rect x="712" y="132" width="16" height="38" />
        <path d="M720,96 L744,132 L696,132 Z" />
        {columns.map(x => (
          <rect key={x} x={x} y="374" width="18" height="86" />
        ))}
      </g>
      <rect x="1240" y="150" width="6" height="340" fill={tone} />
      <g>
        <rect x="1246" y="154" width="130" height="44" fill="#e41e20" />
        <rect x="1246" y="198" width="130" height="44" fill="#ffce00" />
      </g>
      <rect x="0" y="508" width="1440" height="14" fill="rgba(0,0,0,0.26)" />
    </g>
  );
}

function Metro({ tone }: { tone: string }) {
  const towers = [
    { x: 40, w: 120, h: 240 }, { x: 190, w: 90, h: 180 }, { x: 300, w: 140, h: 300 },
    { x: 470, w: 80, h: 150 }, { x: 900, w: 110, h: 260 }, { x: 1030, w: 150, h: 320 },
    { x: 1210, w: 90, h: 200 }, { x: 1320, w: 120, h: 270 },
  ];
  const pillars = [90, 330, 570, 810, 1050, 1290];
  return (
    <g>
      <g fill="rgba(0,0,0,0.34)">
        {towers.map((t, i) => (
          <rect key={i} x={t.x} y={470 - t.h} width={t.w} height={t.h} />
        ))}
      </g>
      <g fill="rgba(255,255,255,0.14)">
        {towers.map((t, i) =>
          Array.from({ length: Math.floor(t.h / 46) }, (_, r) => (
            <rect key={`${i}-${r}`} x={t.x + 14} y={470 - t.h + 18 + r * 46} width={t.w - 28} height={12} />
          ))
        )}
      </g>
      <g fill={tone}>
        {pillars.map(x => (
          <rect key={x} x={x} y="366" width="46" height="126" />
        ))}
        <rect x="0" y="336" width="1440" height="34" />
        <rect x="0" y="326" width="1440" height="12" />
      </g>
      <g>
        <rect x="430" y="278" width="560" height="50" rx="24" fill={tone} />
        <rect x="430" y="278" width="560" height="14" rx="7" fill="rgba(255,255,255,0.16)" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect key={i} x={462 + i * 88} y="296" width="60" height="20" rx="6" fill="rgba(255,255,255,0.30)" />
        ))}
        <circle cx="560" cy="332" r="10" fill="rgba(0,0,0,0.5)" />
        <circle cx="860" cy="332" r="10" fill="rgba(0,0,0,0.5)" />
      </g>
      <rect x="0" y="490" width="1440" height="30" fill="rgba(0,0,0,0.30)" />
    </g>
  );
}

function Today({ tone, glow }: { tone: string; glow: string }) {
  const towers = [
    { x: 0, w: 130, h: 300 }, { x: 150, w: 80, h: 210 }, { x: 250, w: 120, h: 360 },
    { x: 390, w: 90, h: 240 }, { x: 500, w: 140, h: 410 }, { x: 660, w: 70, h: 190 },
    { x: 750, w: 110, h: 330 }, { x: 880, w: 95, h: 250 }, { x: 995, w: 130, h: 390 },
    { x: 1145, w: 85, h: 220 }, { x: 1250, w: 115, h: 340 }, { x: 1385, w: 55, h: 260 },
  ];
  const windows = [
    [30, 210], [70, 250], [100, 190], [175, 290], [275, 320], [310, 260], [345, 360],
    [415, 300], [525, 370], [565, 300], [600, 420], [680, 260], [775, 300], [810, 360],
    [905, 320], [1020, 350], [1060, 280], [1170, 300], [1280, 380], [1320, 300],
  ];
  return (
    <g>
      <g fill={tone}>
        {towers.map((t, i) => (
          <rect key={i} x={t.x} y={470 - t.h} width={t.w} height={t.h} />
        ))}
        <path d="M500,60 L510,60 L510,60 Z" />
        <rect x="560" y="40" width="6" height="40" />
        <circle cx="563" cy="34" r="7" fill={glow} />
      </g>
      <g fill={glow}>
        {windows.map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="16" height="10" opacity={i % 3 === 0 ? 0.85 : 0.45} />
        ))}
      </g>
      <g fill="rgba(0,0,0,0.45)">
        <circle cx="180" cy="440" r="46" />
        <rect x="174" y="440" width="12" height="52" />
        <circle cx="1330" cy="434" r="54" />
        <rect x="1323" y="434" width="14" height="58" />
      </g>
      <rect x="0" y="492" width="1440" height="28" fill="rgba(0,0,0,0.34)" />
    </g>
  );
}

const Scene = memo(function Scene({ index, tone, glow }: SceneProps) {
  return (
    <svg
      viewBox="0 0 1440 520"
      preserveAspectRatio="xMidYMax slice"
      className="absolute bottom-0 left-0 w-full"
      style={{ height: 'min(74vh, 620px)' }}
      aria-hidden="true"
      focusable="false"
    >
      {index === 0 && <Badami tone={tone} />}
      {index === 1 && <Hampi tone={tone} />}
      {index === 2 && <MysorePalace tone={tone} />}
      {index === 3 && <Tipu tone={tone} />}
      {index === 4 && <Formation tone={tone} />}
      {index === 5 && <Metro tone={tone} />}
      {index === 6 && <Today tone={tone} glow={glow} />}
    </svg>
  );
});

export default function LandingBackground({ darkMode }: { darkMode: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / max)));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const last = heritage.length - 1;
  const pos = progress * last;
  const tone = darkMode ? 'rgba(3,3,7,0.66)' : 'rgba(18,12,10,0.38)';
  const scrim = darkMode
    ? 'linear-gradient(180deg, rgba(5,5,9,0.45) 0%, rgba(5,5,9,0.55) 45%, rgba(5,5,9,0.72) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.66) 45%, rgba(255,255,255,0.80) 100%)';

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {heritage.map((stop, i) => {
        const opacity = Math.max(0, 1 - Math.abs(pos - i));
        if (opacity <= 0.001) return null;
        const drift = (i - pos) * 6;
        return (
          <div
            key={stop.title}
            className="absolute inset-0"
            style={{ opacity, transform: `translate3d(0, ${drift}vh, 0)` }}
          >
            <div className="absolute inset-0" style={{ background: stop.sky }} />
            <Scene index={i} tone={tone} glow={stop.glow} />
            <div className="absolute inset-0 hidden md:flex items-start justify-end pr-[5vw] pt-[14vh]">
              <span
                className="text-[11vw] font-extrabold leading-none tracking-tight select-none"
                style={{ color: stop.glow, opacity: 0.1 }}
              >
                {stop.native}
              </span>
            </div>
          </div>
        );
      })}

      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute w-1 h-1 rounded-full animate-pulse"
          style={{
            left: `${p.l}%`,
            top: `${p.t}%`,
            background: i % 3 === 0 ? '#ffce00' : '#e41e20',
            opacity: 0.5,
            animationDelay: `${p.d}s`,
          }}
        />
      ))}

      <div className="absolute inset-0" style={{ background: scrim }} />
    </div>
  );
}
