/**
 * presets.ts — named, cited copies of the REAL shipped ripple/wave values
 * from each existing consumer. These are read-only reference constants (not
 * wired to anything); each field cites the exact source file/line it was
 * pulled from so a future consolidation can diff against the shipped feel.
 */

// ── dabHero — src/components/pdp/DABHeroRipple.tsx ──────────────────────────
//
// intro: setTimeout(() => spawn(72, 48, 0.7, 2.4), 350) — device-center
//        intro burst, peak 0.7, duration 2.4s, fired 350ms after mount.
// burst: spawn(x, y, 1, 2.1) on pointerdown — full-strength burst, 2.1s.
export const dabHero = {
  intro: {
    originPct: { x: 72, y: 48 },
    peak: 0.7,
    durationSec: 2.4,
    delayMs: 350,
  },
  burst: {
    peak: 1.0,
    durationSec: 2.1,
  },
} as const;

// ── feedHover — src/components/feed/hover-fx/tuning.ts (SHIPPED_HOVER_FX_DEFAULTS) ──
export const feedHover = {
  /** ringDuration — s, ring expand duration. */
  ringDurationSec: 2,
  /** ringTravel — %, ring outward travel (radius cap). */
  ringTravelPct: 50,
  /** rippleInterval — ms, min gap between move-spawned rings. */
  rippleIntervalMs: 170,
  /** ringBand — %, ring band half-width (softness). */
  ringBandPct: 32,
  /** ditherPeakScale — ×, multiplier on ripple ring peak alpha. */
  peakScale: 1.5,
  /** rippleOpacityLight — 0..100, master ripple opacity on paper palettes
   *  (100 = full current opacity; shipped raw value, not normalized). */
  opacityLightPct: 10,
  /** rippleOpacityDark — 0..100, master ripple opacity on midnight palette
   *  (100 = full current opacity; shipped raw value, not normalized). */
  opacityDarkPct: 8,
} as const;

// ── discArrival — src/components/chrome/discShadowWave.ts (ShadowWaveParams)
// values as fired from src/components/chrome/FloatingIdentity.tsx, defaults
// from src/components/feed/entrance/tuning.ts ──────────────────────────────
export const discArrival = {
  /** discRippleTravelPx — px the ring's crest travels from the impact point. */
  travelPx: 600,
  /** discRippleDurationSec — s, time for that travel. */
  durationSec: 2,
  /** discRippleBandPx — px, annulus half-width of the wave band. */
  bandPx: 150,
  /** discRipplePeakOpacity — peak opacity of the ripple's dither field. */
  peakOpacity: 0.7,
  /** discRippleDecayPow — decay curve exponent for the post-attack fade. */
  decayPow: 3.4,
  /** discRippleAttackFrac — fraction of duration spent swelling to peak. */
  attackFrac: 0.5,
  /** discRippleAspect — wave aspect (vertical crest radius / horizontal). */
  aspect: 1.15,
  /** discRippleLeadMs — anticipation lead before contact, ms. */
  leadMs: 80,
} as const;

// ── sheetBloom — src/components/chrome/bloom-tuning/defaults.ts
// (SHARED_BLOOM_BASE + BLOOM_PRESET_A, aliased as DEFAULT_BLOOM_TUNING —
// the shipped default) ───────────────────────────────────────────────────
export const sheetBloom = {
  /** ditherShadowSpreadPx — px, penumbra distance beyond the true edge. */
  shadowSpreadPx: 56,
  /** ditherShadowFalloffSoftness — 0..100, penumbra fade softness. */
  shadowFalloffSoftness: 45,
  /** ditherShadowEdgeDensity — 0..1, peak mask alpha at the true edge. */
  shadowEdgeDensity: 0.85,
  /** ditherShadowCornerFollow — 0..1, circle vs measured-aspect follow. */
  shadowCornerFollow: 1,
  /** ditherExpandedOpacity (PRESET A) — dither opacity when the sheet is open. */
  expandedOpacity: 1.0,
  /** ditherCollapsedOpacity (PRESET A) — dither opacity when collapsed to the disc. */
  collapsedOpacity: 0,
} as const;
