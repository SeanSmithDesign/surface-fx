/**
 * texture-tuning ParamSpec registry.
 *
 * Flattens texture-tuning's per-surface (disc|sheet), per-theme (light|dark)
 * `SurfaceConfig` shape — `enabled`, `mode`, the 8 `envelope` fields, and the
 * 14 shader modes' param bags (led/concentric/flow/bayer/halftone/bluenoise/
 * scanlines/crosshatch/lego/phyllotaxis/julia/lightning/web/coral) — into
 * one flat ParamRegistry.
 *
 * KEY CONVENTION: "texture.<surface>.<group>.<param>@<theme>"
 *   - <surface> is "disc" | "sheet"
 *   - <group> is "layer" (enabled/mode), "envelope", or a shader mode name
 *   - <theme> suffix ("@light" | "@dark") keys the SAME logical dial
 *     independently per theme, since Sean dials disc/sheet bloom
 *     divergently per theme (see texture-tuning/store.ts's composer).
 *   e.g. "texture.disc.envelope.reach@light", "texture.sheet.led.gap@dark".
 *
 * Deliberately OUT of this registry (kept as legacy-only state in
 * texture-tuning/store.ts, not schema-backed): `activeSurface`/`activeTheme`
 * (panel-only selectors, don't affect what renders) and the `review`
 * verdicts/notes (render-inert audit metadata for the bake pass). The task
 * scope is "9 modes' params + envelope fields" — the visual dials, not the
 * panel's own bookkeeping.
 *
 * `default` values are pulled directly from DEFAULT_TEXTURE_TUNING (the
 * shipped bake) rather than hand-transcribed, so this registry can never
 * drift from the baked prod values — see
 * texture-tuning/__tests__ prod-snapshot-equality test for the enforcement.
 *
 * min/max/step/unit below are copied from TextureConsolePanel.tsx's
 * RangeControl props (the only dev-panel surface for these dials).
 */
import type {
  EnvelopeParams,
  SurfaceConfig,
  TextureMode,
  TextureSurface,
  TextureThemeKey,
} from "./textureDefaults";
import { DEFAULT_TEXTURE_TUNING } from "./textureDefaults";
import type { ParamSpec } from "./param";
import { defineRegistry, type ParamRegistry } from "./registry";

export const TEXTURE_SURFACES: readonly TextureSurface[] = ["disc", "sheet"];
export const TEXTURE_THEMES: readonly TextureThemeKey[] = ["light", "dark"];
export const TEXTURE_MODES: readonly TextureMode[] = [
  "css",
  "led",
  "concentric",
  "flow",
  "bayer",
  "halftone",
  "bluenoise",
  "scanlines",
  "crosshatch",
  "lego",
  "phyllotaxis",
  "julia",
  "lightning",
  "web",
  "coral",
];

/** The 9 modes that carry a param bag (every mode but "css"). */
export type ShaderMode = Exclude<TextureMode, "css">;
export const SHADER_MODES = TEXTURE_MODES.filter(
  (m): m is ShaderMode => m !== "css",
);

// ── Key builders (used by texture-tuning/store.ts) ─────────────────────────

export function textureEnabledKey(
  surface: TextureSurface,
  theme: TextureThemeKey,
): string {
  return `texture.${surface}.layer.enabled@${theme}`;
}

export function textureModeKey(
  surface: TextureSurface,
  theme: TextureThemeKey,
): string {
  return `texture.${surface}.layer.mode@${theme}`;
}

export function textureEnvelopeKey(
  surface: TextureSurface,
  field: keyof EnvelopeParams,
  theme: TextureThemeKey,
): string {
  return `texture.${surface}.envelope.${field}@${theme}`;
}

export function textureModeParamKey(
  surface: TextureSurface,
  mode: ShaderMode,
  field: string,
  theme: TextureThemeKey,
): string {
  return `texture.${surface}.${mode}.${field}@${theme}`;
}

// ── Field metadata (ranges from TextureConsolePanel.tsx's RangeControls) ───

interface NumberFieldMeta {
  kind: "number";
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  describe: string;
  reducedMotionSafe?: boolean;
}
interface BooleanFieldMeta {
  kind: "boolean";
  label: string;
  describe: string;
}
interface EnumFieldMeta {
  kind: "enum";
  label: string;
  options: readonly string[];
  describe: string;
}
type FieldMeta = NumberFieldMeta | BooleanFieldMeta | EnumFieldMeta;

const ENVELOPE_FIELD_META: Record<keyof EnvelopeParams, FieldMeta> = {
  reach: {
    kind: "number",
    label: "Reach",
    min: 0,
    max: 400,
    step: 1,
    unit: "px",
    describe:
      "Disc: outer mask radius in px. Sheet: ellipse y-radius as % of element height.",
  },
  fadeOrigin: {
    kind: "number",
    label: "Fade origin",
    min: 0,
    max: 1,
    step: 0.01,
    describe:
      "Fraction of reach where the solid band ends and the outer fade begins.",
  },
  fadeSoftness: {
    kind: "number",
    label: "Fade softness",
    min: 0,
    max: 120,
    step: 1,
    unit: "px",
    describe:
      "Width of the inner fade transition (disc only; sheet keeps this at 0).",
  },
  innerCutout: {
    kind: "number",
    label: "Inner cutout",
    min: 0,
    max: 120,
    step: 1,
    unit: "px",
    describe:
      "Inner transparent radius — the hole at the disc center (sheet: 0).",
  },
  opacity: {
    kind: "number",
    label: "Opacity",
    min: 0,
    max: 1,
    step: 0.01,
    describe: "Layer opacity, maps to u_opacity for the shader canvas.",
  },
  screenBlend: {
    kind: "boolean",
    label: "Screen blend",
    describe:
      "mix-blend-mode:screen on the canvas layer (drops black; adds light).",
  },
  tint: {
    kind: "enum",
    label: "Tint",
    options: ["ink", "accent", "custom"],
    describe: "Which CSS var sources u_color0 in the shader.",
  },
  mobileScale: {
    kind: "number",
    label: "Mobile scale",
    min: 0.5,
    max: 2.0,
    step: 0.05,
    describe:
      "Phone-breakpoint (<768px) multiplier on the geometric envelope; ignored at >=768px.",
  },
};
export const ENVELOPE_FIELD_KEYS = Object.keys(
  ENVELOPE_FIELD_META,
) as (keyof EnvelopeParams)[];

const MODE_FIELD_META: Record<ShaderMode, Record<string, NumberFieldMeta>> = {
  led: {
    cellSize: {
      kind: "number",
      label: "Cell size",
      min: 4,
      max: 40,
      step: 1,
      unit: "px",
      describe: "LED cell grid size in CSS px.",
    },
    gap: {
      kind: "number",
      label: "Gap",
      min: 0,
      max: 12,
      step: 0.5,
      unit: "px",
      describe: "Gap between LED cells in CSS px.",
    },
    glow: {
      kind: "number",
      label: "Glow",
      min: 0,
      max: 1,
      step: 0.05,
      describe: "Glow bleed beyond the LED cell boundary.",
    },
    colorMix: {
      kind: "number",
      label: "Color mix",
      min: 0,
      max: 1,
      step: 0.05,
      describe: "Color mix: 0 = color0 only, 1 = color1 only.",
    },
  },
  concentric: {
    ringSpacing: {
      kind: "number",
      label: "Ring spacing",
      min: 4,
      max: 60,
      step: 1,
      unit: "px",
      describe: "Spacing between concentric rings in CSS px.",
    },
    dotScale: {
      kind: "number",
      label: "Dot scale",
      min: 0.1,
      max: 1.5,
      step: 0.05,
      describe: "Dot radius as a fraction of half ring-spacing.",
    },
    centerFalloff: {
      kind: "number",
      label: "Center falloff",
      min: 0.5,
      max: 6,
      step: 0.1,
      describe:
        "Exponent controlling how fast luminance falls off from center.",
    },
    contrast: {
      kind: "number",
      label: "Contrast",
      min: 0.5,
      max: 3,
      step: 0.05,
      describe: "Luminance contrast multiplier.",
    },
  },
  flow: {
    speed: {
      kind: "number",
      label: "Speed",
      min: 0,
      max: 2,
      step: 0.05,
      describe: "Animation speed (scales u_time).",
      reducedMotionSafe: false,
    },
    warpAmount: {
      kind: "number",
      label: "Warp amount",
      min: 0,
      max: 1.5,
      step: 0.05,
      describe: "Domain warp strength.",
    },
    scale: {
      kind: "number",
      label: "Scale",
      min: 0.5,
      max: 8,
      step: 0.1,
      describe: "Noise spatial frequency (canvas-UV scale).",
    },
  },
  bayer: {
    matrixSize: {
      kind: "number",
      label: "Matrix size",
      min: 4,
      max: 8,
      step: 4,
      describe: "Bayer matrix size: 4 (4x4) or 8 (8x8).",
    },
    levels: {
      kind: "number",
      label: "Levels",
      min: 1,
      max: 8,
      step: 1,
      describe: "Quantization levels.",
    },
    contrast: {
      kind: "number",
      label: "Contrast",
      min: 0.5,
      max: 4,
      step: 0.1,
      describe: "Luminance contrast multiplier.",
    },
  },
  halftone: {
    cellSize: {
      kind: "number",
      label: "Cell size",
      min: 3,
      max: 40,
      step: 1,
      unit: "px",
      describe: "Halftone grid cell size in CSS px.",
    },
    dotMax: {
      kind: "number",
      label: "Dot max",
      min: 0.1,
      max: 1.0,
      step: 0.05,
      describe: "Max dot radius as a fraction of half-cell.",
    },
    angle: {
      kind: "number",
      label: "Angle",
      min: 0,
      max: 1.571,
      step: 0.05,
      unit: "rad",
      describe: "Grid rotation angle in radians.",
    },
    contrast: {
      kind: "number",
      label: "Contrast",
      min: 0.5,
      max: 3,
      step: 0.1,
      describe: "Luminance contrast multiplier.",
    },
  },
  bluenoise: {
    scale: {
      kind: "number",
      label: "Scale",
      min: 0.2,
      max: 8,
      step: 0.1,
      describe: "Spatial frequency of the IGN threshold pattern.",
    },
    levels: {
      kind: "number",
      label: "Levels",
      min: 1,
      max: 8,
      step: 1,
      describe: "Quantization levels.",
    },
    contrast: {
      kind: "number",
      label: "Contrast",
      min: 0.5,
      max: 4,
      step: 0.1,
      describe: "Luminance contrast multiplier.",
    },
  },
  scanlines: {
    lineFreq: {
      kind: "number",
      label: "Line freq",
      min: 0.01,
      max: 0.5,
      step: 0.01,
      describe: "Lines per pixel.",
    },
    lineDepth: {
      kind: "number",
      label: "Depth",
      min: 0,
      max: 1,
      step: 0.05,
      describe: "Modulation depth.",
    },
    rollSpeed: {
      kind: "number",
      label: "Roll speed",
      min: 0,
      max: 100,
      step: 5,
      unit: "px/s",
      describe: "Vertical roll speed in px/second (0 = static).",
      reducedMotionSafe: false,
    },
    curvature: {
      kind: "number",
      label: "Curvature",
      min: 0,
      max: 1,
      step: 0.05,
      describe: "CRT barrel distortion strength.",
    },
  },
  crosshatch: {
    hatchFreq: {
      kind: "number",
      label: "Hatch freq",
      min: 0.01,
      max: 0.2,
      step: 0.005,
      describe: "Lines per pixel.",
    },
    angle: {
      kind: "number",
      label: "Angle",
      min: 0,
      max: 1.571,
      step: 0.05,
      unit: "rad",
      describe: "Base hatch angle in radians.",
    },
    levels: {
      kind: "number",
      label: "Levels",
      min: 1,
      max: 3,
      step: 1,
      describe: "Max number of hatch layer directions.",
    },
    weight: {
      kind: "number",
      label: "Line weight",
      min: 0.02,
      max: 0.4,
      step: 0.01,
      describe: "Line half-thickness as a fraction of cell width.",
    },
  },
  lego: {
    studSize: {
      kind: "number",
      label: "Stud size",
      min: 6,
      max: 48,
      step: 2,
      unit: "px",
      describe: "Block cell size in CSS px.",
    },
    bevel: {
      kind: "number",
      label: "Bevel",
      min: 0,
      max: 0.4,
      step: 0.02,
      describe: "Bevel lighting strength.",
    },
    gap: {
      kind: "number",
      label: "Gap",
      min: 0,
      max: 0.45,
      step: 0.02,
      describe: "Inter-block gap as a fraction of the cell.",
    },
  },
  phyllotaxis: {
    spacing: {
      kind: "number",
      label: "Spacing",
      min: 4,
      max: 40,
      step: 1,
      unit: "px",
      describe: "Spacing between successive golden-angle spiral points.",
    },
    dotScale: {
      kind: "number",
      label: "Dot scale",
      min: 0.05,
      max: 1.0,
      step: 0.05,
      describe: "Dot radius as a fraction of spacing.",
    },
    rotate: {
      kind: "number",
      label: "Rotate",
      min: 0,
      max: 6.283,
      step: 0.05,
      unit: "rad",
      describe: "Extra rotation applied to the spiral.",
    },
    jitter: {
      kind: "number",
      label: "Jitter",
      min: 0,
      max: 1,
      step: 0.05,
      describe: "Per-dot position jitter, fraction of spacing.",
    },
    contrast: {
      kind: "number",
      label: "Contrast",
      min: 0.5,
      max: 3,
      step: 0.05,
      describe: "Luminance contrast multiplier.",
    },
  },
  julia: {
    cRe: {
      kind: "number",
      label: "C (real)",
      min: -1.5,
      max: 1.5,
      step: 0.01,
      describe: "Julia constant, real part.",
    },
    cIm: {
      kind: "number",
      label: "C (imag)",
      min: -1.5,
      max: 1.5,
      step: 0.01,
      describe: "Julia constant, imaginary part.",
    },
    zoom: {
      kind: "number",
      label: "Zoom",
      min: 0.2,
      max: 4,
      step: 0.05,
      describe: "View zoom.",
    },
    levels: {
      kind: "number",
      label: "Levels",
      min: 2,
      max: 3,
      step: 1,
      describe: "Posterize tone levels.",
    },
    trapMix: {
      kind: "number",
      label: "Trap mix",
      min: 0,
      max: 1,
      step: 0.05,
      describe: "Blend between escape-time and orbit-trap fields.",
    },
    contrast: {
      kind: "number",
      label: "Contrast",
      min: 0.5,
      max: 3,
      step: 0.05,
      describe: "Luminance contrast multiplier.",
    },
  },
  lightning: {
    density: {
      kind: "number",
      label: "Density",
      min: 0.5,
      max: 8,
      step: 0.1,
      describe: "Noise spatial frequency.",
    },
    warp: {
      kind: "number",
      label: "Warp",
      min: 0,
      max: 2,
      step: 0.05,
      describe: "Domain warp strength.",
    },
    thickness: {
      kind: "number",
      label: "Thickness",
      min: 0.02,
      max: 0.3,
      step: 0.01,
      describe: "Filament width — smaller reads as thinner, sharper threads.",
    },
    flickerSpeed: {
      kind: "number",
      label: "Flicker speed",
      min: 0,
      max: 2,
      step: 0.05,
      describe: "Animation rate (0 = static).",
      reducedMotionSafe: false,
    },
    contrast: {
      kind: "number",
      label: "Contrast",
      min: 0.5,
      max: 4,
      step: 0.1,
      describe: "Luminance contrast multiplier.",
    },
  },
  web: {
    spokes: {
      kind: "number",
      label: "Spokes",
      min: 4,
      max: 24,
      step: 1,
      describe: "Radial spoke count.",
    },
    ringSpacing: {
      kind: "number",
      label: "Ring spacing",
      min: 6,
      max: 60,
      step: 1,
      unit: "px",
      describe: "Spacing between concentric rings in CSS px.",
    },
    sag: {
      kind: "number",
      label: "Sag",
      min: 0,
      max: 0.5,
      step: 0.01,
      describe: "Ring sag between spokes.",
    },
    jitter: {
      kind: "number",
      label: "Jitter",
      min: 0,
      max: 1,
      step: 0.05,
      describe: "Per-thread position jitter.",
    },
    threadWidth: {
      kind: "number",
      label: "Thread width",
      min: 0.5,
      max: 4,
      step: 0.1,
      unit: "px",
      describe: "Thread half-width in CSS px.",
    },
  },
  coral: {
    scale: {
      kind: "number",
      label: "Scale",
      min: 0.5,
      max: 8,
      step: 0.1,
      describe: "Spatial frequency of the Worley cell field.",
    },
    warp: {
      kind: "number",
      label: "Warp",
      min: 0,
      max: 2,
      step: 0.05,
      describe: "Domain warp strength.",
    },
    threshold: {
      kind: "number",
      label: "Threshold",
      min: 0,
      max: 1,
      step: 0.01,
      describe:
        "Base growth threshold — higher spreads growth further from center.",
    },
    detail: {
      kind: "number",
      label: "Detail",
      min: 0,
      max: 1,
      step: 0.05,
      describe: "Fine-cell detail mix.",
    },
    contrast: {
      kind: "number",
      label: "Contrast",
      min: 0.5,
      max: 4,
      step: 0.1,
      describe: "Luminance contrast multiplier.",
    },
  },
};

/** Stable per-mode field order — used by texture-tuning/store.ts's composers. */
export const MODE_FIELD_KEYS: Record<ShaderMode, readonly string[]> =
  Object.fromEntries(
    SHADER_MODES.map((mode) => [mode, Object.keys(MODE_FIELD_META[mode])]),
  ) as unknown as Record<ShaderMode, readonly string[]>;

// ── Registry generation ─────────────────────────────────────────────────────

function buildSpecs(): ParamSpec<unknown>[] {
  const specs: ParamSpec<unknown>[] = [];

  for (const surface of TEXTURE_SURFACES) {
    for (const theme of TEXTURE_THEMES) {
      const surfaceDefaults: SurfaceConfig =
        DEFAULT_TEXTURE_TUNING[surface][theme];

      specs.push({
        key: textureEnabledKey(surface, theme),
        group: `texture.${surface}.layer`,
        label: "Enabled",
        kind: "boolean",
        default: surfaceDefaults.enabled,
        reducedMotionSafe: true,
        agentWritable: true,
        describe: `Whether the WebGL canvas is mounted for the ${surface} surface in ${theme} theme; false falls back to the CSS bloom.`,
      });

      specs.push({
        key: textureModeKey(surface, theme),
        group: `texture.${surface}.layer`,
        label: "Mode",
        kind: "enum",
        default: surfaceDefaults.mode,
        options: TEXTURE_MODES,
        reducedMotionSafe: true,
        agentWritable: true,
        describe: `Active texture shader mode for the ${surface} surface in ${theme} theme.`,
      });

      for (const field of ENVELOPE_FIELD_KEYS) {
        const meta = ENVELOPE_FIELD_META[field];
        specs.push({
          key: textureEnvelopeKey(surface, field, theme),
          group: `texture.${surface}.envelope`,
          label: meta.label,
          kind: meta.kind,
          default: surfaceDefaults.envelope[field],
          ...(meta.kind === "number"
            ? { min: meta.min, max: meta.max, step: meta.step, unit: meta.unit }
            : {}),
          ...(meta.kind === "enum" ? { options: meta.options } : {}),
          reducedMotionSafe: true,
          agentWritable: true,
          describe: meta.describe,
        } as ParamSpec<unknown>);
      }

      for (const mode of SHADER_MODES) {
        const fieldMetaMap = MODE_FIELD_META[mode];
        const modeDefaults = surfaceDefaults[mode] as unknown as Record<
          string,
          number
        >;
        for (const field of Object.keys(fieldMetaMap)) {
          const meta = fieldMetaMap[field];
          specs.push({
            key: textureModeParamKey(surface, mode, field, theme),
            group: `texture.${surface}.${mode}`,
            label: meta.label,
            kind: "number",
            default: modeDefaults[field],
            min: meta.min,
            max: meta.max,
            step: meta.step,
            unit: meta.unit,
            reducedMotionSafe: meta.reducedMotionSafe ?? true,
            agentWritable: true,
            describe: meta.describe,
          });
        }
      }
    }
  }

  return specs;
}

export const TEXTURE_TUNING_PARAMS: readonly ParamSpec<unknown>[] =
  buildSpecs();
export const TEXTURE_TUNING_REGISTRY: ParamRegistry = defineRegistry(
  TEXTURE_TUNING_PARAMS,
);
