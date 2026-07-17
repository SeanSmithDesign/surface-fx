"use client";

/**
 * pointerField.ts — "material tension" pointer-pressure math + a hook that
 * tracks a smoothed pointer position/strength over one surface element.
 *
 * MATERIAL TENSION, not displacement: the dither field's local
 * density/brightness lifts slightly under the pointer, like pressing on
 * grain. Dots never move or scatter — see pressureAt() for the spatial
 * falloff (mirrored 1:1 in the LED shader's GLSL) and usePointerPressure()
 * for the temporal smoothing (follow while hovering, ease-out decay on
 * leave, no permanent rAF loop at rest).
 */

import { useEffect, useRef, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

// ── Pure math ────────────────────────────────────────────────────────────

/**
 * pressureAt — smoothstep falloff from 1 (at the pointer, dist=0) to 0 at
 * dist=radiusPx and beyond. Mirrors the GLSL falloff applied in modeLED
 * (see texture-shaders.ts):
 *   `1.0 - smoothstep(0.0, u_pressureRadius, distance(fragCoord, u_pointer))`
 * radiusPx<=0 is treated as a fully-collapsed field (always 0).
 */
export function pressureAt(dist: number, radiusPx: number): number {
  if (radiusPx <= 0) return 0;
  const t = Math.min(1, Math.max(0, dist / radiusPx));
  const eased = t * t * (3 - 2 * t); // smoothstep(0, 1, t)
  return 1 - eased;
}

// ── Hook ─────────────────────────────────────────────────────────────────

export interface PointerPressureOptions {
  /** Local pressure radius, CSS px. */
  radiusPx: number;
  /** Peak local lift at the pointer, 0..1 (fraction of field alpha/brightness). */
  maxLift: number;
  /** Position/strength follow time-constant, ms. Default 100 (spec range 80-120ms). */
  smoothMs?: number;
  /** Decay duration on pointer leave, ms. Default 400 (spec range 300-500ms). */
  decayMs?: number;
  /** false, or prefers-reduced-motion → no listeners attached, strength stays 0. */
  enabled?: boolean;
}

export interface PointerPressureField {
  /** Pointer X, element-local CSS px (smoothed, follows while hovering). */
  x: MotionValue<number>;
  /** Pointer Y, element-local CSS px (smoothed, follows while hovering). */
  y: MotionValue<number>;
  /** Smoothed pressure strength, 0..1. Eases to 0 on pointer leave. */
  strength: MotionValue<number>;
  /** Echoes the configured radius, CSS px — dial-ready for downstream consumers. */
  radiusPx: number;
  /** Echoes the configured peak lift, 0..1 — dial-ready for downstream consumers. */
  maxLift: number;
}

const DEFAULT_SMOOTH_MS = 100;
const DEFAULT_DECAY_MS = 400;

/** Below this strength, downstream redraw loops are allowed to stop (see TextureShaderCanvas). */
export const POINTER_STRENGTH_IDLE_THRESHOLD = 0.005;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * usePointerPressure — tracks a pointer's element-local position and a
 * smoothed 0..1 "pressure" strength over `ref`'s element.
 *
 * Listeners (pointerenter/pointermove/pointerleave) are attached to the
 * element ONLY — passive, no window-level listeners — so this hook is inert
 * everywhere else on the page.
 *
 * State machine (a single rAF loop, started/stopped, never left running at
 * rest):
 *   "follow" (pointer inside the element): x/y/strength each ease toward
 *     the live target/1 with an exponential time-constant (smoothMs) every
 *     frame — no jitter, no snapping.
 *   "decay" (pointer left): strength eases from its current value to 0 over
 *     decayMs with a cubic ease-out. Once it reaches 0 the loop stops
 *     entirely (phase -> "idle") — no permanent rAF loop runs at rest.
 *
 * enabled:false or prefers-reduced-motion → the effect returns immediately
 * without attaching any listener; strength never leaves 0.
 */
export function usePointerPressure(
  ref: RefObject<HTMLElement | null>,
  opts: PointerPressureOptions,
): PointerPressureField {
  const {
    radiusPx,
    maxLift,
    smoothMs = DEFAULT_SMOOTH_MS,
    decayMs = DEFAULT_DECAY_MS,
    enabled = true,
  } = opts;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const strength = useMotionValue(0);

  // Stable object identity across renders: mutating radiusPx/maxLift in
  // place (rather than returning a fresh object literal each render) lets a
  // caller dial them live without changing this object's reference — which
  // matters downstream, where TextureShaderCanvas keys a mount effect off
  // this object and must NOT tear down/recreate its WebGL context on every
  // ContactSheet re-render.
  const fieldRef = useRef<PointerPressureField | null>(null);
  if (!fieldRef.current) {
    fieldRef.current = { x, y, strength, radiusPx, maxLift };
  }
  fieldRef.current.radiusPx = radiusPx;
  fieldRef.current.maxLift = maxLift;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || prefersReducedMotion()) return;

    type Phase = "idle" | "follow" | "decay";
    let phase: Phase = "idle";
    let rafId = 0;
    let lastTime: number | null = null;
    let decayStart: number | null = null;
    let decayFrom = 0;
    const target = { x: 0, y: 0 };

    function tick(now: number) {
      if (lastTime === null) lastTime = now;
      const dt = Math.max(0, now - lastTime);
      lastTime = now;

      if (phase === "follow") {
        const alpha = smoothMs > 0 ? 1 - Math.exp(-dt / smoothMs) : 1;
        x.set(x.get() + (target.x - x.get()) * alpha);
        y.set(y.get() + (target.y - y.get()) * alpha);
        strength.set(strength.get() + (1 - strength.get()) * alpha);
      } else if (phase === "decay") {
        if (decayStart === null) {
          decayStart = now;
          decayFrom = strength.get();
        }
        const t = decayMs > 0 ? Math.min(1, (now - decayStart) / decayMs) : 1;
        const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
        strength.set(decayFrom * (1 - eased));
        if (t >= 1) {
          strength.set(0);
          phase = "idle";
        }
      }

      if (phase !== "idle") {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
        lastTime = null;
      }
    }

    const ensureLoop = () => {
      if (rafId) return;
      lastTime = null;
      rafId = requestAnimationFrame(tick);
    };

    const setTargetFromEvent = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
    };

    const handleEnter = (e: PointerEvent) => {
      setTargetFromEvent(e);
      if (phase !== "follow") {
        // Snap position on entry so the field doesn't slide in from wherever
        // it last rested — only the STRENGTH ramps in, per the motion spec.
        x.set(target.x);
        y.set(target.y);
      }
      phase = "follow";
      decayStart = null;
      ensureLoop();
    };

    const handleMove = (e: PointerEvent) => {
      setTargetFromEvent(e);
      if (phase !== "follow") {
        phase = "follow";
        decayStart = null;
        ensureLoop();
      }
    };

    const handleLeave = () => {
      if (phase === "idle") return;
      phase = "decay";
      decayStart = null;
      ensureLoop();
    };

    el.addEventListener("pointerenter", handleEnter, { passive: true });
    el.addEventListener("pointermove", handleMove, { passive: true });
    el.addEventListener("pointerleave", handleLeave, { passive: true });

    return () => {
      el.removeEventListener("pointerenter", handleEnter);
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerleave", handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      phase = "idle";
      strength.set(0);
    };
  }, [ref, enabled, smoothMs, decayMs, x, y, strength]);

  return fieldRef.current;
}
