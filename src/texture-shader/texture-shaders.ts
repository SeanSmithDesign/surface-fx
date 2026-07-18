/**
 * texture-shaders.ts — WebGL2 GLSL source strings for the texture-switcher.
 *
 * ONE mega fragment shader keyed on `uniform int u_mode`:
 *   0 = css         — returns vec4(0) (transparent, no-op)
 *   1 = led         — LED dot-matrix with radial brightness falloff
 *   2 = concentric  — concentric halftone dot rings
 *   3 = flow        — domain-warped fbm noise field (uses u_time)
 *   4 = bayer       — ordered Bayer-matrix dithering (crisp 2-level stipple)
 *   5 = halftone    — luminance-scaled circular dots on an angled grid
 *   6 = bluenoise   — IGN-threshold of the radial field (no visible grid)
 *   7 = scanlines   — horizontal sin modulation with optional roll (u_time)
 *   8 = crosshatch  — luminance → layered angled hatch line sets
 *   9 = lego        — chunky block grid with circular stud + bevel lighting
 *
 * Uniforms (all modes):
 *   u_resolution   vec2   canvas size in device px (already DPR-scaled)
 *   u_center       vec2   effect center in UV [0,1] (default 0.5, 0.5)
 *   u_radius       float  DEPRECATED, unused. Superseded by u_shapeMode/
 *                         u_shapeHalf/u_shapeRadius/u_shapeFalloff below.
 *                         Left in place only so existing draw-call plumbing
 *                         keeps compiling.
 *   u_shapeMode    int    selects modeLED's falloff geometry (see shapeFalloff
 *                         below): 0 = legacy elliptical falloff tuned for the
 *                         small identity disc (byte-identical to the falloff
 *                         this codebase shipped before the surface-fx system),
 *                         1 = rounded-box SDF falloff sized to a measured
 *                         rectangular surface (the contact sheet). Default 0.
 *   u_shapeHalf    vec2   rounded-box half-extents [halfW, halfH], device px.
 *                         Mode 1 only.
 *   u_shapeRadius  float  rounded-box corner radius, device px. Mode 1 only.
 *   u_shapeFalloff float  penumbra distance beyond the shape's edge over which
 *                         brightness fades to 0, device px. Mode 1 only.
 *   u_mode         int    selects the active shader branch
 *   u_p0..u_p7    float  per-mode parameter bag (see below)
 *   u_color0       vec3   primary color (from --color-ink)
 *   u_color1       vec3   secondary/accent color (from --color-accent)
 *   u_time         float  seconds elapsed (animated modes)
 *   u_opacity      float  overall layer opacity
 *   u_pointer          vec2   pointer position, device px, same coordinate
 *                             convention as gl_FragCoord (bottom-origin,
 *                             post-DPR) — LED mode only.
 *   u_pressure         float  smoothed pointer pressure, 0..1 — LED mode only.
 *                             At 0 (default/rest) the LED lift math below is
 *                             an exact no-op.
 *   u_pressureRadius   float  pressure falloff radius, device px — LED mode
 *                             only. "Material tension": local alpha lifts up
 *                             to u_pressureMaxLift under the pointer,
 *                             smoothstep falloff to 0 at this radius. Dots
 *                             never move — see
 *                             src/lib/surface-fx/ripple/pointerField.ts.
 *   u_pressureMaxLift  float  peak relative alpha lift at the pointer (e.g.
 *                             0.35 = 35% brighter), 0..1 — LED mode only.
 *                             Caller-supplied so the maxLift dial (see
 *                             SHEET_POINTER_MAX_LIFT in ContactSheet.tsx)
 *                             actually reaches the shader.
 *
 * LED (mode 1) params:
 *   u_p0 = cellSize (CSS px, default 12)
 *   u_p1 = gap      (CSS px between cells, default 2)
 *   u_p2 = glow     (bleed beyond cell, 0..1, default 0.6)
 *   u_p3 = colorMix (0 = color0 only, 1 = color1 only)
 *
 * Concentric (mode 2) params:
 *   u_p0 = ringSpacing   (CSS px between rings, default 20)
 *   u_p1 = dotScale      (dot radius fraction of half-spacing, default 0.7)
 *   u_p2 = centerFalloff (luminance exponent, default 2.0)
 *   u_p3 = contrast      (multiplier, default 1.4)
 *
 * Flow (mode 3) params:
 *   u_p0 = speed       (animation rate, default 0.3)
 *   u_p1 = warpAmount  (domain warp strength, default 0.4)
 *   u_p2 = scale       (noise spatial frequency, default 3.0)
 *
 * Bayer (mode 4) params:
 *   u_p0 = matrixSize  (4 or 8, default 4)
 *   u_p1 = levels      (quantization levels 1..8, default 3)
 *   u_p2 = contrast    (luminance multiplier, default 2.0)
 *
 * Halftone (mode 5) params:
 *   u_p0 = cellSize  (grid cell size in CSS px, default 10)
 *   u_p1 = dotMax    (max dot radius as fraction of half-cell 0..1, default 0.9)
 *   u_p2 = angle     (grid rotation in radians, default 0.524 = 30 deg)
 *   u_p3 = contrast  (luminance multiplier, default 1.8)
 *
 * BlueNoise (mode 6) params:
 *   u_p0 = scale     (spatial frequency of IGN threshold, default 2.0)
 *   u_p1 = levels    (quantization levels, default 3)
 *   u_p2 = contrast  (luminance multiplier, default 1.8)
 *
 * Scanlines (mode 7) params — ANIMATED (uses u_time):
 *   u_p0 = lineFreq   (lines per pixel, default 0.15)
 *   u_p1 = lineDepth  (modulation depth 0..1, default 0.7)
 *   u_p2 = rollSpeed  (vertical roll in px/second, default 20; 0 = static)
 *   u_p3 = curvature  (CRT barrel distortion 0..1, default 0.3)
 *
 * Crosshatch (mode 8) params:
 *   u_p0 = hatchFreq  (lines per pixel, default 0.05)
 *   u_p1 = angle      (base angle in radians, default 0.785 = 45 deg)
 *   u_p2 = levels     (hatch layer count 1..3, default 3)
 *   u_p3 = weight     (line half-thickness fraction 0..0.5, default 0.15)
 *
 * Lego (mode 9) params:
 *   u_p0 = studSize  (block cell size in CSS px, default 18)
 *   u_p1 = bevel     (bevel strength 0..0.4, default 0.2)
 *   u_p2 = gap       (inter-block gap as fraction 0..0.45, default 0.1)
 */

/** Standard fullscreen-triangle vertex shader. */
export const TEXTURE_VERT = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/** Mega fragment shader — all modes in one compile. */
export const TEXTURE_FRAG = `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2  u_resolution;
uniform vec2  u_center;
uniform float u_radius; // deprecated, unused — see u_shapeMode below
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
uniform vec2  u_pointer;        // device px, bottom-origin — LED-only pointer pressure
uniform float u_pressure;       // 0..1, smoothed pointer strength — LED-only
uniform float u_pressureRadius; // device px — LED-only pressure falloff radius
uniform float u_pressureMaxLift; // 0..1, peak relative alpha lift — LED-only

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
//       the disc's shipped look) — the identity disc always uses this branch.
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
  // pressing on grain. Dots never move — only brightness responds. The
  // falloff is the same smoothstep curve as pressureAt() in
  // src/lib/surface-fx/ripple/pointerField.ts. At u_pressure=0 (default/
  // rest) press is exactly 0, so alpha * (1.0 + 0.0) is an exact no-op —
  // byte-identical to the pre-pointer render. u_pressureMaxLift is the
  // caller's actual peak lift (see SHEET_POINTER_MAX_LIFT) — NOT a
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
// to radial luminance — classic newspaper-halftone look.

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
  } else {
    // Mode 0 (css): fully transparent. WebGL canvas is a no-op.
    outColor = vec4(0.0);
  }
}
`;
