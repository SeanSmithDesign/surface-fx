/**
 * ComposedSlot — reference-stable memoization for composing legacy nested
 * shapes out of a flat SchemaValueMap.
 *
 * createSchemaStore's snapshot() returns ONE stable reference for the ENTIRE
 * flat map: any single write anywhere in the registry mints a new top-level
 * reference. Legacy consumers (texture-tuning, bloom-tuning) expect their
 * OWN nested per-surface/per-theme objects to stay reference-stable unless a
 * value INSIDE that specific slice actually changed — the same #185 rule
 * (see feedback-usesyncexternalstore-uncached-snapshot-prod-crash.md) applied
 * one level up, to composed objects rather than raw store snapshots.
 *
 * A ComposedSlot wraps a `build` function with N inputs — either raw flat
 * schema values (leaf slots) or other slots' already-composed results
 * (parent slots). `.resolve(...)` returns the PREVIOUS result verbatim when
 * every input is `===` the previous call's; it only calls `build` when
 * something real changed. Slots nest: a slot composing a `ThemedSurface`
 * from two child `SurfaceConfig` slots stays stable exactly when both
 * children stay stable, cascading correctly to the top-level composed state.
 */
export class ComposedSlot<T> {
  private lastInputs: unknown[] | null = null;
  private lastResult: T | null = null;

  constructor(private readonly build: (...inputs: unknown[]) => T) {}

  resolve(...inputs: unknown[]): T {
    if (
      this.lastInputs !== null &&
      this.lastInputs.length === inputs.length &&
      this.lastInputs.every((v, i) => v === inputs[i])
    ) {
      return this.lastResult as T;
    }
    this.lastInputs = inputs;
    this.lastResult = this.build(...inputs);
    return this.lastResult;
  }
}
