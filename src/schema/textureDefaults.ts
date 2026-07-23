/**
 * texture-tuning types — mode selector + per-mode param bags + surface/theme shape.
 *
 * Default mode is "css": the WebGL canvas never mounts, CSS bloom renders as-is.
 *
 * Canonical source of these types + the shipped baked defaults — moved here
 * from the chrome texture-tuning component's types/defaults files so
 * `src/lib/surface-fx` has zero imports back into site components. Those
 * chrome files now re-export from here as thin shims (see
 * src/components/chrome/texture-tuning/types.ts and defaults.ts).
 */

export type TextureMode =
  | "css"
  | "led"
  | "concentric"
  | "flow"
  | "bayer"
  | "halftone"
  | "bluenoise"
  | "scanlines"
  | "crosshatch"
  | "lego"
  | "phyllotaxis"
  | "julia"
  | "lightning"
  | "web"
  | "coral";

/** Which surface the tuning panel is currently editing. */
export type TextureSurface = "disc" | "sheet";

/** Which theme set the tuning panel is currently editing. */
export type TextureThemeKey = "light" | "dark";

/** LED dot-matrix params (mode 1). */
export interface LEDParams {
  /** Cell grid size in CSS px. */
  cellSize: number;
  /** Gap between cells in CSS px. */
  gap: number;
  /** Glow bleed beyond the cell boundary, 0..1. */
  glow: number;
  /** Color mix: 0 = color0 only, 1 = color1 only. */
  colorMix: number;
}

/** Concentric halftone dot-ring params (mode 2). */
export interface ConcentricParams {
  /** Spacing between concentric rings in CSS px. */
  ringSpacing: number;
  /** Dot radius as fraction of half ring-spacing, 0..1.8. */
  dotScale: number;
  /** Exponent controlling how fast luminance falls off from center. */
  centerFalloff: number;
  /** Luminance contrast multiplier. */
  contrast: number;
}

/** Flow-field / domain-warp noise params (mode 3). */
export interface FlowParams {
  /** Animation speed (scales u_time). */
  speed: number;
  /** Domain warp strength, 0..2. */
  warpAmount: number;
  /** Noise spatial frequency (canvas-UV scale). */
  scale: number;
}

/** Bayer ordered-dithering params (mode 4). */
export interface BayerParams {
  /** Bayer matrix size: 4 (4x4) or 8 (8x8). */
  matrixSize: number;
  /** Quantization levels (1..8). */
  levels: number;
  /** Luminance contrast multiplier. */
  contrast: number;
}

/** Halftone dot-grid params (mode 5). */
export interface HalftoneParams {
  /** Grid cell size in CSS px. */
  cellSize: number;
  /** Max dot radius as fraction of half-cell, 0..1. */
  dotMax: number;
  /** Grid rotation angle in radians. */
  angle: number;
  /** Luminance contrast multiplier. */
  contrast: number;
}

/** Blue-noise / IGN dithering params (mode 6). */
export interface BlueNoiseParams {
  /** Spatial frequency of the IGN threshold pattern. */
  scale: number;
  /** Quantization levels. */
  levels: number;
  /** Luminance contrast multiplier. */
  contrast: number;
}

/** Scanlines params (mode 7) — ANIMATED via u_time. */
export interface ScanlinesParams {
  /** Lines per pixel (default 0.15 ~ 1 line per 7px). */
  lineFreq: number;
  /** Modulation depth 0..1. */
  lineDepth: number;
  /** Vertical roll speed in px/second (0 = static). */
  rollSpeed: number;
  /** CRT barrel distortion strength 0..1. */
  curvature: number;
}

/** Crosshatch engraving params (mode 8). */
export interface CrosshatchParams {
  /** Lines per pixel. */
  hatchFreq: number;
  /** Base hatch angle in radians. */
  angle: number;
  /** Max number of hatch layer directions (1..3). */
  levels: number;
  /** Line half-thickness as a fraction of cell width, 0..0.5. */
  weight: number;
}

/** Lego block-grid params (mode 9). */
export interface LegoParams {
  /** Block cell size in CSS px. */
  studSize: number;
  /** Bevel lighting strength 0..0.4. */
  bevel: number;
  /** Inter-block gap as a fraction of the cell 0..0.45. */
  gap: number;
}

/** Phyllotaxis / Vogel-spiral dot params (mode 10). */
export interface PhyllotaxisParams {
  /** Spacing between successive spiral points in CSS px. */
  spacing: number;
  /** Dot radius as a fraction of spacing, 0.05..1. */
  dotScale: number;
  /** Extra spiral rotation in radians. */
  rotate: number;
  /** Per-dot position jitter, fraction of spacing, 0..1. */
  jitter: number;
  /** Luminance contrast multiplier. */
  contrast: number;
}

/** Julia-set orbit-trap params (mode 11). */
export interface JuliaParams {
  /** Julia constant, real part. */
  cRe: number;
  /** Julia constant, imaginary part. */
  cIm: number;
  /** View zoom. */
  zoom: number;
  /** Posterize levels, 2..3. */
  levels: number;
  /** Blend between escape-time and orbit-trap fields, 0..1. */
  trapMix: number;
  /** Luminance contrast multiplier. */
  contrast: number;
}

/** Lightning filament params (mode 12) — ANIMATED via u_time when flickerSpeed > 0. */
export interface LightningParams {
  /** Noise spatial frequency. */
  density: number;
  /** Domain warp strength, 0..2. */
  warp: number;
  /** Filament width, 0.02..0.3. */
  thickness: number;
  /** Animation rate (0 = static). */
  flickerSpeed: number;
  /** Luminance contrast multiplier. */
  contrast: number;
}

/** Spider web params (mode 13). */
export interface WebParams {
  /** Radial spoke count. */
  spokes: number;
  /** Spacing between concentric rings in CSS px. */
  ringSpacing: number;
  /** Ring sag between spokes, 0..0.5. */
  sag: number;
  /** Per-thread position jitter, 0..1. */
  jitter: number;
  /** Thread half-width in CSS px. */
  threadWidth: number;
}

/** Coral / dendritic growth params (mode 14). */
export interface CoralParams {
  /** Spatial frequency. */
  scale: number;
  /** Domain warp strength, 0..2. */
  warp: number;
  /** Base growth threshold, 0..1. */
  threshold: number;
  /** Fine-cell detail mix, 0..1. */
  detail: number;
  /** Luminance contrast multiplier. */
  contrast: number;
}

/** Union of all per-mode param bags. */
export type TextureModeParams =
  | LEDParams
  | ConcentricParams
  | FlowParams
  | BayerParams
  | HalftoneParams
  | BlueNoiseParams
  | ScanlinesParams
  | CrosshatchParams
  | LegoParams
  | PhyllotaxisParams
  | JuliaParams
  | LightningParams
  | WebParams
  | CoralParams
  | object;

/**
 * Mask + layer envelope for one surface+theme set.
 *
 * Disc geometry (all distances from radial center, in px):
 *   0..innerCutout:                      transparent (the hole)
 *   innerCutout..innerCutout+fadeSoftness: fade to solid
 *   innerCutout+fadeSoftness..reach*fadeOrigin: solid
 *   reach*fadeOrigin..reach:             fade to transparent
 *
 * Sheet geometry (mixed units):
 *   ellipse x-radius = layout half-width + 96px (derived from DOM measurement)
 *   ellipse y-radius = reach% of element height
 *   0..fadeOrigin*100%: solid
 *   fadeOrigin*100%..100%: fade to transparent
 *   innerCutout: 0 (no hole for the sheet surface)
 *   fadeSoftness: 0 (no inner fade for the sheet surface)
 */
export interface EnvelopeParams {
  /**
   * Disc: outer radius of the texture mask in px.
   * Sheet: y-radius of the ellipse mask as % of element height.
   */
  reach: number;
  /**
   * Fraction 0..1: where the solid band ends and the outer fade begins,
   * expressed as a fraction of reach.
   */
  fadeOrigin: number;
  /**
   * Width of the inner fade transition.
   * Disc: px distance from innerCutout to where the solid region begins.
   * Sheet: typically 0 (no inner hole or fade).
   */
  fadeSoftness: number;
  /** Layer opacity 0..1 (maps to u_opacity for the shader canvas). */
  opacity: number;
  /**
   * Inner transparent radius in px (the hole at the disc center).
   * Sheet: 0 (no hole).
   */
  innerCutout: number;
  /** mix-blend-mode:screen on the canvas layer (drops black; adds light). */
  screenBlend: boolean;
  /**
   * Which CSS var sources u_color0 in the shader.
   * "custom" is reserved for future use; use "ink" for now.
   */
  tint: "ink" | "accent" | "custom";
  /**
   * Optional phone-breakpoint multiplier applied to the geometric envelope
   * (reach, innerCutout, fadeSoftness) ONLY when viewport width < 768px.
   * At >=768px this value is ignored — the disc-size ratio handles scaling.
   * Default 1.0 = no extra adjustment. Increase to expand bloom on phones.
   *
   * For the disc surface the full scaling formula is:
   *   factor = (discSize / REFERENCE_DISC_SIZE) * (isMobile ? mobileScale : 1.0)
   * For the sheet surface only mobileScale is applied (no disc-size ratio).
   */
  mobileScale: number;
}

/**
 * Configuration for one surface in one theme.
 * Contains the envelope (mask geometry + layer props) and all 9 per-mode param bags.
 */
export interface SurfaceConfig {
  /** Whether the WebGL canvas is enabled for this surface+theme. */
  enabled: boolean;
  /** Active texture mode. Default "css" = CSS bloom, no WebGL canvas. */
  mode: TextureMode;
  /** Mask geometry and layer-level properties. */
  envelope: EnvelopeParams;
  /** Params for LED mode. */
  led: LEDParams;
  /** Params for concentric halftone mode. */
  concentric: ConcentricParams;
  /** Params for flow-field mode. */
  flow: FlowParams;
  /** Params for Bayer ordered-dithering mode. */
  bayer: BayerParams;
  /** Params for halftone dot-grid mode. */
  halftone: HalftoneParams;
  /** Params for blue-noise / IGN mode. */
  bluenoise: BlueNoiseParams;
  /** Params for scanlines mode. */
  scanlines: ScanlinesParams;
  /** Params for crosshatch engraving mode. */
  crosshatch: CrosshatchParams;
  /** Params for Lego block-grid mode. */
  lego: LegoParams;
  /** Params for phyllotaxis spiral mode. */
  phyllotaxis: PhyllotaxisParams;
  /** Params for Julia-set orbit-trap mode. */
  julia: JuliaParams;
  /** Params for lightning filament mode. */
  lightning: LightningParams;
  /** Params for spider web mode. */
  web: WebParams;
  /** Params for coral / dendritic growth mode. */
  coral: CoralParams;
}

/** A pair of SurfaceConfigs, one per document theme. */
export interface ThemedSurface {
  light: SurfaceConfig;
  dark: SurfaceConfig;
}

/** Verdict for a texture mode during the audition session. */
export type VerdictValue = "keep" | "maybe" | "kill";

/**
 * Render-inert review state: verdicts per mode + free-text notes.
 * Persisted with the rest of the config; does NOT affect what surfaces draw.
 */
export interface TextureReview {
  /** Per-mode verdicts set during the audition session. */
  verdicts: Partial<Record<TextureMode, VerdictValue>>;
  /** Free-text notes for the orchestrator bake pass. */
  notes: string;
}

/** Full texture-tuning state persisted to localStorage (v2 shape). */
export interface TextureTuningState {
  /** Which surface the dev panel is currently editing. */
  activeSurface: TextureSurface;
  /** Which theme set the dev panel is currently editing. */
  activeTheme: TextureThemeKey;
  /** Per-theme config for the disc bloom (FloatingIdentity). */
  disc: ThemedSurface;
  /** Per-theme config for the ContactSheet dither backdrop. */
  sheet: ThemedSurface;
  /** Render-inert review: verdicts + notes for the orchestrator bake pass. */
  review: TextureReview;
}

/**
 * Reference disc size (px) at which all envelope geometry was authored.
 * At this size the scale factor is exactly 1.0, so the look is byte-identical
 * to the baked defaults. Other breakpoints scale proportionally:
 *   96px phone  -> factor 0.75
 *   128px tablet/desktop -> factor 1.0 (reference)
 *   144px large monitor  -> factor 1.125
 */
export const REFERENCE_DISC_SIZE = 128;

/**
 * Shared per-mode param defaults — used by both disc and sheet surfaces and
 * both light and dark theme sets. Sean dials per-surface from these starting points.
 */
const DEFAULT_MODE_PARAMS = {
  led: {
    cellSize: 12,
    gap: 2,
    glow: 0.6,
    colorMix: 0,
  },
  concentric: {
    ringSpacing: 20,
    dotScale: 0.7,
    centerFalloff: 2.0,
    contrast: 1.4,
  },
  flow: {
    speed: 0.3,
    warpAmount: 0.4,
    scale: 3.0,
  },
  bayer: {
    matrixSize: 4,
    levels: 3,
    contrast: 2.0,
  },
  halftone: {
    cellSize: 10,
    dotMax: 0.9,
    angle: 0.524, // 30 degrees
    contrast: 1.8,
  },
  bluenoise: {
    scale: 2.0,
    levels: 3,
    contrast: 1.8,
  },
  scanlines: {
    lineFreq: 0.15,
    lineDepth: 0.7,
    rollSpeed: 20,
    curvature: 0.3,
  },
  crosshatch: {
    hatchFreq: 0.05,
    angle: 0.785, // 45 degrees
    levels: 3,
    weight: 0.15,
  },
  lego: {
    studSize: 18,
    bevel: 0.2,
    gap: 0.1,
  },
  phyllotaxis: {
    spacing: 14,
    dotScale: 0.35,
    rotate: 0,
    jitter: 0.15,
    contrast: 1.6,
  },
  julia: {
    cRe: -0.4,
    cIm: 0.6,
    zoom: 1.0,
    levels: 3,
    trapMix: 0.5,
    contrast: 1.6,
  },
  lightning: {
    density: 3.0,
    warp: 0.6,
    thickness: 0.08,
    flickerSpeed: 0.15,
    contrast: 1.8,
  },
  web: {
    spokes: 10,
    ringSpacing: 18,
    sag: 0.15,
    jitter: 0.2,
    threadWidth: 1.5,
  },
  coral: {
    scale: 2.5,
    warp: 0.5,
    threshold: 0.15,
    detail: 0.5,
    contrast: 1.8,
  },
} as const;

/**
 * Disc envelope, light theme — Sean's dialed LED look (won the texture audition
 * against the CSS bloom mask). Baked from the dev tuning console.
 */
const DISC_LIGHT_ENVELOPE: EnvelopeParams = {
  reach: 192,
  fadeOrigin: 0.4,
  fadeSoftness: 50,
  opacity: 0.4,
  innerCutout: 24,
  screenBlend: false,
  tint: "ink",
  mobileScale: 1.0,
};

/**
 * Disc envelope, dark theme — Sean's dialed LED look, dark divergence.
 */
const DISC_DARK_ENVELOPE: EnvelopeParams = {
  reach: 128,
  fadeOrigin: 0.3,
  fadeSoftness: 8,
  opacity: 0.25,
  innerCutout: 28,
  screenBlend: false,
  tint: "accent",
  mobileScale: 1.0,
};

/**
 * Sheet (ContactSheet) envelope, light theme — Sean's dialed LED look.
 */
const SHEET_LIGHT_ENVELOPE: EnvelopeParams = {
  reach: 102,
  fadeOrigin: 0.56,
  fadeSoftness: 80,
  opacity: 0.5,
  innerCutout: 80,
  screenBlend: false,
  tint: "accent",
  mobileScale: 1.0,
};

/**
 * Sheet (ContactSheet) envelope, dark theme — Sean's dialed LED look.
 */
const SHEET_DARK_ENVELOPE: EnvelopeParams = {
  reach: 183,
  fadeOrigin: 0.6,
  fadeSoftness: 100,
  opacity: 1,
  innerCutout: 55,
  screenBlend: false,
  tint: "ink",
  mobileScale: 1.0,
};

/**
 * Build a SurfaceConfig for one surface+theme combination, baked to mode "led"
 * with Sean's dialed envelope + led params. All other mode param blocks stay
 * at DEFAULT_MODE_PARAMS as the console's starting points for those modes.
 */
function makeSurfaceConfig(
  envelope: EnvelopeParams,
  ledOverride: Partial<LEDParams>,
): SurfaceConfig {
  return {
    enabled: true,
    mode: "led", // Sean's chosen texture — baked default. See note below.
    envelope,
    ...DEFAULT_MODE_PARAMS,
    led: { ...DEFAULT_MODE_PARAMS.led, ...ledOverride },
  };
}

/** Default review state — no verdicts, no notes. */
const DEFAULT_REVIEW = {
  verdicts: {} as Record<string, never>,
  notes: "",
} as const;

/**
 * DEFAULT_TEXTURE_TUNING — the baked resting state (v2 shape).
 *
 * The baked default mode is now "led" — Sean auditioned the WebGL dither
 * textures against the shipped CSS bloom and picked "led" as the winner, then
 * dialed per-surface, per-theme envelope + led values in the dev console.
 * This bake makes that look the dev/preview default.
 *
 * Production DOES render this: the baked default mode is "led", and the
 * WebGL canvas renders post-mount whenever useWebGLSupported() resolves
 * true (WebGL2 available). On SSR/first paint, and on browsers without
 * WebGL2, the surfaces fall back to the CSS bloom instead.
 *
 * Dark sets are Sean's own dialed dark divergence, not copies of light.
 */
export const DEFAULT_TEXTURE_TUNING: TextureTuningState = {
  activeSurface: "disc",
  activeTheme: "light",
  disc: {
    light: makeSurfaceConfig(DISC_LIGHT_ENVELOPE, {
      cellSize: 9,
      gap: 4,
      glow: 0.9,
      colorMix: 0.4,
    }),
    dark: makeSurfaceConfig(DISC_DARK_ENVELOPE, {
      cellSize: 12,
      gap: 4.5,
      glow: 0.6,
      colorMix: 0.5,
    }),
  },
  sheet: {
    light: makeSurfaceConfig(SHEET_LIGHT_ENVELOPE, {
      cellSize: 9,
      gap: 4,
      glow: 0.6,
      colorMix: 0.5,
    }),
    dark: makeSurfaceConfig(SHEET_DARK_ENVELOPE, {
      cellSize: 12,
      gap: 4,
      glow: 0.6,
      colorMix: 0.5,
    }),
  },
  review: DEFAULT_REVIEW,
};
