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
    <button className={"thumb " + (active ? "active" : "")} onClick={onClick}>
      <div className="thumb-clip">
        <Pattern palette={palette.colors} seed={42} warp={0.5} density={0.5} />
      </div>
      <span className="thumb-label">{PATTERNS[patternKey].label}</span>
    </button>
  );
}

function ColorPicker({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="cp-row">
      <label className="cp-label">{label}</label>
      <div className="cp-controls">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cp-color"
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
          className="cp-hex"
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
    <div className="slider-row">
      <div className="slider-head">
        <span>{label}</span>
        <span className="slider-val">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
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
    <div className="format-picker" ref={ref}>
      <button className="btn ghost fp-btn" onClick={() => setOpen((o) => !o)}>
        <span className="fp-shape-mini" style={{ aspectRatio: format.w + " / " + format.h }} />
        <span className="fp-btn-text">{format.name} · {format.w}×{format.h}</span>
        <span className="fp-caret">▾</span>
      </button>

      {open && (
        <div className="fp-menu">
          <div className="fp-grid">
            {FORMATS.map((f, i) => (
              <button
                key={f.id}
                className={"fp-item " + (idx === i ? "active" : "")}
                onClick={() => { setFormat(f); setOpen(false); }}
              >
                <div className="fp-shape-wrap">
                  <div className="fp-shape" style={{ aspectRatio: f.w + " / " + f.h }} />
                </div>
                <div className="fp-item-meta">
                  <span className="fp-item-name">{f.name}</span>
                  <span className="fp-item-dims">{f.w} × {f.h}</span>
                </div>
              </button>
            ))}
          </div>
          <div className={"fp-custom-row " + (isCustom ? "active" : "")}>
            <span className="fp-custom-tag">Custom</span>
            <input
              type="number" min={64} max={8000} step={1}
              value={isCustom ? format.w : 1080}
              onChange={(e) => updateCustom("w", e.target.value)}
            />
            <span className="fp-sep">×</span>
            <input
              type="number" min={64} max={8000} step={1}
              value={isCustom ? format.h : 1920}
              onChange={(e) => updateCustom("h", e.target.value)}
            />
            <span className="fp-sep">px</span>
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
    <div className="modal-back" onClick={onClose}>
      <div className="modal-card export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Export</h2>
          <button className="x-btn" onClick={onClose}>×</button>
        </div>
        <div className="export-summary">
          <span className="summary-label">Size</span>
          <span className="summary-value">{format.name} · {format.w} × {format.h}</span>
        </div>
        <div className="modal-section-label">File type</div>
        <div className="filetype-row">
          <button
            className={"filetype-card " + (fileType === "png" ? "active" : "")}
            onClick={() => setFileType("png")}
          >
            <span className="ft-name">PNG</span>
            <span className="ft-desc">Raster image — ready for upload</span>
          </button>
          <button
            className={"filetype-card " + (fileType === "svg" ? "active" : "")}
            onClick={() => setFileType("svg")}
          >
            <span className="ft-name">SVG</span>
            <span className="ft-desc">Vector, infinite zoom</span>
          </button>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary big" onClick={handleDownload}>↓ Download {fileType.toUpperCase()}</button>
        </div>
      </div>
    </div>
  );
}

export default function Vibewall() {
  const [patternKey, setPatternKey] = useState("topo");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [seed, setSeed] = useState(7);
  const [warp, setWarp] = useState(0.55);
  const [density, setDensity] = useState(0.5);
  const [extrasMap, setExtrasMap] = useState<Record<string, Extras>>({});
  const [invert, setInvert] = useState(false);
  const [format, setFormat] = useState<Format>(FORMATS[0]);
  const [exportOpen, setExportOpen] = useState(false);
  const [customC1, setCustomC1] = useState("#ff4a1a");
  const [customC2, setCustomC2] = useState("#ff2d95");

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

  const basePalette = paletteIdx === -1 ? customPalette : PALETTES[paletteIdx];
  const palette: Palette = useMemo(() => {
    if (!invert) return basePalette;
    const c = [...basePalette.colors];
    [c[0], c[1]] = [c[1], c[0]];
    return { ...basePalette, colors: c };
  }, [basePalette, invert]);

  const randomize = useCallback(() => {
    const rng = mulberry32(Date.now() & 0xffffffff);
    setSeed(Math.floor(rng() * 9999));
    setPaletteIdx(Math.floor(rng() * PALETTES.length));
    setPatternKey(PATTERN_KEYS[Math.floor(rng() * PATTERN_KEYS.length)]);
    setWarp(0.3 + rng() * 0.6);
    setDensity(0.3 + rng() * 0.5);
  }, []);

  const reseed = useCallback(() => {
    setSeed((s) => ((s * 7 + 13) % 9999) + 1);
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
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 40 40" width="32" height="32">
              <path d={starburstPath(20, 20, 17, 13, 11, 1)} fill="#fff" />
              <circle cx="20" cy="20" r="4" fill="#0a0a0a" />
            </svg>
          </div>
          <div>
            <h1>VIBEWALL</h1>
            <p>Background generator</p>
          </div>
        </div>
        <div className="top-actions">
          <button className="btn ghost" onClick={reseed}>↻ Reseed</button>
          <button className="btn" onClick={randomize}>⚡ Surprise me</button>
          <FormatPicker format={format} setFormat={setFormat} />
          <button className="btn primary" onClick={() => setExportOpen(true)}>↓ Export</button>
        </div>
      </header>

      <main className="grid">
        <section className="panel">
          <h2>Pattern</h2>
          <div className="thumbs">
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

          <h2 style={{ marginTop: 24 }}>Sliders</h2>
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

          <div className="toggle-row">
            <button
              className={"btn ghost tiny full " + (invert ? "on" : "")}
              onClick={() => setInvert((v) => !v)}
            >
              {invert ? "● Invert: ON" : "○ Invert colors"}
            </button>
          </div>

          <div className="seed-row">
            <span className="seed-label">Seed</span>
            <input
              type="number" value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
              className="seed-input"
            />
            <button className="btn ghost tiny" onClick={reseed}>↻</button>
          </div>
        </section>

        <section className="stage">
          <Preview
            patternKey={patternKey}
            palette={palette}
            seed={seed}
            warp={warp}
            density={density}
            format={format}
            extras={extras}
          />
          <div className="stage-caption">
            <span>{PATTERNS[patternKey].label}</span>
            <span className="dot">·</span>
            <span>{palette.name}</span>
            <span className="dot">·</span>
            <span>{format.w} × {format.h}</span>
            <span className="dot">·</span>
            <span>seed {seed}</span>
          </div>
        </section>

        <section className="panel">
          <h2>Palette</h2>
          <div className="palettes">
            {PALETTES.map((p, i) => (
              <button
                key={p.id}
                className={"swatch " + (i === paletteIdx ? "active" : "")}
                onClick={() => setPaletteIdx(i)}
                title={p.name}
              >
                <span style={{ background: p.colors[0] }} />
                <span style={{ background: p.colors[1] }} />
                <span className="swatch-name">{p.name}</span>
              </button>
            ))}
            <button
              className={"swatch swatch-custom " + (paletteIdx === -1 ? "active" : "")}
              onClick={() => setPaletteIdx(-1)}
              title="Custom"
            >
              <span style={{ background: customPalette.colors[0] }} />
              <span style={{ background: customPalette.colors[1] }} />
              <span className="swatch-name">+ Custom</span>
            </button>
          </div>

          {paletteIdx === -1 && (
            <div className="custom-pickers">
              <ColorPicker label="Primary"    value={customC1} onChange={setCustomC1} />
              <ColorPicker label="Background" value={customC2} onChange={setCustomC2} />
              <button
                className="btn ghost tiny full"
                onClick={() => {
                  const p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
                  setCustomC1(p.colors[0]);
                  setCustomC2(p.colors[1]);
                }}
              >
                ↻ Copy random preset
              </button>
            </div>
          )}
        </section>
      </main>

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
