"use client";

import { useVelocity, useSpring, useTransform, type MotionValue } from "motion/react";
import type { Vec2 } from "./triggers";

export interface SurfaceVelocitySpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

const DEFAULT_SPRING: SurfaceVelocitySpringConfig = {
  stiffness: 300,
  damping: 30,
};

export interface SurfaceVelocity {
  /** Smoothed speed, px/s. */
  speed: MotionValue<number>;
  /** Smoothed heading, radians (atan2(y, x)). */
  heading: MotionValue<number>;
}

/**
 * useSurfaceVelocity — pointer/drag velocity, smoothed, exposed as speed +
 * heading MotionValues.
 *
 * The raw x/y velocity components are spring-smoothed FIRST, then speed and
 * heading are derived from the smoothed components. Smoothing the
 * components (rather than smoothing an already-derived angle) avoids the
 * angle-wraparound discontinuity a spring would otherwise fight at the
 * ±π seam.
 */
export function useSurfaceVelocity(
  x: MotionValue<number>,
  y: MotionValue<number>,
  springConfig: SurfaceVelocitySpringConfig = DEFAULT_SPRING,
): SurfaceVelocity {
  const vx = useVelocity(x);
  const vy = useVelocity(y);

  const smoothVx = useSpring(vx, springConfig);
  const smoothVy = useSpring(vy, springConfig);

  const speed = useTransform([smoothVx, smoothVy], (latest) => {
    const [sx, sy] = latest as [number, number];
    return Math.hypot(sx, sy);
  });

  const heading = useTransform([smoothVx, smoothVy], (latest) => {
    const [sx, sy] = latest as [number, number];
    return Math.atan2(sy, sx);
  });

  return { speed, heading };
}

export interface VelocityToRippleConfig {
  /** Speed (px/s) that maps to energy = 1. */
  speedRef: number;
  /** How much the ripple elongates (aspect - 1) at energy = 1. */
  elongation: number;
  /** Max offset (px) applied along heading at energy = 1. */
  offsetPx: number;
}

export interface VelocityRippleResult {
  /** 0..1, clamped. */
  energy: number;
  /** 1 at rest, growing with energy and elongation. */
  aspect: number;
  /** Origin offset along heading, scaled by energy. */
  offset: Vec2;
}

/**
 * velocityToRipple — pure mapping from smoothed speed/heading to ripple
 * shape/placement knobs.
 */
export function velocityToRipple(
  speed: number,
  heading: number,
  cfg: VelocityToRippleConfig,
): VelocityRippleResult {
  const energy = Math.min(1, Math.max(0, speed / cfg.speedRef));
  const aspect = 1 + energy * cfg.elongation;
  const offset: Vec2 = {
    x: Math.cos(heading) * energy * cfg.offsetPx,
    y: Math.sin(heading) * energy * cfg.offsetPx,
  };

  return { energy, aspect, offset };
}
