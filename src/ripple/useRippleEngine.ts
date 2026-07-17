"use client";

import { useCallback, useMemo, useState } from "react";
import type { RippleEngine, Vec2 } from "./triggers";

/** Spawn cap — matches the shipped concurrent-ripple ceiling in
 *  HeroDitherRipple.tsx / DABHeroRipple.tsx ("Cap concurrent ripples so a
 *  fast drag can't pile up hundreds of layers", `next.length > 14`). */
const RIPPLE_SPAWN_CAP = 14;

export interface ActiveRipple {
  id: number;
  origin: Vec2;
  energy: number;
  aspect: number;
  startTime: number;
}

let nextRippleId = 1;

export interface UseRippleEngineResult {
  /** The current active-ripple list, newest last, capped at 14. */
  ripples: ActiveRipple[];
  /** The RippleEngine surface (mount/press/fire) — a renderer wires this up. */
  engine: RippleEngine;
}

/**
 * useRippleEngine — render-agnostic ripple driver.
 *
 * Holds the active-ripple list and exposes the RippleEngine trigger methods.
 * Deliberately does NOT render or animate anything itself — that is a
 * renderer's job, consuming `ripples` and `rippleEnvelope`/
 * `RIPPLE_PROGRESS_EASE` from ./envelope.ts. Not wired to any component.
 */
export function useRippleEngine(): UseRippleEngineResult {
  const [ripples, setRipples] = useState<ActiveRipple[]>([]);

  const spawn = useCallback((origin: Vec2, energy: number, aspect = 1) => {
    setRipples((prev) => {
      const next: ActiveRipple[] = [
        ...prev,
        {
          id: nextRippleId++,
          origin,
          energy,
          aspect,
          startTime: performance.now(),
        },
      ];
      return next.length > RIPPLE_SPAWN_CAP
        ? next.slice(next.length - RIPPLE_SPAWN_CAP)
        : next;
    });
  }, []);

  const engine = useMemo<RippleEngine>(
    () => ({
      mount: (spec) => {
        spawn(spec?.origin ?? { x: 0.5, y: 0.5 }, spec?.energy ?? 1);
      },
      press: (origin, energy = 1) => {
        spawn(origin, energy);
      },
      fire: (origin, energy, opts) => {
        spawn(origin, energy, opts?.aspect ?? 1);
      },
    }),
    [spawn],
  );

  return { ripples, engine };
}
