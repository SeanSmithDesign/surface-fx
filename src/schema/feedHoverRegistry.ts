/**
 * Feed hover-FX ParamSpec registry.
 *
 * Flattens the feed card hover treatments' FEEL values — wake tilt/lift/
 * spring, ripple duration/travel/spawn-cadence/band/opacity, glow radius/
 * opacity, and dither dot/grid/softness/peak-intensity — into a
 * ParamRegistry. This is the ONE remaining tuning store on the site not yet
 * migrated onto the schema core (texture-tuning and bloom-tuning already
 * are — see textureTuningRegistry.ts / bloomTuningRegistry.ts).
 *
 * KEY CONVENTION: "feed.hover.<group>.<param>" — NO "@<theme>" suffix.
 * Unlike texture-tuning and bloom-tuning (both THEMED: independent light/
 * dark value sets a panel can dial apart from each other — see registry.ts's
 * key-convention comment), this store has exactly ONE value per field. Two
 * fields even have "Light"/"Dark" in their name (rippleOpacityLight/
 * rippleOpacityDark, glowOpacityLight/glowOpacityDark), but those are
 * already modeled as two independent flat fields in SHIPPED_HOVER_FX_DEFAULTS
 * (not one field keyed twice per theme) — so there is nothing for a
 * "@<theme>" suffix to key here. This registry deliberately opts out of that
 * convention rather than mis-applying it.
 *
 * SHIPPED_HOVER_FX_DEFAULTS — the pre-migration store's shipped-constants
 * object — is DEFINED HERE, not in tuning.ts, and every spec's `default`
 * below is pulled from it programmatically (never hand-transcribed), so this
 * registry can never drift from the baked prod values. It lives here rather
 * than in tuning.ts to avoid a module cycle: tuning.ts's schema store needs
 * this registry, and this registry needs the shipped defaults, so the
 * defaults must live upstream of both (the same reason bloomTuningRegistry.ts
 * pulls from bloom-tuning/defaults.ts rather than bloom-tuning/store.ts).
 * tuning.ts re-exports SHIPPED_HOVER_FX_DEFAULTS / HoverFXTuning /
 * HoverFXTuningKey / HOVER_FX_TUNING_KEYS byte-for-byte so every consumer
 * (serializeTuning.ts, FeedHoverFXTuningPanel.tsx) keeps compiling unchanged
 * against "./tuning" / the feed hover-fx component's local "./tuning" alias.
 *
 * min/max/step/unit below are copied from FeedHoverFXTuningPanel.tsx's
 * RangeControl props (the dev-panel surface for these dials). Every shipped
 * default already sits inside its own [min, max] — defineRegistry's
 * validateSpec throws otherwise — so no range needed widening past the
 * panel's literal slider bound (unlike bloomTuningRegistry.ts's two spots).
 *
 * reducedMotionSafe: the Wake group (tiltMax / wakeLift / springStiffness /
 * springDamping) drives an actual 3D transform — tilt, lift, and the spring
 * that animates both — and is marked false. Ripple's ringDuration/ringTravel
 * set how far and how fast the ripple ring itself travels outward (motion,
 * not just intensity) and are also false. Every other field — spawn
 * cadence, band softness, opacity levels, glow radius, dither dot geometry,
 * peak-intensity scale — is a static appearance/intensity value with no
 * inherent motion of its own and is marked true, mirroring bloom-tuning's
 * timing-vs-appearance split (see bloomTuningRegistry.ts's SCALAR_FIELD_META
 * comment). No consumer reads this flag yet (see param.ts's doc comment) —
 * this is forward-looking metadata for a future reduced-motion wire-up, not
 * a behavior change today.
 */
import type { ParamSpec } from "./param";
import { defineRegistry, type ParamRegistry } from "./registry";

// ── Shipped defaults — canonical source (see header) ────────────────────────
//
// These MUST equal the values previously hardcoded in tuning.ts so
// production renders unchanged. To bake new values: copy the dev panel's
// "Copy values" output and paste the numbers over these.
export const SHIPPED_HOVER_FX_DEFAULTS = {
  // Wake (FeedHoverFX.tsx)
  tiltMax: 0.5, // deg — pointer-relative rotateX/rotateY ceiling
  wakeLift: -5, // px — translateY on enter (negative = rise)
  // Card scale on hover is driven by MotionTuning's hoverScale (1.02) so it stays
  // in sync with the DialKit panel and applies to the whole card as a unit.
  springStiffness: 260, // wake tilt + lift + scale spring stiffness
  springDamping: 23, // wake tilt + lift + scale spring damping
  // Ripple (HoverRippleLayer + FeedHoverFX move throttle)
  ringDuration: 2, // s — ring expand duration
  ringTravel: 50, // % — ring outward travel (radius cap)
  rippleInterval: 170, // ms — min gap between move-spawned rings
  ringBand: 32, // % — ring band half-width (softness)
  // Ripple opacity (HoverRippleLayer via --fx-ripple-opacity CSS var)
  rippleOpacityLight: 10, // % — master ripple opacity on paper palettes (100 = full current opacity)
  rippleOpacityDark: 8, // % — master ripple opacity on midnight palette (100 = full current opacity)
  // Glow / Bloom (FeedHoverFX.module.css via CSS vars)
  glowRadius: 120, // px — bloom radial gradient radius
  glowOpacityLight: 0, // % — peak glow ink-mix on paper palettes
  glowOpacityDark: 0, // % — peak glow ink-mix on midnight palette
  // Dither (HoverRippleLayer.module.css dot-grid vars + peak intensity)
  ditherDotSize: 1, // px — dot-grid circle radius (--dab-dither-dot)
  ditherGridGap: 5, // px — dot-grid cell size (--dab-dither-gap)
  ditherDotSoftness: 0.05, // px — dot feather spread (--dab-dither-spread)
  ditherPeakScale: 1.5, // × — multiplier on ripple ring peak alpha (hover intensity)
} as const;

export type HoverFXTuning = typeof SHIPPED_HOVER_FX_DEFAULTS;
export type HoverFXTuningKey = keyof HoverFXTuning;

export const HOVER_FX_TUNING_KEYS = Object.keys(
  SHIPPED_HOVER_FX_DEFAULTS,
) as HoverFXTuningKey[];

// ── Key builder ──────────────────────────────────────────────────────────

export function feedHoverFieldKey(field: HoverFXTuningKey): string {
  return `feed.hover.${FIELD_META[field].group}.${field}`;
}

// ── Field metadata (ranges from FeedHoverFXTuningPanel.tsx's RangeControls) ─

type FieldGroup = "wake" | "ripple" | "glow" | "dither";

interface FieldMeta {
  group: FieldGroup;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  reducedMotionSafe: boolean;
  describe: string;
}

const FIELD_META: Record<HoverFXTuningKey, FieldMeta> = {
  tiltMax: {
    group: "wake",
    label: "Tilt max",
    min: 0,
    max: 10,
    step: 0.5,
    unit: "deg",
    reducedMotionSafe: false,
    describe:
      "Pointer-relative rotateX/rotateY ceiling for the wake tilt effect, in degrees.",
  },
  wakeLift: {
    group: "wake",
    label: "Lift",
    min: -12,
    max: 0,
    step: 0.5,
    unit: "px",
    reducedMotionSafe: false,
    describe:
      "translateY on hover enter; negative values rise the card toward the viewer.",
  },
  springStiffness: {
    group: "wake",
    label: "Spring stiffness",
    min: 80,
    max: 300,
    step: 5,
    reducedMotionSafe: false,
    describe:
      "Spring stiffness shared by the wake tilt, lift, and scale animations.",
  },
  springDamping: {
    group: "wake",
    label: "Spring damping",
    min: 15,
    max: 40,
    step: 1,
    reducedMotionSafe: false,
    describe:
      "Spring damping shared by the wake tilt, lift, and scale animations.",
  },
  ringDuration: {
    group: "ripple",
    label: "Ring duration",
    min: 1.0,
    max: 3.5,
    step: 0.1,
    unit: "s",
    reducedMotionSafe: false,
    describe:
      "Duration of one ripple ring's outward expand-and-fade sweep, in seconds.",
  },
  ringTravel: {
    group: "ripple",
    label: "Ring travel",
    min: 40,
    max: 80,
    step: 1,
    unit: "%",
    reducedMotionSafe: false,
    describe:
      "How far a ripple ring travels outward from its spawn point, as a % radius cap.",
  },
  rippleInterval: {
    group: "ripple",
    label: "Spawn interval",
    min: 150,
    max: 500,
    step: 10,
    unit: "ms",
    reducedMotionSafe: true,
    describe:
      "Minimum gap between pointer-move-spawned ripple rings, in ms.",
  },
  ringBand: {
    group: "ripple",
    label: "Band softness",
    min: 10,
    max: 36,
    step: 1,
    unit: "%",
    reducedMotionSafe: true,
    describe:
      "Ripple ring band half-width (softness of the ring's leading/trailing edge), as a %.",
  },
  rippleOpacityLight: {
    group: "ripple",
    label: "Opacity (light)",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    reducedMotionSafe: true,
    describe:
      "Master ripple opacity on paper (light) palettes; 100 = full current opacity.",
  },
  rippleOpacityDark: {
    group: "ripple",
    label: "Opacity (dark)",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    reducedMotionSafe: true,
    describe:
      "Master ripple opacity on the midnight (dark) palette; 100 = full current opacity.",
  },
  glowRadius: {
    group: "glow",
    label: "Glow radius",
    min: 120,
    max: 360,
    step: 4,
    unit: "px",
    reducedMotionSafe: true,
    describe:
      "Radial-gradient radius of the cursor-follow bloom glow, in px.",
  },
  glowOpacityLight: {
    group: "glow",
    label: "Opacity (light)",
    min: 0,
    max: 40,
    step: 1,
    unit: "%",
    reducedMotionSafe: true,
    describe: "Peak glow ink-mix on paper (light) palettes.",
  },
  glowOpacityDark: {
    group: "glow",
    label: "Opacity (dark)",
    min: 0,
    max: 40,
    step: 1,
    unit: "%",
    reducedMotionSafe: true,
    describe: "Peak glow ink-mix on the midnight (dark) palette.",
  },
  ditherDotSize: {
    group: "dither",
    label: "Dot size",
    min: 0.5,
    max: 3,
    step: 0.25,
    unit: "px",
    reducedMotionSafe: true,
    describe: "Dot-grid circle radius for the ripple's dither texture, in px.",
  },
  ditherGridGap: {
    group: "dither",
    label: "Grid spacing",
    min: 2,
    max: 10,
    step: 0.5,
    unit: "px",
    reducedMotionSafe: true,
    describe: "Dot-grid cell size for the ripple's dither texture, in px.",
  },
  ditherDotSoftness: {
    group: "dither",
    label: "Dot softness",
    min: 0.05,
    max: 1,
    step: 0.05,
    unit: "px",
    reducedMotionSafe: true,
    describe: "Dot feather spread for the ripple's dither texture, in px.",
  },
  ditherPeakScale: {
    group: "dither",
    label: "Peak intensity",
    min: 0.5,
    max: 1.5,
    step: 0.1,
    unit: "×",
    reducedMotionSafe: true,
    describe: "Multiplier on the ripple ring's peak alpha (hover intensity).",
  },
};

// ── Registry generation ─────────────────────────────────────────────────────

function buildSpecs(): ParamSpec<unknown>[] {
  return HOVER_FX_TUNING_KEYS.map((field): ParamSpec<unknown> => {
    const meta = FIELD_META[field];
    return {
      key: feedHoverFieldKey(field),
      group: `feed.hover.${meta.group}`,
      label: meta.label,
      kind: "number",
      default: SHIPPED_HOVER_FX_DEFAULTS[field],
      min: meta.min,
      max: meta.max,
      step: meta.step,
      ...(meta.unit ? { unit: meta.unit } : {}),
      reducedMotionSafe: meta.reducedMotionSafe,
      agentWritable: true,
      describe: meta.describe,
    };
  });
}

export const FEED_HOVER_PARAMS: readonly ParamSpec<unknown>[] = buildSpecs();
export const FEED_HOVER_REGISTRY: ParamRegistry = defineRegistry(FEED_HOVER_PARAMS);
