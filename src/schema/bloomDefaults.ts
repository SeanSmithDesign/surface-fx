/**
 * Bloom tuning types — contact-sheet open/close animation parameters.
 *
 * All params feed the single-surface "bloom" transition between the
 * 64px dock disc and the full contact sheet.
 *
 * Canonical source of these types + the shipped baked defaults — moved here
 * from the chrome bloom-tuning component's types/defaults files so
 * `src/lib/surface-fx` has zero imports back into site components. Those
 * chrome files now re-export from here as thin shims (see
 * src/components/chrome/bloom-tuning/types.ts and defaults.ts).
 */

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export interface PortraitSpringConfig {
  stiffness: number;
  damping: number;
}

export interface BloomTuning {
  /**
   * Spring for the surface box on CLOSE (the FLIP back from sheet to disc).
   * Drives how quickly and springily the card shrinks back to the disc.
   */
  surfaceCloseSpring: SpringConfig;

  /**
   * 0..1 fraction of the close animation at which corner-radius begins rounding
   * up from the sheet's card radius (36px) toward the disc's 50% radius.
   *
   * At 0: radius begins rounding immediately when close starts.
   * At 1: radius holds flat at 36px until the very end, then snaps.
   * Default ~0.6: keeps card corners through most of the shrink so it
   * never over-rounds into a pill/oval before the box has contracted.
   */
  radiusHoldFraction: number;

  /** Sheet radius (px) held during the first radiusHoldFraction of close. */
  sheetRadius: number;

  /** Disc radius (px or %). Set to a large number (e.g. 9999) for a true circle. */
  discRadius: number;

  /**
   * Close lead delay (ms). On CLOSE, the surface scale-down (collapseProgress
   * driving toward 1) is delayed by this many milliseconds while the portrait
   * avatar begins re-homing immediately. The effect: the portrait visibly
   * leads, then the sheet shrinks a beat later. Applies to CLOSE only. Open is
   * unaffected. At 0 the surface and portrait start together (old behavior).
   */
  surfaceCloseLeadDelayMs: number;

  /** Content (text/rows/X) fade-out duration on close (ms). */
  contentFadeOutMs: number;

  /** Content fade-out delay on close (ms) — how long after close starts before content begins fading. */
  contentFadeOutDelayMs: number;

  /**
   * Spring for the portrait inverse-correction on close.
   * Softer than the surface spring lets it lag slightly and track the
   * shrinking surface, preventing the white-disc artifact.
   */
  portraitFollowSpring: PortraitSpringConfig;

  /**
   * Time-based delay (seconds) on CLOSE before corner-radius rounding begins.
   *
   * When close starts, the radius holds at sheetRadius for this many seconds.
   * Only after this delay elapses does the existing radiusHoldFraction/interpolation
   * logic take over and round toward discRadius.
   *
   * This is a TIME gate layered on top of the existing progress gate. Both must
   * be satisfied before any rounding occurs.
   *
   * Does NOT affect the open animation — open looks exactly as it does today.
   *
   * At 0 (default): the time gate is a no-op, behavior is identical to pre-delay.
   */
  radiusCloseDelaySec: number;

  /**
   * Content reveal delay on OPEN (seconds) — how long into the bloom before
   * text/rows start writing in. Kept as seconds to match Motion 12 convention.
   */
  openContentRevealDelaySec: number;

  // ── Backdrop dither ────────────────────────────────────────────────────────

  /**
   * Enable/disable the gray dim+blur scrim layer.
   * When true (default): the backdrop renders its warm tint and backdropBlurPx blur as today.
   * When false: the scrim is fully removed (background transparent, no blur filter) so
   * the page shows through cleanly. The dither bloom layer is unaffected either way.
   */
  backdropDimEnabled: boolean;

  /**
   * Backdrop blur radius (px). Wires the existing backdrop-filter blur so Sean
   * can dial it down (even to 0 for pure dither) or up.
   * Only applied when backdropDimEnabled is true.
   */
  backdropBlurPx: number;

  /**
   * Multiplier on the dim scrim alpha. 0 = no tint, 1 = current shipped alpha.
   * Scales the per-mode base alpha (light: 0.27, dark/midnight: 0.48) so Sean
   * can dial the gray tint lighter or heavier without fully toggling it off.
   * Only applied when backdropDimEnabled is true.
   */
  backdropDimOpacity: number;

  /**
   * Enable/disable the dither texture overlay on the backdrop.
   * When false, the backdrop is the existing plain dim + blur scrim.
   */
  ditherEnabled: boolean;

  /**
   * Dither opacity when the sheet is fully COLLAPSED (collapseProgress = 1).
   * Defaults to 0 so the texture fades completely IN as the sheet blooms open
   * and completely OUT as it collapses (no pop-in or pop-out). Kept tunable so
   * Sean can lift it slightly for a faint residue if he wants one.
   */
  ditherCollapsedOpacity: number;

  /**
   * Dither opacity when the sheet is fully EXPANDED (collapseProgress = 0).
   * More pronounced/exaggerated to frame the open sheet.
   */
  ditherExpandedOpacity: number;

  /**
   * Dot/cell size for the dither dot grid (px). Controls the radial-gradient
   * background-size, consistent with the DAB hero dither precedent.
   */
  ditherScale: number;

  // ── Dither fade mask ───────────────────────────────────────────────────────

  /**
   * Enable the spatial fade mask on the dither layer. When true, the dot
   * texture is heaviest near the sheet's top edge and fades to transparent
   * away from it (a soft bloom shape). When false, the old uniform full-screen
   * fill is used so Sean can compare.
   */
  ditherFadeEnabled: boolean;

  /**
   * Shape of the fade mask.
   * true  = radial ellipse anchored near the bottom-center (bloom-from-sheet look).
   * false = linear vertical fade from bottom to top.
   */
  ditherFadeRadial: boolean;

  /**
   * RADIAL path: vertical radius of the bloom ellipse, as a percent of the
   * element height. The ellipse is anchored at the bottom center (50% 100%),
   * so this controls how far upward the texture bloom reaches. Larger values
   * extend the bloom toward the top; smaller values keep it near the sheet.
   * With the origin at the bottom, the bottom of the viewport is always fully
   * opaque (at the ellipse center), so only the upward direction fades.
   *
   * LINEAR path: vertical anchor of the heaviest fill as a percent of element
   * height. 100 = bottom, lower values move the transition upward.
   *
   * Range 0..150, default 78.
   */
  ditherFadeOriginY: number;

  /**
   * LINEAR path only: how far the fill extends from the origin before going
   * transparent, as a percent of the element height. Larger = broader transition.
   * Range 0..150, default 64.
   *
   * RADIAL path: unused (the ellipse radius is controlled by ditherFadeOriginY).
   */
  ditherFadeSpread: number;

  /**
   * RADIAL path: the fraction of the ellipse radius (0..100%) that stays fully
   * opaque before the fade begins. 0 = fade starts at the bottom center (instant
   * edge); 100 = entire ellipse is solid (no fade). Maps directly to the gradient
   * solid-stop percentage so the visual range is intuitive.
   *
   * LINEAR path: the fraction of the spread distance that is a solid opaque core
   * before the fade-to-transparent begins, as a percent of spread.
   *
   * Range 0..100, default 60.
   *
   * NOTE: this field only affects the LINEAR path now (ditherFadeRadial=false,
   * a legacy A/B comparison mode). The default RADIAL path uses the
   * geometry-driven shadow-morph fields below instead.
   */
  ditherFadeSoftness: number;

  // ── Shadow morph (disc<->sheet) ─────────────────────────────────────────────
  //
  // The RADIAL path's mask shape (ditherFadeRadial=true, the default) is
  // geometry-driven: it interpolates the TRUE (un-bled) edge half-extents
  // between the dock disc's measured circle and the contact sheet's measured
  // box at the current collapseProgress, so the dither expands/reshapes/resizes
  // in lockstep with the disc->sheet morph rather than fading in place as a
  // static wash. These four fields shape the PENUMBRA added beyond that true
  // edge — the part that reads as a shadow.

  /**
   * Penumbra spread beyond the morphing shape's true edge, in px. Shared by
   * both axes. Larger values extend the soft halo further outward.
   * Default ~56px.
   */
  ditherShadowSpreadPx: number;

  /**
   * 0..100: shape of the falloff curve across the spread band.
   * 0 = the penumbra fades sharply right after the true edge (short, crisp
   * halo). 100 = it stays dense across most of the spread band and only
   * falls away right at the outer edge (long, soft tail).
   * Default ~45.
   */
  ditherShadowFalloffSoftness: number;

  /**
   * 0..1: peak mask alpha right at the morphing shape's true edge — how DENSE
   * the dither reads at the point closest to the silhouette, independent of
   * the overall ditherExpandedOpacity. Default ~0.85.
   */
  ditherShadowEdgeDensity: number;

  /**
   * 0..1: how strongly the mask's rx/ry follow the morphing shape's true
   * measured aspect ratio vs a perfect circle (the average of the two radii).
   * 0 = always a round halo regardless of shape. 1 = fully hugs the disc's
   * circle / sheet's rect proportions as measured. Default 1 (fully
   * geometry-driven, per the "measure, don't hardcode" rule).
   */
  ditherShadowCornerFollow: number;

  // ── Resting-disc dither bloom ──────────────────────────────────────────────

  /**
   * Opacity of the resting-disc dither bloom — a masked radial dot-grid that
   * renders under the dock disc when the contact sheet is fully collapsed.
   * 0 = invisible, 1 = fully opaque. Default ~0.10 for a subtle ambient glow.
   *
   * Dark theme gets a slightly higher value so the cream dot grid reads on
   * the midnight paper (#161412). The color of the dots is handled in CSS via
   * the `--color-ink` variable — only the numeric opacity lives here.
   */
  discDitherOpacity: number;

  /**
   * Dot-grid scale / spacing in px for the resting-disc dither bloom.
   * Consistent with ditherScale: controls the background-size of the
   * radial-gradient dot pattern. Smaller values produce a denser grid.
   * Default ~3px.
   */
  discDitherScale: number;

  /**
   * Radius/spread of the radial mask that fades the resting-disc dot-grid
   * outward from the disc center, in px. Larger values let the bloom spread
   * further from the disc. Default ~120px.
   */
  discDitherMaskSize: number;

  // ── Pointer pressure ("material tension") ───────────────────────────────
  //
  // Peak local alpha lift under the pointer on the sheet's WebGL dither
  // (see usePointerPressure/pointerField.ts and modeLED's u_pressureMaxLift
  // in texture-shaders.ts). Migrated from a hardcoded module constant
  // (ContactSheet.tsx's SHEET_POINTER_MAX_LIFT) so it is dial-able per theme
  // like the shadow-morph fields above.

  /**
   * 0..1: peak relative alpha lift at the pointer, applied multiplicatively
   * to the sheet dither's own shader alpha (`alpha * (1 + press * maxLift)`)
   * BEFORE the container opacity (envelope.opacity x ditherShadowEdgeDensity)
   * multiplies it down. Because that container ceiling is themed and roughly
   * half as tall in light as in dark (light envelope.opacity 0.5 vs dark 1),
   * the same relative lift reads far fainter in light — a proportionally
   * larger light value is needed for the pointer effect to read at all.
   * Default: light ~0.7, dark 0.35 (unchanged from the pre-migration
   * constant, first-pass values — Sean dials from here).
   */
  pointerMaxLift: number;
}

/**
 * A pair of full BloomTuning sets, one per document theme.
 *
 * The active set is chosen at runtime from the document palette
 * (`data-palette="midnight"` => dark, anything else => light), letting the
 * contact-sheet bloom read a different look in light vs dark mode.
 */
export interface ThemedBloomTuning {
  light: BloomTuning;
  dark: BloomTuning;
}

/** The two document themes the bloom tuning can target. */
export type BloomThemeKey = "light" | "dark";

/**
 * Bloom presets — two full BloomTuning looks Sean settled on.
 *
 * Both presets share every structural/animation field; they differ ONLY in the
 * dither look (collapsed/expanded opacity + fade origin/spread/softness). The
 * shared base below is the single source of truth for the common fields so the
 * two presets can never drift apart on anything but the dither.
 *
 *   PRESET A = the dialed baked look (Sean's 2026-06-23 session).
 *   PRESET B = a new, heavier dither look (unused; kept for reference).
 *
 * Sean maps these onto themes via DEFAULT_THEMED_BLOOM_TUNING below,
 * then dials per theme in the dev panel and bakes the result.
 */
const SHARED_BLOOM_BASE: Omit<
  BloomTuning,
  | "ditherCollapsedOpacity"
  | "ditherExpandedOpacity"
  | "ditherFadeOriginY"
  | "ditherFadeSpread"
  | "ditherFadeSoftness"
> = {
  // Spring for the surface FLIP on CLOSE — dialed by Sean 2026-06-19
  surfaceCloseSpring: {
    stiffness: 240,
    damping: 34,
    mass: 1.75,
  },

  // Hold card corners until the box has visibly shrunk, then round to disc.
  // 0.74 = radius stays at sheetRadius for the first 74% of collapse progress,
  // then interpolates to discRadius over the final 26%. Dialed by Sean 2026-06-23.
  radiusHoldFraction: 0.74,

  // Time-based delay before corner rounding starts on close (seconds).
  // 1.5s holds card corners long into the collapse so the oval only appears
  // near the end. Dialed by Sean 2026-06-23.
  radiusCloseDelaySec: 1.5,

  sheetRadius: 32,
  discRadius: 9999,

  // Close lead delay (ms): on close the portrait re-homes immediately while the
  // surface scale-down starts this beat later, so the avatar visibly leads.
  // Dialed by Sean 2026-06-23 to 100ms. Close only; open unaffected.
  surfaceCloseLeadDelayMs: 100,

  // Content (text/rows/X) fades out quickly at the very start of close
  contentFadeOutMs: 80,
  contentFadeOutDelayMs: 0,

  // Portrait spring: stiffer and critically damped so the avatar re-homes fast
  // enough to clear the shrinking sheet on close, without overshoot (overshoot
  // would reintroduce the white-disc artifact the softer spring originally avoided).
  portraitFollowSpring: {
    stiffness: 500,
    damping: 45,
  },

  // Content reveal delay on open (seconds)
  openContentRevealDelaySec: 0.2,

  // Backdrop dim+blur scrim — dialed by Sean 2026-06-19.
  // Dim scrim OFF by default (clear page behind the bloom); the 15px blur
  // applies only if the scrim is re-enabled. Strength multiplier kept at 1.
  backdropDimEnabled: false,
  backdropBlurPx: 15,
  backdropDimOpacity: 1,

  // Backdrop dither — dot-grid texture, intensity coupled to bloom state.
  // Scale 3 = sparser grid, less dense. Dialed by Sean 2026-06-23.
  ditherEnabled: true,
  ditherScale: 3,

  // Dither fade mask — soft bloom from the sheet edge, fading upward.
  ditherFadeEnabled: true,
  ditherFadeRadial: true,

  // Shadow morph (disc<->sheet) — the RADIAL path's penumbra, geometry-driven
  // from the disc/sheet measured rects. Light theme dialed by Sean 2026-07-14:
  // long feather, quiet edge (see contact-sheet-shadow bake). Dark theme keeps
  // the prior strawman values via an explicit override below pending its own pass.
  ditherShadowSpreadPx: 140,
  ditherShadowFalloffSoftness: 80,
  ditherShadowEdgeDensity: 0.45,
  ditherShadowCornerFollow: 1,

  // Resting-disc dither bloom — subtle ambient glow under the dock disc.
  // These are shared between presets A and B; the dark theme preset can
  // diverge by splitting them into the per-preset block if needed later.
  // Color of dots is handled in CSS via --color-ink (cream flip in dark mode).
  // Opacity 0.3, maskSize 128 dialed by Sean 2026-06-23.
  discDitherOpacity: 0.3,
  discDitherScale: 3,
  discDitherMaskSize: 128,

  // Pointer pressure ("material tension") — peak relative alpha lift on the
  // sheet dither under the pointer. This is the LIGHT-theme first-pass value
  // (see types.ts's pointerMaxLift doc): roughly double the pre-migration
  // constant (0.35) to compensate for light's envelope.opacity (0.5) being
  // about half of dark's (1), since the lift applies before that container
  // opacity multiplies it down. Dark keeps the unchanged pre-migration value
  // via an explicit override below. Pending Sean's live dial.
  pointerMaxLift: 0.7,
};

/**
 * BLOOM_PRESET_A — the current baked look (lighter dither).
 *
 * Dither fade: radial ellipse anchored at the viewport bottom (50% 100%).
 * ditherFadeOriginY controls the ellipse's vertical radius (how far upward
 * the bloom reaches as a % of element height). The bottom is always solid
 * because it sits at the ellipse center; the fade only acts upward.
 * ditherFadeSoftness controls what fraction of the radius is solid before
 * the transparent fade begins (solidStop = softness * originY / 100).
 */
export const BLOOM_PRESET_A: BloomTuning = {
  ...SHARED_BLOOM_BASE,
  // Collapsed opacity 0 so the dither fades fully out on close (no pop).
  ditherCollapsedOpacity: 0,
  // Strawman 2026-06-29: pushed to "clearly too present" so Sean can dial DOWN
  // from a strong baseline rather than up from near-invisible. Rationale:
  //
  // WHY it was faint before: the themed localStorage key ("contact-bloom-tuning-themed")
  // deep-merges stored dev overrides (opacity dialed to ~0.35 on 06-23) over the
  // baked defaults on every load, including production. Those stale overrides
  // masked whatever was baked. Part A (store.ts prod gate) fixes the masking.
  //
  // MASK GEOMETRY: the radial ellipse is centered on the sheet's vertical center
  // (~68% from the viewport top on a phone). The solid zone (softness%) extends
  // upward by (softness% x originY% x viewportH) from center. At softness=72
  // and originY=115, that is 72% x 115% x 844 = ~699px, which exceeds the ~578px
  // center-to-top distance, so the ENTIRE above-sheet region renders at full
  // dither density. Previous values (softness=55, originY=100) left the top
  // ~114px of the viewport in the fade zone instead of the solid zone.
  //
  // Sean should dial both ditherExpandedOpacity and ditherFadeSoftness down
  // in the BloomTuningPanel to find the sweet spot.
  ditherExpandedOpacity: 1.0, // was 0.6 (prev 0.35) — max density, clearly present
  ditherFadeOriginY: 115, // was 100 — extends ellipse to 115% of viewport; entire above-sheet solid
  // Fade spread (LINEAR path only; unused in radial mode). Kept for compatibility.
  ditherFadeSpread: 150,
  ditherFadeSoftness: 72, // was 55 — 72% solid zone covers entire above-sheet area on all phones
};

/**
 * BLOOM_PRESET_B — a new, heavier dither look.
 */
export const BLOOM_PRESET_B: BloomTuning = {
  ...SHARED_BLOOM_BASE,
  // Collapsed opacity 0 so the dither fades fully out on close (no pop).
  ditherCollapsedOpacity: 0,
  ditherExpandedOpacity: 1,
  ditherFadeOriginY: 88,
  ditherFadeSpread: 80,
  ditherFadeSoftness: 25,
};

/**
 * DEFAULT_THEMED_BLOOM_TUNING — light = PRESET A. As of 2026-06-23 Sean dialed
 * DARK to diverge from light on the dither LOOK only: all non-dither fields
 * (springs, delays, radius, scale, backdrop) stay shared via PRESET_A. Because
 * discDitherOpacity lives in SHARED_BLOOM_BASE, it is overridden inline here
 * rather than in a preset. This is what renders when localStorage is empty.
 */
export const DEFAULT_THEMED_BLOOM_TUNING: ThemedBloomTuning = {
  light: {
    ...BLOOM_PRESET_A,
    // Confirmed by Sean 2026-07-15: shadow feather-in, promoted from a live
    // dev-panel override to the shipped default. Spread 140→115, disc mask
    // 128→110. Dark is unaffected (its own explicit override below).
    ditherShadowSpreadPx: 115,
    discDitherMaskSize: 110,
  },
  dark: {
    // Inherits all fields from PRESET_A (structure, springs, radius, backdrop).
    // Overrides: dither look only. Cream dots on midnight paper (#1f1d18) read as
    // a warm glow per the dark-shadows-are-light-glows convention; dot color is
    // already cream in CSS ([data-palette="midnight"] .ditherBackdrop).
    // ditherExpandedOpacity and fade geometry match light at these strawman values
    // so Sean sees the same "clearly present" baseline in both themes. discDither
    // stays lower than light because cream on near-black reads brighter per dot.
    ...BLOOM_PRESET_A,
    ditherExpandedOpacity: 1.0, // was 0.76 — match light strawman; cream glow on midnight
    ditherFadeOriginY: 110, // was 95 — extends ellipse to 110% of viewport height
    ditherFadeSpread: 0,
    ditherFadeSoftness: 70, // was 50 — 70% x 110% x viewport covers entire above-sheet area
    discDitherOpacity: 0.25,
    // Dark keeps the pre-2026-07-14 shadow strawman; light was rebaked to
    // 140/80/0.45 (long feather, quiet edge) but dark gets its own pass later.
    ditherShadowSpreadPx: 56,
    ditherShadowFalloffSoftness: 45,
    ditherShadowEdgeDensity: 0.08,
    // Pointer pressure: unchanged from the pre-migration constant. Dark's
    // higher envelope.opacity already makes the effect read clearly, so this
    // is left at 0.35 pending Sean's own live dial (not confirmed to need a
    // change, only "maybe too exaggerated").
    pointerMaxLift: 0.35,
  },
};

/**
 * DEFAULT_BLOOM_TUNING — kept as an alias of PRESET A.
 *
 * Used as the SSR-safe single-set initial value (light/A renders first so the
 * server and first client render always match) and by any remaining single-set
 * importers (e.g. getMorphSpring's fallback).
 */
export const DEFAULT_BLOOM_TUNING: BloomTuning = BLOOM_PRESET_A;
