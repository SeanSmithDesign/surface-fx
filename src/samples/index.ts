/**
 * surface-fx samples — the named targets `surface-fx open <target>` (and the
 * Stage playground's sample picker) load.
 *
 * A sample is a STATIC look: shape + theme + a partial override of the
 * ParamRegistry's default values. It never wires ripple/pointer/velocity —
 * those are bundled by stage-entry.ts but not driving any rendering (see
 * that file's header "NOT YET IN STAGE" note); a sample must render
 * correctly at rest, with no motion dependency.
 *
 * Lives in `src/lib/surface-fx/` (not scripts/) so it travels unmodified
 * when this directory is extracted into a standalone `surface-fx` package —
 * the Stage bundle (stage-entry.ts) and any future CLI/MCP face both import
 * it directly.
 *
 * Every override below is READ from the shipped baked defaults
 * (textureDefaults.ts / textureTuningRegistry.ts), never hand-guessed — see
 * each sample's comment for where its values come from.
 */
import { textureModeKey } from "../schema/textureTuningRegistry";

export type SurfaceFxSampleShape = "circle" | "roundedRect";
export type SurfaceFxSampleTheme = "light" | "dark";

/** A single registry-key override value — mirrors ParamSpec's value union. */
export type SurfaceFxSampleParamValue = number | boolean | string;

export interface SurfaceFxSample {
  /** Kebab-case, stable — this is the `open <target>` / `?target=` id. */
  id: string;
  label: string;
  /** One line — shown in the Stage picker's title/tooltip. */
  description: string;
  shape: SurfaceFxSampleShape;
  theme: SurfaceFxSampleTheme;
  /**
   * Partial override of registry keys, applied OVER defaultsRecord().
   * Only keys that meaningfully change the look — everything else falls
   * through to the shipped default.
   */
  params: Record<string, SurfaceFxSampleParamValue>;
}

/**
 * disc — the shipped identity-disc default look (FloatingIdentity's dock
 * disc). Circle, light theme, mode "led" — this IS the baked
 * DEFAULT_TEXTURE_TUNING.disc.light config (textureDefaults.ts), so no
 * overrides are needed; defaultsRecord() already renders it. This is also
 * what `open` with no target loads.
 */
const DISC_SAMPLE: SurfaceFxSample = {
  id: "disc",
  label: "Disc",
  description: "Shipped identity-disc default — circle, light theme, LED texture.",
  shape: "circle",
  theme: "light",
  params: {},
};

/**
 * sheet — the shipped contact-sheet look (ContactSheet's dither-shadow
 * surface). Rounded-rect, light theme, mode "led" — this IS the baked
 * DEFAULT_TEXTURE_TUNING.sheet.light config, so no overrides are needed.
 */
const SHEET_SAMPLE: SurfaceFxSample = {
  id: "sheet",
  label: "Sheet",
  description: "Shipped contact-sheet default — rounded-rect, light theme, LED texture.",
  shape: "roundedRect",
  theme: "light",
  params: {},
};

/**
 * halftone — same disc geometry/envelope as DISC_SAMPLE (dark-theme
 * divergence, per textureDefaults.ts's DISC_DARK_ENVELOPE), with the shader
 * mode swapped from "led" to "halftone" to show the material's range. The
 * halftone param bag itself is untouched: DEFAULT_MODE_PARAMS.halftone
 * (textureDefaults.ts) is shared across every surface/theme that hasn't
 * overridden it, and disc.dark never does — so this needs exactly one
 * override (the mode enum key) to render correctly.
 */
const HALFTONE_SAMPLE: SurfaceFxSample = {
  id: "halftone",
  label: "Halftone",
  description: "Disc surface, dark theme, mode swapped to halftone dot-grid.",
  shape: "circle",
  theme: "dark",
  params: {
    [textureModeKey("disc", "dark")]: "halftone",
  },
};

export const SURFACE_FX_SAMPLES: readonly SurfaceFxSample[] = [
  DISC_SAMPLE,
  SHEET_SAMPLE,
  HALFTONE_SAMPLE,
];

export const SURFACE_FX_SAMPLE_IDS: readonly string[] = SURFACE_FX_SAMPLES.map((s) => s.id);

export function getSurfaceFxSample(id: string): SurfaceFxSample | undefined {
  return SURFACE_FX_SAMPLES.find((s) => s.id === id);
}
