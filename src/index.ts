/**
 * surface-fx — public barrel.
 *
 * Pure-logic foundation for the site's unified dither-shadow + ripple
 * surface-effects system: geometry measurement, shader shape uniforms,
 * ripple envelope/trigger/velocity math. No JSX, no CSS — the extraction
 * seam for a future standalone package.
 */

export type { SurfaceGeometry } from "./geometry/SurfaceGeometry";
export { rectToGeometry, type RectToGeometryOptions } from "./geometry/measure";
export {
  useSurfaceGeometry,
  type UseSurfaceGeometryOptions,
} from "./geometry/useSurfaceGeometry";

export {
  buildShapeUniforms,
  type ShapeUniforms,
} from "./shader/shapeUniforms";

export {
  RIPPLE_PROGRESS_EASE,
  rippleEnvelope,
  type RippleEnvelopeOptions,
} from "./ripple/envelope";
export type { RippleTrigger, RippleSpec, RippleEngine, Vec2 } from "./ripple/triggers";
export {
  useSurfaceVelocity,
  velocityToRipple,
  type SurfaceVelocity,
  type SurfaceVelocitySpringConfig,
  type VelocityToRippleConfig,
  type VelocityRippleResult,
} from "./ripple/velocity";
export {
  useRippleEngine,
  type ActiveRipple,
  type UseRippleEngineResult,
} from "./ripple/useRippleEngine";
export { dabHero, feedHover, discArrival, sheetBloom } from "./ripple/presets";
export {
  pressureAt,
  usePointerPressure,
  POINTER_STRENGTH_IDLE_THRESHOLD,
  type PointerPressureOptions,
  type PointerPressureField,
} from "./ripple/pointerField";

// ── Schema core ──────────────────────────────────────────────────────────
// Parameter registry + store factory: the seam that will let React
// components, the human dev tuning panel, and an agent (MCP/CLI) all read
// and write the same tunable surface-fx values. See ./schema for details.
export type { ParamSpec } from "./schema/param";
export {
  defineRegistry,
  SHEET_SHADOW_PARAMS,
  SHEET_SHADOW_REGISTRY,
  type ParamRegistry,
} from "./schema/registry";
export {
  createSchemaStore,
  type ParamValue,
  type SchemaValueMap,
  type SchemaStore,
} from "./schema/store";
export {
  createAgentFace,
  type AgentFace,
  type AgentSetResult,
} from "./schema/agent";
export { ComposedSlot } from "./schema/compose";
export {
  TEXTURE_SURFACES,
  TEXTURE_THEMES,
  TEXTURE_MODES,
  SHADER_MODES as TEXTURE_SHADER_MODES,
  type ShaderMode as TextureShaderMode,
  ENVELOPE_FIELD_KEYS as TEXTURE_ENVELOPE_FIELD_KEYS,
  MODE_FIELD_KEYS as TEXTURE_MODE_FIELD_KEYS,
  textureEnabledKey,
  textureModeKey,
  textureEnvelopeKey,
  textureModeParamKey,
  TEXTURE_TUNING_PARAMS,
  TEXTURE_TUNING_REGISTRY,
} from "./schema/textureTuningRegistry";
export {
  BLOOM_THEMES,
  SPRING_GROUPS as BLOOM_SPRING_GROUPS,
  type SpringGroup as BloomSpringGroup,
  SCALAR_FIELD_KEYS as BLOOM_SCALAR_FIELD_KEYS,
  SPRING_FIELD_KEYS as BLOOM_SPRING_FIELD_KEYS,
  bloomFieldKey,
  bloomSpringFieldKey,
  BLOOM_TUNING_PARAMS,
  BLOOM_TUNING_REGISTRY,
} from "./schema/bloomTuningRegistry";
export {
  SHIPPED_HOVER_FX_DEFAULTS,
  type HoverFXTuning,
  type HoverFXTuningKey,
  HOVER_FX_TUNING_KEYS,
  feedHoverFieldKey,
  FEED_HOVER_PARAMS,
  FEED_HOVER_REGISTRY,
} from "./schema/feedHoverRegistry";
