import { describe, expect, it } from "vitest";
import { buildShapeUniforms } from "../shader/shapeUniforms";
import type { SurfaceGeometry } from "../geometry/SurfaceGeometry";

describe("buildShapeUniforms", () => {
  it("circle degeneracy: halfW === halfH === cornerR yields shapeRadius === R * dpr regardless of cornerFollow", () => {
    const R = 44;
    const dpr = 1.5;
    const geo: SurfaceGeometry = {
      cx: 100,
      cy: 200,
      halfW: R,
      halfH: R,
      cornerR: R,
      dpr,
    };

    for (const cornerFollow of [0, 0.25, 0.5, 0.75, 1]) {
      const uniforms = buildShapeUniforms(geo, cornerFollow, 12);
      expect(uniforms.shapeRadius).toBeCloseTo(R * dpr, 9);
    }
  });

  it("scales shapeHalf and shapeFalloff by dpr", () => {
    const geo: SurfaceGeometry = {
      cx: 0,
      cy: 0,
      halfW: 120,
      halfH: 80,
      cornerR: 16,
      dpr: 2,
    };
    const uniforms = buildShapeUniforms(geo, 1, 24);
    expect(uniforms.shapeHalf).toEqual([240, 160]);
    expect(uniforms.shapeFalloff).toBe(48);
    expect(uniforms.shapeMode).toBe(1);
  });

  it("lerps corner radius toward the measured cornerR as cornerFollow rises", () => {
    const geo: SurfaceGeometry = {
      cx: 0,
      cy: 0,
      halfW: 200,
      halfH: 100,
      cornerR: 12,
      dpr: 1,
    };
    const fullyRound = Math.min(geo.halfW, geo.halfH); // 100
    const atZero = buildShapeUniforms(geo, 0, 0);
    const atOne = buildShapeUniforms(geo, 1, 0);
    expect(atZero.shapeRadius).toBeCloseTo(fullyRound, 9);
    expect(atOne.shapeRadius).toBeCloseTo(geo.cornerR, 9);
  });
});
