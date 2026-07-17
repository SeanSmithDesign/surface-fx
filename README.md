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

## Tooling

`scripts/` holds an agent-facing CLI, MCP server, and browser playground for
dialing surface-fx params on a *running* site. These are HTTP-bridge clients
— they talk to a consuming app's dev-only bridge route (e.g.
`/api/dev/surface-fx` on seansmithdesign.com) over a port and never import
this library's source directly, so they run from anywhere as long as they're
pointed at a live `next dev` process that ships the bridge route and its
client (`SurfaceFxBridge`).

```bash
npm run fx -- list --port 4040          # list registered params
npm run fx -- get texture.grain.intensity --port 4040
npm run fx -- set texture.grain.intensity 0.4 --port 4040
npm run fx:ui -- --port 4040            # standalone playground UI
npm run fx:mcp -- --port 4040           # stdio MCP server (see .mcp.json)
```

`.mcp.json` registers the MCP server for agent use out of the box.
