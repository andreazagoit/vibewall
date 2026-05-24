"use client";

import React from "react";

export type Palette = { id: string; name: string; colors: string[] };

export type PatternProps = {
  palette: string[];
  seed: number;
  warp: number;
  density: number;
  w?: number;
  h?: number;
  // pattern-specific extras
  cycles?: number;
  rayCount?: number;
  centerY?: number;
  rings?: number;
  slices?: number;
  turns?: number;
  hWeight?: number;
  rotation?: number;
  twist?: number;
  tilt?: number;
  cellAspect?: number;
  thickness?: number;
  curvature?: number;
  skew?: number;
  blobSize?: number;
};

function Warp({ id, seed, freq = 0.008, scale = 180 }: { id: string; seed: number; freq?: number; scale?: number }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={seed} stitchTiles="stitch" />
      <feDisplacementMap in="SourceGraphic" scale={scale} />
    </filter>
  );
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function starburstPath(cx: number, cy: number, rOuter: number, rInner: number, points: number, jitterSeed = 0) {
  let d = "";
  const rng = mulberry32(jitterSeed * 9973 + 1);
  for (let i = 0; i < points * 2; i++) {
    const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const isOut = i % 2 === 0;
    const base = isOut ? rOuter : rInner;
    const jit = 1 + (rng() - 0.5) * 0.15;
    const r = base * jit;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
  }
  return d + "Z";
}

// 1. TOPO WAVES
function TopoPattern({ palette, seed, warp, density, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const lines = [];
  const cx = W / 2, cy = H / 2;
  const max = (Math.hypot(W, H) / 2) * 1.6;
  const step = lerp(80, 30, density);
  for (let r = step / 2; r < max; r += step) {
    lines.push(<circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={fg} strokeWidth={step * 0.55} />);
  }
  const id = `wTopo-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.005 + 0.008 * (1 - density)} scale={lerp(80, 260, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{lines}</g>
    </svg>
  );
}

// 2. LIQUID STRIPES
function StripesPattern({ palette, seed, warp, density, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const stripes = [];
  const count = Math.round(lerp(8, 22, density));
  const sw = W / count;
  for (let i = 0; i < count; i += 2) {
    stripes.push(<rect key={i} x={i * sw - 60} y={-200} width={sw + 4} height={H + 400} fill={fg} />);
  }
  const id = `wStripes-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.006} scale={lerp(120, 320, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{stripes}</g>
    </svg>
  );
}

// 3. SUNBURST
function SunburstPattern({ palette, seed, warp, density, rayCount, centerY, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const rays = [];
  const count = rayCount ?? Math.round(lerp(20, 56, density));
  const cx = W / 2, cy = H * (centerY ?? 0.42);
  const reach = 2400;
  for (let i = 0; i < count; i++) {
    if (i % 2 === 1) continue;
    const a0 = (i / count) * Math.PI * 2;
    const a1 = ((i + 1) / count) * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * reach, y0 = cy + Math.sin(a0) * reach;
    const x1 = cx + Math.cos(a1) * reach, y1 = cy + Math.sin(a1) * reach;
    rays.push(<path key={i} d={`M${cx},${cy} L${x0},${y0} L${x1},${y1} Z`} fill={fg} />);
  }
  const id = `wSun-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.012} scale={lerp(40, 180, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{rays}</g>
    </svg>
  );
}

// 4. RADIAL CHECK
function RadialCheckPattern({ palette, seed, warp, density, rings: ringsP, slices: slicesP, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const cells = [];
  const rings = ringsP ?? Math.round(lerp(6, 14, density));
  const slices = slicesP ?? Math.round(lerp(16, 32, density));
  const maxR = 1600;
  const cx = W / 2, cy = H / 2;
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < slices; j++) {
      if ((i + j) % 2 === 0) continue;
      const r0 = (i / rings) * maxR;
      const r1 = ((i + 1) / rings) * maxR;
      const a0 = (j / slices) * Math.PI * 2;
      const a1 = ((j + 1) / slices) * Math.PI * 2;
      const x00 = cx + Math.cos(a0) * r0, y00 = cy + Math.sin(a0) * r0;
      const x01 = cx + Math.cos(a0) * r1, y01 = cy + Math.sin(a0) * r1;
      const x11 = cx + Math.cos(a1) * r1, y11 = cy + Math.sin(a1) * r1;
      const x10 = cx + Math.cos(a1) * r0, y10 = cy + Math.sin(a1) * r0;
      const path = `M${x00},${y00} L${x01},${y01} A${r1},${r1} 0 0 1 ${x11},${y11} L${x10},${y10} A${r0},${r0} 0 0 0 ${x00},${y00} Z`;
      cells.push(<path key={`${i}-${j}`} d={path} fill={fg} />);
    }
  }
  const id = `wRad-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.004} scale={lerp(30, 160, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{cells}</g>
    </svg>
  );
}

// 5. BUBBLE POP
function BubblePopPattern({ palette, seed, warp, density, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const rng = mulberry32(seed * 7919);
  const count = Math.round(lerp(6, 18, density));
  const blobs = [];
  for (let i = 0; i < count; i++) {
    const cx = rng() * W;
    const cy = rng() * H;
    const rOuter = lerp(120, 320, rng());
    const rInner = rOuter * lerp(0.7, 0.9, rng());
    const pts = Math.round(lerp(7, 14, rng()));
    const d = starburstPath(cx, cy, rOuter, rInner, pts, seed + i);
    blobs.push(<path key={i} d={d} fill={fg} opacity={Number(lerp(0.85, 1, rng()).toFixed(2))} />);
  }
  const id = `wBlb-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.018} scale={lerp(0, 80, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={warp > 0 ? `url(#${id})` : undefined}>{blobs}</g>
    </svg>
  );
}

// 6. WAVY STRIPES
function WavyStripesPattern({ palette, seed, warp, density, cycles: cyclesP, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const count = Math.round(lerp(6, 16, density));
  const bandH = H / count;
  const amp = lerp(20, 220, warp);
  const cycles = cyclesP ?? lerp(1.2, 3.8, density);
  const phase = ((seed % 100) / 100) * Math.PI * 2;
  const bands = [];
  const steps = 40;
  for (let i = 0; i < count; i += 2) {
    let d = `M -80,${i * bandH - 60}`;
    for (let s = 0; s <= steps; s++) {
      const x = -80 + (W + 160) * (s / steps);
      const y = i * bandH + Math.sin((s / steps) * Math.PI * cycles + phase + i * 0.4) * amp;
      d += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    }
    for (let s = steps; s >= 0; s--) {
      const x = -80 + (W + 160) * (s / steps);
      const y = (i + 1) * bandH + Math.sin((s / steps) * Math.PI * cycles + phase + (i + 1) * 0.4) * amp;
      d += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    }
    d += " Z";
    bands.push(<path key={i} d={d} fill={fg} />);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width={W} height={H} fill={bg} />
      {bands}
    </svg>
  );
}

// 7. HALFTONE DOTS
function HalftoneDotsPattern({ palette, seed, warp, density, centerY, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const cols = Math.round(lerp(10, 22, density));
  const cellSize = W / cols;
  const rows = Math.ceil(H / cellSize) + 2;
  const cx = W / 2, cy = H * (centerY ?? 0.42);
  const maxD = Math.hypot(W, H) * 0.55;
  const dots = [];
  for (let y = -1; y < rows; y++) {
    for (let x = -1; x < cols + 1; x++) {
      const px = (x + 0.5) * cellSize + (y % 2 === 0 ? cellSize / 2 : 0);
      const py = (y + 0.5) * cellSize;
      const d = Math.hypot(px - cx, py - cy) / maxD;
      const t = Math.max(0, Math.min(1, d));
      const baseR = cellSize * 0.48 * (1 - t * lerp(0.2, 0.95, warp));
      if (baseR < 1) continue;
      dots.push(<circle key={`${x}-${y}`} cx={px} cy={py} r={Number(baseR.toFixed(2))} fill={fg} />);
    }
  }
  // seed referenced for stable signature
  void seed;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width={W} height={H} fill={bg} />
      {dots}
    </svg>
  );
}

// 8. SPIRAL
function SpiralPattern({ palette, seed, warp, density, turns: turnsP, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const cx = W / 2, cy = H / 2;
  const turns = turnsP ?? lerp(6, 14, density);
  const points = 700;
  const maxR = 1500;
  const phase = ((seed % 100) / 100) * Math.PI * 2;
  let d = "";
  for (let i = 0; i <= points; i++) {
    const tt = i / points;
    const angle = tt * turns * Math.PI * 2 + phase;
    const r = tt * maxR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
  }
  const strokeW = (maxR / turns) * 0.5;
  const id = `wSpi-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.006} scale={lerp(0, 220, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={warp > 0.02 ? `url(#${id})` : undefined}>
        <path d={d} fill="none" stroke={fg} strokeWidth={strokeW} strokeLinecap="round" />
      </g>
    </svg>
  );
}

// 9. MARBLE
function MarblePattern({ palette, seed, warp, density, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const id = `mrbl-${seed}`;
  const maskId = `mrblM-${seed}`;
  const freq = lerp(0.0035, 0.014, density);
  const contrast = lerp(20, 90, warp);
  const bias = -contrast * 0.5 + 0.5;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={id} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={seed} stitchTiles="stitch" />
          <feColorMatrix values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${contrast} ${bias}`} />
        </filter>
        <mask id={maskId}>
          <rect width={W} height={H} fill="black" />
          <rect width={W} height={H} filter={`url(#${id})`} />
        </mask>
      </defs>
      <rect width={W} height={H} fill={bg} />
      <rect width={W} height={H} fill={fg} mask={`url(#${maskId})`} />
    </svg>
  );
}

// 10. PLAID
function PlaidPattern({ palette, seed, warp, density, hWeight, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const count = Math.round(lerp(6, 14, density));
  const sw = W / count;
  const id = `wPld-${seed}`;
  const vStripes = [];
  const hStripes = [];
  for (let i = 0; i < count; i += 2) {
    vStripes.push(<rect key={`v${i}`} x={i * sw - 30} y={-100} width={sw + 2} height={H + 200} fill={fg} />);
  }
  const rowH = H / count;
  const hOp = Number((hWeight ?? 0.45).toFixed(2));
  for (let i = 1; i < count; i += 2) {
    hStripes.push(<rect key={`h${i}`} x={-100} y={i * rowH} width={W + 200} height={rowH + 2} fill={fg} opacity={hOp} />);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.006} scale={lerp(30, 200, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>
        {vStripes}
        {hStripes}
      </g>
    </svg>
  );
}

// 11. CONCENTRIC RINGS
function ConcentricRingsPattern({ palette, seed, warp, density, rings: ringsP, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const rings = ringsP ?? Math.round(lerp(6, 16, density));
  const cx = W / 2, cy = H / 2;
  const maxR = (Math.hypot(W, H) / 2) * 1.5;
  const ringW = maxR / rings;
  const circles = [];
  for (let i = rings; i >= 0; i--) {
    const r = i * ringW;
    circles.push(<circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 === 0 ? fg : bg} />);
  }
  const id = `wCR-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.005} scale={lerp(0, 240, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{circles}</g>
    </svg>
  );
}

// 12. PIE SLICES
function PieSlicesPattern({ palette, seed, warp, density, slices: slicesP, rotation, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const slices = slicesP ?? Math.round(lerp(6, 18, density));
  const cx = W / 2, cy = H / 2;
  const reach = Math.hypot(W, H);
  const phase = rotation != null ? (rotation * Math.PI) / 180 : ((seed % 100) / 100) * Math.PI * 2;
  const wedges = [];
  for (let i = 0; i < slices; i++) {
    if (i % 2 === 1) continue;
    const a0 = (i / slices) * Math.PI * 2 + phase;
    const a1 = ((i + 1) / slices) * Math.PI * 2 + phase;
    const x0 = cx + Math.cos(a0) * reach, y0 = cy + Math.sin(a0) * reach;
    const x1 = cx + Math.cos(a1) * reach, y1 = cy + Math.sin(a1) * reach;
    wedges.push(<path key={i} d={`M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} Z`} fill={fg} />);
  }
  const id = `wPie-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.006} scale={lerp(0, 240, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{wedges}</g>
    </svg>
  );
}

// 13. SPIRAL CHECK
function SpiralCheckPattern({ palette, seed, warp, density, rings: ringsP, slices: slicesP, twist: twistP, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const cells = [];
  const rings = ringsP ?? Math.round(lerp(7, 15, density));
  const slices = slicesP ?? Math.round(lerp(14, 30, density));
  const maxR = Math.hypot(W, H) * 0.6;
  const cx = W / 2, cy = H / 2;
  const twist = (Math.PI / slices) * (twistP ?? lerp(0.5, 4, density));
  for (let i = 0; i < rings; i++) {
    const ringOffset = i * twist;
    for (let j = 0; j < slices; j++) {
      if ((i + j) % 2 === 0) continue;
      const r0 = (i / rings) * maxR;
      const r1 = ((i + 1) / rings) * maxR;
      const a0 = (j / slices) * Math.PI * 2 + ringOffset;
      const a1 = ((j + 1) / slices) * Math.PI * 2 + ringOffset;
      const x00 = cx + Math.cos(a0) * r0, y00 = cy + Math.sin(a0) * r0;
      const x01 = cx + Math.cos(a0) * r1, y01 = cy + Math.sin(a0) * r1;
      const x11 = cx + Math.cos(a1) * r1, y11 = cy + Math.sin(a1) * r1;
      const x10 = cx + Math.cos(a1) * r0, y10 = cy + Math.sin(a1) * r0;
      const path = `M${x00.toFixed(1)},${y00.toFixed(1)} L${x01.toFixed(1)},${y01.toFixed(1)} A${r1.toFixed(1)},${r1.toFixed(1)} 0 0 1 ${x11.toFixed(1)},${y11.toFixed(1)} L${x10.toFixed(1)},${y10.toFixed(1)} A${r0.toFixed(1)},${r0.toFixed(1)} 0 0 0 ${x00.toFixed(1)},${y00.toFixed(1)} Z`;
      cells.push(<path key={`${i}-${j}`} d={path} fill={fg} />);
    }
  }
  const id = `wSpc-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.004} scale={lerp(20, 180, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{cells}</g>
    </svg>
  );
}

// 14. DIAMOND CHECK
function DiamondCheckPattern({ palette, seed, warp, density, tilt, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const cells = [];
  const cols = Math.round(lerp(8, 16, density));
  const cellSize = (Math.max(W, H) * 1.6) / cols;
  const rows = Math.ceil((Math.max(W, H) * 1.6) / cellSize);
  for (let y = -2; y < rows + 2; y++) {
    for (let x = -2; x < cols + 2; x++) {
      if ((x + y) % 2 === 0) continue;
      cells.push(<rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize + 0.6} height={cellSize + 0.6} fill={fg} />);
    }
  }
  const id = `wDmd-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.005} scale={lerp(20, 220, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g transform={`rotate(${tilt ?? 45} ${W / 2} ${H / 2}) translate(${-cols * cellSize * 0.3} ${-rows * cellSize * 0.3})`} filter={`url(#${id})`}>{cells}</g>
    </svg>
  );
}

// 15. HORIZONTAL GRID
function HorizontalGridPattern({ palette, seed, warp, density, cellAspect, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const ar = cellAspect ?? 0.5;
  const total = lerp(50, 220, density);
  const targetH = Math.sqrt((W * H) / (total * ar));
  const targetW = targetH * ar;
  const rows = Math.max(2, Math.round(H / targetH));
  const cols = Math.max(2, Math.round(W / targetW));
  const cellH = H / rows;
  const cellW = W / cols;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 1) continue;
      cells.push(<rect key={`${r}-${c}`} x={c * cellW - 0.5} y={r * cellH - 0.5} width={cellW + 1} height={cellH + 1} fill={fg} />);
    }
  }
  const id = `wHG-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.005} scale={lerp(10, 180, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{cells}</g>
    </svg>
  );
}

// 16. LINES GRID
function LinesGridPattern({ palette, seed, warp, density, thickness, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const rows = Math.round(lerp(8, 18, density));
  const cols = Math.round(lerp(5, 12, density));
  const cellH = H / rows;
  const cellW = W / cols;
  const lineW = thickness ?? Math.max(3, Math.min(cellH, cellW) * 0.12);
  const lines = [];
  for (let r = 0; r <= rows; r++) {
    lines.push(<rect key={`h${r}`} x={-50} y={r * cellH - lineW / 2} width={W + 100} height={lineW} fill={fg} />);
  }
  for (let c = 0; c <= cols; c++) {
    lines.push(<rect key={`v${c}`} x={c * cellW - lineW / 2} y={-50} width={lineW} height={H + 100} fill={fg} />);
  }
  const id = `wLG-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.006} scale={lerp(20, 220, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{lines}</g>
    </svg>
  );
}

// 17. GLOBE GRID
function GlobeGridPattern({ palette, seed, warp, density, curvature, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const rows = Math.round(lerp(8, 18, density));
  const cols = Math.round(lerp(5, 12, density));
  const cellH = H / rows;
  const cellW = W / cols;
  const cx = W / 2, cy = H / 2;
  const maxR = Math.hypot(W, H) / 2;
  const k = curvature ?? 0.8;
  const transform = (x: number, y: number): [number, number] => {
    const dx = x - cx, dy = y - cy;
    const r2 = (dx * dx + dy * dy) / (maxR * maxR);
    const factor = 1 / (1 + k * r2);
    return [cx + dx * factor, cy + dy * factor];
  };
  const margin = Math.ceil(Math.max(rows, cols) * 0.9);
  const cells = [];
  for (let r = -margin; r < rows + margin; r++) {
    for (let c = -margin; c < cols + margin; c++) {
      if ((((r + c) % 2) + 2) % 2 === 1) continue;
      const x0 = c * cellW, y0 = r * cellH;
      const x1 = (c + 1) * cellW, y1 = (r + 1) * cellH;
      const [p1x, p1y] = transform(x0, y0);
      const [p2x, p2y] = transform(x1, y0);
      const [p3x, p3y] = transform(x1, y1);
      const [p4x, p4y] = transform(x0, y1);
      const d = `M${p1x.toFixed(1)},${p1y.toFixed(1)} L${p2x.toFixed(1)},${p2y.toFixed(1)} L${p3x.toFixed(1)},${p3y.toFixed(1)} L${p4x.toFixed(1)},${p4y.toFixed(1)} Z`;
      cells.push(<path key={`${r}-${c}`} d={d} fill={fg} />);
    }
  }
  const id = `wGlb-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.005} scale={lerp(0, 180, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={warp > 0.02 ? `url(#${id})` : undefined}>{cells}</g>
    </svg>
  );
}

// 18. SKEW GRID
function SkewGridPattern({ palette, seed, warp, density, skew, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const rows = Math.round(lerp(10, 22, density));
  const cols = Math.round(lerp(4, 9, density));
  const cellH = H / rows;
  const cellW = W / cols;
  const skewDeg = skew ?? 25;
  const dir = seed % 2 === 0 ? 1 : -1;
  const shear = Math.tan((skewDeg * Math.PI) / 180) * dir;
  const halfH = H / 2;
  const maxShearX = Math.abs(halfH * shear);
  const padCols = Math.ceil(maxShearX / cellW) + 1;
  const cells = [];
  for (let r = -1; r < rows + 1; r++) {
    for (let c = -padCols; c < cols + padCols; c++) {
      if ((((r + c) % 2) + 2) % 2 === 1) continue;
      const y0 = r * cellH, y1 = (r + 1) * cellH;
      const sxTop = (y0 - halfH) * shear;
      const sxBot = (y1 - halfH) * shear;
      const x0 = c * cellW, x1 = (c + 1) * cellW;
      const pts = `${(x0 + sxTop).toFixed(1)},${y0.toFixed(1)} ${(x1 + sxTop).toFixed(1)},${y0.toFixed(1)} ${(x1 + sxBot).toFixed(1)},${y1.toFixed(1)} ${(x0 + sxBot).toFixed(1)},${y1.toFixed(1)}`;
      cells.push(<polygon key={`${r}-${c}`} points={pts} fill={fg} />);
    }
  }
  const id = `wSkw-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.005} scale={lerp(0, 180, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={warp > 0.02 ? `url(#${id})` : undefined}>{cells}</g>
    </svg>
  );
}

// 19. TWIST GRID
function TwistGridPattern({ palette, seed, warp, density, twist, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const rows = Math.round(lerp(8, 18, density));
  const cols = Math.round(lerp(5, 10, density));
  const cellH = H / rows;
  const cellW = W / cols;
  const cx = W / 2, cy = H / 2;
  const twistRange = twist ?? 0.7;
  const dir = seed % 2 === 0 ? 1 : -1;
  const rotate = (x: number, y: number): [number, number] => {
    const angle = ((y - cy) / H) * twistRange * dir;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const dx = x - cx, dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  };
  const padCols = Math.ceil(cols * 0.9);
  const padRows = Math.ceil(rows * 0.4);
  const cells = [];
  for (let r = -padRows; r < rows + padRows; r++) {
    for (let c = -padCols; c < cols + padCols; c++) {
      if ((((r + c) % 2) + 2) % 2 === 1) continue;
      const x0 = c * cellW, x1 = (c + 1) * cellW;
      const y0 = r * cellH, y1 = (r + 1) * cellH;
      const p1 = rotate(x0, y0);
      const p2 = rotate(x1, y0);
      const p3 = rotate(x1, y1);
      const p4 = rotate(x0, y1);
      const pts = `${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} ${p3[0].toFixed(1)},${p3[1].toFixed(1)} ${p4[0].toFixed(1)},${p4[1].toFixed(1)}`;
      cells.push(<polygon key={`${r}-${c}`} points={pts} fill={fg} />);
    }
  }
  const id = `wTwt-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><Warp id={id} seed={seed} freq={0.005} scale={lerp(0, 180, warp)} /></defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={warp > 0.02 ? `url(#${id})` : undefined}>{cells}</g>
    </svg>
  );
}

// 20. MELT GRID
function MeltGridPattern({ palette, seed, warp, density, blobSize, w = 1080, h = 1920 }: PatternProps) {
  const W = w, H = h;
  const [fg, bg] = palette;
  const rows = Math.round(lerp(14, 32, density));
  const cols = Math.round(lerp(5, 12, density));
  const cellH = H / rows;
  const cellW = W / cols;
  const cells = [];
  for (let r = -2; r < rows + 2; r++) {
    for (let c = -3; c < cols + 3; c++) {
      if ((((r + c) % 2) + 2) % 2 === 1) continue;
      cells.push(<rect key={`${r}-${c}`} x={c * cellW - 0.5} y={r * cellH - 0.5} width={cellW + 1} height={cellH + 1} fill={fg} />);
    }
  }
  const id = `wMlt-${seed}`;
  const dispScale = lerp(80, 480, warp);
  const baseFreq = 0.006 / (blobSize ?? 1.5);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency={baseFreq} numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feDisplacementMap in="SourceGraphic" scale={dispScale} />
        </filter>
      </defs>
      <rect width={W} height={H} fill={bg} />
      <g filter={`url(#${id})`}>{cells}</g>
    </svg>
  );
}

// === Param formatters ===
const _intFmt = (v: number) => Math.round(v).toString();
const _degFmt = (v: number) => Math.round(v) + "°";
const _pctFmt = (v: number) => Math.round(v * 100) + "%";
const _f2Fmt = (v: number) => (+v).toFixed(2);
const _f1Fmt = (v: number) => (+v).toFixed(1);
const _pxFmt = (v: number) => Math.round(v) + "px";

export type PatternParam = {
  id: keyof PatternProps;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  format: (v: number) => string;
};

export type PatternDef = {
  label: string;
  render: React.ComponentType<PatternProps>;
  params: PatternParam[];
};

export const PATTERNS: Record<string, PatternDef> = {
  topo:        { label: "Topo Waves",     render: TopoPattern,            params: [] },
  stripes:     { label: "Liquid Stripes", render: StripesPattern,         params: [] },
  wavy:        { label: "Wavy Bands",     render: WavyStripesPattern,     params: [
    { id: "cycles", label: "Cycles", min: 0.5, max: 6, step: 0.1, default: 2.5, format: _f1Fmt },
  ] },
  sunburst:    { label: "Sunburst",       render: SunburstPattern,        params: [
    { id: "rayCount", label: "Rays", min: 10, max: 80, step: 2, default: 36, format: _intFmt },
    { id: "centerY",  label: "Center Y", min: 0, max: 1, step: 0.01, default: 0.42, format: _pctFmt },
  ] },
  radial:      { label: "Radial Check",   render: RadialCheckPattern,     params: [
    { id: "rings",  label: "Rings",  min: 3, max: 22, step: 1, default: 10, format: _intFmt },
    { id: "slices", label: "Slices", min: 6, max: 48, step: 1, default: 24, format: _intFmt },
  ] },
  bubble:      { label: "Bubble Pop",     render: BubblePopPattern,       params: [] },
  halftone:    { label: "Halftone",       render: HalftoneDotsPattern,    params: [
    { id: "centerY", label: "Center Y", min: 0, max: 1, step: 0.01, default: 0.42, format: _pctFmt },
  ] },
  spiral:      { label: "Spiral",         render: SpiralPattern,          params: [
    { id: "turns", label: "Turns", min: 3, max: 22, step: 0.5, default: 9, format: _f1Fmt },
  ] },
  marble:      { label: "Marble",         render: MarblePattern,          params: [] },
  plaid:       { label: "Plaid",          render: PlaidPattern,           params: [
    { id: "hWeight", label: "H weight", min: 0, max: 1, step: 0.01, default: 0.45, format: _pctFmt },
  ] },
  rings:       { label: "Bullseye",       render: ConcentricRingsPattern, params: [
    { id: "rings", label: "Rings", min: 3, max: 26, step: 1, default: 12, format: _intFmt },
  ] },
  pie:         { label: "Pie Slices",     render: PieSlicesPattern,       params: [
    { id: "slices",   label: "Slices",   min: 3, max: 32, step: 1, default: 10, format: _intFmt },
    { id: "rotation", label: "Rotation", min: 0, max: 360, step: 1, default: 0, format: _degFmt },
  ] },
  spiralCheck: { label: "Spiral Check",   render: SpiralCheckPattern,     params: [
    { id: "rings",  label: "Rings",  min: 3, max: 20, step: 1, default: 11, format: _intFmt },
    { id: "slices", label: "Slices", min: 8, max: 40, step: 1, default: 22, format: _intFmt },
    { id: "twist",  label: "Twist",  min: 0, max: 4, step: 0.05, default: 2, format: _f2Fmt },
  ] },
  diamond:     { label: "Diamond Check",  render: DiamondCheckPattern,    params: [
    { id: "tilt", label: "Tilt", min: 0, max: 90, step: 1, default: 45, format: _degFmt },
  ] },
  hgrid:       { label: "Horizontal Grid", render: HorizontalGridPattern, params: [
    { id: "cellAspect", label: "Cell ratio", min: 0.2, max: 2, step: 0.05, default: 0.5, format: _f2Fmt },
  ] },
  linesGrid:   { label: "Lines Grid",     render: LinesGridPattern,       params: [
    { id: "thickness", label: "Thickness", min: 1, max: 40, step: 1, default: 6, format: _pxFmt },
  ] },
  globe:       { label: "Globe Grid",     render: GlobeGridPattern,       params: [
    { id: "curvature", label: "Curvature", min: 0, max: 3, step: 0.05, default: 0.8, format: _f2Fmt },
  ] },
  skew:        { label: "Skew Grid",      render: SkewGridPattern,        params: [
    { id: "skew", label: "Skew", min: 0, max: 60, step: 1, default: 25, format: _degFmt },
  ] },
  twist:       { label: "Twist Grid",     render: TwistGridPattern,       params: [
    { id: "twist", label: "Twist", min: 0, max: 2.5, step: 0.05, default: 0.7, format: _f2Fmt },
  ] },
  melt:        { label: "Melt Grid",      render: MeltGridPattern,        params: [
    { id: "blobSize", label: "Blob size", min: 0.4, max: 4, step: 0.1, default: 1.5, format: _f1Fmt },
  ] },
};

export const PATTERN_KEYS = Object.keys(PATTERNS);

export const PALETTES: Palette[] = [
  { id: "heat",      name: "Heat",       colors: ["#ff4a1a", "#ff2d95"] },
  { id: "bubblegum", name: "Bubblegum",  colors: ["#ff2db1", "#ff8acb"] },
  { id: "ultra",     name: "Ultra",      colors: ["#4b2bff", "#c9b8ff"] },
  { id: "lilac",     name: "Lilac",      colors: ["#a78dff", "#f1e6ff"] },
  { id: "acid",      name: "Acid",       colors: ["#caff2e", "#ff2bd1"] },
  { id: "cobalt",    name: "Cobalt",     colors: ["#2b5cff", "#cfe0ff"] },
  { id: "tangerine", name: "Tangerine",  colors: ["#ff7a1a", "#ffd166"] },
  { id: "noir",      name: "Midnight",   colors: ["#c2185b", "#1a1a22"] },
  { id: "mint",      name: "Mint Slap",  colors: ["#19c79a", "#e8fff6"] },
  { id: "blood",     name: "Blood Moon", colors: ["#ff1f3d", "#240307"] },
  { id: "vapor",     name: "Vapor",      colors: ["#ff7ad9", "#7af0ff"] },
  { id: "neon",      name: "Neon",       colors: ["#00ff9c", "#0a0a0a"] },
  { id: "cyber",     name: "Cyber",      colors: ["#fff200", "#0a1322"] },
  { id: "sunset",    name: "Sunset",     colors: ["#ff5a6e", "#ffd8a8"] },
  { id: "forest",    name: "Forest",     colors: ["#1f6e4a", "#fce8c2"] },
  { id: "lava",      name: "Lava",       colors: ["#ff3a0e", "#ffb800"] },
  { id: "ocean",     name: "Ocean",      colors: ["#0a8aa6", "#06203a"] },
  { id: "cream",     name: "Cream",      colors: ["#d4a373", "#fefae0"] },
  { id: "punk",      name: "Punk",       colors: ["#0a0a0a", "#ffeb3b"] },
  { id: "skyfall",   name: "Skyfall",    colors: ["#7ec8ff", "#0b1a3a"] },
  { id: "matcha",    name: "Matcha",     colors: ["#a7c957", "#2b3a1a"] },
  { id: "blush",     name: "Blush",      colors: ["#ffafc5", "#2a0a18"] },
  { id: "sand",      name: "Sand",       colors: ["#c9a37a", "#f4ecd8"] },
  { id: "stone",     name: "Stone",      colors: ["#8a857a", "#e8e2d4"] },
  { id: "greige",    name: "Greige",     colors: ["#a89986", "#f1ece2"] },
  { id: "mocha",     name: "Mocha",      colors: ["#7a5b46", "#e8d8c4"] },
  { id: "bone",      name: "Bone",       colors: ["#2a2622", "#f5efe6"] },
  { id: "olive",     name: "Olive",      colors: ["#6b6a3a", "#ede9d0"] },
  { id: "sage",      name: "Sage",       colors: ["#8aa085", "#e8e4d6"] },
  { id: "concrete",  name: "Concrete",   colors: ["#7a7a82", "#dadce0"] },
  { id: "clay",      name: "Clay",       colors: ["#b8765a", "#f0e0cc"] },
  { id: "ink",       name: "Ink",        colors: ["#1a1a1a", "#f4f0ea"] },
];
