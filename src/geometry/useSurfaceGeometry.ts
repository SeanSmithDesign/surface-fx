"use client";

import { useEffect, useState, type RefObject } from "react";
import type { SurfaceGeometry } from "./SurfaceGeometry";
import { rectToGeometry } from "./measure";

export interface UseSurfaceGeometryOptions {
  mode: "settled" | "live";
  /** Corner radius, px, or a getter (e.g. reading a live tuning store). */
  cornerR: number | (() => number);
  /** When false, returns null and mounts no observers. Default true. */
  enabled?: boolean;
}

/**
 * Strict field-by-field compare — returns true only when every measured
 * value is identical. Used to decide whether a re-measure should mint a new
 * SurfaceGeometry object or return the PREVIOUS reference unchanged.
 */
function geometryEquals(a: SurfaceGeometry, b: SurfaceGeometry): boolean {
  return (
    a.cx === b.cx &&
    a.cy === b.cy &&
    a.halfW === b.halfW &&
    a.halfH === b.halfH &&
    a.cornerR === b.cornerR &&
    a.dpr === b.dpr
  );
}

/**
 * useSurfaceGeometry — ResizeObserver + window-resize-driven SurfaceGeometry
 * for an element.
 *
 * CRITICAL (prod-crash rule, React error #185): setState must never receive
 * a fresh object when the measured geometry hasn't actually changed. A
 * fresh-object-per-measure would loop forever in production (dev hides it
 * behind double-invoke reconciliation) — see ContactSheet.tsx's sheetCenter/
 * discRect state guards ("Render-loop guard (React #185)") and the memory
 * file feedback-usesyncexternalstore-uncached-snapshot-prod-crash for the
 * same pattern. The updater below performs a strict field-by-field compare
 * and returns the PREVIOUS object reference when nothing changed.
 *
 * enabled:false clears geometry to null via the CLEANUP of the previous
 * (enabled) effect invocation — not a direct setState call in the effect
 * body — mirroring ContactSheet.tsx's sheetCenter clear-on-close pattern
 * ("Clearing sheetCenter here (in cleanup, not in the effect body) avoids
 * the react-hooks/set-state-in-effect lint rule").
 */
export function useSurfaceGeometry(
  ref: RefObject<HTMLElement | null>,
  opts: UseSurfaceGeometryOptions,
): SurfaceGeometry | null {
  const { mode, cornerR, enabled = true } = opts;
  const [geometry, setGeometry] = useState<SurfaceGeometry | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    function measure() {
      const current = ref.current;
      if (!current) return;
      const resolvedCornerR =
        typeof cornerR === "function" ? cornerR() : cornerR;
      const next = rectToGeometry(current, { mode, cornerR: resolvedCornerR });
      setGeometry((prev) => {
        if (prev !== null && geometryEquals(prev, next)) return prev;
        return next;
      });
    }

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      setGeometry(null);
    };
  }, [ref, mode, cornerR, enabled]);

  return geometry;
}
