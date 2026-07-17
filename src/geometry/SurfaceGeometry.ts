/**
 * SurfaceGeometry — the shape a dither/ripple surface effect paints against.
 *
 * Every surface-fx consumer (shadow masks, ripple rings, shader uniforms)
 * ultimately needs the same handful of numbers describing WHERE the surface
 * sits and WHAT SHAPE it is. This is the shared, render-agnostic description.
 */
export interface SurfaceGeometry {
  /** Center X, viewport px. */
  cx: number;
  /** Center Y, viewport px. */
  cy: number;
  /** Half-extent along X, px. */
  halfW: number;
  /** Half-extent along Y, px. */
  halfH: number;
  /** Corner radius, px. A circle is the degenerate case: cornerR === halfW === halfH. */
  cornerR: number;
  /** devicePixelRatio, clamped to a ceiling of 2 (matches the LED/texture shader convention). */
  dpr: number;
}
