export type Vec2 = { x: number; y: number };

/**
 * RippleTrigger — the three ways a ripple gets born across the shipped
 * consumers:
 *   "mount" — an intro/entrance burst with no user input (HeroDitherRipple's
 *             introX/introY, DABHeroRipple's device-center intro).
 *   "press" — a pointer-down burst at a known origin (HeroDitherRipple/
 *             DABHeroRipple's pointerdown handler).
 *   "fire"  — a directional/energy-scaled burst (discShadowWave's impact
 *             wave, energy-coupled to arrival velocity; HoverRippleLayer's
 *             move-throttled pings).
 */
export type RippleTrigger = "mount" | "press" | "fire";

export interface RippleSpec {
  origin: Vec2;
  energy: number;
  aspect?: number;
  heading?: number;
}

export interface RippleEngine {
  mount(spec?: { origin?: Vec2; energy?: number }): void;
  press(origin: Vec2, energy?: number): void;
  fire(
    origin: Vec2,
    energy: number,
    opts?: { heading?: number; aspect?: number },
  ): void;
}
