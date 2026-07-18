/**
 * color.ts — minimal color helper the texture WebGL renderer needs.
 *
 * Copied from the site's src/lib/ambient/shader/webgl-renderer.ts
 * (hexToRgb01 only — this file does not pull in the rest of the ambient
 * shader system).
 */

export function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}
