import { describe, expect, it } from "vitest";
import { velocityToRipple } from "../ripple/velocity";

describe("velocityToRipple", () => {
  it("fast heading-right: energy≈1, aspect>1, offset.x>0, offset.y≈0", () => {
    const cfg = { speedRef: 500, elongation: 0.6, offsetPx: 40 };
    const speed = 5000; // far above speedRef -> energy clamps to 1
    const heading = 0; // pointing right (atan2 convention: 0 rad = +x axis)

    const result = velocityToRipple(speed, heading, cfg);

    expect(result.energy).toBeCloseTo(1, 9);
    expect(result.aspect).toBeGreaterThan(1);
    expect(result.aspect).toBeCloseTo(1 + cfg.elongation, 9);
    expect(result.offset.x).toBeGreaterThan(0);
    expect(result.offset.x).toBeCloseTo(cfg.offsetPx, 9);
    expect(Math.abs(result.offset.y)).toBeCloseTo(0, 9);
  });

  it("clamps energy to [0, 1] outside the reference range", () => {
    const cfg = { speedRef: 500, elongation: 0.6, offsetPx: 40 };
    expect(velocityToRipple(-100, 0, cfg).energy).toBe(0);
    expect(velocityToRipple(100000, 0, cfg).energy).toBe(1);
  });

  it("at rest (speed=0) collapses to aspect 1 and zero offset", () => {
    const cfg = { speedRef: 500, elongation: 0.6, offsetPx: 40 };
    const result = velocityToRipple(0, 1.2, cfg);
    expect(result.energy).toBe(0);
    expect(result.aspect).toBe(1);
    expect(result.offset.x).toBeCloseTo(0, 9);
    expect(result.offset.y).toBeCloseTo(0, 9);
  });
});
