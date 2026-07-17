/**
 * ParamSpec — the schema core's atomic unit.
 *
 * One spec describes a single tunable surface-fx value: what it is, its valid
 * range, how it behaves under prefers-reduced-motion and the no-WebGL CSS
 * fallback path, and whether an agent (MCP/CLI) may write it. A registry
 * (see ./registry.ts) is a keyed collection of these; a store (see ./store.ts)
 * reads/writes values against a registry; an agent face (see ./agent.ts)
 * exposes the same registry+store pair to a non-React caller.
 *
 * This is the SINGLE description consumed by three different faces:
 *   1. React components (via the store's useValue hook)
 *   2. The human dev tuning panel (via the store + registry.describe/label)
 *   3. An agent via MCP/CLI (via the agent face's list/get/set)
 */
export interface ParamSpec<T = number> {
  /** Globally unique, stable, dot-notation key, e.g. "sheet.shadow.spreadPx". */
  key: string;

  /** Dot-notation grouping for panel sections / agent discovery, e.g. "sheet.shadow". */
  group: string;

  /** Human-readable label for the dev tuning panel. */
  label: string;

  /** Value shape. Determines how the store validates and clamps writes. */
  kind: "number" | "boolean" | "enum" | "color";

  /** Shipped default — the value production renders when no override is set. */
  default: T;

  /** Number kind only: inclusive lower bound. */
  min?: number;
  /** Number kind only: inclusive upper bound. */
  max?: number;
  /** Number kind only: dev-panel slider step. */
  step?: number;
  /** Number kind only: display unit for the dev panel, e.g. "px", "%". */
  unit?: string;
  /** Enum kind only: the allowed value set. */
  options?: readonly string[];

  /**
   * Whether this param may vary freely under prefers-reduced-motion.
   * false forces the value to `reducedMotionValue` (or the shipped default,
   * if unset) whenever the user has reduced motion enabled.
   */
  reducedMotionSafe: boolean;
  /** Value substituted when reducedMotionSafe is false and reduced motion is active. */
  reducedMotionValue?: T;

  /** Value the no-WebGL CSS fallback path uses; undefined falls back to `default`. */
  cssFallback?: T;

  /** Whether an agent (MCP/CLI) is permitted to write this param. */
  agentWritable: boolean;

  /** One-line semantics for an agent reading the registry — what this controls and why. */
  describe: string;
}
