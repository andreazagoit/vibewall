"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  PATTERNS,
  PATTERN_KEYS,
  PALETTES,
  mulberry32,
  starburstPath,
  type Palette,
  type PatternProps,
} from "./patterns";

type Format = { id: string; name: string; w: number; h: number };

const FORMATS: Format[] = [
  { id: "phone",     name: "Phone 9:16",     w: 1080, h: 1920 },
  { id: "iphone",    name: "iPhone Pro",     w: 1290, h: 2796 },
  { id: "android",   name: "Android",        w: 1080, h: 2400 },
  { id: "square",    name: "Square 1:1",     w: 1080, h: 1080 },
  { id: "post",      name: "Post 4:5",       w: 1080, h: 1350 },
  { id: "landscape", name: "Landscape 16:9", w: 1920, h: 1080 },
  { id: "desktop",   name: "2K Desktop",     w: 2560, h: 1440 },
  { id: "uhd",       name: "4K UHD",         w: 3840, h: 2160 },
];

type Extras = Partial<PatternProps>;

function Preview({
  patternKey, palette, seed, warp, density, format, extras,
}: {
  patternKey: string; palette: Palette; seed: number;
  warp: number; density: number; format: Format; extras: Extras;
}) {
  const Pattern = PATTERNS[patternKey].render;
  return (
    <div
      className="preview-frame"
      style={{
        aspectRatio: format.w + " / " + format.h,
        ["--ar" as string]: format.w / format.h,
        background: palette.colors[1],
      } as React.CSSProperties}
    >
      <Pattern
        palette={palette.colors}
        seed={seed}
        warp={warp}
        density={density}
        {...extras}
        w={format.w}
        h={format.h}
      />
    </div>
  );
}

function PatternThumb({
  patternKey, palette, active, onClick,
}: { patternKey: string; palette: Palette; active: boolean; onClick: () => void }) {
  const Pattern = PATTERNS[patternKey].render;
  return (
    <button
      onClick={onClick}
      className={`relative bg-bg-3 border-[1.5px] rounded-[10px] p-2 cursor-pointer transition-[border-color,transform] duration-100 flex flex-col gap-2 font-ui hover:border-[#555] hover:-translate-y-px ${
        active ? "border-accent shadow-[0_0_0_1.5px_var(--color-accent)]" : "border-line"
      }`}
    >
      <div className="aspect-square rounded-md overflow-hidden bg-black [&_svg]:w-full [&_svg]:h-full [&_svg]:block">
        <Pattern palette={palette.colors} seed={42} warp={0.5} density={0.5} />
      </div>
      <span className="font-hand text-base text-center text-ink pb-0.5">
        {PATTERNS[patternKey].label}
      </span>
    </button>
  );
}

function ColorPicker({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cp-color w-8 h-8 bg-none border-[1.5px] border-line rounded-lg p-0 cursor-pointer"
        />
        {/* key={value} remounts the input on external value change so the
            uncontrolled defaultValue resets — avoids syncing prop→state in an effect. */}
        <input
          key={value}
          type="text"
          defaultValue={value}
          onChange={(e) => {
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value);
          }}
          className="flex-1 min-w-0 bg-bg-2 border border-line text-ink font-mono text-xs px-2 py-1.5 rounded-md outline-none uppercase focus:border-accent"
        />
      </div>
    </div>
  );
}

function Slider({
  label, value, onChange, min = 0, max = 1, step = 0.01, format,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; format?: (v: number) => string;
}) {
  const display = format ? format(value) : Math.round(value * 100) + "";
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2 font-mono text-[11px] uppercase tracking-[1.2px] text-ink-dim">
        <span>{label}</span>
        <span className="text-ink">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded outline-none"
      />
    </div>
  );
}

function FormatPicker({
  format, setFormat,
}: { format: Format; setFormat: (f: Format) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const idx = FORMATS.findIndex((f) => f.id === format.id);
  const isCustom = idx === -1;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const updateCustom = (key: "w" | "h", val: string) => {
    const n = Math.max(64, Math.min(8000, parseInt(val) || 0));
    if (!n) return;
    setFormat({
      id: "custom", name: "Custom",
      w: key === "w" ? n : (isCustom ? format.w : 1080),
      h: key === "h" ? n : (isCustom ? format.h : 1920),
    });
  };

  return (
    <div className="format-picker relative flex items-center" ref={ref}>
      <button
        className="btn flex items-center gap-2"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Formato: ${format.name} ${format.w}×${format.h}`}
        title={`${format.name} · ${format.w}×${format.h}`}
      >
        <span
          className="inline-block bg-gradient-to-br from-accent to-accent-2 rounded-sm h-4 w-[11px] shrink-0"
          style={{ aspectRatio: format.w + " / " + format.h }}
        />
        <span className="text-[13px] font-semibold">Formato</span>
        <span className="text-ink-dim text-[11px] ml-0.5">▾</span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-bg-2 border border-line rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 min-w-[560px] max-w-[90vw] max-[560px]:min-w-0 max-[560px]:max-w-[calc(100vw-28px)]">
          <div className="grid grid-cols-4 gap-2 mb-3 max-[560px]:grid-cols-2">
            {FORMATS.map((f, i) => (
              <button
                key={f.id}
                onClick={() => { setFormat(f); setOpen(false); }}
                className={`bg-bg-3 border-[1.5px] rounded-lg pt-2.5 px-2 pb-2 cursor-pointer flex flex-col items-center gap-2 transition-colors duration-100 hover:border-[#555] ${
                  idx === i ? "border-accent shadow-[0_0_0_1.5px_var(--color-accent)]" : "border-line"
                }`}
              >
                <div className="h-12 grid place-items-center w-full">
                  <div
                    className="bg-gradient-to-br from-[#3a3a44] to-[#22222a] rounded-[3px] max-h-12 max-w-full h-full"
                    style={{ aspectRatio: f.w + " / " + f.h }}
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5 font-ui">
                  <span className="text-[11px] font-semibold text-ink">{f.name}</span>
                  <span className="font-mono text-[9.5px] text-ink-dim tracking-[0.4px]">{f.w} × {f.h}</span>
                </div>
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-2 px-3 py-2.5 bg-bg-3 border-[1.5px] rounded-lg ${
            isCustom ? "border-accent border-solid shadow-[0_0_0_1.5px_var(--color-accent)]" : "border-line border-dashed"
          }`}>
            <span className="font-hand text-base mr-1">Custom</span>
            <input
              type="number" min={64} max={8000} step={1}
              value={isCustom ? format.w : 1080}
              onChange={(e) => updateCustom("w", e.target.value)}
              className="no-spin w-20 bg-bg-2 border border-line text-ink font-mono text-xs px-2 py-1.5 rounded-md outline-none text-center focus:border-accent"
            />
            <span className="font-mono text-xs text-ink-dim">×</span>
            <input
              type="number" min={64} max={8000} step={1}
              value={isCustom ? format.h : 1920}
              onChange={(e) => updateCustom("h", e.target.value)}
              className="no-spin w-20 bg-bg-2 border border-line text-ink font-mono text-xs px-2 py-1.5 rounded-md outline-none text-center focus:border-accent"
            />
            <span className="font-mono text-xs text-ink-dim">px</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportModal({
  open, onClose, format, onDownloadPNG, onDownloadSVG,
}: {
  open: boolean; onClose: () => void; format: Format;
  onDownloadPNG: (f: Format) => void; onDownloadSVG: (f: Format) => void;
}) {
  const [fileType, setFileType] = useState<"png" | "svg">("png");
  if (!open) return null;
  const handleDownload = () => {
    if (fileType === "png") onDownloadPNG(format);
    else onDownloadSVG(format);
    onClose();
  };
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[rgba(5,5,8,0.72)] backdrop-blur-[8px] grid place-items-center z-[100] animate-[fadeIn_140ms_ease]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-2 border border-line rounded-[18px] p-6 w-[min(520px,calc(100vw-40px))] max-h-[calc(100vh-80px)] overflow-y-auto shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="flex justify-between items-center mb-[18px]">
          <h2 className="font-hand text-[28px] m-0 leading-none">Export</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-bg-3 border border-line text-ink rounded-full text-[22px] cursor-pointer grid place-items-center p-0 leading-none hover:bg-[#2a2a33]"
          >
            ×
          </button>
        </div>
        <div className="flex justify-between items-center px-3.5 py-3 bg-bg-3 border border-line rounded-[10px] mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-ink-dim">Size</span>
          <span className="font-ui text-[13px] font-semibold text-ink">{format.name} · {format.w} × {format.h}</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-ink-dim mb-2.5 mt-1">File type</div>
        <div className="grid grid-cols-2 gap-2.5 mb-[18px]">
          {(["png", "svg"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFileType(t)}
              className={`bg-bg-3 border-[1.5px] rounded-[10px] px-4 py-3.5 cursor-pointer flex flex-col items-start gap-1 transition-colors duration-100 text-left font-ui hover:border-[#555] ${
                fileType === t ? "border-accent shadow-[0_0_0_1.5px_var(--color-accent)]" : "border-line"
              }`}
            >
              <span className="text-lg font-bold text-ink font-hand tracking-[0.5px]">{t.toUpperCase()}</span>
              <span className="text-[11px] text-ink-dim">
                {t === "png" ? "Raster image — ready for upload" : "Vector, infinite zoom"}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center gap-2.5">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary big" onClick={handleDownload}>↓ Download {fileType.toUpperCase()}</button>
        </div>
      </div>
    </div>
  );
}

export default function Vibewall() {
  const [patternKey, setPatternKey] = useState("topo");
  const [paletteMode, setPaletteMode] = useState<"presets" | "custom">("presets");
  const [presetIdx, setPresetIdx] = useState(0);
  const [seed, setSeed] = useState(7);
  const [warp, setWarp] = useState(0.55);
  const [density, setDensity] = useState(0.5);
  const [extrasMap, setExtrasMap] = useState<Record<string, Extras>>({});
  const [format, setFormat] = useState<Format>(FORMATS[0]);
  const [exportOpen, setExportOpen] = useState(false);
  const [customC1, setCustomC1] = useState("#ff4a1a");
  const [customC2, setCustomC2] = useState("#ff2d95");
  // Mobile-only state: which panel is open as a modal (null = none).
  // Gated by CSS @media — desktop ignores this entirely.
  const [mobileModal, setMobileModal] = useState<null | "pattern" | "sliders" | "palette" | "format">(null);

  // Derive extras from patternKey defaults — user overrides per-pattern in extrasMap.
  const extras: Extras = useMemo(() => {
    const stored = extrasMap[patternKey];
    if (stored) return stored;
    const defaults: Extras = {};
    for (const p of PATTERNS[patternKey].params || []) {
      (defaults as Record<string, number>)[p.id as string] = p.default;
    }
    return defaults;
  }, [patternKey, extrasMap]);

  const setExtra = useCallback((id: string, v: number) => {
    setExtrasMap((prev) => {
      const cur = prev[patternKey] ?? (() => {
        const d: Extras = {};
        for (const p of PATTERNS[patternKey].params || []) {
          (d as Record<string, number>)[p.id as string] = p.default;
        }
        return d;
      })();
      return { ...prev, [patternKey]: { ...cur, [id]: v } as Extras };
    });
  }, [patternKey]);

  const customPalette: Palette = useMemo(
    () => ({ id: "custom", name: "Custom", colors: [customC1, customC2] }),
    [customC1, customC2],
  );

  const palette: Palette = paletteMode === "custom" ? customPalette : PALETTES[presetIdx];

  const randomize = useCallback(() => {
    const rng = mulberry32(Date.now() & 0xffffffff);
    setSeed(Math.floor(rng() * 9999));
    setPaletteMode("presets");
    setPresetIdx(Math.floor(rng() * PALETTES.length));
    setPatternKey(PATTERN_KEYS[Math.floor(rng() * PATTERN_KEYS.length)]);
    setWarp(0.3 + rng() * 0.6);
    setDensity(0.3 + rng() * 0.5);
  }, []);

  const downloadAt = useCallback((f: Format) => {
    const node = document.querySelector("#export-stage svg") as SVGSVGElement | null;
    if (!node) return;
    const clone = node.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(f.w));
    clone.setAttribute("height", String(f.h));
    clone.setAttribute("preserveAspectRatio", "xMidYMid slice");
    const xml = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = f.w; canvas.height = f.h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = palette.colors[1];
      ctx.fillRect(0, 0, f.w, f.h);
      ctx.drawImage(img, 0, 0, f.w, f.h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `vibewall-${patternKey}-${palette.id}-${seed}-${f.w}x${f.h}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = url;
  }, [patternKey, palette, seed]);

  const downloadSVG = useCallback((f: Format) => {
    const node = document.querySelector("#export-stage svg") as SVGSVGElement | null;
    if (!node) return;
    const clone = node.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(f.w));
    clone.setAttribute("height", String(f.h));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vibewall-${patternKey}-${palette.id}-${seed}-${f.w}x${f.h}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [patternKey, palette, seed]);

  const PatternRender = PATTERNS[patternKey].render;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-line bg-gradient-to-b from-[#111114] to-bg z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent rounded-[14px] grid place-items-center">
            <svg viewBox="0 0 40 40" width="32" height="32">
              <path d={starburstPath(20, 20, 17, 13, 11, 1)} fill="#fff" />
              <circle cx="20" cy="20" r="4" fill="#0a0a0a" />
            </svg>
          </div>
          <div>
            <h1 className="font-hand text-[28px] tracking-[0.5px] m-0 leading-none">VIBEWALL</h1>
            <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-ink-dim mt-1 m-0">Background generator</p>
          </div>
        </div>
        <div className="top-actions flex gap-2 items-center">
          <button className="btn" onClick={randomize}>⚡ Surprise me</button>
          <FormatPicker format={format} setFormat={setFormat} />
          <button className="btn primary" onClick={() => setExportOpen(true)}>↓ Export</button>
        </div>
      </header>

      <main className="app-grid">
        <section className="stage flex flex-col items-stretch p-0 gap-4 h-full min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 [container-type:size] flex items-center justify-center">
            <Preview
              patternKey={patternKey}
              palette={palette}
              seed={seed}
              warp={warp}
              density={density}
              format={format}
              extras={extras}
            />
          </div>
          <div className="self-center flex gap-2.5 items-center font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim px-3 py-1.5 bg-bg-2 border border-line rounded-full whitespace-nowrap shrink-0">
            <span className="text-ink font-semibold">Formato</span>
            <span className="text-[#444]">·</span>
            <span>{format.name}</span>
            <span className="text-[#444]">·</span>
            <span>{format.w} × {format.h}</span>
          </div>
        </section>

        {/* Controls wrapper. `display: contents` on desktop so children land in
            the .grid columns. On mobile each <section> becomes a modal opened
            from the bottom nav. */}
        <div className="controls" data-mobile-modal={mobileModal ?? ""}>
          {/* Mobile-only modal backdrop — tap to close */}
          <div
            onClick={() => setMobileModal(null)}
            aria-hidden="true"
            className={`hidden max-[940px]:block fixed inset-0 bg-[rgba(5,5,8,0.6)] backdrop-blur-[6px] z-[80] transition-opacity duration-200 ${
              mobileModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          />

          <section className="bg-bg-2 border border-line rounded-2xl p-5 h-full overflow-y-auto min-h-0" data-panel="pattern">
            <div className="panel-head">
              <h2 className="font-hand text-[22px] font-bold m-0 tracking-[0.3px]">Pattern</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PATTERN_KEYS.map((k) => (
                <PatternThumb
                  key={k}
                  patternKey={k}
                  palette={palette}
                  active={k === patternKey}
                  onClick={() => setPatternKey(k)}
                />
              ))}
            </div>
          </section>

          <section className="bg-bg-2 border border-line rounded-2xl p-5 h-full overflow-y-auto min-h-0" data-panel="sliders">
            <div className="panel-head">
              <h2 className="font-hand text-[22px] font-bold m-0 tracking-[0.3px]">Sliders</h2>
            </div>
            <Slider label="Warp" value={warp} onChange={setWarp} />
            <Slider label="Density" value={density} onChange={setDensity} />

            {(PATTERNS[patternKey].params || []).map((p) => (
              <Slider
                key={p.id as string}
                label={p.label}
                value={(extras as Record<string, number>)[p.id as string] ?? p.default}
                min={p.min}
                max={p.max}
                step={p.step || 0.01}
                format={p.format}
                onChange={(v) => setExtra(p.id as string, v)}
              />
            ))}

            <div className="flex gap-2 items-center mt-3">
              <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim shrink-0">Seed</span>
              <input
                type="number" value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="no-spin flex-1 min-w-0 bg-bg-3 border border-line text-ink font-mono text-xs px-2 py-1.5 rounded-[7px] outline-none focus:border-accent"
              />
              <button
                className="btn ghost tiny shrink-0"
                title="Random seed"
                onClick={() => setSeed(Math.floor(Math.random() * 9999) + 1)}
              >
                ↻
              </button>
            </div>
          </section>

          <section className="bg-bg-2 border border-line rounded-2xl p-5 h-full overflow-y-auto min-h-0" data-panel="palette">
            <div className="panel-head">
              <h2 className="font-hand text-[22px] font-bold m-0 tracking-[0.3px]">Palette</h2>
              <div role="tablist" className="inline-flex bg-bg-3 border border-line rounded-lg p-[3px] gap-0.5">
                {(["presets", "custom"] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={paletteMode === m}
                    onClick={() => setPaletteMode(m)}
                    className={`font-ui text-[11px] font-semibold tracking-[0.3px] px-2.5 py-[5px] border-0 rounded-md cursor-pointer transition-[background,color] duration-100 ${
                      paletteMode === m ? "bg-accent text-white" : "bg-transparent text-ink-dim hover:text-ink"
                    }`}
                  >
                    {m === "presets" ? "Presets" : "Custom"}
                  </button>
                ))}
              </div>
            </div>

            {paletteMode === "presets" ? (
              <div className="grid grid-cols-2 gap-2">
                {PALETTES.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setPresetIdx(i)}
                    title={p.name}
                    className={`flex flex-col gap-2 border-[1.5px] rounded-[10px] cursor-pointer p-2 bg-bg-3 transition-colors duration-100 hover:border-[#555] ${
                      i === presetIdx ? "border-accent shadow-[0_0_0_1.5px_var(--color-accent)]" : "border-line"
                    }`}
                  >
                    <div className="grid grid-cols-2 h-12 rounded-md overflow-hidden">
                      <span style={{ background: p.colors[0] }} />
                      <span style={{ background: p.colors[1] }} />
                    </div>
                    <span className="font-hand text-sm text-ink text-center leading-none pb-0.5">{p.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4 bg-bg-3 border border-dashed border-line rounded-xl">
                <div className="grid grid-cols-2 h-16 rounded-[10px] overflow-hidden border-[1.5px] border-line">
                  <span style={{ background: customPalette.colors[0] }} />
                  <span style={{ background: customPalette.colors[1] }} />
                </div>
                <ColorPicker label="Primary"    value={customC1} onChange={setCustomC1} />
                <ColorPicker label="Background" value={customC2} onChange={setCustomC2} />
                <button
                  className="btn ghost tiny w-full mt-1"
                  onClick={() => {
                    const a = customC1, b = customC2;
                    setCustomC1(b);
                    setCustomC2(a);
                  }}
                >
                  ⇄ Invert colors
                </button>
              </div>
            )}
          </section>

          {/* Mobile-only: format tab — render the size options inline (no dropdown). */}
          <section className="bg-bg-2 border border-line rounded-2xl p-5 h-full overflow-y-auto min-h-0 mobile-only-panel" data-panel="format">
            <div className="panel-head">
              <h2 className="font-hand text-[22px] font-bold m-0 tracking-[0.3px]">Format</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f)}
                  className={`bg-bg-3 border-[1.5px] rounded-lg pt-2.5 px-2 pb-2 cursor-pointer flex flex-col items-center gap-2 transition-colors duration-100 hover:border-[#555] ${
                    format.id === f.id ? "border-accent shadow-[0_0_0_1.5px_var(--color-accent)]" : "border-line"
                  }`}
                >
                  <div className="h-12 grid place-items-center w-full">
                    <div
                      className="bg-gradient-to-br from-[#3a3a44] to-[#22222a] rounded-[3px] max-h-12 max-w-full h-full"
                      style={{ aspectRatio: f.w + " / " + f.h }}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-0.5 font-ui">
                    <span className="text-[11px] font-semibold text-ink">{f.name}</span>
                    <span className="font-mono text-[9.5px] text-ink-dim tracking-[0.4px]">{f.w} × {f.h}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2.5 bg-bg-3 border-[1.5px] rounded-lg ${
              format.id === "custom" ? "border-accent border-solid shadow-[0_0_0_1.5px_var(--color-accent)]" : "border-line border-dashed"
            }`}>
              <span className="font-hand text-base mr-1">Custom</span>
              <input
                type="number" min={64} max={8000} step={1}
                value={format.id === "custom" ? format.w : 1080}
                onChange={(e) => {
                  const n = Math.max(64, Math.min(8000, parseInt(e.target.value) || 0));
                  setFormat({
                    id: "custom",
                    name: "Custom",
                    w: n,
                    h: format.id === "custom" ? format.h : 1920,
                  });
                }}
                className="no-spin w-20 bg-bg-2 border border-line text-ink font-mono text-xs px-2 py-1.5 rounded-md outline-none text-center focus:border-accent"
              />
              <span className="font-mono text-xs text-ink-dim">×</span>
              <input
                type="number" min={64} max={8000} step={1}
                value={format.id === "custom" ? format.h : 1920}
                onChange={(e) => {
                  const n = Math.max(64, Math.min(8000, parseInt(e.target.value) || 0));
                  setFormat({
                    id: "custom",
                    name: "Custom",
                    w: format.id === "custom" ? format.w : 1080,
                    h: n,
                  });
                }}
                className="no-spin w-20 bg-bg-2 border border-line text-ink font-mono text-xs px-2 py-1.5 rounded-md outline-none text-center focus:border-accent"
              />
              <span className="font-mono text-xs text-ink-dim">px</span>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile-only bottom nav — each tap opens that panel as a modal */}
      <nav
        aria-label="Panels"
        className="hidden max-[940px]:flex fixed left-3 right-3 bottom-3 z-[70] bg-bg-2 border border-line rounded-2xl p-1.5 gap-1 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_20px_50px_rgba(0,0,0,0.55)]"
        style={{ paddingBottom: `calc(0.375rem + env(safe-area-inset-bottom))` }}
      >
        {([
          { id: "pattern", icon: "▦", label: "Pattern" },
          { id: "sliders", icon: "≡", label: "Sliders" },
          { id: "palette", icon: "◐", label: "Palette" },
          { id: "format",  icon: "⛶", label: "Format" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            aria-pressed={mobileModal === tab.id}
            onClick={() => setMobileModal(mobileModal === tab.id ? null : tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-2.5 bg-transparent border-0 rounded-[10px] cursor-pointer transition-[background,color] duration-100 ${
              mobileModal === tab.id ? "bg-accent text-white" : "text-ink-dim hover:text-ink hover:bg-bg-3"
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="font-ui text-[10px] font-semibold tracking-[0.3px]">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div
        id="export-stage"
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          width: format.w,
          height: format.h,
          pointerEvents: "none",
        }}
      >
        <PatternRender
          palette={palette.colors}
          seed={seed}
          warp={warp}
          density={density}
          {...extras}
          w={format.w}
          h={format.h}
        />
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        format={format}
        onDownloadPNG={downloadAt}
        onDownloadSVG={downloadSVG}
      />
    </div>
  );
}
