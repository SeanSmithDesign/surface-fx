import { describe, expect, it } from "vitest";
import { pressureAt } from "../ripple/pointerField";

describe("pressureAt", () => {
  it("is 1 at the pointer (dist=0)", () => {
    expect(pressureAt(0, 100)).toBe(1);
  });

  it("is 0 at and beyond the radius", () => {
    expect(pressureAt(100, 100)).toBe(0);
    expect(pressureAt(150, 100)).toBe(0);
  });

  it("falls off monotonically between the pointer and the radius", () => {
    const radius = 100;
    const near = pressureAt(20, radius);
    const mid = pressureAt(50, radius);
    const far = pressureAt(80, radius);
    expect(near).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
  });

  it("returns 0 for a non-positive radius", () => {
    expect(pressureAt(10, 0)).toBe(0);
    expect(pressureAt(10, -5)).toBe(0);
  });
});
