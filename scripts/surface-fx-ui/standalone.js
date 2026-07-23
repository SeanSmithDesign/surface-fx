// GENERATED FILE — built from scripts/surface-fx-ui/stage-entry.ts by
// scripts/surface-fx-ui/build-standalone.mjs. Do not hand-edit; re-run the
// build script instead. Committed as a versioned dev-tool artifact — the
// playground stays zero-dependency at runtime (no build step per request).
"use strict";
(() => {
  // src/schema/textureDefaults.ts
  var DEFAULT_MODE_PARAMS = {
    led: {
      cellSize: 12,
      gap: 2,
      glow: 0.6,
      colorMix: 0
    },
    concentric: {
      ringSpacing: 20,
      dotScale: 0.7,
      centerFalloff: 2,
      contrast: 1.4
    },
    flow: {
      speed: 0.3,
      warpAmount: 0.4,
      scale: 3
    },
    bayer: {
      matrixSize: 4,
      levels: 3,
      contrast: 2
    },
    halftone: {
      cellSize: 10,
      dotMax: 0.9,
      angle: 0.524,
      // 30 degrees
      contrast: 1.8
    },
    bluenoise: {
      scale: 2,
      levels: 3,
      contrast: 1.8
    },
    scanlines: {
      lineFreq: 0.15,
      lineDepth: 0.7,
      rollSpeed: 20,
      curvature: 0.3
    },
    crosshatch: {
      hatchFreq: 0.05,
      angle: 0.785,
      // 45 degrees
      levels: 3,
      weight: 0.15
    },
    lego: {
      studSize: 18,
      bevel: 0.2,
      gap: 0.1
    },
    phyllotaxis: {
      spacing: 14,
      dotScale: 0.35,
      rotate: 0,
      jitter: 0.15,
      contrast: 1.6
    },
    julia: {
      cRe: -0.4,
      cIm: 0.6,
      zoom: 1,
      levels: 3,
      trapMix: 0.5,
      contrast: 1.6
    },
    lightning: {
      density: 3,
      warp: 0.6,
      thickness: 0.08,
      flickerSpeed: 0.15,
      contrast: 1.8
    },
    web: {
      spokes: 10,
      ringSpacing: 18,
      sag: 0.15,
      jitter: 0.2,
      threadWidth: 1.5
    },
    coral: {
      scale: 2.5,
      warp: 0.5,
      threshold: 0.15,
      detail: 0.5,
      contrast: 1.8
    }
  };
  var DISC_LIGHT_ENVELOPE = {
    reach: 192,
    fadeOrigin: 0.4,
    fadeSoftness: 50,
    opacity: 0.4,
    innerCutout: 24,
    screenBlend: false,
    tint: "ink",
    mobileScale: 1
  };
  var DISC_DARK_ENVELOPE = {
    reach: 128,
    fadeOrigin: 0.3,
    fadeSoftness: 8,
    opacity: 0.25,
    innerCutout: 28,
    screenBlend: false,
    tint: "accent",
    mobileScale: 1
  };
  var SHEET_LIGHT_ENVELOPE = {
    reach: 102,
    fadeOrigin: 0.56,
    fadeSoftness: 80,
    opacity: 0.5,
    innerCutout: 80,
    screenBlend: false,
    tint: "accent",
    mobileScale: 1
  };
  var SHEET_DARK_ENVELOPE = {
    reach: 183,
    fadeOrigin: 0.6,
    fadeSoftness: 100,
    opacity: 1,
    innerCutout: 55,
    screenBlend: false,
    tint: "ink",
    mobileScale: 1
  };
  function makeSurfaceConfig(envelope, ledOverride) {
    return {
      enabled: true,
      mode: "led",
      // Sean's chosen texture — baked default. See note below.
      envelope,
      ...DEFAULT_MODE_PARAMS,
      led: { ...DEFAULT_MODE_PARAMS.led, ...ledOverride }
    };
  }
  var DEFAULT_REVIEW = {
    verdicts: {},
    notes: ""
  };
  var DEFAULT_TEXTURE_TUNING = {
    activeSurface: "disc",
    activeTheme: "light",
    disc: {
      light: makeSurfaceConfig(DISC_LIGHT_ENVELOPE, {
        cellSize: 9,
        gap: 4,
        glow: 0.9,
        colorMix: 0.4
      }),
      dark: makeSurfaceConfig(DISC_DARK_ENVELOPE, {
        cellSize: 12,
        gap: 4.5,
        glow: 0.6,
        colorMix: 0.5
      })
    },
    sheet: {
      light: makeSurfaceConfig(SHEET_LIGHT_ENVELOPE, {
        cellSize: 9,
        gap: 4,
        glow: 0.6,
        colorMix: 0.5
      }),
      dark: makeSurfaceConfig(SHEET_DARK_ENVELOPE, {
        cellSize: 12,
        gap: 4,
        glow: 0.6,
        colorMix: 0.5
      })
    },
    review: DEFAULT_REVIEW
  };

  // src/schema/registry.ts
  function defineRegistry(specs) {
    const registry = {};
    for (const spec of specs) {
      if (Object.prototype.hasOwnProperty.call(registry, spec.key)) {
        throw new Error(`defineRegistry: duplicate param key "${spec.key}"`);
      }
      validateSpec(spec);
      registry[spec.key] = spec;
    }
    return registry;
  }
  function validateSpec(spec) {
    if (spec.kind === "enum" && (!spec.options || spec.options.length === 0)) {
      throw new Error(
        `defineRegistry: enum param "${spec.key}" requires a non-empty options array`
      );
    }
    if (spec.kind === "number") {
      if (spec.min !== void 0 && spec.max !== void 0 && spec.min > spec.max) {
        throw new Error(
          `defineRegistry: param "${spec.key}" has min (${spec.min}) greater than max (${spec.max})`
        );
      }
      if (typeof spec.default === "number") {
        if (spec.min !== void 0 && spec.default < spec.min) {
          throw new Error(
            `defineRegistry: param "${spec.key}" default (${spec.default}) is below min (${spec.min})`
          );
        }
        if (spec.max !== void 0 && spec.default > spec.max) {
          throw new Error(
            `defineRegistry: param "${spec.key}" default (${spec.default}) is above max (${spec.max})`
          );
        }
      }
    }
  }
  var SHEET_SHADOW_PARAMS = [
    {
      key: "sheet.shadow.spreadPx",
      group: "sheet.shadow",
      label: "Shadow Spread",
      kind: "number",
      default: 56,
      min: 0,
      max: 200,
      step: 1,
      unit: "px",
      reducedMotionSafe: true,
      agentWritable: true,
      describe: "Penumbra spread beyond the morphing shape's true edge, in px, shared by both axes. Larger values extend the soft halo further outward."
    },
    {
      key: "sheet.shadow.falloffSoftness",
      group: "sheet.shadow",
      label: "Falloff Softness",
      kind: "number",
      default: 45,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      reducedMotionSafe: true,
      agentWritable: true,
      describe: "Shape of the falloff curve across the spread band. 0 = the penumbra fades sharply right after the true edge (short, crisp halo). 100 = it stays dense across most of the spread band and only falls away right at the outer edge (long, soft tail)."
    },
    {
      key: "sheet.shadow.edgeDensity",
      group: "sheet.shadow",
      label: "Edge Density",
      kind: "number",
      default: 0.85,
      min: 0,
      max: 1,
      step: 0.01,
      reducedMotionSafe: true,
      agentWritable: true,
      describe: "Peak mask alpha right at the morphing shape's true edge \u2014 how dense the dither reads at the point closest to the silhouette, independent of the overall expanded opacity."
    },
    {
      key: "sheet.shadow.cornerFollow",
      group: "sheet.shadow",
      label: "Corner Follow",
      kind: "number",
      default: 1,
      min: 0,
      max: 1,
      step: 0.01,
      reducedMotionSafe: true,
      agentWritable: true,
      describe: "How strongly the mask's rx/ry follow the morphing shape's true measured aspect ratio vs a perfect circle (the average of the two radii). 0 = always a round halo regardless of shape. 1 = fully hugs the disc's circle / sheet's rect proportions as measured."
    }
  ];
  var SHEET_SHADOW_REGISTRY = defineRegistry(SHEET_SHADOW_PARAMS);

  // src/schema/textureTuningRegistry.ts
  var TEXTURE_SURFACES = ["disc", "sheet"];
  var TEXTURE_THEMES = ["light", "dark"];
  var TEXTURE_MODES = [
    "css",
    "led",
    "concentric",
    "flow",
    "bayer",
    "halftone",
    "bluenoise",
    "scanlines",
    "crosshatch",
    "lego",
    "phyllotaxis",
    "julia",
    "lightning",
    "web",
    "coral"
  ];
  var SHADER_MODES = TEXTURE_MODES.filter(
    (m) => m !== "css"
  );
  function textureEnabledKey(surface, theme) {
    return `texture.${surface}.layer.enabled@${theme}`;
  }
  function textureModeKey(surface, theme) {
    return `texture.${surface}.layer.mode@${theme}`;
  }
  function textureEnvelopeKey(surface, field, theme) {
    return `texture.${surface}.envelope.${field}@${theme}`;
  }
  function textureModeParamKey(surface, mode, field, theme) {
    return `texture.${surface}.${mode}.${field}@${theme}`;
  }
  var ENVELOPE_FIELD_META = {
    reach: {
      kind: "number",
      label: "Reach",
      min: 0,
      max: 400,
      step: 1,
      unit: "px",
      describe: "Disc: outer mask radius in px. Sheet: ellipse y-radius as % of element height."
    },
    fadeOrigin: {
      kind: "number",
      label: "Fade origin",
      min: 0,
      max: 1,
      step: 0.01,
      describe: "Fraction of reach where the solid band ends and the outer fade begins."
    },
    fadeSoftness: {
      kind: "number",
      label: "Fade softness",
      min: 0,
      max: 120,
      step: 1,
      unit: "px",
      describe: "Width of the inner fade transition (disc only; sheet keeps this at 0)."
    },
    innerCutout: {
      kind: "number",
      label: "Inner cutout",
      min: 0,
      max: 120,
      step: 1,
      unit: "px",
      describe: "Inner transparent radius \u2014 the hole at the disc center (sheet: 0)."
    },
    opacity: {
      kind: "number",
      label: "Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      describe: "Layer opacity, maps to u_opacity for the shader canvas."
    },
    screenBlend: {
      kind: "boolean",
      label: "Screen blend",
      describe: "mix-blend-mode:screen on the canvas layer (drops black; adds light)."
    },
    tint: {
      kind: "enum",
      label: "Tint",
      options: ["ink", "accent", "custom"],
      describe: "Which CSS var sources u_color0 in the shader."
    },
    mobileScale: {
      kind: "number",
      label: "Mobile scale",
      min: 0.5,
      max: 2,
      step: 0.05,
      describe: "Phone-breakpoint (<768px) multiplier on the geometric envelope; ignored at >=768px."
    }
  };
  var ENVELOPE_FIELD_KEYS = Object.keys(
    ENVELOPE_FIELD_META
  );
  var MODE_FIELD_META = {
    led: {
      cellSize: {
        kind: "number",
        label: "Cell size",
        min: 4,
        max: 40,
        step: 1,
        unit: "px",
        describe: "LED cell grid size in CSS px."
      },
      gap: {
        kind: "number",
        label: "Gap",
        min: 0,
        max: 12,
        step: 0.5,
        unit: "px",
        describe: "Gap between LED cells in CSS px."
      },
      glow: {
        kind: "number",
        label: "Glow",
        min: 0,
        max: 1,
        step: 0.05,
        describe: "Glow bleed beyond the LED cell boundary."
      },
      colorMix: {
        kind: "number",
        label: "Color mix",
        min: 0,
        max: 1,
        step: 0.05,
        describe: "Color mix: 0 = color0 only, 1 = color1 only."
      }
    },
    concentric: {
      ringSpacing: {
        kind: "number",
        label: "Ring spacing",
        min: 4,
        max: 60,
        step: 1,
        unit: "px",
        describe: "Spacing between concentric rings in CSS px."
      },
      dotScale: {
        kind: "number",
        label: "Dot scale",
        min: 0.1,
        max: 1.5,
        step: 0.05,
        describe: "Dot radius as a fraction of half ring-spacing."
      },
      centerFalloff: {
        kind: "number",
        label: "Center falloff",
        min: 0.5,
        max: 6,
        step: 0.1,
        describe: "Exponent controlling how fast luminance falls off from center."
      },
      contrast: {
        kind: "number",
        label: "Contrast",
        min: 0.5,
        max: 3,
        step: 0.05,
        describe: "Luminance contrast multiplier."
      }
    },
    flow: {
      speed: {
        kind: "number",
        label: "Speed",
        min: 0,
        max: 2,
        step: 0.05,
        describe: "Animation speed (scales u_time).",
        reducedMotionSafe: false
      },
      warpAmount: {
        kind: "number",
        label: "Warp amount",
        min: 0,
        max: 1.5,
        step: 0.05,
        describe: "Domain warp strength."
      },
      scale: {
        kind: "number",
        label: "Scale",
        min: 0.5,
        max: 8,
        step: 0.1,
        describe: "Noise spatial frequency (canvas-UV scale)."
      }
    },
    bayer: {
      matrixSize: {
        kind: "number",
        label: "Matrix size",
        min: 4,
        max: 8,
        step: 4,
        describe: "Bayer matrix size: 4 (4x4) or 8 (8x8)."
      },
      levels: {
        kind: "number",
        label: "Levels",
        min: 1,
        max: 8,
        step: 1,
        describe: "Quantization levels."
      },
      contrast: {
        kind: "number",
        label: "Contrast",
        min: 0.5,
        max: 4,
        step: 0.1,
        describe: "Luminance contrast multiplier."
      }
    },
    halftone: {
      cellSize: {
        kind: "number",
        label: "Cell size",
        min: 3,
        max: 40,
        step: 1,
        unit: "px",
        describe: "Halftone grid cell size in CSS px."
      },
      dotMax: {
        kind: "number",
        label: "Dot max",
        min: 0.1,
        max: 1,
        step: 0.05,
        describe: "Max dot radius as a fraction of half-cell."
      },
      angle: {
        kind: "number",
        label: "Angle",
        min: 0,
        max: 1.571,
        step: 0.05,
        unit: "rad",
        describe: "Grid rotation angle in radians."
      },
      contrast: {
        kind: "number",
        label: "Contrast",
        min: 0.5,
        max: 3,
        step: 0.1,
        describe: "Luminance contrast multiplier."
      }
    },
    bluenoise: {
      scale: {
        kind: "number",
        label: "Scale",
        min: 0.2,
        max: 8,
        step: 0.1,
        describe: "Spatial frequency of the IGN threshold pattern."
      },
      levels: {
        kind: "number",
        label: "Levels",
        min: 1,
        max: 8,
        step: 1,
        describe: "Quantization levels."
      },
      contrast: {
        kind: "number",
        label: "Contrast",
        min: 0.5,
        max: 4,
        step: 0.1,
        describe: "Luminance contrast multiplier."
      }
    },
    scanlines: {
      lineFreq: {
        kind: "number",
        label: "Line freq",
        min: 0.01,
        max: 0.5,
        step: 0.01,
        describe: "Lines per pixel."
      },
      lineDepth: {
        kind: "number",
        label: "Depth",
        min: 0,
        max: 1,
        step: 0.05,
        describe: "Modulation depth."
      },
      rollSpeed: {
        kind: "number",
        label: "Roll speed",
        min: 0,
        max: 100,
        step: 5,
        unit: "px/s",
        describe: "Vertical roll speed in px/second (0 = static).",
        reducedMotionSafe: false
      },
      curvature: {
        kind: "number",
        label: "Curvature",
        min: 0,
        max: 1,
        step: 0.05,
        describe: "CRT barrel distortion strength."
      }
    },
    crosshatch: {
      hatchFreq: {
        kind: "number",
        label: "Hatch freq",
        min: 0.01,
        max: 0.2,
        step: 5e-3,
        describe: "Lines per pixel."
      },
      angle: {
        kind: "number",
        label: "Angle",
        min: 0,
        max: 1.571,
        step: 0.05,
        unit: "rad",
        describe: "Base hatch angle in radians."
      },
      levels: {
        kind: "number",
        label: "Levels",
        min: 1,
        max: 3,
        step: 1,
        describe: "Max number of hatch layer directions."
      },
      weight: {
        kind: "number",
        label: "Line weight",
        min: 0.02,
        max: 0.4,
        step: 0.01,
        describe: "Line half-thickness as a fraction of cell width."
      }
    },
    lego: {
      studSize: {
        kind: "number",
        label: "Stud size",
        min: 6,
        max: 48,
        step: 2,
        unit: "px",
        describe: "Block cell size in CSS px."
      },
      bevel: {
        kind: "number",
        label: "Bevel",
        min: 0,
        max: 0.4,
        step: 0.02,
        describe: "Bevel lighting strength."
      },
      gap: {
        kind: "number",
        label: "Gap",
        min: 0,
        max: 0.45,
        step: 0.02,
        describe: "Inter-block gap as a fraction of the cell."
      }
    },
    phyllotaxis: {
      spacing: {
        kind: "number",
        label: "Spacing",
        min: 4,
        max: 40,
        step: 1,
        unit: "px",
        describe: "Spacing between successive golden-angle spiral points."
      },
      dotScale: {
        kind: "number",
        label: "Dot scale",
        min: 0.05,
        max: 1,
        step: 0.05,
        describe: "Dot radius as a fraction of spacing."
      },
      rotate: {
        kind: "number",
        label: "Rotate",
        min: 0,
        max: 6.283,
        step: 0.05,
        unit: "rad",
        describe: "Extra rotation applied to the spiral."
      },
      jitter: {
        kind: "number",
        label: "Jitter",
        min: 0,
        max: 1,
        step: 0.05,
        describe: "Per-dot position jitter, fraction of spacing."
      },
      contrast: {
        kind: "number",
        label: "Contrast",
        min: 0.5,
        max: 3,
        step: 0.05,
        describe: "Luminance contrast multiplier."
      }
    },
    julia: {
      cRe: {
        kind: "number",
        label: "C (real)",
        min: -1.5,
        max: 1.5,
        step: 0.01,
        describe: "Julia constant, real part."
      },
      cIm: {
        kind: "number",
        label: "C (imag)",
        min: -1.5,
        max: 1.5,
        step: 0.01,
        describe: "Julia constant, imaginary part."
      },
      zoom: {
        kind: "number",
        label: "Zoom",
        min: 0.2,
        max: 4,
        step: 0.05,
        describe: "View zoom."
      },
      levels: {
        kind: "number",
        label: "Levels",
        min: 2,
        max: 3,
        step: 1,
        describe: "Posterize tone levels."
      },
      trapMix: {
        kind: "number",
        label: "Trap mix",
        min: 0,
        max: 1,
        step: 0.05,
        describe: "Blend between escape-time and orbit-trap fields."
      },
      contrast: {
        kind: "number",
        label: "Contrast",
        min: 0.5,
        max: 3,
        step: 0.05,
        describe: "Luminance contrast multiplier."
      }
    },
    lightning: {
      density: {
        kind: "number",
        label: "Density",
        min: 0.5,
        max: 8,
        step: 0.1,
        describe: "Noise spatial frequency."
      },
      warp: {
        kind: "number",
        label: "Warp",
        min: 0,
        max: 2,
        step: 0.05,
        describe: "Domain warp strength."
      },
      thickness: {
        kind: "number",
        label: "Thickness",
        min: 0.02,
        max: 0.3,
        step: 0.01,
        describe: "Filament width \u2014 smaller reads as thinner, sharper threads."
      },
      flickerSpeed: {
        kind: "number",
        label: "Flicker speed",
        min: 0,
        max: 2,
        step: 0.05,
        describe: "Animation rate (0 = static).",
        reducedMotionSafe: false
      },
      contrast: {
        kind: "number",
        label: "Contrast",
        min: 0.5,
        max: 4,
        step: 0.1,
        describe: "Luminance contrast multiplier."
      }
    },
    web: {
      spokes: {
        kind: "number",
        label: "Spokes",
        min: 4,
        max: 24,
        step: 1,
        describe: "Radial spoke count."
      },
      ringSpacing: {
        kind: "number",
        label: "Ring spacing",
        min: 6,
        max: 60,
        step: 1,
        unit: "px",
        describe: "Spacing between concentric rings in CSS px."
      },
      sag: {
        kind: "number",
        label: "Sag",
        min: 0,
        max: 0.5,
        step: 0.01,
        describe: "Ring sag between spokes."
      },
      jitter: {
        kind: "number",
        label: "Jitter",
        min: 0,
        max: 1,
        step: 0.05,
        describe: "Per-thread position jitter."
      },
      threadWidth: {
        kind: "number",
        label: "Thread width",
        min: 0.5,
        max: 4,
        step: 0.1,
        unit: "px",
        describe: "Thread half-width in CSS px."
      }
    },
    coral: {
      scale: {
        kind: "number",
        label: "Scale",
        min: 0.5,
        max: 8,
        step: 0.1,
        describe: "Spatial frequency of the Worley cell field."
      },
      warp: {
        kind: "number",
        label: "Warp",
        min: 0,
        max: 2,
        step: 0.05,
        describe: "Domain warp strength."
      },
      threshold: {
        kind: "number",
        label: "Threshold",
        min: 0,
        max: 1,
        step: 0.01,
        describe: "Base growth threshold \u2014 higher spreads growth further from center."
      },
      detail: {
        kind: "number",
        label: "Detail",
        min: 0,
        max: 1,
        step: 0.05,
        describe: "Fine-cell detail mix."
      },
      contrast: {
        kind: "number",
        label: "Contrast",
        min: 0.5,
        max: 4,
        step: 0.1,
        describe: "Luminance contrast multiplier."
      }
    }
  };
  var MODE_FIELD_KEYS = Object.fromEntries(
    SHADER_MODES.map((mode) => [mode, Object.keys(MODE_FIELD_META[mode])])
  );
  function buildSpecs() {
    const specs = [];
    for (const surface of TEXTURE_SURFACES) {
      for (const theme of TEXTURE_THEMES) {
        const surfaceDefaults = DEFAULT_TEXTURE_TUNING[surface][theme];
        specs.push({
          key: textureEnabledKey(surface, theme),
          group: `texture.${surface}.layer`,
          label: "Enabled",
          kind: "boolean",
          default: surfaceDefaults.enabled,
          reducedMotionSafe: true,
          agentWritable: true,
          describe: `Whether the WebGL canvas is mounted for the ${surface} surface in ${theme} theme; false falls back to the CSS bloom.`
        });
        specs.push({
          key: textureModeKey(surface, theme),
          group: `texture.${surface}.layer`,
          label: "Mode",
          kind: "enum",
          default: surfaceDefaults.mode,
          options: TEXTURE_MODES,
          reducedMotionSafe: true,
          agentWritable: true,
          describe: `Active texture shader mode for the ${surface} surface in ${theme} theme.`
        });
        for (const field of ENVELOPE_FIELD_KEYS) {
          const meta = ENVELOPE_FIELD_META[field];
          specs.push({
            key: textureEnvelopeKey(surface, field, theme),
            group: `texture.${surface}.envelope`,
            label: meta.label,
            kind: meta.kind,
            default: surfaceDefaults.envelope[field],
            ...meta.kind === "number" ? { min: meta.min, max: meta.max, step: meta.step, unit: meta.unit } : {},
            ...meta.kind === "enum" ? { options: meta.options } : {},
            reducedMotionSafe: true,
            agentWritable: true,
            describe: meta.describe
          });
        }
        for (const mode of SHADER_MODES) {
          const fieldMetaMap = MODE_FIELD_META[mode];
          const modeDefaults = surfaceDefaults[mode];
          for (const field of Object.keys(fieldMetaMap)) {
            const meta = fieldMetaMap[field];
            specs.push({
              key: textureModeParamKey(surface, mode, field, theme),
              group: `texture.${surface}.${mode}`,
              label: meta.label,
              kind: "number",
              default: modeDefaults[field],
              min: meta.min,
              max: meta.max,
              step: meta.step,
              unit: meta.unit,
              reducedMotionSafe: meta.reducedMotionSafe ?? true,
              agentWritable: true,
              describe: meta.describe
            });
          }
        }
      }
    }
    return specs;
  }
  var TEXTURE_TUNING_PARAMS = buildSpecs();
  var TEXTURE_TUNING_REGISTRY = defineRegistry(
    TEXTURE_TUNING_PARAMS
  );

  // src/schema/bloomDefaults.ts
  var SHARED_BLOOM_BASE = {
    // Spring for the surface FLIP on CLOSE — dialed by Sean 2026-06-19
    surfaceCloseSpring: {
      stiffness: 240,
      damping: 34,
      mass: 1.75
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
      damping: 45
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
    pointerMaxLift: 0.7
  };
  var BLOOM_PRESET_A = {
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
    ditherExpandedOpacity: 1,
    // was 0.6 (prev 0.35) — max density, clearly present
    ditherFadeOriginY: 115,
    // was 100 — extends ellipse to 115% of viewport; entire above-sheet solid
    // Fade spread (LINEAR path only; unused in radial mode). Kept for compatibility.
    ditherFadeSpread: 150,
    ditherFadeSoftness: 72
    // was 55 — 72% solid zone covers entire above-sheet area on all phones
  };
  var BLOOM_PRESET_B = {
    ...SHARED_BLOOM_BASE,
    // Collapsed opacity 0 so the dither fades fully out on close (no pop).
    ditherCollapsedOpacity: 0,
    ditherExpandedOpacity: 1,
    ditherFadeOriginY: 88,
    ditherFadeSpread: 80,
    ditherFadeSoftness: 25
  };
  var DEFAULT_THEMED_BLOOM_TUNING = {
    light: {
      ...BLOOM_PRESET_A,
      // Confirmed by Sean 2026-07-15: shadow feather-in, promoted from a live
      // dev-panel override to the shipped default. Spread 140→115, disc mask
      // 128→110. Dark is unaffected (its own explicit override below).
      ditherShadowSpreadPx: 115,
      discDitherMaskSize: 110
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
      ditherExpandedOpacity: 1,
      // was 0.76 — match light strawman; cream glow on midnight
      ditherFadeOriginY: 110,
      // was 95 — extends ellipse to 110% of viewport height
      ditherFadeSpread: 0,
      ditherFadeSoftness: 70,
      // was 50 — 70% x 110% x viewport covers entire above-sheet area
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
      pointerMaxLift: 0.35
    }
  };

  // src/schema/bloomTuningRegistry.ts
  var BLOOM_THEMES = ["light", "dark"];
  function bloomFieldKey(field, theme) {
    return `bloom.${field}@${theme}`;
  }
  function bloomSpringFieldKey(spring, field, theme) {
    return `bloom.${spring}.${field}@${theme}`;
  }
  var SCALAR_FIELD_META = {
    radiusHoldFraction: { kind: "number", label: "Radius hold fraction", min: 0, max: 1, step: 0.02, describe: "0..1 fraction of close where corner-radius begins rounding from sheet toward disc.", reducedMotionSafe: false },
    sheetRadius: { kind: "number", label: "Sheet radius", min: 0, max: 64, step: 1, unit: "px", describe: "Sheet corner radius (px) held during the first radiusHoldFraction of close.", reducedMotionSafe: true },
    discRadius: { kind: "number", label: "Disc radius", min: 0, max: 99999, step: 1, describe: "Disc radius; a large sentinel (9999) yields a true circle. No dev-panel slider exists for this field.", reducedMotionSafe: true },
    surfaceCloseLeadDelayMs: { kind: "number", label: "Close lead delay", min: 0, max: 200, step: 5, unit: "ms", describe: "On close, delays the surface scale-down while the portrait re-homes immediately.", reducedMotionSafe: false },
    contentFadeOutMs: { kind: "number", label: "Content fade duration", min: 0, max: 400, step: 10, unit: "ms", describe: "Content (text/rows/X) fade-out duration on close.", reducedMotionSafe: false },
    contentFadeOutDelayMs: { kind: "number", label: "Content fade delay", min: 0, max: 200, step: 10, unit: "ms", describe: "Delay after close starts before content begins fading.", reducedMotionSafe: false },
    radiusCloseDelaySec: { kind: "number", label: "Radius close delay", min: 0, max: 2, step: 0.02, unit: "s", describe: "Time gate on CLOSE before corner-radius rounding begins, layered on top of radiusHoldFraction.", reducedMotionSafe: false },
    openContentRevealDelaySec: { kind: "number", label: "Open content reveal delay", min: 0, max: 1, step: 0.01, unit: "s", describe: "Delay on OPEN before text/rows start writing in.", reducedMotionSafe: false },
    backdropDimEnabled: { kind: "boolean", label: "Backdrop dim + blur", describe: "Enable/disable the gray dim+blur scrim layer.", reducedMotionSafe: true },
    backdropBlurPx: { kind: "number", label: "Backdrop blur", min: 0, max: 40, step: 1, unit: "px", describe: "Backdrop blur radius; only applied when backdropDimEnabled is true.", reducedMotionSafe: true },
    backdropDimOpacity: { kind: "number", label: "Backdrop dim strength", min: 0, max: 1, step: 0.05, describe: "Multiplier on the dim scrim alpha; only applied when backdropDimEnabled is true.", reducedMotionSafe: true },
    ditherEnabled: { kind: "boolean", label: "Dither overlay", describe: "Enable/disable the dither texture overlay on the backdrop.", reducedMotionSafe: true },
    ditherCollapsedOpacity: { kind: "number", label: "Dither collapsed opacity", min: 0, max: 1, step: 0.01, describe: "Dither opacity when the sheet is fully COLLAPSED (collapseProgress = 1).", reducedMotionSafe: true },
    ditherExpandedOpacity: { kind: "number", label: "Dither expanded opacity", min: 0, max: 1, step: 0.01, describe: "Dither opacity when the sheet is fully EXPANDED (collapseProgress = 0).", reducedMotionSafe: true },
    ditherScale: { kind: "number", label: "Dither dot size", min: 1, max: 12, step: 0.5, unit: "px", describe: "Dot/cell size for the dither dot grid.", reducedMotionSafe: true },
    ditherFadeEnabled: { kind: "boolean", label: "Dither fade mask", describe: "Enable the spatial fade mask on the dither layer (bloom-from-sheet shape).", reducedMotionSafe: true },
    ditherFadeRadial: { kind: "boolean", label: "Dither fade radial", describe: "true = radial ellipse anchored bottom-center; false = linear vertical fade.", reducedMotionSafe: true },
    ditherFadeOriginY: { kind: "number", label: "Dither fade origin Y", min: 0, max: 150, step: 1, unit: "%", describe: "Radial: bloom ellipse's vertical radius as % of element height. Linear: vertical anchor of heaviest fill.", reducedMotionSafe: true },
    ditherFadeSpread: { kind: "number", label: "Dither fade spread", min: 0, max: 150, step: 1, unit: "%", describe: "Linear path only: how far the fill extends from origin before going transparent.", reducedMotionSafe: true },
    ditherFadeSoftness: { kind: "number", label: "Dither fade softness", min: 0, max: 100, step: 1, unit: "%", describe: "Linear path only: fraction of spread that is a solid opaque core before fading.", reducedMotionSafe: true },
    ditherShadowSpreadPx: { kind: "number", label: "Shadow spread", min: 0, max: 160, step: 2, unit: "px", describe: "Penumbra spread beyond the morphing shape's true edge, shared by both axes.", reducedMotionSafe: true },
    ditherShadowFalloffSoftness: { kind: "number", label: "Shadow falloff softness", min: 0, max: 100, step: 1, unit: "%", describe: "Shape of the falloff curve across the spread band.", reducedMotionSafe: true },
    ditherShadowEdgeDensity: { kind: "number", label: "Shadow edge density", min: 0, max: 1, step: 0.05, describe: "Peak mask alpha right at the morphing shape's true edge.", reducedMotionSafe: true },
    ditherShadowCornerFollow: { kind: "number", label: "Shadow corner follow", min: 0, max: 1, step: 0.05, describe: "How strongly the mask's rx/ry follow the morphing shape's true aspect ratio vs a circle.", reducedMotionSafe: true },
    discDitherOpacity: { kind: "number", label: "Disc dither opacity", min: 0, max: 1, step: 0.01, describe: "Opacity of the resting-disc dither bloom under the dock disc.", reducedMotionSafe: true },
    discDitherScale: { kind: "number", label: "Disc dither scale", min: 1, max: 12, step: 0.5, unit: "px", describe: "Dot-grid scale/spacing for the resting-disc dither bloom.", reducedMotionSafe: true },
    discDitherMaskSize: { kind: "number", label: "Disc dither mask size", min: 40, max: 320, step: 4, unit: "px", describe: "Radius/spread of the radial mask fading the resting-disc dot-grid outward.", reducedMotionSafe: true },
    pointerMaxLift: { kind: "number", label: "Pointer max lift", min: 0, max: 1, step: 0.01, describe: "Peak relative alpha lift on the sheet dither at the pointer, applied before the container opacity ceiling multiplies it down. Migrated from ContactSheet.tsx's SHEET_POINTER_MAX_LIFT constant.", reducedMotionSafe: true }
  };
  var SCALAR_FIELD_KEYS = Object.keys(
    SCALAR_FIELD_META
  );
  var SPRING_FIELD_META = {
    surfaceCloseSpring: {
      stiffness: { kind: "number", label: "Stiffness", min: 20, max: 800, step: 5, describe: "Spring stiffness for the surface box on CLOSE (the FLIP back from sheet to disc).", reducedMotionSafe: false },
      damping: { kind: "number", label: "Damping", min: 5, max: 80, step: 1, describe: "Spring damping for the surface box on CLOSE.", reducedMotionSafe: false },
      mass: { kind: "number", label: "Mass", min: 0.1, max: 5, step: 0.05, describe: "Spring mass for the surface box on CLOSE.", reducedMotionSafe: false }
    },
    portraitFollowSpring: {
      stiffness: { kind: "number", label: "Stiffness", min: 20, max: 800, step: 5, describe: "Spring stiffness for the portrait inverse-correction on close.", reducedMotionSafe: false },
      damping: { kind: "number", label: "Damping", min: 5, max: 80, step: 1, describe: "Spring damping for the portrait inverse-correction on close.", reducedMotionSafe: false }
    }
  };
  var SPRING_GROUPS = [
    "surfaceCloseSpring",
    "portraitFollowSpring"
  ];
  var SPRING_FIELD_KEYS = Object.fromEntries(
    SPRING_GROUPS.map((spring) => [spring, Object.keys(SPRING_FIELD_META[spring])])
  );
  function buildSpecs2() {
    const specs = [];
    for (const theme of BLOOM_THEMES) {
      const themeDefaults = DEFAULT_THEMED_BLOOM_TUNING[theme];
      for (const field of SCALAR_FIELD_KEYS) {
        const meta = SCALAR_FIELD_META[field];
        specs.push({
          key: bloomFieldKey(field, theme),
          group: `bloom.${field}`,
          label: meta.label,
          kind: meta.kind,
          default: themeDefaults[field],
          ...meta.kind === "number" ? { min: meta.min, max: meta.max, step: meta.step, unit: meta.unit } : {},
          reducedMotionSafe: meta.reducedMotionSafe,
          agentWritable: true,
          describe: meta.describe
        });
      }
      for (const spring of Object.keys(SPRING_FIELD_META)) {
        const fieldMetaMap = SPRING_FIELD_META[spring];
        const springDefaults = themeDefaults[spring];
        for (const field of Object.keys(fieldMetaMap)) {
          const meta = fieldMetaMap[field];
          specs.push({
            key: bloomSpringFieldKey(spring, field, theme),
            group: `bloom.${spring}`,
            label: meta.label,
            kind: "number",
            default: springDefaults[field],
            min: meta.min,
            max: meta.max,
            step: meta.step,
            reducedMotionSafe: meta.reducedMotionSafe,
            agentWritable: true,
            describe: meta.describe
          });
        }
      }
    }
    return specs;
  }
  var BLOOM_TUNING_PARAMS = buildSpecs2();
  var BLOOM_TUNING_REGISTRY = defineRegistry(BLOOM_TUNING_PARAMS);

  // src/schema/feedHoverRegistry.ts
  var SHIPPED_HOVER_FX_DEFAULTS = {
    // Wake (FeedHoverFX.tsx)
    tiltMax: 0.5,
    // deg — pointer-relative rotateX/rotateY ceiling
    wakeLift: -5,
    // px — translateY on enter (negative = rise)
    // Card scale on hover is driven by MotionTuning's hoverScale (1.02) so it stays
    // in sync with the DialKit panel and applies to the whole card as a unit.
    springStiffness: 260,
    // wake tilt + lift + scale spring stiffness
    springDamping: 23,
    // wake tilt + lift + scale spring damping
    // Ripple (HoverRippleLayer + FeedHoverFX move throttle)
    ringDuration: 2,
    // s — ring expand duration
    ringTravel: 50,
    // % — ring outward travel (radius cap)
    rippleInterval: 170,
    // ms — min gap between move-spawned rings
    ringBand: 32,
    // % — ring band half-width (softness)
    // Ripple opacity (HoverRippleLayer via --fx-ripple-opacity CSS var)
    rippleOpacityLight: 10,
    // % — master ripple opacity on paper palettes (100 = full current opacity)
    rippleOpacityDark: 8,
    // % — master ripple opacity on midnight palette (100 = full current opacity)
    // Glow / Bloom (FeedHoverFX.module.css via CSS vars)
    glowRadius: 120,
    // px — bloom radial gradient radius
    glowOpacityLight: 0,
    // % — peak glow ink-mix on paper palettes
    glowOpacityDark: 0,
    // % — peak glow ink-mix on midnight palette
    // Dither (HoverRippleLayer.module.css dot-grid vars + peak intensity)
    ditherDotSize: 1,
    // px — dot-grid circle radius (--dab-dither-dot)
    ditherGridGap: 5,
    // px — dot-grid cell size (--dab-dither-gap)
    ditherDotSoftness: 0.05,
    // px — dot feather spread (--dab-dither-spread)
    ditherPeakScale: 1.5
    // × — multiplier on ripple ring peak alpha (hover intensity)
  };
  var HOVER_FX_TUNING_KEYS = Object.keys(
    SHIPPED_HOVER_FX_DEFAULTS
  );
  function feedHoverFieldKey(field) {
    return `feed.hover.${FIELD_META[field].group}.${field}`;
  }
  var FIELD_META = {
    tiltMax: {
      group: "wake",
      label: "Tilt max",
      min: 0,
      max: 10,
      step: 0.5,
      unit: "deg",
      reducedMotionSafe: false,
      describe: "Pointer-relative rotateX/rotateY ceiling for the wake tilt effect, in degrees."
    },
    wakeLift: {
      group: "wake",
      label: "Lift",
      min: -12,
      max: 0,
      step: 0.5,
      unit: "px",
      reducedMotionSafe: false,
      describe: "translateY on hover enter; negative values rise the card toward the viewer."
    },
    springStiffness: {
      group: "wake",
      label: "Spring stiffness",
      min: 80,
      max: 300,
      step: 5,
      reducedMotionSafe: false,
      describe: "Spring stiffness shared by the wake tilt, lift, and scale animations."
    },
    springDamping: {
      group: "wake",
      label: "Spring damping",
      min: 15,
      max: 40,
      step: 1,
      reducedMotionSafe: false,
      describe: "Spring damping shared by the wake tilt, lift, and scale animations."
    },
    ringDuration: {
      group: "ripple",
      label: "Ring duration",
      min: 1,
      max: 3.5,
      step: 0.1,
      unit: "s",
      reducedMotionSafe: false,
      describe: "Duration of one ripple ring's outward expand-and-fade sweep, in seconds."
    },
    ringTravel: {
      group: "ripple",
      label: "Ring travel",
      min: 40,
      max: 80,
      step: 1,
      unit: "%",
      reducedMotionSafe: false,
      describe: "How far a ripple ring travels outward from its spawn point, as a % radius cap."
    },
    rippleInterval: {
      group: "ripple",
      label: "Spawn interval",
      min: 150,
      max: 500,
      step: 10,
      unit: "ms",
      reducedMotionSafe: true,
      describe: "Minimum gap between pointer-move-spawned ripple rings, in ms."
    },
    ringBand: {
      group: "ripple",
      label: "Band softness",
      min: 10,
      max: 36,
      step: 1,
      unit: "%",
      reducedMotionSafe: true,
      describe: "Ripple ring band half-width (softness of the ring's leading/trailing edge), as a %."
    },
    rippleOpacityLight: {
      group: "ripple",
      label: "Opacity (light)",
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      reducedMotionSafe: true,
      describe: "Master ripple opacity on paper (light) palettes; 100 = full current opacity."
    },
    rippleOpacityDark: {
      group: "ripple",
      label: "Opacity (dark)",
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      reducedMotionSafe: true,
      describe: "Master ripple opacity on the midnight (dark) palette; 100 = full current opacity."
    },
    glowRadius: {
      group: "glow",
      label: "Glow radius",
      min: 120,
      max: 360,
      step: 4,
      unit: "px",
      reducedMotionSafe: true,
      describe: "Radial-gradient radius of the cursor-follow bloom glow, in px."
    },
    glowOpacityLight: {
      group: "glow",
      label: "Opacity (light)",
      min: 0,
      max: 40,
      step: 1,
      unit: "%",
      reducedMotionSafe: true,
      describe: "Peak glow ink-mix on paper (light) palettes."
    },
    glowOpacityDark: {
      group: "glow",
      label: "Opacity (dark)",
      min: 0,
      max: 40,
      step: 1,
      unit: "%",
      reducedMotionSafe: true,
      describe: "Peak glow ink-mix on the midnight (dark) palette."
    },
    ditherDotSize: {
      group: "dither",
      label: "Dot size",
      min: 0.5,
      max: 3,
      step: 0.25,
      unit: "px",
      reducedMotionSafe: true,
      describe: "Dot-grid circle radius for the ripple's dither texture, in px."
    },
    ditherGridGap: {
      group: "dither",
      label: "Grid spacing",
      min: 2,
      max: 10,
      step: 0.5,
      unit: "px",
      reducedMotionSafe: true,
      describe: "Dot-grid cell size for the ripple's dither texture, in px."
    },
    ditherDotSoftness: {
      group: "dither",
      label: "Dot softness",
      min: 0.05,
      max: 1,
      step: 0.05,
      unit: "px",
      reducedMotionSafe: true,
      describe: "Dot feather spread for the ripple's dither texture, in px."
    },
    ditherPeakScale: {
      group: "dither",
      label: "Peak intensity",
      min: 0.5,
      max: 1.5,
      step: 0.1,
      unit: "\xD7",
      reducedMotionSafe: true,
      describe: "Multiplier on the ripple ring's peak alpha (hover intensity)."
    }
  };
  function buildSpecs3() {
    return HOVER_FX_TUNING_KEYS.map((field) => {
      const meta = FIELD_META[field];
      return {
        key: feedHoverFieldKey(field),
        group: `feed.hover.${meta.group}`,
        label: meta.label,
        kind: "number",
        default: SHIPPED_HOVER_FX_DEFAULTS[field],
        min: meta.min,
        max: meta.max,
        step: meta.step,
        ...meta.unit ? { unit: meta.unit } : {},
        reducedMotionSafe: meta.reducedMotionSafe,
        agentWritable: true,
        describe: meta.describe
      };
    });
  }
  var FEED_HOVER_PARAMS = buildSpecs3();
  var FEED_HOVER_REGISTRY = defineRegistry(FEED_HOVER_PARAMS);

  // src/shader/shapeUniforms.ts
  function buildShapeUniforms(geo, cornerFollow, falloffPx) {
    const follow = Math.min(1, Math.max(0, cornerFollow));
    const fullyRound = Math.min(geo.halfW, geo.halfH);
    const radius = fullyRound + (geo.cornerR - fullyRound) * follow;
    return {
      shapeMode: 1,
      shapeHalf: [geo.halfW * geo.dpr, geo.halfH * geo.dpr],
      shapeRadius: radius * geo.dpr,
      shapeFalloff: falloffPx * geo.dpr
    };
  }

  // src/geometry/measure.ts
  function rectToGeometry(el, opts) {
    const dpr2 = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
    if (opts.mode === "live") {
      const rect = el.getBoundingClientRect();
      const halfW2 = rect.width / 2;
      const halfH2 = rect.height / 2;
      return {
        cx: rect.left + halfW2,
        cy: rect.top + halfH2,
        halfW: halfW2,
        halfH: halfH2,
        cornerR: opts.cornerR,
        dpr: dpr2
      };
    }
    let left = 0;
    let top = 0;
    let node = el;
    while (node) {
      left += node.offsetLeft;
      top += node.offsetTop;
      node = node.offsetParent;
    }
    const halfW = el.offsetWidth / 2;
    const halfH = el.offsetHeight / 2;
    return {
      cx: left + halfW,
      cy: top + halfH,
      halfW,
      halfH,
      cornerR: opts.cornerR,
      dpr: dpr2
    };
  }

  // src/ripple/envelope.ts
  var RIPPLE_PROGRESS_EASE = [0.16, 0.7, 0.3, 1];
  function rippleEnvelope(t, opts) {
    const attackFrac = opts.attackFrac ?? 0.18;
    const decayPow = opts.decayPow ?? 1.4;
    const { peak } = opts;
    const a = t < attackFrac ? t / attackFrac * peak : peak * (1 - (t - attackFrac) / (1 - attackFrac)) ** decayPow;
    return Math.max(0, a);
  }

  // src/texture-shader/texture-shaders.ts
  var TEXTURE_VERT = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;
  var TEXTURE_FRAG = `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2  u_resolution;
uniform vec2  u_center;
uniform float u_radius; // deprecated, unused \u2014 see u_shapeMode below
uniform int   u_shapeMode;
uniform vec2  u_shapeHalf;
uniform float u_shapeRadius;
uniform float u_shapeFalloff;
uniform int   u_mode;
uniform float u_p0;
uniform float u_p1;
uniform float u_p2;
uniform float u_p3;
uniform float u_p4;
uniform float u_p5;
uniform float u_p6;
uniform float u_p7;
uniform vec3  u_color0;
uniform vec3  u_color1;
uniform float u_time;
uniform float u_opacity;
uniform vec2  u_pointer;        // device px, bottom-origin \u2014 LED-only pointer pressure
uniform float u_pressure;       // 0..1, smoothed pointer strength \u2014 LED-only
uniform float u_pressureRadius; // device px \u2014 LED-only pressure falloff radius
uniform float u_pressureMaxLift; // 0..1, peak relative alpha lift \u2014 LED-only

// -- Noise / hash utilities ---------------------------------------------------

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Value noise 2D with smooth Hermite interpolation.
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 4-octave fbm (fractal brownian motion).
float fbm(vec2 p) {
  float v    = 0.0;
  float amp  = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    v    += amp * vnoise(p * freq);
    amp  *= 0.5;
    freq *= 2.0;
  }
  return v;
}

// -- Shape falloff: legacy ellipse vs rounded-box SDF -------------------------
//
// modeLED's brightness falloff derives its shape from u_shapeMode:
//   0 = legacy elliptical falloff. Reproduces this codebase's original
//       modeLED falloff EXACTLY (constants tuned for, and byte-identical to,
//       the disc's shipped look) \u2014 the identity disc always uses this branch.
//   1 = rounded-box SDF falloff, sized to a measured rectangular surface (the
//       contact sheet) via u_shapeHalf/u_shapeRadius/u_shapeFalloff. Falls off
//       from the box's true edge (sd=0) to fully transparent at
//       sd=u_shapeFalloff, so the sheet's shadow reads as a rounded rect
//       instead of an oval sized for the disc.
//
// sdRoundBox is the canonical rounded-box signed-distance function (Inigo
// Quilez). p is the fragment position relative to the box center; b is the
// box half-extents; r is the corner radius. Negative inside, 0 at the
// boundary, positive outside.

float sdRoundBox(in vec2 p, in vec2 b, in float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float shapeFalloff(vec2 fragCoord) {
  if (u_shapeMode == 0) {
    vec2 uv = fragCoord / u_resolution;
    float f = 1.0 - smoothstep(0.0, 0.72, length(uv - u_center) * 1.6);
    return pow(max(f, 0.0), 1.6);
  }
  vec2 p = fragCoord - u_center * u_resolution;
  float sd = sdRoundBox(p, u_shapeHalf, u_shapeRadius);
  return 1.0 - smoothstep(0.0, max(u_shapeFalloff, 1.0), max(sd, 0.0));
}

// -- Mode 1: LED dot matrix --------------------------------------------------
//
// Draws rounded-rect "LED pads" in a regular grid. Radial brightness falloff
// from u_center drives per-cell intensity. A glow bleed extends a soft halo
// just beyond each cell boundary for a lit-panel look.
//
// The falloff shape (see shapeFalloff above) is passed in by the caller,
// derived from the surface's OWN measured geometry. It must scale with the
// surface: a falloff tuned for the small identity disc extinguishes
// brightness long before it reaches the much larger contact-sheet's masked
// edge, leaving the sheet's shadow mask with nothing to reveal.

vec4 modeLED(vec2 fragCoord) {
  float cellSize = max(u_p0, 1.0);
  float gap      = clamp(u_p1, 0.0, cellSize * 0.45);
  float glow     = clamp(u_p2, 0.0, 1.0);
  float colorMix = clamp(u_p3, 0.0, 1.0);

  vec2 cellUV  = fract(fragCoord / cellSize) - 0.5;
  vec2 cellIdx = floor(fragCoord / cellSize);

  float dotHalf = (cellSize - gap) * 0.5 / cellSize;

  vec2  d    = abs(cellUV) - (dotHalf - 0.04);
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.04;
  float dot_ = smoothstep(0.02 / cellSize, -0.02 / cellSize, dist);

  float falloff = shapeFalloff(fragCoord);

  float variation = 0.9 + 0.1 * hash21(cellIdx);
  float brightness = falloff * variation;

  float glowDist = dist + dotHalf;
  float glowBleed = smoothstep(0.7, 0.0, glowDist) * glow * falloff * 0.3;

  vec3  col   = mix(u_color0, u_color1, colorMix);
  float alpha = clamp((dot_ * brightness + glowBleed) * u_opacity, 0.0, 1.0);

  // Material tension: pointer pressure lifts local alpha slightly, like
  // pressing on grain. Dots never move \u2014 only brightness responds. The
  // falloff is the same smoothstep curve as pressureAt() in
  // src/lib/surface-fx/ripple/pointerField.ts. At u_pressure=0 (default/
  // rest) press is exactly 0, so alpha * (1.0 + 0.0) is an exact no-op \u2014
  // byte-identical to the pre-pointer render. u_pressureMaxLift is the
  // caller's actual peak lift (see SHEET_POINTER_MAX_LIFT) \u2014 NOT a
  // hardcoded literal, so dialing the JS-side constant reaches this math.
  float press = u_pressure * (1.0 - smoothstep(0.0, u_pressureRadius, distance(fragCoord, u_pointer)));
  alpha = min(alpha * (1.0 + press * u_pressureMaxLift), 1.0);

  return vec4(col * alpha, alpha);
}

// -- Mode 2: Concentric halftone ---------------------------------------------
//
// Draws halftone dots arranged in concentric rings centered on u_center.
// Dot size is proportional to the local luminance (radial falloff).

vec4 modeConcentric(vec2 fragCoord) {
  float ringSpacing   = max(u_p0, 2.0);
  float dotScale      = clamp(u_p1, 0.05, 1.8);
  float centerFalloff = max(u_p2, 0.1);
  float contrast      = clamp(u_p3, 0.5, 3.0);

  vec2  centered = fragCoord - u_center * u_resolution;
  float r        = length(centered);

  float normR   = r / (min(u_resolution.x, u_resolution.y) * 0.5);
  float lum     = pow(max(1.0 - normR, 0.0), centerFalloff) * contrast;
  lum           = clamp(lum, 0.0, 1.0);

  float ringIndex = floor(r / ringSpacing);
  float ringR     = (ringIndex + 0.5) * ringSpacing;

  float circumference = max(6.28318 * ringR, ringSpacing);
  float dotCount      = max(floor(circumference / ringSpacing), 1.0);
  float angularStep   = 6.28318 / dotCount;

  float angle    = atan(centered.y, centered.x);
  float dotIdx   = floor((angle + 3.14159) / angularStep);
  float dotAngle = dotIdx * angularStep - 3.14159;
  vec2  dotCenter = vec2(cos(dotAngle) * ringR, sin(dotAngle) * ringR);

  float distToDot = length(centered - dotCenter);
  float dotRadius = dotScale * ringSpacing * 0.5 * lum;
  float dot_      = 1.0 - smoothstep(max(dotRadius - 1.5, 0.0), dotRadius + 1.5, distToDot);

  float gated = dot_ * step(0.03, lum);
  float alpha = clamp(gated * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 3: Flow-field / domain-warp noise ----------------------------------
//
// Warps a UV coordinate with a time-driven vector field, then samples fbm.
// Radial mask concentrates the effect near u_center. Works at u_time=0.

vec4 modeFlow(vec2 fragCoord) {
  float speed      = max(u_p0, 0.0);
  float warpAmount = clamp(u_p1, 0.0, 2.0);
  float scale      = max(u_p2, 0.2);

  vec2 uv = fragCoord / u_resolution;
  float t = u_time * speed;

  vec2 warp = vec2(
    fbm(uv * scale + vec2(t * 0.31, t * 0.17)),
    fbm(uv * scale + vec2(1.73 + t * 0.23, 0.89 + t * 0.11))
  );

  vec2 warped = uv + warpAmount * (warp * 2.0 - 1.0);

  float n = fbm(warped * scale + t * 0.12);
  n = clamp(n, 0.0, 1.0);

  float dist       = length(uv - u_center);
  float radialMask = smoothstep(0.6, 0.05, dist);

  vec3  col   = mix(u_color0, u_color1, n);
  float alpha = clamp(n * radialMask * u_opacity, 0.0, 1.0);
  return vec4(col * alpha, alpha);
}

// -- Shared luminance helper (screen-pixel distance, DPR-independent) --------
//
// Uses screen-pixel distance from u_center rather than UV space. This ensures
// the luminance gradient spans the actual bloom-ring footprint regardless of
// where the disc sits in the viewport.

float bloomLum(vec2 fragCoord, float contrast) {
  vec2  centered = fragCoord - u_center * u_resolution;
  float r        = length(centered);
  // Normalize to min(resolution)*0.2 so falloff spans ~36-140 CSS px from center.
  float normR    = r / (min(u_resolution.x, u_resolution.y) * 0.2);
  return clamp((1.0 - normR) * contrast, 0.0, 1.0);
}

// -- Mode 4: Bayer ordered dithering -----------------------------------------
//
// Thresholds the radial luminance field against a 4x4 or 8x8 Bayer matrix.
// Crisp multi-level stipple; u_p0 selects matrix size (4 or 8).

float bayerThreshold4(ivec2 p) {
  int x = p.x & 3;
  int y = p.y & 3;
  int idx = y * 4 + x;
  float vals[16] = float[16](
     0., 8., 2.,10.,
    12., 4.,14., 6.,
     3.,11., 1., 9.,
    15., 7.,13., 5.
  );
  return (vals[idx] + 0.5) / 16.0;
}

float bayerThreshold8(ivec2 p) {
  int x = p.x & 7;
  int y = p.y & 7;
  int idx = y * 8 + x;
  float vals[64] = float[64](
     0.,32., 8.,40., 2.,34.,10.,42.,
    48.,16.,56.,24.,50.,18.,58.,26.,
    12.,44., 4.,36.,14.,46., 6.,38.,
    60.,28.,52.,20.,62.,30.,54.,22.,
     3.,35.,11.,43., 1.,33., 9.,41.,
    51.,19.,59.,27.,49.,17.,57.,25.,
    15.,47., 7.,39.,13.,45., 5.,37.,
    63.,31.,55.,23.,61.,29.,53.,21.
  );
  return (vals[idx] + 0.5) / 64.0;
}

vec4 modeBayer(vec2 fragCoord) {
  float msize    = u_p0;
  float levels   = max(u_p1, 1.0);
  float contrast = clamp(u_p2, 0.5, 4.0);

  float lum = bloomLum(fragCoord, contrast);

  ivec2 pix = ivec2(fragCoord);
  float threshold = msize < 6.0 ? bayerThreshold4(pix) : bayerThreshold8(pix);

  // Multi-level ordered dither.
  float q    = floor(lum * levels) / levels;
  float frac = fract(lum * levels);
  float dithered = clamp(q + step(threshold, frac) / levels, 0.0, 1.0);

  float alpha = dithered * u_opacity;
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 5: Halftone --------------------------------------------------------
//
// Circular dots on a regular grid rotated by angle. Dot radius proportional
// to radial luminance \u2014 classic newspaper-halftone look.

vec4 modeHalftone(vec2 fragCoord) {
  float cellSize = max(u_p0, 2.0);
  float dotMax   = clamp(u_p1, 0.05, 1.0);
  float angle    = u_p2;
  float contrast = clamp(u_p3, 0.5, 3.0);

  float ca = cos(angle), sa = sin(angle);
  vec2 rot = vec2(
    fragCoord.x * ca + fragCoord.y * sa,
   -fragCoord.x * sa + fragCoord.y * ca
  );

  vec2 cellUV = fract(rot / cellSize) - 0.5;

  float lum  = bloomLum(fragCoord, contrast);

  float dotR   = dotMax * 0.5 * lum;
  float r      = length(cellUV);
  float feather = 0.6 / cellSize;
  float dot_ = 1.0 - smoothstep(dotR - feather, dotR + feather, r);

  float alpha = clamp(dot_ * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 6: Blue-noise dithering --------------------------------------------
//
// Uses Interleaved Gradient Noise (IGN) to threshold the radial luminance
// field. IGN has strong high-frequency energy with no visible grid structure.

vec4 modeBlueNoise(vec2 fragCoord) {
  float scale    = max(u_p0, 0.1);
  float levels   = max(u_p1, 1.0);
  float contrast = clamp(u_p2, 0.5, 4.0);

  float lum  = bloomLum(fragCoord, contrast);

  // IGN threshold: no visible grid, high-frequency distribution.
  vec2  p     = fragCoord * scale;
  float noise = fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));

  float q        = floor(lum * levels) / levels;
  float frac_    = fract(lum * levels);
  float dithered = clamp(q + step(noise, frac_) / levels, 0.0, 1.0);

  float alpha = dithered * u_opacity;
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 7: Scanlines -------------------------------------------------------
//
// Horizontal sin modulation over the radial luminance field. u_time drives
// an optional vertical roll. Under prefers-reduced-motion the caller draws
// one static frame (u_time=0) without starting the rAF loop.

vec4 modeScanlines(vec2 fragCoord) {
  float lineFreq  = max(u_p0, 0.001);
  float lineDepth = clamp(u_p1, 0.0, 1.0);
  float rollSpeed = u_p2;
  float curvature = clamp(u_p3, 0.0, 1.0);

  float lum  = bloomLum(fragCoord, 1.0);

  // Optional CRT barrel distortion on Y.
  vec2  uv       = fragCoord / u_resolution;
  vec2  centered = uv - 0.5;
  float barrelR  = length(centered);
  float yDistort = centered.y * (1.0 + curvature * 0.2 * barrelR * barrelR);
  float scanY    = yDistort * u_resolution.y + u_time * rollSpeed;

  float wave      = 0.5 + 0.5 * sin(scanY * lineFreq * 6.28318);
  float modulated = mix(1.0, wave, lineDepth);

  float alpha = clamp(lum * modulated * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 8: Crosshatch ------------------------------------------------------
//
// Luminance drives layered angled hatch line sets. As luminance increases,
// 1 -> 2 -> 3 directions stack up for an engraved etching look.

float hatchLayer(vec2 fragCoord, float angle, float freq, float weight) {
  float ca   = cos(angle), sa = sin(angle);
  float proj = fragCoord.x * ca + fragCoord.y * sa;
  float t    = abs(fract(proj * freq) - 0.5) * 2.0;
  return smoothstep(weight + 0.3, weight, t);
}

vec4 modeCrosshatch(vec2 fragCoord) {
  float hatchFreq = max(u_p0, 0.001);
  float baseAngle = u_p1;
  float levels    = clamp(u_p2, 1.0, 3.0);
  float weight    = clamp(u_p3, 0.02, 0.48);

  float lum  = bloomLum(fragCoord, 1.0);

  float hatch = 0.0;

  if (lum > 0.05) {
    hatch = max(hatch, hatchLayer(fragCoord, baseAngle, hatchFreq, weight));
  }
  if (lum > 0.40 && levels >= 2.0) {
    hatch = max(hatch, hatchLayer(fragCoord, baseAngle + 1.5708, hatchFreq, weight));
  }
  if (lum > 0.70 && levels >= 3.0) {
    hatch = max(hatch, hatchLayer(fragCoord, baseAngle + 0.7854, hatchFreq * 1.41, weight));
  }

  float alpha = clamp(hatch * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 9: Lego ------------------------------------------------------------
//
// Chunky block grid: filled cell + circular stud + bevel lighting.
// Brighter top-left, darker bottom-right per block/stud face.

vec4 modeLego(vec2 fragCoord) {
  float studSize = max(u_p0, 4.0);
  float bevel    = clamp(u_p1, 0.0, 0.4);
  float gapFrac  = clamp(u_p2, 0.0, 0.45);

  vec2 cellUV = fract(fragCoord / studSize) - 0.5;

  vec2  uv   = fragCoord / u_resolution;
  float dist = length(uv - u_center);
  float lum  = clamp(1.0 - dist * 1.8, 0.0, 1.0);

  float blockHalf = 0.5 - gapFrac;

  // Block SDF (filled square minus gap).
  vec2  bd       = abs(cellUV) - vec2(blockHalf);
  float blockSDF = max(bd.x, bd.y);
  float blockMask = smoothstep(0.02, -0.01, blockSDF);

  // Circular stud (38% of block half-size radius).
  float studR    = blockHalf * 0.38;
  float studMask = smoothstep(0.01, -0.01, length(cellUV) - studR);

  // Bevel lighting: bright top-left, dark bottom-right.
  float bevelDir = (-cellUV.x + cellUV.y) / max(blockHalf, 0.001);
  float bevelLit = 1.0 + bevel * bevelDir;

  float blockVal = blockMask * clamp(bevelLit, 0.4, 2.0);
  float studVal  = studMask * clamp(bevelLit + bevel, 0.4, 2.0);
  float combined = clamp(max(blockVal, studVal), 0.0, 1.5);

  float alpha = clamp(combined * lum * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 10: Phyllotaxis -----------------------------------------------------
//
// Vogel/golden-angle spiral of dots ("sunflower seed head"). Inverts the
// spiral formula r(n) = spacing*sqrt(n) to estimate the nearest index for a
// given radius, then searches a small fixed window of neighboring indices to
// find the true nearest spiral point. Dot radius scales with bloomLum, so
// the spiral fills in near u_center and thins out toward the edge.

vec4 modePhyllotaxis(vec2 fragCoord) {
  float spacing  = max(u_p0, 2.0);
  float dotScale = clamp(u_p1, 0.05, 1.0);
  float rotate   = u_p2;
  float jitter   = clamp(u_p3, 0.0, 1.0);
  float contrast = clamp(u_p4, 0.5, 3.0);

  const float GOLDEN_ANGLE = 2.399963;

  vec2  centered = fragCoord - u_center * u_resolution;
  float r        = length(centered);

  float nEst = r / spacing;
  nEst = nEst * nEst;

  float bestDist = 1e6;

  for (int i = -4; i <= 4; i++) {
    float n  = max(nEst + float(i), 0.0);
    float pr = spacing * sqrt(n);
    float pa = n * GOLDEN_ANGLE + rotate;
    vec2  pt = vec2(cos(pa), sin(pa)) * pr;

    vec2 jOff = (vec2(hash21(vec2(n, 1.0)), hash21(vec2(n, 2.0))) - 0.5)
      * jitter * spacing;
    pt += jOff;

    bestDist = min(bestDist, length(centered - pt));
  }

  float lum      = bloomLum(fragCoord, contrast);
  float dotR     = dotScale * spacing * 0.5 * lum;
  float feather  = max(spacing * 0.04, 0.75);
  float dot_     = 1.0 - smoothstep(dotR - feather, dotR + feather, bestDist);

  float alpha = clamp(dot_ * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 11: Julia set orbit-trap field --------------------------------------
//
// Escape-time Julia iteration (z = z^2 + c) with a modest iteration count,
// blended against an orbit-trap (min |z|^2 seen during iteration) field and
// posterized into 2-3 tone levels so it reads as abstract texture rather
// than a fractal poster. Modulated by bloomLum like the other modes.

vec4 modeJulia(vec2 fragCoord) {
  float cRe     = u_p0;
  float cIm     = u_p1;
  float zoom    = max(u_p2, 0.1);
  float levels  = clamp(u_p3, 2.0, 3.0);
  float trapMix = clamp(u_p4, 0.0, 1.0);
  float contrast = clamp(u_p5, 0.5, 3.0);

  float viewScale = min(u_resolution.x, u_resolution.y) * 0.15;
  vec2  uv = (fragCoord - u_center * u_resolution) / (viewScale * zoom);

  vec2 z = uv;
  vec2 c = vec2(cRe, cIm);
  float trap = 1e6;
  int   iter = 0;

  const int MAX_ITER = 48;
  for (int i = 0; i < MAX_ITER; i++) {
    if (dot(z, z) > 4.0) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    trap = min(trap, dot(z, z));
    iter++;
  }

  float escapeVal = float(iter) / float(MAX_ITER);
  float trapVal   = clamp(1.0 - sqrt(trap) * 0.7, 0.0, 1.0);
  float val       = mix(escapeVal, trapVal, trapMix);

  float lum = bloomLum(fragCoord, contrast);
  val *= lum;

  float q     = floor(val * levels) / max(levels - 1.0, 1.0);
  float alpha = clamp(q * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 12: Lightning -------------------------------------------------------
//
// Ridged fbm (1 - |2*noise-1|) sharpened into thin bright threads, with a
// domain warp so filaments branch instead of running parallel. Sampled in a
// polar-ish domain (angle x radius) so filaments radiate outward from
// u_center. u_time drives a subtle flicker; at flickerSpeed=0 this is an
// exact static frame.

float lightningRidge(vec2 p) {
  return 1.0 - abs(vnoise(p) * 2.0 - 1.0);
}

float lightningRidgedFbm(vec2 p) {
  float v    = 0.0;
  float amp  = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 3; i++) {
    v    += amp * lightningRidge(p * freq);
    amp  *= 0.5;
    freq *= 2.2;
  }
  return v;
}

vec4 modeLightning(vec2 fragCoord) {
  float density      = max(u_p0, 0.5);
  float warp         = clamp(u_p1, 0.0, 2.0);
  float thickness    = clamp(u_p2, 0.02, 0.3);
  float flickerSpeed = max(u_p3, 0.0);
  float contrast     = clamp(u_p4, 0.5, 4.0);

  vec2  centered = fragCoord - u_center * u_resolution;
  float r        = length(centered);
  float ang      = atan(centered.y, centered.x);
  float t        = u_time * flickerSpeed;

  vec2 p = vec2(ang * 2.0, r * 0.02) * density;

  vec2 warpOffset = vec2(
    fbm(p * 0.5 + t * 0.1),
    fbm(p * 0.5 + vec2(5.2, 1.3) + t * 0.1)
  );
  p += warp * (warpOffset - 0.5) * 2.0;

  float bolt = lightningRidgedFbm(p);
  bolt = pow(clamp(bolt, 0.0, 1.0), 1.0 / max(thickness * 10.0, 0.5));

  float lum   = bloomLum(fragCoord, contrast);
  float alpha = clamp(bolt * lum * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 13: Web --------------------------------------------------------------
//
// Spider web in polar coordinates: N radial spokes plus concentric threads
// that sag between spokes (ring radius offset by a cosine of the sector
// angle) with per-thread hash jitter. Thin anti-aliased lines via
// smoothstep on distance.

vec4 modeWeb(vec2 fragCoord) {
  float spokes      = max(floor(u_p0), 3.0);
  float ringSpacing = max(u_p1, 4.0);
  float sag         = clamp(u_p2, 0.0, 0.5);
  float jitter      = clamp(u_p3, 0.0, 1.0);
  float threadWidth = clamp(u_p4, 0.5, 4.0);

  vec2  centered = fragCoord - u_center * u_resolution;
  float r        = length(centered);
  float ang      = atan(centered.y, centered.x);

  float sector     = (ang / 6.28318) * spokes;
  float sectorFrac = fract(sector) - 0.5;
  float distToSpoke = abs(sectorFrac) * (6.28318 * max(r, 1.0) / spokes);
  float spokeLine  = 1.0 - smoothstep(threadWidth * 0.5, threadWidth * 0.5 + 1.5, distToSpoke);

  float sectorAngle  = (floor(sector) + 0.5) * (6.28318 / spokes);
  float sagOffset    = sag * ringSpacing * cos((ang - sectorAngle) * spokes);
  float jitterOffset = (hash21(vec2(floor(r / ringSpacing), floor(sector))) - 0.5)
    * jitter * ringSpacing * 0.3;

  float ringR      = r - sagOffset - jitterOffset;
  float ringMod    = mod(ringR, ringSpacing);
  float distToRing = min(ringMod, ringSpacing - ringMod);
  float ringLine   = 1.0 - smoothstep(threadWidth * 0.5, threadWidth * 0.5 + 1.5, distToRing);

  float web = max(spokeLine, ringLine);
  float lum = bloomLum(fragCoord, 1.4);

  float alpha = clamp(web * lum * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Mode 14: Coral ------------------------------------------------------------
//
// Domain-warped Worley (cellular) noise thresholded so bloomLum controls how
// far the growth has "spread" from center \u2014 dense organic mass near center,
// dissolving into scattered fragments at the edge. worleyF1 returns distance
// to the nearest feature point in a 3x3 neighborhood search.

float worleyF1(vec2 p) {
  vec2  i = floor(p);
  vec2  f = fract(p);
  float minDist = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = vec2(
        hash21(i + neighbor),
        hash21(i + neighbor + vec2(37.1, 91.7))
      );
      vec2 diff = neighbor + point - f;
      minDist = min(minDist, length(diff));
    }
  }
  return minDist;
}

vec4 modeCoral(vec2 fragCoord) {
  float scale     = max(u_p0, 0.5);
  float warp      = clamp(u_p1, 0.0, 2.0);
  float threshold = clamp(u_p2, 0.0, 1.0);
  float detail    = clamp(u_p3, 0.0, 1.0);
  float contrast  = clamp(u_p4, 0.5, 4.0);

  vec2 uv = fragCoord / u_resolution * scale;

  vec2 warpOffset = vec2(fbm(uv * 1.5), fbm(uv * 1.5 + vec2(4.2, 2.1)));
  vec2 warped = uv + warp * (warpOffset - 0.5) * 2.0;

  float cellCoarse = worleyF1(warped * (4.0 + detail * 8.0));
  float cellFine   = worleyF1(warped * (12.0 + detail * 16.0));
  float pattern    = mix(cellCoarse, cellFine, 0.35);

  float lum    = bloomLum(fragCoord, contrast);
  float spread = threshold + lum * (1.0 - threshold);

  float mass  = 1.0 - smoothstep(spread - 0.08, spread, pattern);
  float alpha = clamp(mass * lum * u_opacity, 0.0, 1.0);
  return vec4(u_color0 * alpha, alpha);
}

// -- Main --------------------------------------------------------------------

void main() {
  vec2 fragCoord = gl_FragCoord.xy;

  if (u_mode == 1) {
    outColor = modeLED(fragCoord);
  } else if (u_mode == 2) {
    outColor = modeConcentric(fragCoord);
  } else if (u_mode == 3) {
    outColor = modeFlow(fragCoord);
  } else if (u_mode == 4) {
    outColor = modeBayer(fragCoord);
  } else if (u_mode == 5) {
    outColor = modeHalftone(fragCoord);
  } else if (u_mode == 6) {
    outColor = modeBlueNoise(fragCoord);
  } else if (u_mode == 7) {
    outColor = modeScanlines(fragCoord);
  } else if (u_mode == 8) {
    outColor = modeCrosshatch(fragCoord);
  } else if (u_mode == 9) {
    outColor = modeLego(fragCoord);
  } else if (u_mode == 10) {
    outColor = modePhyllotaxis(fragCoord);
  } else if (u_mode == 11) {
    outColor = modeJulia(fragCoord);
  } else if (u_mode == 12) {
    outColor = modeLightning(fragCoord);
  } else if (u_mode == 13) {
    outColor = modeWeb(fragCoord);
  } else if (u_mode == 14) {
    outColor = modeCoral(fragCoord);
  } else {
    // Mode 0 (css): fully transparent. WebGL canvas is a no-op.
    outColor = vec4(0.0);
  }
}
`;

  // src/texture-shader/color.ts
  function hexToRgb01(hex) {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    ];
  }

  // src/texture-shader/texture-webgl-renderer.ts
  var LED_FALLOFF_NOOP_RADIUS = 1e6;
  var SHAPE_FALLOFF_NOOP_PX = 1e6;
  var POINTER_NOOP = {
    pos: [0, 0],
    pressure: 0,
    radiusPx: 100,
    maxLift: 0
  };
  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Failed to create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? "unknown";
      gl.deleteShader(shader);
      throw new Error(`Texture shader compile error: ${log}`);
    }
    return shader;
  }
  function createProgram(gl) {
    const vert = compileShader(gl, gl.VERTEX_SHADER, TEXTURE_VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, TEXTURE_FRAG);
    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create WebGL program");
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? "unknown";
      gl.deleteProgram(program);
      throw new Error(`Texture program link error: ${log}`);
    }
    return program;
  }
  function createTextureWebGLRenderer(canvas, options = {}) {
    const {
      color0: initColor0 = "#1a1610",
      color1: initColor1 = "#a4441f",
      center: initCenter = [0.5, 0.5],
      opacity: initOpacity = 1
    } = options;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!gl) return null;
    let program;
    try {
      program = createProgram(gl);
    } catch {
      return null;
    }
    gl.useProgram(program);
    const posLoc = gl.getAttribLocation(program, "a_pos");
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    const loc = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      center: gl.getUniformLocation(program, "u_center"),
      radius: gl.getUniformLocation(program, "u_radius"),
      // deprecated, unused
      shapeMode: gl.getUniformLocation(program, "u_shapeMode"),
      shapeHalf: gl.getUniformLocation(program, "u_shapeHalf"),
      shapeRadius: gl.getUniformLocation(program, "u_shapeRadius"),
      shapeFalloff: gl.getUniformLocation(program, "u_shapeFalloff"),
      mode: gl.getUniformLocation(program, "u_mode"),
      p: [0, 1, 2, 3, 4, 5, 6, 7].map(
        (i) => gl.getUniformLocation(program, `u_p${i}`)
      ),
      color0: gl.getUniformLocation(program, "u_color0"),
      color1: gl.getUniformLocation(program, "u_color1"),
      time: gl.getUniformLocation(program, "u_time"),
      opacity: gl.getUniformLocation(program, "u_opacity"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      pressure: gl.getUniformLocation(program, "u_pressure"),
      pressureRadius: gl.getUniformLocation(program, "u_pressureRadius"),
      pressureMaxLift: gl.getUniformLocation(program, "u_pressureMaxLift")
    };
    let width = 0;
    let height = 0;
    let rafId = 0;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return {
      resize(w, h) {
        if (w === width && h === height) return;
        width = w;
        height = h;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      },
      draw(opts) {
        const {
          mode,
          params,
          time = 0,
          color0: drawColor0,
          color1: drawColor1,
          opacity: drawOpacity,
          center: drawCenter,
          radius: drawRadius,
          shape: drawShape,
          pointer: drawPointer
        } = opts;
        const c0 = hexToRgb01(drawColor0 ?? initColor0);
        const c1 = hexToRgb01(drawColor1 ?? initColor1);
        const op = drawOpacity ?? initOpacity;
        const cx = drawCenter ?? initCenter;
        const shape = drawShape ?? {
          mode: 0,
          half: [width / 2, height / 2],
          radius: 0,
          falloffPx: SHAPE_FALLOFF_NOOP_PX
        };
        const pointer = drawPointer ?? POINTER_NOOP;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(loc.resolution, width, height);
        gl.uniform2f(loc.center, cx[0], cx[1]);
        gl.uniform1f(loc.radius, drawRadius ?? LED_FALLOFF_NOOP_RADIUS);
        gl.uniform1i(loc.shapeMode, shape.mode);
        gl.uniform2f(loc.shapeHalf, shape.half[0], shape.half[1]);
        gl.uniform1f(loc.shapeRadius, shape.radius);
        gl.uniform1f(loc.shapeFalloff, shape.falloffPx);
        gl.uniform1i(loc.mode, mode);
        for (let i = 0; i < 8; i++) {
          gl.uniform1f(loc.p[i], params[i] ?? 0);
        }
        gl.uniform3fv(loc.color0, c0);
        gl.uniform3fv(loc.color1, c1);
        gl.uniform1f(loc.time, time);
        gl.uniform1f(loc.opacity, op);
        gl.uniform2f(loc.pointer, pointer.pos[0], pointer.pos[1]);
        gl.uniform1f(loc.pressure, pointer.pressure);
        gl.uniform1f(loc.pressureRadius, Math.max(pointer.radiusPx, 1));
        gl.uniform1f(loc.pressureMaxLift, pointer.maxLift);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      startLoop(onFrame) {
        const tick = (now) => {
          onFrame(now / 1e3);
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      },
      stopLoop() {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      destroy() {
        this.stopLoop();
        gl.deleteBuffer(buf);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
      }
    };
  }

  // src/samples/index.ts
  var DISC_SAMPLE = {
    id: "disc",
    label: "Disc",
    description: "Shipped identity-disc default \u2014 circle, light theme, LED texture.",
    shape: "circle",
    theme: "light",
    params: {}
  };
  var SHEET_SAMPLE = {
    id: "sheet",
    label: "Sheet",
    description: "Shipped contact-sheet default \u2014 rounded-rect, light theme, LED texture.",
    shape: "roundedRect",
    theme: "light",
    params: {}
  };
  var HALFTONE_SAMPLE = {
    id: "halftone",
    label: "Halftone",
    description: "Disc surface, dark theme, mode swapped to halftone dot-grid.",
    shape: "circle",
    theme: "dark",
    params: {
      [textureModeKey("disc", "dark")]: "halftone"
    }
  };
  var SURFACE_FX_SAMPLES = [
    DISC_SAMPLE,
    SHEET_SAMPLE,
    HALFTONE_SAMPLE
  ];
  var SURFACE_FX_SAMPLE_IDS = SURFACE_FX_SAMPLES.map((s) => s.id);
  function getSurfaceFxSample(id) {
    return SURFACE_FX_SAMPLES.find((s) => s.id === id);
  }

  // scripts/surface-fx-ui/stage-entry.ts
  var REGISTRY = {
    ...TEXTURE_TUNING_REGISTRY,
    ...BLOOM_TUNING_REGISTRY,
    ...FEED_HOVER_REGISTRY
  };
  function defaultsRecord() {
    const out = {};
    for (const key of Object.keys(REGISTRY)) {
      out[key] = REGISTRY[key].default;
    }
    return out;
  }
  var paramValues = defaultsRecord();
  var listeners = /* @__PURE__ */ new Set();
  function notify() {
    listeners.forEach((fn) => fn());
  }
  function clampAgainstSpec(spec, value) {
    if (spec.kind === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return {
          ok: false,
          error: `Parameter "${spec.key}" expects a finite number.`
        };
      }
      let v = value;
      if (spec.min !== void 0) v = Math.max(spec.min, v);
      if (spec.max !== void 0) v = Math.min(spec.max, v);
      return { ok: true, value: v };
    }
    if (spec.kind === "boolean") {
      if (typeof value !== "boolean") {
        return { ok: false, error: `Parameter "${spec.key}" expects a boolean.` };
      }
      return { ok: true, value };
    }
    if (typeof value !== "string") {
      return { ok: false, error: `Parameter "${spec.key}" expects a string.` };
    }
    if (spec.kind === "enum" && spec.options && !spec.options.includes(value)) {
      return {
        ok: false,
        error: `Parameter "${spec.key}" must be one of: ${spec.options.join(", ")}`
      };
    }
    return { ok: true, value };
  }
  function getValue(key) {
    return paramValues[key];
  }
  function bridgeList() {
    return { specs: Object.values(REGISTRY) };
  }
  function bridgeSnapshot() {
    return {
      params: { ...paramValues },
      updatedAt: Date.now(),
      staleMs: 0,
      connected: true
      // Stage IS the client — always "connected" to itself.
    };
  }
  function bridgeSetSync(key, value) {
    const spec = REGISTRY[key];
    if (!spec) return { ok: false, error: `Unknown parameter key: "${key}"` };
    if (!spec.agentWritable) {
      return { ok: false, error: `Parameter "${key}" is not agent-writable.` };
    }
    const clamped = clampAgainstSpec(spec, value);
    if (!clamped.ok) return { ok: false, error: clamped.error };
    paramValues = { ...paramValues, [key]: clamped.value };
    notify();
    redrawAll();
    return { ok: true, id: "stage", key, clamped: clamped.value, queued: false };
  }
  function bridgeDiff() {
    const changed = [];
    for (const spec of Object.values(REGISTRY)) {
      const current = paramValues[spec.key];
      if (current !== void 0 && current !== spec.default) {
        changed.push({
          key: spec.key,
          current,
          default: spec.default
        });
      }
    }
    return { ok: true, changed };
  }
  function bridgeGet(action, _extra) {
    if (action === "list") return Promise.resolve(bridgeList());
    if (action === "snapshot") return Promise.resolve(bridgeSnapshot());
    return Promise.reject(
      new Error(`Stage bridge: unsupported GET action "${action}".`)
    );
  }
  function bridgeSet(key, value) {
    const result = bridgeSetSync(key, value);
    if (result.ok === false) return Promise.reject(new Error(result.error));
    return Promise.resolve(result);
  }
  var THEME_COLORS = {
    light: { ink: "#1a1610", accent: "#a4441f" },
    dark: { ink: "#f3eee3", accent: "#ff9b48" }
  };
  var THEME_BACKGROUND = {
    light: "#f3eee3",
    dark: "#161412"
  };
  var MODE_TO_INT = {
    css: 0,
    led: 1,
    concentric: 2,
    flow: 3,
    bayer: 4,
    halftone: 5,
    bluenoise: 6,
    scanlines: 7,
    crosshatch: 8,
    lego: 9,
    phyllotaxis: 10,
    julia: 11,
    lightning: 12,
    web: 13,
    coral: 14
  };
  function modeParamFloats(surface, mode, theme) {
    const fields = MODE_FIELD_KEYS[mode];
    if (!fields) return [0, 0, 0, 0, 0, 0, 0, 0];
    const floats = fields.map((field) => {
      const key = textureModeParamKey(surface, mode, field, theme);
      const v = getValue(key);
      return typeof v === "number" ? v : 0;
    });
    while (floats.length < 8) floats.push(0);
    return floats;
  }
  function getEnvelope(surface, theme) {
    const num = (field, fallback) => {
      const v = getValue(textureEnvelopeKey(surface, field, theme));
      return typeof v === "number" ? v : fallback;
    };
    const bool = (field, fallback) => {
      const v = getValue(textureEnvelopeKey(surface, field, theme));
      return typeof v === "boolean" ? v : fallback;
    };
    return {
      reach: num("reach", 192),
      fadeOrigin: num("fadeOrigin", 0.4),
      fadeSoftness: num("fadeSoftness", 50),
      opacity: num("opacity", 0.4),
      innerCutout: num("innerCutout", 24),
      screenBlend: bool("screenBlend", false),
      // Read for parity with the real spec but NOT applied below — see file
      // header "KNOWN STAGE LIMITATION" note. Documented no-op in Stage.
      mobileScale: num("mobileScale", 1)
    };
  }
  function getSurfaceModeAndEnabled(surface, theme) {
    const modeVal = getValue(textureModeKey(surface, theme));
    const enabledVal = getValue(textureEnabledKey(surface, theme));
    return {
      mode: typeof modeVal === "string" ? modeVal : "css",
      enabled: typeof enabledVal === "boolean" ? enabledVal : true
    };
  }
  function bloomNum(field, theme, fallback) {
    const v = getValue(bloomFieldKey(field, theme));
    return typeof v === "number" ? v : fallback;
  }
  var MAX_DPR = 2;
  var CIRCLE_CANVAS_SIZE = 420;
  var RECT_CANVAS_W = 640;
  var RECT_CANVAS_H = 380;
  var currentTheme = "light";
  var currentShape = "circle";
  var backgroundMode = "paper";
  var BACKGROUND_OVERRIDES = {
    white: "#ffffff",
    dark: "#111114",
    checker: "conic-gradient(#d8d8d8 90deg, #f2f2f2 90deg 180deg, #d8d8d8 180deg 270deg, #f2f2f2 270deg) 0 0 / 16px 16px"
  };
  var mounted = false;
  var stageContainer = null;
  var circleWrap;
  var circleCanvas;
  var circleRenderer = null;
  var rectHost;
  var rectProbe;
  var rectCanvas;
  var rectRenderer = null;
  function dpr() {
    return Math.min(window.devicePixelRatio || 1, MAX_DPR);
  }
  function applyStageBackground() {
    if (!stageContainer) return;
    stageContainer.style.background = backgroundMode === "paper" ? THEME_BACKGROUND[currentTheme] : BACKGROUND_OVERRIDES[backgroundMode];
  }
  function buildDom(container) {
    container.innerHTML = "";
    stageContainer = container;
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.width = "100%";
    container.style.height = "100%";
    applyStageBackground();
    circleWrap = document.createElement("div");
    circleWrap.setAttribute("data-stage-shape", "circle");
    circleWrap.style.position = "relative";
    circleWrap.style.width = `${CIRCLE_CANVAS_SIZE}px`;
    circleWrap.style.height = `${CIRCLE_CANVAS_SIZE}px`;
    circleCanvas = document.createElement("canvas");
    circleCanvas.style.position = "absolute";
    circleCanvas.style.inset = "0";
    circleCanvas.style.width = "100%";
    circleCanvas.style.height = "100%";
    circleWrap.appendChild(circleCanvas);
    rectHost = document.createElement("div");
    rectHost.setAttribute("data-stage-shape", "roundedRect");
    rectHost.style.position = "relative";
    rectHost.style.width = `${RECT_CANVAS_W}px`;
    rectHost.style.height = `${RECT_CANVAS_H}px`;
    rectHost.style.display = "flex";
    rectHost.style.alignItems = "center";
    rectHost.style.justifyContent = "center";
    rectProbe = document.createElement("div");
    rectProbe.style.width = "280px";
    rectProbe.style.height = "160px";
    rectProbe.style.visibility = "hidden";
    rectProbe.style.pointerEvents = "none";
    rectCanvas = document.createElement("canvas");
    rectCanvas.style.position = "absolute";
    rectCanvas.style.inset = "0";
    rectCanvas.style.width = "100%";
    rectCanvas.style.height = "100%";
    rectHost.appendChild(rectProbe);
    rectHost.appendChild(rectCanvas);
    container.appendChild(circleWrap);
    container.appendChild(rectHost);
    circleRenderer = createTextureWebGLRenderer(circleCanvas);
    rectRenderer = createTextureWebGLRenderer(rectCanvas);
    applyShapeVisibility();
  }
  function applyShapeVisibility() {
    if (!circleWrap || !rectHost) return;
    circleWrap.style.display = currentShape === "circle" ? "block" : "none";
    rectHost.style.display = currentShape === "roundedRect" ? "flex" : "none";
  }
  function resizeCanvas(canvas, renderer, cssW, cssH) {
    if (!renderer) return;
    const d = dpr();
    renderer.resize(Math.round(cssW * d), Math.round(cssH * d));
  }
  function drawCircle() {
    if (!circleRenderer) return;
    const theme = currentTheme;
    const env = getEnvelope("disc", theme);
    const { mode, enabled } = getSurfaceModeAndEnabled("disc", theme);
    const colors = THEME_COLORS[theme];
    resizeCanvas(
      circleCanvas,
      circleRenderer,
      CIRCLE_CANVAS_SIZE,
      CIRCLE_CANVAS_SIZE
    );
    const innerFadeEnd = env.innerCutout + env.fadeSoftness;
    const solidEnd = env.reach * env.fadeOrigin;
    const maskCss = `radial-gradient(circle at 50% 50%, transparent 0px, transparent ${env.innerCutout}px, rgba(0,0,0,1) ${innerFadeEnd}px, rgba(0,0,0,1) ${solidEnd}px, transparent ${env.reach}px)`;
    circleWrap.style.maskImage = maskCss;
    circleWrap.style.webkitMaskImage = maskCss;
    circleWrap.style.opacity = String(env.opacity);
    circleWrap.style.mixBlendMode = env.screenBlend ? "screen" : "normal";
    if (!enabled || mode === "css") {
      circleRenderer.draw({
        mode: 0,
        params: [0, 0, 0, 0, 0, 0, 0, 0],
        center: [0.5, 0.5]
      });
      return;
    }
    circleRenderer.draw({
      mode: MODE_TO_INT[mode] ?? 0,
      params: modeParamFloats("disc", mode, theme),
      color0: colors.ink,
      color1: colors.accent,
      opacity: 1,
      // envelope opacity is a WRAPPER CSS opacity, not u_opacity — mirrors FloatingIdentity.tsx exactly.
      center: [0.5, 0.5]
    });
  }
  function drawRect() {
    if (!rectRenderer) return;
    const theme = currentTheme;
    const { mode, enabled } = getSurfaceModeAndEnabled("sheet", theme);
    const env = getEnvelope("sheet", theme);
    const colors = THEME_COLORS[theme];
    resizeCanvas(rectCanvas, rectRenderer, RECT_CANVAS_W, RECT_CANVAS_H);
    rectHost.style.maskImage = "none";
    rectHost.style.webkitMaskImage = "none";
    if (!enabled || mode === "css") {
      rectRenderer.draw({
        mode: 0,
        params: [0, 0, 0, 0, 0, 0, 0, 0],
        center: [0.5, 0.5]
      });
      return;
    }
    const cornerR = bloomNum("sheetRadius", theme, 32);
    const cornerFollow = bloomNum("ditherShadowCornerFollow", theme, 1);
    const spreadPx = bloomNum("ditherShadowSpreadPx", theme, 56);
    const falloffSoftness = bloomNum("ditherShadowFalloffSoftness", theme, 45);
    const edgeDensity = bloomNum("ditherShadowEdgeDensity", theme, 0.85);
    const softness01 = Math.min(1, Math.max(0, falloffSoftness / 100));
    const falloffPx = Math.max(spreadPx * (0.5 + softness01), 1);
    const geo = rectToGeometry(rectProbe, { mode: "live", cornerR });
    const shapeUniforms = buildShapeUniforms(geo, cornerFollow, falloffPx);
    const canvasRect = rectCanvas.getBoundingClientRect();
    const cxFrac = canvasRect.width > 0 ? (geo.cx - canvasRect.left) / canvasRect.width : 0.5;
    const cyFrac = canvasRect.height > 0 ? 1 - (geo.cy - canvasRect.top) / canvasRect.height : 0.5;
    rectRenderer.draw({
      mode: MODE_TO_INT[mode] ?? 0,
      params: modeParamFloats("sheet", mode, theme),
      color0: colors.ink,
      color1: colors.accent,
      // Resting-frame opacity: mirrors ContactSheet.tsx's reduced-motion
      // branch (sEnv.opacity * ditherShadowEdgeDensity) — Stage has no
      // open/close bloom animation to drive collapseProgress (out of
      // scope — see NOT YET IN STAGE note).
      opacity: env.opacity * edgeDensity,
      center: [cxFrac, cyFrac],
      // shapeUniforms is already in DEVICE px (buildShapeUniforms applies
      // geo.dpr internally) — the renderer's `shape` option wants device px
      // directly, same convention TextureShaderCanvas.tsx uses after ITS OWN
      // dpr multiply.
      shape: {
        mode: 1,
        half: shapeUniforms.shapeHalf,
        radius: shapeUniforms.shapeRadius,
        falloffPx: shapeUniforms.shapeFalloff
      }
    });
  }
  function redrawAll() {
    if (!mounted) return;
    drawCircle();
    drawRect();
  }
  var currentSampleId = null;
  function applySample(id) {
    const sample = getSurfaceFxSample(id);
    if (!sample) return null;
    paramValues = {
      ...defaultsRecord(),
      ...sample.params
    };
    currentShape = sample.shape;
    currentTheme = sample.theme;
    currentSampleId = sample.id;
    applyShapeVisibility();
    applyStageBackground();
    redrawAll();
    return { shape: sample.shape, theme: sample.theme };
  }
  var api = {
    bridgeGet,
    bridgeSet,
    diff: bridgeDiff,
    mount(container) {
      buildDom(container);
      mounted = true;
      if (!currentSampleId) applySample("disc");
      redrawAll();
      window.addEventListener("resize", redrawAll);
    },
    setTheme(theme) {
      currentTheme = theme;
      applyStageBackground();
      redrawAll();
    },
    setShape(shape) {
      currentShape = shape;
      applyShapeVisibility();
      redrawAll();
    },
    setBackground(mode) {
      backgroundMode = mode;
      applyStageBackground();
    },
    resize: redrawAll,
    destroy() {
      mounted = false;
      window.removeEventListener("resize", redrawAll);
      circleRenderer?.destroy();
      rectRenderer?.destroy();
      circleRenderer = null;
      rectRenderer = null;
    },
    samples: SURFACE_FX_SAMPLES.map(({ id, label, description }) => ({
      id,
      label,
      description
    })),
    loadSample: applySample,
    ripple: { rippleEnvelope, RIPPLE_PROGRESS_EASE }
  };
  window.SurfaceFxStage = api;
})();
