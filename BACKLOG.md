# surface-fx — Backlog

> Deferred / parked work. Resurfaces at wrap. Greppable, no ticket overhead.

## Tuner (Direction D2) — in flight

**Locked:** D2 two-panel layout (tabbed `Look`/`Setup` inspector + full-width timeline, no top bar). Wired live to the real texture schema store — commit `3a1adda` on `feat/stage-playground`. Runs at `http://localhost:4041/?stage=1&target=disc`.

**Key fact (measured 2026-07-20):** the extraction dropped NOTHING. All ~251 params from the original seansmithdesign.com dev panels live in the store (`src/schema/{texture,bloom,feedHover}*.ts` — 168 / 66 / 17). Wave 1 rendered only ~8. The gap Sean felt is 100% un-rendered, not lost.

### NEXT — Wave 2: Texture track to full parity with original TextureConsolePanel
- All 8 envelope controls (reach, fadeOrigin, fadeSoftness, innerCutout, opacity, screenBlend, tint, mobileScale) — not just 4.
- The **active mode's complete param set**, auto-swapping when Shape changes (LED→cellSize/gap/glow/colorMix; Rings→ringSpacing/dotScale/centerFalloff/contrast; etc. across all 9 modes).
- Both surfaces (disc/sheet via Setup) and both themes (@light/@dark), already keyed.
- Nuance affordances the original had: numeric entry, per-dial reset, copy/export of the diff.
- Renders live on the stage (texture is what the stage draws today).

### Wave 3 (parked) — Dither-shadow + Ripple tracks
- Dither shadow track → bloom registry (66 params, 7 groups: springs, timing, dither geometry, shadow morph, pointer lift).
- Ripple track → feed-hover registry (17: mode + wake/ripple/glow/dither).
- **Dependency:** the stage only *draws* the texture effect today. Wiring bloom/ripple sets real values but won't visibly change the stage until it also renders those effects. Needs stage-render work first, not just control wiring.

## Open design decisions (surfaced by the live build)
1. **Tint** is an enum (`ink`/`accent`/`custom`), not a color picker. Keep, or add a real picker?
2. **"Theme" label** — the toggle picks which effect *variant* (@light/@dark) you're tuning, not app appearance. Rename to "Variant"?
3. **Sample picker** — one-click disc/sheet/halftone is gone (halftone via Shape dial now). Miss it?
4. **Timeline density** — does the 3-track + trigger + envelope + timing bottom bar hold up live, or does it want collapse-when-unselected?

## Parked (from earlier port work)
- Merge `feat/stage-playground` → surface-fx `main` — HELD. main is the site's floating `github:` dep, so this is prod-adjacent. Gated on Sean.
- Stale v2 branch `feat/surface-fx-playground-v2` — keep for now.
