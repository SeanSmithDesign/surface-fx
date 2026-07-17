import type { ParamSpec } from "./param";

/**
 * A ParamSpec whose value type has been widened for storage in a registry —
 * a registry mixes number/boolean/enum(string)/color(string) specs together,
 * so it cannot commit to a single T. Individual specs are still authored
 * against their concrete T (e.g. `ParamSpec<string>` for an enum).
 */
type AnyParamSpec = ParamSpec<unknown>;

/** A keyed collection of ParamSpecs, indexed by their own `key` field. */
export type ParamRegistry = Record<string, AnyParamSpec>;

/**
 * Build a ParamRegistry from a flat list of specs, keyed by `spec.key`.
 *
 * Validates at build time (module load, not runtime-per-call) so a bad
 * registry fails loudly during development/CI rather than surfacing as a
 * confusing dev-panel or agent bug later:
 *   - duplicate `key` across specs throws
 *   - `kind: "enum"` without a non-empty `options` array throws
 *   - `kind: "number"` with min > max, or a default outside [min, max], throws
 */
export function defineRegistry(
  specs: readonly ParamSpec<unknown>[],
): ParamRegistry {
  const registry: ParamRegistry = {};

  for (const spec of specs) {
    if (Object.prototype.hasOwnProperty.call(registry, spec.key)) {
      throw new Error(`defineRegistry: duplicate param key "${spec.key}"`);
    }
    validateSpec(spec);
    registry[spec.key] = spec;
  }

  return registry;
}

function validateSpec(spec: AnyParamSpec): void {
  if (spec.kind === "enum" && (!spec.options || spec.options.length === 0)) {
    throw new Error(
      `defineRegistry: enum param "${spec.key}" requires a non-empty options array`,
    );
  }

  if (spec.kind === "number") {
    if (spec.min !== undefined && spec.max !== undefined && spec.min > spec.max) {
      throw new Error(
        `defineRegistry: param "${spec.key}" has min (${spec.min}) greater than max (${spec.max})`,
      );
    }
    if (typeof spec.default === "number") {
      if (spec.min !== undefined && spec.default < spec.min) {
        throw new Error(
          `defineRegistry: param "${spec.key}" default (${spec.default}) is below min (${spec.min})`,
        );
      }
      if (spec.max !== undefined && spec.default > spec.max) {
        throw new Error(
          `defineRegistry: param "${spec.key}" default (${spec.default}) is above max (${spec.max})`,
        );
      }
    }
  }
}

// ── Key convention across the site's ParamSpec registries ──────────────────
//
// Every registry in this schema/ directory keys its specs with the same
// dot-notation + "@theme" suffix convention so an agent can discover a
// param's namespace from its key alone, with no side-channel lookup:
//
//   "<domain>[.<surface>].<group>.<param>[@<theme>]"
//
//   - <domain>: the store the param belongs to, e.g. "sheet", "texture", "bloom".
//   - <surface>: present only when the store has more than one rendered
//     surface (texture-tuning's "disc" | "sheet"); omitted for single-surface
//     stores (bloom-tuning has exactly one surface — the contact-sheet bloom).
//   - <group>: the sub-object the param lives in for panel-section / agent
//     grouping — "envelope", a shader mode name, "surfaceCloseSpring", etc.
//   - <param>: the field name itself, verbatim from the legacy TS interface.
//   - "@<theme>" suffix: present only when the store is THEMED (light/dark
//     sets that can independently diverge — texture-tuning and bloom-tuning
//     both are); omitted for un-themed registries (this seed group).
//
// See schema/textureTuningRegistry.ts and schema/bloomTuningRegistry.ts for
// the two real, themed registries built on this convention, and their file
// header comments for the domain-specific rationale (what's included/excluded,
// how theming is keyed, range-widening notes).
//
// ── Seed group: sheet.shadow ──────────────────────────────────────────────
//
// Proof-of-concept group covering the four shadow-morph fields already
// shipped in bloom-tuning (ditherShadowSpreadPx / FalloffSoftness /
// EdgeDensity / CornerFollow — see bloom-tuning/types.ts:196-236). Values,
// ranges, and semantics below are copied verbatim from that shipped spec.
// This registry is NOT wired into bloom-tuning; it exists to prove the
// schema core against a real group before any store migration. bloom-tuning's
// REAL, themed migration of these same 4 fields lives in
// bloomTuningRegistry.ts as "bloom.ditherShadow*@<theme>" — see that file's
// header comment for why the two are kept as separate, documented specs
// rather than collapsed into one (themed independence, not just a rename).

export const SHEET_SHADOW_PARAMS: readonly ParamSpec[] = [
  {
    key: "sheet.shadow.spreadPx",
    group: "sheet.shadow",
    label: "Shadow Spread",
    kind: "number",
    default: 56,
    min: 0,
    max: 200,
    step: 1,
    unit: "px",
    reducedMotionSafe: true,
    agentWritable: true,
    describe:
      "Penumbra spread beyond the morphing shape's true edge, in px, shared by both axes. Larger values extend the soft halo further outward.",
  },
  {
    key: "sheet.shadow.falloffSoftness",
    group: "sheet.shadow",
    label: "Falloff Softness",
    kind: "number",
    default: 45,
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    reducedMotionSafe: true,
    agentWritable: true,
    describe:
      "Shape of the falloff curve across the spread band. 0 = the penumbra fades sharply right after the true edge (short, crisp halo). 100 = it stays dense across most of the spread band and only falls away right at the outer edge (long, soft tail).",
  },
  {
    key: "sheet.shadow.edgeDensity",
    group: "sheet.shadow",
    label: "Edge Density",
    kind: "number",
    default: 0.85,
    min: 0,
    max: 1,
    step: 0.01,
    reducedMotionSafe: true,
    agentWritable: true,
    describe:
      "Peak mask alpha right at the morphing shape's true edge — how dense the dither reads at the point closest to the silhouette, independent of the overall expanded opacity.",
  },
  {
    key: "sheet.shadow.cornerFollow",
    group: "sheet.shadow",
    label: "Corner Follow",
    kind: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    reducedMotionSafe: true,
    agentWritable: true,
    describe:
      "How strongly the mask's rx/ry follow the morphing shape's true measured aspect ratio vs a perfect circle (the average of the two radii). 0 = always a round halo regardless of shape. 1 = fully hugs the disc's circle / sheet's rect proportions as measured.",
  },
];

export const SHEET_SHADOW_REGISTRY: ParamRegistry = defineRegistry(SHEET_SHADOW_PARAMS);
