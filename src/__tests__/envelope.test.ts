import { describe, expect, it } from "vitest";
import { rippleEnvelope } from "../ripple/envelope";

/**
 * Inline formula from HeroDitherRipple.tsx (identical in DABHeroRipple.tsx
 * and HoverRippleLayer.tsx):
 *
 *   const a =
 *     t < 0.18
 *       ? (t / 0.18) * r.peak
 *       : r.peak * (1 - (t - 0.18) / 0.82) ** 1.4;
 *   el.style.setProperty("--ra", String(Math.max(0, a)));
 */
function shippedInlineFormula(t: number, peak: number): number {
  const a = t < 0.18 ? (t / 0.18) * peak : peak * (1 - (t - 0.18) / 0.82) ** 1.4;
  return Math.max(0, a);
}

describe("rippleEnvelope", () => {
  // NOTE — flagged discrepancy: at t === 1 exactly, the shipped literal
  // formula (hardcoded `0.82`) hits a floating-point rounding artifact:
  // 1 - 0.18 === 0.8200000000000001 (not bit-identical to the 0.82
  // literal), so (t - 0.18) / 0.82 evaluates fractionally ABOVE 1, making
  // the base of `** 1.4` a tiny negative number — and Math.pow of a
  // negative base with a fractional exponent is NaN in JS. The shipped
  // formula therefore returns NaN at exactly t=1 (verified: see
  // shippedInlineFormula(1, peak) below). rippleEnvelope computes the
  // decay denominator as `(1 - attackFrac)` rather than a hardcoded
  // literal, which divides evenly and returns the mathematically correct
  // 0 at t=1 instead of NaN — a strictly more robust result at that one
  // boundary sample, tested separately below. All other samples are
  // bit-for-bit identical to the shipped formula.
  const NON_BOUNDARY_SAMPLES = [0, 0.05, 0.18, 0.5, 0.9];

  it("matches the shipped inline formula at default attackFrac/decayPow", () => {
    const peak = 0.7;
    for (const t of NON_BOUNDARY_SAMPLES) {
      expect(rippleEnvelope(t, { peak })).toBeCloseTo(
        shippedInlineFormula(t, peak),
        9,
      );
    }
  });

  it("matches across a range of peak values", () => {
    const peaks = [0.5, 0.7, 1];
    for (const peak of peaks) {
      for (const t of NON_BOUNDARY_SAMPLES) {
        expect(rippleEnvelope(t, { peak })).toBeCloseTo(
          shippedInlineFormula(t, peak),
          9,
        );
      }
    }
  });

  it("at t=1, the shipped literal formula NaNs on a float-rounding artifact; rippleEnvelope avoids it and returns 0", () => {
    expect(shippedInlineFormula(1, 0.7)).toBeNaN();
    expect(rippleEnvelope(1, { peak: 0.7 })).toBe(0);
  });

  it("never returns a negative value", () => {
    for (let t = 0; t <= 1; t += 0.05) {
      expect(rippleEnvelope(t, { peak: 1 })).toBeGreaterThanOrEqual(0);
    }
  });
});
