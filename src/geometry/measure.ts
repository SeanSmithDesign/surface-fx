import type { SurfaceGeometry } from "./SurfaceGeometry";

export interface RectToGeometryOptions {
  /**
   * "settled" — the RESTING layout position, excluding any in-flight CSS
   * transform (e.g. a Motion FLIP animation mid-flight). Mirrors
   * ContactSheet.tsx's sheet measurement: walk offsetLeft/offsetTop up the
   * offsetParent chain rather than reading getBoundingClientRect().
   *
   * "live" — the current painted position INCLUDING any transform, via
   * getBoundingClientRect(). Mirrors ContactSheet.tsx's disc measurement
   * (the trigger button's rect is stable across the whole open/close cycle
   * once measured, so reading the live rect is safe there).
   */
  mode: "settled" | "live";
  /** Corner radius, px, to stamp onto the returned geometry as-is. */
  cornerR: number;
}

/**
 * rectToGeometry — measure an element into a SurfaceGeometry.
 *
 * "settled" mode mirrors ContactSheet.tsx's sheet-center measurement
 * verbatim:
 *
 *   // offsetLeft/offsetTop: settled CSS layout position (excludes Motion
 *   // FLIP transform). On position:fixed elements these are viewport coords.
 *   const cx = el.offsetLeft + el.offsetWidth / 2;
 *   const cy = el.offsetTop + el.offsetHeight / 2;
 *
 * Generalized here by walking the offsetParent chain (summing offsetLeft/
 * offsetTop at each positioned ancestor) instead of reading a single level.
 * For a position:fixed element — ContactSheet's case — offsetParent is null,
 * so the walk is exactly one hop and this reduces to the identical
 * calculation above (no scroll adjustment needed, per that file's comment).
 * For an element in normal document flow, the walk continues up through
 * each positioned ancestor, which is the standard technique for reading a
 * layout position that excludes CSS transforms.
 *
 * "live" mode mirrors ContactSheet.tsx's disc-rect measurement verbatim:
 *
 *   const rect = el.getBoundingClientRect();
 *   const cx = rect.left + rect.width / 2;
 *   const cy = rect.top + rect.height / 2;
 */
export function rectToGeometry(
  el: HTMLElement,
  opts: RectToGeometryOptions,
): SurfaceGeometry {
  const dpr =
    typeof window !== "undefined"
      ? Math.min(2, window.devicePixelRatio || 1)
      : 1;

  if (opts.mode === "live") {
    const rect = el.getBoundingClientRect();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    return {
      cx: rect.left + halfW,
      cy: rect.top + halfH,
      halfW,
      halfH,
      cornerR: opts.cornerR,
      dpr,
    };
  }

  // "settled" — walk the offsetParent chain summing offsetLeft/offsetTop.
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  const halfW = el.offsetWidth / 2;
  const halfH = el.offsetHeight / 2;

  return {
    cx: left + halfW,
    cy: top + halfH,
    halfW,
    halfH,
    cornerR: opts.cornerR,
    dpr,
  };
}
