/**
 * stage-entry.ts — browser entry point for the surface-fx playground's
 * Stage mode (a local canvas the playground renders and drives itself, with
 * NO dev site running).
 *
 * Bundled by build-standalone.mjs into the COMMITTED scripts/surface-fx-ui/
 * standalone.js (an esbuild IIFE bundle) — the playground page loads that
 * static file directly; it never runs a build step at request time.
 *
 * WHAT'S BUNDLED FROM src/lib/surface-fx/ (read-only source — see that
 * directory's own docs; nothing here modifies it):
 *   - schema/textureTuningRegistry.ts + bloomTuningRegistry.ts +
 *     feedHoverRegistry.ts — the SAME three registries
 *     src/app/api/dev/surface-fx/route.ts merges into the live bridge, so
 *     `list()` below returns byte-identical specs to the real dev-site
 *     bridge and the playground's EXISTING controls render unchanged.
 *   - shader/shapeUniforms.ts + geometry/measure.ts + geometry/SurfaceGeometry.ts
 *     — the rounded-box SDF geometry math (shapeMode 1 / "rounded-rect").
 *   - ripple/envelope.ts — bundled and exposed on the global for a future
 *     Stage ripple wire-up. NOT YET DRIVING ANY RENDERING BELOW — see the
 *     "NOT YET IN STAGE" note near the bottom of this file. Pointer-pressure
 *     (pointerField.ts) and velocity-driven ripple (velocity.ts,
 *     useRippleEngine.ts) are likewise not wired; honest gap, not a stub.
 *
 * KNOWN STAGE LIMITATION — mobileScale is read but NOT applied: getEnvelope()
 * below reads the mobileScale dial into EnvelopeValues (mirroring the real
 * bridge/spec), but drawCircle()/drawRect() never multiply it in. In
 * production (FloatingIdentity.tsx) mobileScale only multiplies the disc
 * scale when the CHROME is rendered at a mobile-width viewport — see that
 * file's `discScaleFactor = (discSize/REFERENCE_DISC_SIZE) * (isMobileViewport
 * ? env.mobileScale : 1.0)`. Stage renders both shapes at one fixed reference
 * size and playground.html's viewport-preset picker (the tool's only
 * "mobile width" concept) is hidden entirely in Stage mode (see
 * applyModeVisibility() there), so there is no "is this mobile" signal to
 * key off here. Net effect: dragging mobileScale in Stage is a documented
 * no-op, not a silent one — do not treat it as an active control there.
 *
 * Imports go DIRECTLY at the specific submodule files (not the
 * src/lib/surface-fx barrel/index.ts) so this bundle never risks pulling in
 * schema/store.ts or schema/agent.ts (both are "use client" React modules —
 * store.ts imports `react` itself). Stage re-implements the same
 * validate-and-clamp rule those modules use (mirroring
 * src/app/api/dev/surface-fx/route.ts's clampAgainstSpec, the actual
 * production bridge's own reimplementation for the identical reason: the
 * real stores live client-side there too) as a small in-memory store with
 * zero framework dependencies.
 *
 * ALSO bundles src/lib/texture-shader/texture-webgl-renderer.ts (which pulls
 * in texture-shaders.ts's GLSL source strings and
 * src/lib/ambient/shader/webgl-renderer.ts's hexToRgb01 helper) — this is
 * OUTSIDE src/lib/surface-fx/ but is the actual shipped GLSL + WebGL
 * renderer the disc/sheet draw with. Both files are read-only references
 * here too; nothing in this repo's site code is modified by this task.
 */

import type { ParamSpec } from "../../src/schema/param";
import type { ParamRegistry } from "../../src/schema/registry";
import {
  TEXTURE_TUNING_REGISTRY,
  textureEnabledKey,
  textureModeKey,
  textureEnvelopeKey,
  textureModeParamKey,
  MODE_FIELD_KEYS as TEXTURE_MODE_FIELD_KEYS,
} from "../../src/schema/textureTuningRegistry";
import {
  BLOOM_TUNING_REGISTRY,
  bloomFieldKey,
} from "../../src/schema/bloomTuningRegistry";
import { FEED_HOVER_REGISTRY } from "../../src/schema/feedHoverRegistry";
import { buildShapeUniforms } from "../../src/shader/shapeUniforms";
import { rectToGeometry } from "../../src/geometry/measure";
import {
  rippleEnvelope,
  RIPPLE_PROGRESS_EASE,
} from "../../src/ripple/envelope";
import {
  createTextureWebGLRenderer,
  type TextureWebGLRenderer,
} from "../../src/texture-shader/texture-webgl-renderer";
import {
  SURFACE_FX_SAMPLES,
  getSurfaceFxSample,
} from "../../src/samples/index";

// ── Types (kept local — this file is compiled standalone by esbuild, not
// through the site's tsconfig) ──────────────────────────────────────────────

type ParamValue = number | boolean | string;
type ThemeKey = "light" | "dark";
type ShapeKind = "circle" | "roundedRect";

// ── Merged registry — SAME three registries route.ts merges ────────────────

const REGISTRY: ParamRegistry = {
  ...TEXTURE_TUNING_REGISTRY,
  ...BLOOM_TUNING_REGISTRY,
  ...FEED_HOVER_REGISTRY,
};

// ── In-memory store — mirrors route.ts's clampAgainstSpec + pendingWrites/
// clientSnapshot exactly, minus the HTTP relay (this runs in the SAME tab,
// no client/server split needed). See file header for why this doesn't
// reuse schema/store.ts. ──────────────────────────────────────────────────

function defaultsRecord(): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {};
  for (const key of Object.keys(REGISTRY)) {
    out[key] = REGISTRY[key].default as ParamValue;
  }
  return out;
}

let paramValues: Record<string, ParamValue> = defaultsRecord();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

function clampAgainstSpec(
  spec: ParamSpec<unknown>,
  value: unknown,
): { ok: true; value: ParamValue } | { ok: false; error: string } {
  if (spec.kind === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return {
        ok: false,
        error: `Parameter "${spec.key}" expects a finite number.`,
      };
    }
    let v = value;
    if (spec.min !== undefined) v = Math.max(spec.min, v);
    if (spec.max !== undefined) v = Math.min(spec.max, v);
    return { ok: true, value: v };
  }
  if (spec.kind === "boolean") {
    if (typeof value !== "boolean") {
      return { ok: false, error: `Parameter "${spec.key}" expects a boolean.` };
    }
    return { ok: true, value };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `Parameter "${spec.key}" expects a string.` };
  }
  if (spec.kind === "enum" && spec.options && !spec.options.includes(value)) {
    return {
      ok: false,
      error: `Parameter "${spec.key}" must be one of: ${spec.options.join(", ")}`,
    };
  }
  return { ok: true, value };
}

function getValue(key: string): ParamValue | undefined {
  return paramValues[key];
}

// ── Bridge shim — mirrors the SAME action contract
// scripts/surface-fx-ui.mjs proxies through to
// src/app/api/dev/surface-fx/route.ts: GET list / GET snapshot / POST set.
// (GET drain and POST report are the SITE's own client-bridge internals —
// the playground UI never calls them; see scripts/surface-fx-ui.mjs's own
// header comment. `diff` is included for parity with schema/agent.ts's
// AgentFace even though the playground UI doesn't call it either.) ────────

function bridgeList(): { specs: ParamSpec<unknown>[] } {
  return { specs: Object.values(REGISTRY) };
}

function bridgeSnapshot(): {
  params: Record<string, ParamValue>;
  updatedAt: number;
  staleMs: number;
  connected: boolean;
} {
  return {
    params: { ...paramValues },
    updatedAt: Date.now(),
    staleMs: 0,
    connected: true, // Stage IS the client — always "connected" to itself.
  };
}

function bridgeSetSync(
  key: string,
  value: ParamValue,
):
  | { ok: true; id: string; key: string; clamped: ParamValue; queued: false }
  | { ok: false; error: string } {
  const spec = REGISTRY[key];
  if (!spec) return { ok: false, error: `Unknown parameter key: "${key}"` };
  if (!spec.agentWritable) {
    return { ok: false, error: `Parameter "${key}" is not agent-writable.` };
  }
  const clamped = clampAgainstSpec(spec, value);
  if (!clamped.ok) return { ok: false, error: clamped.error };

  paramValues = { ...paramValues, [key]: clamped.value };
  notify();
  redrawAll();
  return { ok: true, id: "stage", key, clamped: clamped.value, queued: false };
}

function bridgeDiff(): {
  ok: true;
  changed: { key: string; current: ParamValue; default: ParamValue }[];
} {
  const changed: { key: string; current: ParamValue; default: ParamValue }[] =
    [];
  for (const spec of Object.values(REGISTRY)) {
    const current = paramValues[spec.key];
    if (current !== undefined && current !== spec.default) {
      changed.push({
        key: spec.key,
        current,
        default: spec.default as ParamValue,
      });
    }
  }
  return { ok: true, changed };
}

/** playground.html's bridgeGet(action, extra) — Promise-shaped to match fetch. */
function bridgeGet(
  action: string,
  _extra?: Record<string, string>,
): Promise<unknown> {
  if (action === "list") return Promise.resolve(bridgeList());
  if (action === "snapshot") return Promise.resolve(bridgeSnapshot());
  return Promise.reject(
    new Error(`Stage bridge: unsupported GET action "${action}".`),
  );
}

/** playground.html's bridgeSet(key, value) — Promise-shaped to match fetch; rejects on failure (queueSet's .catch expects this). */
function bridgeSet(key: string, value: ParamValue): Promise<unknown> {
  const result = bridgeSetSync(key, value);
  if (result.ok === false) return Promise.reject(new Error(result.error));
  return Promise.resolve(result);
}

// ── Theme-aware colors ───────────────────────────────────────────────────
// Stage has no page CSS to read --color-ink/--color-accent from — these are
// the shipped calm-warm (light) / midnight (dark) values transcribed
// verbatim from src/app/globals.css (read-only reference; not modified).
// Light matches createTextureWebGLRenderer's own literal fallback defaults
// exactly (see texture-webgl-renderer.ts's initColor0/initColor1).

const THEME_COLORS: Record<ThemeKey, { ink: string; accent: string }> = {
  light: { ink: "#1a1610", accent: "#a4441f" },
  dark: { ink: "#f3eee3", accent: "#ff9b48" },
};

const MODE_TO_INT: Record<string, number> = {
  css: 0,
  led: 1,
  concentric: 2,
  flow: 3,
  bayer: 4,
  halftone: 5,
  bluenoise: 6,
  scanlines: 7,
  crosshatch: 8,
  lego: 9,
};

function modeParamFloats(
  surface: "disc" | "sheet",
  mode: string,
  theme: ThemeKey,
): number[] {
  const fields = (TEXTURE_MODE_FIELD_KEYS as Record<string, readonly string[]>)[
    mode
  ];
  if (!fields) return [0, 0, 0, 0, 0, 0, 0, 0];
  const floats = fields.map((field) => {
    const key = textureModeParamKey(surface, mode as never, field, theme);
    const v = getValue(key);
    return typeof v === "number" ? v : 0;
  });
  while (floats.length < 8) floats.push(0);
  return floats;
}

interface EnvelopeValues {
  reach: number;
  fadeOrigin: number;
  fadeSoftness: number;
  opacity: number;
  innerCutout: number;
  screenBlend: boolean;
  mobileScale: number;
}

function getEnvelope(
  surface: "disc" | "sheet",
  theme: ThemeKey,
): EnvelopeValues {
  const num = (field: string, fallback: number): number => {
    const v = getValue(textureEnvelopeKey(surface, field as never, theme));
    return typeof v === "number" ? v : fallback;
  };
  const bool = (field: string, fallback: boolean): boolean => {
    const v = getValue(textureEnvelopeKey(surface, field as never, theme));
    return typeof v === "boolean" ? v : fallback;
  };
  return {
    reach: num("reach", 192),
    fadeOrigin: num("fadeOrigin", 0.4),
    fadeSoftness: num("fadeSoftness", 50),
    opacity: num("opacity", 0.4),
    innerCutout: num("innerCutout", 24),
    screenBlend: bool("screenBlend", false),
    // Read for parity with the real spec but NOT applied below — see file
    // header "KNOWN STAGE LIMITATION" note. Documented no-op in Stage.
    mobileScale: num("mobileScale", 1.0),
  };
}

function getSurfaceModeAndEnabled(
  surface: "disc" | "sheet",
  theme: ThemeKey,
): { mode: string; enabled: boolean } {
  const modeVal = getValue(textureModeKey(surface, theme));
  const enabledVal = getValue(textureEnabledKey(surface, theme));
  return {
    mode: typeof modeVal === "string" ? modeVal : "css",
    enabled: typeof enabledVal === "boolean" ? enabledVal : true,
  };
}

function bloomNum(field: string, theme: ThemeKey, fallback: number): number {
  const v = getValue(bloomFieldKey(field as never, theme));
  return typeof v === "number" ? v : fallback;
}

// ── DOM + WebGL mounts ───────────────────────────────────────────────────

const MAX_DPR = 2;
const CIRCLE_CANVAS_SIZE = 420; // CSS px — square, big enough for reach up to ~200px + margin.
const RECT_CANVAS_W = 640;
const RECT_CANVAS_H = 380;

let currentTheme: ThemeKey = "light";
let currentShape: ShapeKind = "circle";

let mounted = false;
let circleWrap: HTMLDivElement;
let circleCanvas: HTMLCanvasElement;
let circleRenderer: TextureWebGLRenderer | null = null;

let rectHost: HTMLDivElement;
let rectProbe: HTMLDivElement;
let rectCanvas: HTMLCanvasElement;
let rectRenderer: TextureWebGLRenderer | null = null;

function dpr(): number {
  return Math.min(window.devicePixelRatio || 1, MAX_DPR);
}

function buildDom(container: HTMLElement): void {
  container.innerHTML = "";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.background = "#000";

  // -- Circle (disc, shapeMode 0) --------------------------------------------
  circleWrap = document.createElement("div");
  circleWrap.setAttribute("data-stage-shape", "circle");
  circleWrap.style.position = "relative";
  circleWrap.style.width = `${CIRCLE_CANVAS_SIZE}px`;
  circleWrap.style.height = `${CIRCLE_CANVAS_SIZE}px`;
  // Core mask formula transcribed verbatim from
  // src/components/chrome/FloatingIdentity.module.css's .shadowFieldMask
  // CORE gradient layer (the wave/ripple layer is intentionally omitted —
  // see file header NOT YET IN STAGE note). Set per-frame in drawCircle().
  circleCanvas = document.createElement("canvas");
  circleCanvas.style.position = "absolute";
  circleCanvas.style.inset = "0";
  circleCanvas.style.width = "100%";
  circleCanvas.style.height = "100%";
  circleWrap.appendChild(circleCanvas);

  // -- Rounded-rect (sheet, shapeMode 1) --------------------------------------
  rectHost = document.createElement("div");
  rectHost.setAttribute("data-stage-shape", "roundedRect");
  rectHost.style.position = "relative";
  rectHost.style.width = `${RECT_CANVAS_W}px`;
  rectHost.style.height = `${RECT_CANVAS_H}px`;
  rectHost.style.display = "flex";
  rectHost.style.alignItems = "center";
  rectHost.style.justifyContent = "center";

  // Invisible probe div — its measured rect (via rectToGeometry, the SAME
  // helper ContactSheet.tsx uses) defines the rounded-box half-extents/
  // center the shader's SDF falls off from. Sized well inside the canvas so
  // the penumbra (shapeFalloff) has room on every side.
  rectProbe = document.createElement("div");
  rectProbe.style.width = "280px";
  rectProbe.style.height = "160px";
  rectProbe.style.visibility = "hidden";
  rectProbe.style.pointerEvents = "none";

  rectCanvas = document.createElement("canvas");
  rectCanvas.style.position = "absolute";
  rectCanvas.style.inset = "0";
  rectCanvas.style.width = "100%";
  rectCanvas.style.height = "100%";

  rectHost.appendChild(rectProbe);
  rectHost.appendChild(rectCanvas);

  container.appendChild(circleWrap);
  container.appendChild(rectHost);

  circleRenderer = createTextureWebGLRenderer(circleCanvas);
  rectRenderer = createTextureWebGLRenderer(rectCanvas);

  applyShapeVisibility();
}

function applyShapeVisibility(): void {
  if (!circleWrap || !rectHost) return;
  circleWrap.style.display = currentShape === "circle" ? "block" : "none";
  rectHost.style.display = currentShape === "roundedRect" ? "flex" : "none";
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  renderer: TextureWebGLRenderer | null,
  cssW: number,
  cssH: number,
): void {
  if (!renderer) return;
  const d = dpr();
  renderer.resize(Math.round(cssW * d), Math.round(cssH * d));
}

// ── Draw: circle (disc, shapeMode 0 — pixel-sacred legacy falloff) ────────

function drawCircle(): void {
  if (!circleRenderer) return;
  const theme = currentTheme;
  const env = getEnvelope("disc", theme);
  const { mode, enabled } = getSurfaceModeAndEnabled("disc", theme);
  const colors = THEME_COLORS[theme];

  resizeCanvas(
    circleCanvas,
    circleRenderer,
    CIRCLE_CANVAS_SIZE,
    CIRCLE_CANVAS_SIZE,
  );

  // CSS mask — CORE layer only, transcribed verbatim from
  // FloatingIdentity.module.css's .shadowFieldMask (see that file for the
  // full two-layer version incl. the arrival-wave ripple, NOT reproduced
  // here — see NOT YET IN STAGE note in this file's header).
  const innerFadeEnd = env.innerCutout + env.fadeSoftness;
  const solidEnd = env.reach * env.fadeOrigin;
  const maskCss =
    `radial-gradient(circle at 50% 50%, ` +
    `transparent 0px, transparent ${env.innerCutout}px, ` +
    `rgba(0,0,0,1) ${innerFadeEnd}px, rgba(0,0,0,1) ${solidEnd}px, ` +
    `transparent ${env.reach}px)`;
  circleWrap.style.maskImage = maskCss;
  (circleWrap.style as unknown as { webkitMaskImage: string }).webkitMaskImage =
    maskCss;
  circleWrap.style.opacity = String(env.opacity);
  circleWrap.style.mixBlendMode = env.screenBlend ? "screen" : "normal";

  if (!enabled || mode === "css") {
    circleRenderer.draw({
      mode: 0,
      params: [0, 0, 0, 0, 0, 0, 0, 0],
      center: [0.5, 0.5],
    });
    return;
  }

  // shapeMode defaults to 0 (legacy elliptical falloff) when `shape` is
  // omitted — see texture-webgl-renderer.ts's draw(). This IS the
  // pixel-sacred disc curve; nothing here overrides it.
  circleRenderer.draw({
    mode: MODE_TO_INT[mode] ?? 0,
    params: modeParamFloats("disc", mode, theme),
    color0: colors.ink,
    color1: colors.accent,
    opacity: 1, // envelope opacity is a WRAPPER CSS opacity, not u_opacity — mirrors FloatingIdentity.tsx exactly.
    center: [0.5, 0.5],
  });
}

// ── Draw: rounded-rect (sheet, shapeMode 1 — iq rounded-box SDF) ──────────

function drawRect(): void {
  if (!rectRenderer) return;
  const theme = currentTheme;
  const { mode, enabled } = getSurfaceModeAndEnabled("sheet", theme);
  const env = getEnvelope("sheet", theme);
  const colors = THEME_COLORS[theme];

  resizeCanvas(rectCanvas, rectRenderer, RECT_CANVAS_W, RECT_CANVAS_H);
  rectHost.style.maskImage = "none";
  (rectHost.style as unknown as { webkitMaskImage: string }).webkitMaskImage =
    "none";

  if (!enabled || mode === "css") {
    rectRenderer.draw({
      mode: 0,
      params: [0, 0, 0, 0, 0, 0, 0, 0],
      center: [0.5, 0.5],
    });
    return;
  }

  const cornerR = bloomNum("sheetRadius", theme, 32);
  const cornerFollow = bloomNum("ditherShadowCornerFollow", theme, 1);
  const spreadPx = bloomNum("ditherShadowSpreadPx", theme, 56);
  const falloffSoftness = bloomNum("ditherShadowFalloffSoftness", theme, 45);
  const edgeDensity = bloomNum("ditherShadowEdgeDensity", theme, 0.85);

  // SAME formula as ContactSheet.tsx's shapeFalloffPx derivation (see that
  // file's inline comment): the shader's smoothstep WIDTH is the natural
  // SDF analog for "falloff softness."
  const softness01 = Math.min(1, Math.max(0, falloffSoftness / 100));
  const falloffPx = Math.max(spreadPx * (0.5 + softness01), 1);

  // Real geometry measurement via the SAME rectToGeometry helper
  // ContactSheet.tsx uses ("live" mode = getBoundingClientRect()).
  const geo = rectToGeometry(rectProbe, { mode: "live", cornerR });
  const shapeUniforms = buildShapeUniforms(geo, cornerFollow, falloffPx);

  const canvasRect = rectCanvas.getBoundingClientRect();
  const cxFrac =
    canvasRect.width > 0 ? (geo.cx - canvasRect.left) / canvasRect.width : 0.5;
  const cyFrac =
    canvasRect.height > 0
      ? 1 - (geo.cy - canvasRect.top) / canvasRect.height
      : 0.5; // GLSL Y-flip, matches gl_FragCoord convention.

  rectRenderer.draw({
    mode: MODE_TO_INT[mode] ?? 0,
    params: modeParamFloats("sheet", mode, theme),
    color0: colors.ink,
    color1: colors.accent,
    // Resting-frame opacity: mirrors ContactSheet.tsx's reduced-motion
    // branch (sEnv.opacity * ditherShadowEdgeDensity) — Stage has no
    // open/close bloom animation to drive collapseProgress (out of
    // scope — see NOT YET IN STAGE note).
    opacity: env.opacity * edgeDensity,
    center: [cxFrac, cyFrac],
    // shapeUniforms is already in DEVICE px (buildShapeUniforms applies
    // geo.dpr internally) — the renderer's `shape` option wants device px
    // directly, same convention TextureShaderCanvas.tsx uses after ITS OWN
    // dpr multiply.
    shape: {
      mode: 1,
      half: shapeUniforms.shapeHalf,
      radius: shapeUniforms.shapeRadius,
      falloffPx: shapeUniforms.shapeFalloff,
    },
  });
}

function redrawAll(): void {
  if (!mounted) return;
  drawCircle();
  drawRect();
}

// ── Samples — named targets `surface-fx open <target>` / the Stage picker
// load. See src/lib/surface-fx/samples/index.ts for the definitions; this is
// the only place that APPLIES one (shape + theme + param overrides). ───────

let currentSampleId: string | null = null;

/**
 * Applies a sample's shape + theme + param overrides (over defaultsRecord())
 * and redraws. Returns the applied {shape, theme} so a caller (playground.html's
 * picker, or mount()'s initial-load below) can sync its own UI state; returns
 * null for an unknown id (no-op — caller decides the fallback).
 */
function applySample(id: string): { shape: ShapeKind; theme: ThemeKey } | null {
  const sample = getSurfaceFxSample(id);
  if (!sample) return null;
  paramValues = {
    ...defaultsRecord(),
    ...(sample.params as Record<string, ParamValue>),
  };
  currentShape = sample.shape;
  currentTheme = sample.theme;
  currentSampleId = sample.id;
  applyShapeVisibility();
  redrawAll();
  return { shape: sample.shape, theme: sample.theme };
}

// ── Public API — window.SurfaceFxStage ────────────────────────────────────

interface SurfaceFxStageAPI {
  bridgeGet(action: string, extra?: Record<string, string>): Promise<unknown>;
  bridgeSet(key: string, value: ParamValue): Promise<unknown>;
  diff(): {
    ok: true;
    changed: { key: string; current: ParamValue; default: ParamValue }[];
  };
  mount(container: HTMLElement): void;
  setTheme(theme: ThemeKey): void;
  setShape(shape: ShapeKind): void;
  resize(): void;
  destroy(): void;
  /** id/label/description only — see samples/index.ts for the full shape. */
  samples: { id: string; label: string; description: string }[];
  /** Applies a sample by id; returns the applied {shape, theme}, or null if unknown. */
  loadSample(id: string): { shape: ShapeKind; theme: ThemeKey } | null;
  /**
   * Bundled but NOT wired into any drawing above — exposed for a future
   * Stage ripple pass. See file header "NOT YET IN STAGE" note.
   */
  ripple: {
    rippleEnvelope: typeof rippleEnvelope;
    RIPPLE_PROGRESS_EASE: typeof RIPPLE_PROGRESS_EASE;
  };
}

const api: SurfaceFxStageAPI = {
  bridgeGet,
  bridgeSet,
  diff: bridgeDiff,
  mount(container: HTMLElement) {
    buildDom(container);
    mounted = true;
    // Initial load: a `?target=<id>` in the URL (threaded through by
    // playground.html — see its boot-time query-param read) is handled
    // there via loadSample(); here we just render the current defaults
    // (== the "disc" sample) so Stage always has a valid rest frame even
    // before any loadSample() call arrives.
    if (!currentSampleId) applySample("disc");
    redrawAll();
    window.addEventListener("resize", redrawAll);
  },
  setTheme(theme: ThemeKey) {
    currentTheme = theme;
    redrawAll();
  },
  setShape(shape: ShapeKind) {
    currentShape = shape;
    applyShapeVisibility();
    redrawAll();
  },
  resize: redrawAll,
  destroy() {
    mounted = false;
    window.removeEventListener("resize", redrawAll);
    circleRenderer?.destroy();
    rectRenderer?.destroy();
    circleRenderer = null;
    rectRenderer = null;
  },
  samples: SURFACE_FX_SAMPLES.map(({ id, label, description }) => ({
    id,
    label,
    description,
  })),
  loadSample: applySample,
  ripple: { rippleEnvelope, RIPPLE_PROGRESS_EASE },
};

declare global {
  interface Window {
    SurfaceFxStage: SurfaceFxStageAPI;
  }
}

window.SurfaceFxStage = api;
