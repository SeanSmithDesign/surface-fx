/**
 * Ripple progress ease — the ring's outward travel curve (fast start, gentle
 * settle). Matches the literal array used at every ripple call site:
 * HeroDitherRipple.tsx, DABHeroRipple.tsx, HoverRippleLayer.tsx —
 * `ease: [0.16, 0.7, 0.3, 1]` passed to Motion's `animate(0, 1, { ease })`.
 */
export const RIPPLE_PROGRESS_EASE = [0.16, 0.7, 0.3, 1] as const;

export interface RippleEnvelopeOptions {
  /** Peak alpha reached at the end of the attack. */
  peak: number;
  /** Fraction of the timeline spent rising to peak. Default 0.18. */
  attackFrac?: number;
  /** Decay exponent for the post-peak fade. Default 1.4. */
  decayPow?: number;
}

/**
 * rippleEnvelope — alpha at progress t (0..1): a linear rise to peak over
 * attackFrac, then a power-law decay to 0 over the remainder. Clamped to
 * ≥ 0.
 *
 * Matches the inline formula shared verbatim by HeroDitherRipple.tsx,
 * DABHeroRipple.tsx, and HoverRippleLayer.tsx (identical in all three):
 *
 *   const a =
 *     t < 0.18
 *       ? (t / 0.18) * r.peak
 *       : r.peak * (1 - (t - 0.18) / 0.82) ** 1.4;
 *   el.style.setProperty("--ra", String(Math.max(0, a)));
 *
 * At the default attackFrac (0.18) and decayPow (1.4), 1 - attackFrac ===
 * 0.82, so this function reduces to that exact expression.
 */
export function rippleEnvelope(
  t: number,
  opts: RippleEnvelopeOptions,
): number {
  const attackFrac = opts.attackFrac ?? 0.18;
  const decayPow = opts.decayPow ?? 1.4;
  const { peak } = opts;

  const a =
    t < attackFrac
      ? (t / attackFrac) * peak
      : peak * (1 - (t - attackFrac) / (1 - attackFrac)) ** decayPow;

  return Math.max(0, a);
}
