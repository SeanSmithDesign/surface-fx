/**
 * bloom-tuning ParamSpec registry.
 *
 * Flattens the per-theme (light|dark) `BloomTuning` shape — the contact-
 * sheet open/close animation's springs, radius/content timing, backdrop
 * dither, shadow-morph, resting-disc-dither, and pointer-pressure fields —
 * into one flat ParamRegistry.
 *
 * KEY CONVENTION: "bloom.<group>.<param>@<theme>"
 *   - top-level scalar fields: "bloom.<field>@<theme>", e.g. "bloom.ditherScale@light"
 *   - nested spring objects: "bloom.<spring>.<field>@<theme>", e.g.
 *     "bloom.surfaceCloseSpring.stiffness@dark"
 *   - <theme> suffix ("@light" | "@dark") keys the SAME logical dial
 *     independently per theme, since BloomTuningPanel edits one theme's
 *     full BloomTuning set at a time and the two sets CAN diverge on every
 *     field (see bloom-tuning/store.ts's composer).
 *
 * Reconciling with the schema core's seed group (SHEET_SHADOW_PARAMS in
 * ./registry.ts): that seed is an UN-themed proof-of-concept covering the
 * same 4 shadow-morph fields (spreadPx/falloffSoftness/edgeDensity/
 * cornerFollow) at their current shared light+dark values. It is NOT reused
 * here — bloom's shadow fields are independently editable per theme (Sean
 * CAN dial dark's shadow differently from light in the panel even though
 * today's baked defaults happen to match), so collapsing them onto one
 * un-themed key would be a real behavior change, not just a rename. The two
 * stay separate, documented namespaces by design: SHEET_SHADOW_REGISTRY
 * remains an unwired POC; "bloom.ditherShadow*@<theme>" below is the real,
 * wired-up spec for the same geometry, defined once per theme.
 *
 * `default` values are pulled directly from DEFAULT_THEMED_BLOOM_TUNING (the
 * shipped bake) rather than hand-transcribed, so this registry can never
 * drift from the baked prod values — see
 * bloom-tuning/__tests__ prod-snapshot-equality test for the enforcement.
 *
 * min/max/step/unit below are copied from BloomTuningPanel.tsx and
 * FloatingIdentityTuningPanel.tsx's RangeControl props (the two dev-panel
 * surfaces for these dials), WIDENED past the panel's literal slider bound
 * in the two spots where the shipped baked default already exceeds it
 * (radiusCloseDelaySec: panel max 1, baked default 1.5; ditherFadeOriginY:
 * panel max 100, baked default up to 115) — a ParamSpec whose min/max
 * excludes its own `default` throws at module load (defineRegistry's
 * validateSpec), so the range must honestly cover what production ships.
 */
import type { BloomTuning, BloomThemeKey } from "./bloomDefaults";
import { DEFAULT_THEMED_BLOOM_TUNING } from "./bloomDefaults";
import type { ParamSpec } from "./param";
import { defineRegistry, type ParamRegistry } from "./registry";

export const BLOOM_THEMES: readonly BloomThemeKey[] = ["light", "dark"];

export type SpringGroup = "surfaceCloseSpring" | "portraitFollowSpring";

// ── Key builders (used by bloom-tuning/store.ts) ────────────────────────────

export function bloomFieldKey(
  field: Exclude<keyof BloomTuning, SpringGroup>,
  theme: BloomThemeKey,
): string {
  return `bloom.${field}@${theme}`;
}

export function bloomSpringFieldKey(
  spring: SpringGroup,
  field: string,
  theme: BloomThemeKey,
): string {
  return `bloom.${spring}.${field}@${theme}`;
}

// ── Field metadata ───────────────────────────────────────────────────────────

interface NumberFieldMeta {
  kind: "number";
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  describe: string;
  reducedMotionSafe: boolean;
}
interface BooleanFieldMeta {
  kind: "boolean";
  label: string;
  describe: string;
  reducedMotionSafe: boolean;
}
type ScalarFieldMeta = NumberFieldMeta | BooleanFieldMeta;

// Timing/spring fields that directly shape the open/close ANIMATION curve
// are reducedMotionSafe:false. Static appearance fields (backdrop, dither,
// shadow shape, resting-disc glow) are reducedMotionSafe:true.
const SCALAR_FIELD_META: Record<Exclude<keyof BloomTuning, SpringGroup>, ScalarFieldMeta> = {
  radiusHoldFraction: { kind: "number", label: "Radius hold fraction", min: 0, max: 1, step: 0.02, describe: "0..1 fraction of close where corner-radius begins rounding from sheet toward disc.", reducedMotionSafe: false },
  sheetRadius: { kind: "number", label: "Sheet radius", min: 0, max: 64, step: 1, unit: "px", describe: "Sheet corner radius (px) held during the first radiusHoldFraction of close.", reducedMotionSafe: true },
  discRadius: { kind: "number", label: "Disc radius", min: 0, max: 99999, step: 1, describe: "Disc radius; a large sentinel (9999) yields a true circle. No dev-panel slider exists for this field.", reducedMotionSafe: true },
  surfaceCloseLeadDelayMs: { kind: "number", label: "Close lead delay", min: 0, max: 200, step: 5, unit: "ms", describe: "On close, delays the surface scale-down while the portrait re-homes immediately.", reducedMotionSafe: false },
  contentFadeOutMs: { kind: "number", label: "Content fade duration", min: 0, max: 400, step: 10, unit: "ms", describe: "Content (text/rows/X) fade-out duration on close.", reducedMotionSafe: false },
  contentFadeOutDelayMs: { kind: "number", label: "Content fade delay", min: 0, max: 200, step: 10, unit: "ms", describe: "Delay after close starts before content begins fading.", reducedMotionSafe: false },
  radiusCloseDelaySec: { kind: "number", label: "Radius close delay", min: 0, max: 2, step: 0.02, unit: "s", describe: "Time gate on CLOSE before corner-radius rounding begins, layered on top of radiusHoldFraction.", reducedMotionSafe: false },
  openContentRevealDelaySec: { kind: "number", label: "Open content reveal delay", min: 0, max: 1, step: 0.01, unit: "s", describe: "Delay on OPEN before text/rows start writing in.", reducedMotionSafe: false },
  backdropDimEnabled: { kind: "boolean", label: "Backdrop dim + blur", describe: "Enable/disable the gray dim+blur scrim layer.", reducedMotionSafe: true },
  backdropBlurPx: { kind: "number", label: "Backdrop blur", min: 0, max: 40, step: 1, unit: "px", describe: "Backdrop blur radius; only applied when backdropDimEnabled is true.", reducedMotionSafe: true },
  backdropDimOpacity: { kind: "number", label: "Backdrop dim strength", min: 0, max: 1, step: 0.05, describe: "Multiplier on the dim scrim alpha; only applied when backdropDimEnabled is true.", reducedMotionSafe: true },
  ditherEnabled: { kind: "boolean", label: "Dither overlay", describe: "Enable/disable the dither texture overlay on the backdrop.", reducedMotionSafe: true },
  ditherCollapsedOpacity: { kind: "number", label: "Dither collapsed opacity", min: 0, max: 1, step: 0.01, describe: "Dither opacity when the sheet is fully COLLAPSED (collapseProgress = 1).", reducedMotionSafe: true },
  ditherExpandedOpacity: { kind: "number", label: "Dither expanded opacity", min: 0, max: 1, step: 0.01, describe: "Dither opacity when the sheet is fully EXPANDED (collapseProgress = 0).", reducedMotionSafe: true },
  ditherScale: { kind: "number", label: "Dither dot size", min: 1, max: 12, step: 0.5, unit: "px", describe: "Dot/cell size for the dither dot grid.", reducedMotionSafe: true },
  ditherFadeEnabled: { kind: "boolean", label: "Dither fade mask", describe: "Enable the spatial fade mask on the dither layer (bloom-from-sheet shape).", reducedMotionSafe: true },
  ditherFadeRadial: { kind: "boolean", label: "Dither fade radial", describe: "true = radial ellipse anchored bottom-center; false = linear vertical fade.", reducedMotionSafe: true },
  ditherFadeOriginY: { kind: "number", label: "Dither fade origin Y", min: 0, max: 150, step: 1, unit: "%", describe: "Radial: bloom ellipse's vertical radius as % of element height. Linear: vertical anchor of heaviest fill.", reducedMotionSafe: true },
  ditherFadeSpread: { kind: "number", label: "Dither fade spread", min: 0, max: 150, step: 1, unit: "%", describe: "Linear path only: how far the fill extends from origin before going transparent.", reducedMotionSafe: true },
  ditherFadeSoftness: { kind: "number", label: "Dither fade softness", min: 0, max: 100, step: 1, unit: "%", describe: "Linear path only: fraction of spread that is a solid opaque core before fading.", reducedMotionSafe: true },
  ditherShadowSpreadPx: { kind: "number", label: "Shadow spread", min: 0, max: 160, step: 2, unit: "px", describe: "Penumbra spread beyond the morphing shape's true edge, shared by both axes.", reducedMotionSafe: true },
  ditherShadowFalloffSoftness: { kind: "number", label: "Shadow falloff softness", min: 0, max: 100, step: 1, unit: "%", describe: "Shape of the falloff curve across the spread band.", reducedMotionSafe: true },
  ditherShadowEdgeDensity: { kind: "number", label: "Shadow edge density", min: 0, max: 1, step: 0.05, describe: "Peak mask alpha right at the morphing shape's true edge.", reducedMotionSafe: true },
  ditherShadowCornerFollow: { kind: "number", label: "Shadow corner follow", min: 0, max: 1, step: 0.05, describe: "How strongly the mask's rx/ry follow the morphing shape's true aspect ratio vs a circle.", reducedMotionSafe: true },
  discDitherOpacity: { kind: "number", label: "Disc dither opacity", min: 0, max: 1, step: 0.01, describe: "Opacity of the resting-disc dither bloom under the dock disc.", reducedMotionSafe: true },
  discDitherScale: { kind: "number", label: "Disc dither scale", min: 1, max: 12, step: 0.5, unit: "px", describe: "Dot-grid scale/spacing for the resting-disc dither bloom.", reducedMotionSafe: true },
  discDitherMaskSize: { kind: "number", label: "Disc dither mask size", min: 40, max: 320, step: 4, unit: "px", describe: "Radius/spread of the radial mask fading the resting-disc dot-grid outward.", reducedMotionSafe: true },
  pointerMaxLift: { kind: "number", label: "Pointer max lift", min: 0, max: 1, step: 0.01, describe: "Peak relative alpha lift on the sheet dither at the pointer, applied before the container opacity ceiling multiplies it down. Migrated from ContactSheet.tsx's SHEET_POINTER_MAX_LIFT constant.", reducedMotionSafe: true },
};
export const SCALAR_FIELD_KEYS = Object.keys(
  SCALAR_FIELD_META,
) as Exclude<keyof BloomTuning, SpringGroup>[];

const SPRING_FIELD_META: Record<SpringGroup, Record<string, NumberFieldMeta>> = {
  surfaceCloseSpring: {
    stiffness: { kind: "number", label: "Stiffness", min: 20, max: 800, step: 5, describe: "Spring stiffness for the surface box on CLOSE (the FLIP back from sheet to disc).", reducedMotionSafe: false },
    damping: { kind: "number", label: "Damping", min: 5, max: 80, step: 1, describe: "Spring damping for the surface box on CLOSE.", reducedMotionSafe: false },
    mass: { kind: "number", label: "Mass", min: 0.1, max: 5, step: 0.05, describe: "Spring mass for the surface box on CLOSE.", reducedMotionSafe: false },
  },
  portraitFollowSpring: {
    stiffness: { kind: "number", label: "Stiffness", min: 20, max: 800, step: 5, describe: "Spring stiffness for the portrait inverse-correction on close.", reducedMotionSafe: false },
    damping: { kind: "number", label: "Damping", min: 5, max: 80, step: 1, describe: "Spring damping for the portrait inverse-correction on close.", reducedMotionSafe: false },
  },
};

export const SPRING_GROUPS: readonly SpringGroup[] = [
  "surfaceCloseSpring",
  "portraitFollowSpring",
];
/** Stable per-spring field order — used by bloom-tuning/store.ts's composers. */
export const SPRING_FIELD_KEYS: Record<SpringGroup, readonly string[]> = Object.fromEntries(
  SPRING_GROUPS.map((spring) => [spring, Object.keys(SPRING_FIELD_META[spring])]),
) as unknown as Record<SpringGroup, readonly string[]>;

// ── Registry generation ─────────────────────────────────────────────────────

function buildSpecs(): ParamSpec<unknown>[] {
  const specs: ParamSpec<unknown>[] = [];

  for (const theme of BLOOM_THEMES) {
    const themeDefaults: BloomTuning = DEFAULT_THEMED_BLOOM_TUNING[theme];

    for (const field of SCALAR_FIELD_KEYS) {
      const meta = SCALAR_FIELD_META[field];
      specs.push({
        key: bloomFieldKey(field, theme),
        group: `bloom.${field}`,
        label: meta.label,
        kind: meta.kind,
        default: themeDefaults[field],
        ...(meta.kind === "number"
          ? { min: meta.min, max: meta.max, step: meta.step, unit: meta.unit }
          : {}),
        reducedMotionSafe: meta.reducedMotionSafe,
        agentWritable: true,
        describe: meta.describe,
      } as ParamSpec<unknown>);
    }

    for (const spring of Object.keys(SPRING_FIELD_META) as SpringGroup[]) {
      const fieldMetaMap = SPRING_FIELD_META[spring];
      const springDefaults = themeDefaults[spring] as unknown as Record<string, number>;
      for (const field of Object.keys(fieldMetaMap)) {
        const meta = fieldMetaMap[field];
        specs.push({
          key: bloomSpringFieldKey(spring, field, theme),
          group: `bloom.${spring}`,
          label: meta.label,
          kind: "number",
          default: springDefaults[field],
          min: meta.min,
          max: meta.max,
          step: meta.step,
          reducedMotionSafe: meta.reducedMotionSafe,
          agentWritable: true,
          describe: meta.describe,
        });
      }
    }
  }

  return specs;
}

export const BLOOM_TUNING_PARAMS: readonly ParamSpec<unknown>[] = buildSpecs();
export const BLOOM_TUNING_REGISTRY: ParamRegistry = defineRegistry(BLOOM_TUNING_PARAMS);
