# surface-fx

Agent-forward dither/ripple/pointer surface-effect library for React. Pure-logic foundation: geometry measurement, shader shape uniforms, ripple envelope/trigger/velocity math, and a parameter-registry schema that lets React hooks, a dev tuning panel, and an agent (CLI/MCP) all read and write the same tunable values.

No JSX, no CSS, no bundled UI. You wire the hooks and registries into your own surface components.

---

## What it is

- **`geometry/`** — `useSurfaceGeometry` measures a DOM element's rect/border-radius into a stable `SurfaceGeometry`, for driving shader uniforms or CSS clip-paths off real layout.
- **`shader/`** — `buildShapeUniforms` converts `SurfaceGeometry` into shape uniforms for a shader-driven surface.
- **`ripple/`** — pointer-driven ripple math: `useRippleEngine` for triggered ripples, `useSurfaceVelocity`/`velocityToRipple` for velocity-derived ripples, `usePointerPressure` for a continuous pointer-pressure field, plus shipped presets (`dabHero`, `feedHover`, `discArrival`, `sheetBloom`).
- **`schema/`** — `defineRegistry`/`createSchemaStore` define one `ParamRegistry` per tunable surface, backing a live store. `createAgentFace` exposes list/get/set over that same store so a script or MCP server can co-tune alongside a human dev panel.

## What it is not

- No bundled dev tuning panel UI, CLI, or MCP relay — those are consumer-side scaffolding, not part of the library.
- No shader/GLSL source — `shader/` only builds the uniform values a consumer's own shader program reads.

---

## Installation

The package is source-only (no build step). Consume it via Next.js `transpilePackages`.

```bash
npm install github:SeanSmithDesign/surface-fx
```

In `next.config.ts`:

```ts
const nextConfig = {
  transpilePackages: ["@seansmith/surface-fx"],
};

export default nextConfig;
```

## Usage

```ts
import { useSurfaceGeometry, buildShapeUniforms, useRippleEngine, dabHero } from "@seansmith/surface-fx";

// or import a subpath directly
import { createSchemaStore } from "@seansmith/surface-fx/schema/store";
```

## Requirements

Peer dependencies: `react` `>=19`, `motion` `>=12`.

## Development

```bash
npm install
npm run typecheck
npm test
```
