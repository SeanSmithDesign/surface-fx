import type { SurfaceGeometry } from "../geometry/SurfaceGeometry";

export interface ShapeUniforms {
  shapeMode: 1;
  shapeHalf: [number, number];
  shapeRadius: number;
  shapeFalloff: number;
}

/**
 * buildShapeUniforms — turn a SurfaceGeometry into shader-ready uniforms for
 * a rounded-rect / circle SDF shape.
 *
 * cornerFollow (0..1) lerps the corner radius between fully-round
 * (min(halfW, halfH) — a pill/circle) and the measured cornerR (the real
 * corner radius). At the circle degeneracy (halfW === halfH === cornerR),
 * both ends of the lerp are identical, so shapeRadius === cornerR regardless
 * of cornerFollow.
 *
 * All outputs are multiplied by geo.dpr — the shader operates in device
 * pixels, not CSS px.
 */
export function buildShapeUniforms(
  geo: SurfaceGeometry,
  cornerFollow: number,
  falloffPx: number,
): ShapeUniforms {
  const follow = Math.min(1, Math.max(0, cornerFollow));
  const fullyRound = Math.min(geo.halfW, geo.halfH);
  const radius = fullyRound + (geo.cornerR - fullyRound) * follow;

  return {
    shapeMode: 1,
    shapeHalf: [geo.halfW * geo.dpr, geo.halfH * geo.dpr],
    shapeRadius: radius * geo.dpr,
    shapeFalloff: falloffPx * geo.dpr,
  };
}
