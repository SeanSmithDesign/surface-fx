/**
 * texture-webgl-renderer.ts
 *
 * Generic WebGL2 renderer for the texture-switcher. Draws ONE full-screen
 * triangle and dispatches to the correct shader branch via u_mode.
 *
 * Static modes (led, concentric): call draw() once, no rAF.
 * Animated modes (flow): call startLoop() / stopLoop() around the rAF.
 *
 * Strict-Mode safe: loseContext() is intentionally OMITTED. Calling
 * loseContext() on cleanup poisons a reused canvas under React Strict Mode's
 * double-invoke pattern (see reference_webgl-react-strictmode-losecontext.md).
 * GPU resources are cleaned up via deleteProgram/deleteBuffer/deleteVertexArray.
 *
 * Returns null when WebGL2 is unavailable — callers fall back to CSS.
 */

import { TEXTURE_VERT, TEXTURE_FRAG } from "./texture-shaders";
import { hexToRgb01 } from "./color";

export type { hexToRgb01 };

export interface TextureRendererOptions {
  /** Hex color for the primary tint (--color-ink). */
  color0?: string;
  /** Hex color for the secondary tint (--color-accent). */
  color1?: string;
  /** UV center of the effect [0,1], default [0.5, 0.5]. */
  center?: [number, number];
  /** Overall layer opacity, 0..1, default 1. */
  opacity?: number;
}

export interface TextureDrawOptions {
  /** u_mode integer (0=css, 1=led, 2=concentric, 3=flow). */
  mode: number;
  /** Ordered param floats for u_p0..u_p7. */
  params: number[];
  /** Elapsed time in seconds (for flow mode). */
  time?: number;
  /** Override color0 hex. */
  color0?: string;
  /** Override color1 hex. */
  color1?: string;
  /** Override opacity. */
  opacity?: number;
  /**
   * UV-space effect center [0,1] with GLSL Y-flip applied by the caller
   * (gl_FragCoord.y counts from the bottom, so flip: y_glsl = 1 - y_css/vpH).
   * Overrides the factory-level initCenter for this draw call.
   */
  center?: [number, number];
  /**
   * DEPRECATED, unused by the shader (superseded by `shape` below). Kept only
   * so existing draw-call plumbing keeps compiling.
   */
  radius?: number;
  /**
   * modeLED's falloff shape (u_shapeMode/u_shapeHalf/u_shapeRadius/
   * u_shapeFalloff), all in DEVICE px. Omit to fall back to shapeMode 0 (the
   * legacy elliptical falloff, byte-identical to main's shipped disc look).
   * Other modes ignore these uniforms.
   */
  shape?: TextureShapeFalloff;
  /**
   * Pointer-pressure uniforms ("material tension" — see pointerField.ts).
   * LED mode only; other modes ignore them. Omit for a harmless no-op
   * (u_pressure=0, which reduces the shader's lift math to an exact
   * identity — see modeLED in texture-shaders.ts).
   */
  pointer?: TexturePointerPressure;
}

/**
 * modeLED's pointer-pressure uniforms, DEVICE px (post-DPR), bottom-origin —
 * same coordinate convention as gl_FragCoord.
 */
export interface TexturePointerPressure {
  /** Pointer position, device px. */
  pos: [number, number];
  /** Smoothed pressure strength, 0..1. */
  pressure: number;
  /** Pressure falloff radius, device px. */
  radiusPx: number;
  /** Peak relative alpha lift at the pointer, 0..1. */
  maxLift: number;
}

/**
 * modeLED's falloff geometry, device px (post-DPR). See u_shapeMode doc in
 * texture-shaders.ts for the mode 0 vs mode 1 semantics.
 */
export interface TextureShapeFalloff {
  /** 0 = legacy elliptical falloff (disc). 1 = rounded-box SDF (sheet). */
  mode: 0 | 1;
  /** Rounded-box half-extents [halfWidth, halfHeight]. Mode 1 only. */
  half: [number, number];
  /** Rounded-box corner radius. Mode 1 only. */
  radius: number;
  /** Penumbra distance beyond the box edge over which brightness fades to 0. Mode 1 only. */
  falloffPx: number;
}

/**
 * LED falloff radius multiplier — see ledFalloffRadiusPx below.
 */
const LED_FALLOFF_REACH_MULTIPLIER = 4;

/**
 * Fallback u_radius (device px) when no caller-supplied radius is given.
 * Large enough that smoothstep never engages, i.e. the LED vignette is a
 * pure no-op and whatever CSS mask clips the canvas does 100% of the shaping.
 */
const LED_FALLOFF_NOOP_RADIUS = 1e6;

/**
 * ledFalloffRadiusPx — derives the LED shader's falloff dead-zone (u_radius)
 * from a surface's own measured/visible mask reach, in CSS px (pre-DPR;
 * TextureShaderCanvas applies the DPR multiply before sending the uniform).
 *
 * @deprecated Superseded by the `shape` draw option: shapeMode 0 reproduces
 * this codebase's original (pre-u_radius) modeLED falloff exactly with no
 * caller-computed radius needed, and shapeMode 1 (rounded-box SDF) replaces
 * the surface-scaling this helper approximated for the contact sheet. Kept
 * only for reference; no caller in this codebase invokes it anymore.
 */
export function ledFalloffRadiusPx(reachPx: number): number {
  return Math.max(reachPx, 1) * LED_FALLOFF_REACH_MULTIPLIER;
}

/**
 * Harmless fallback for u_shapeRadius/u_shapeFalloff when a caller omits
 * `shape` (shapeMode defaults to 0, which never reads them). u_shapeHalf
 * defaults to the current canvas resolution/2 at draw time (see draw() below)
 * so it always holds a sane, non-degenerate value.
 */
const SHAPE_FALLOFF_NOOP_PX = 1e6;

/**
 * Harmless fallback pointer-pressure uniforms when a caller omits `pointer`.
 * pressure=0 makes u_pointer/u_pressureRadius mathematically irrelevant (the
 * shader's `press` term is exactly 0 regardless of their values), but
 * radiusPx must stay > 0 — smoothstep(0, 0, x) is GLSL-undefined and would
 * poison the multiply even though it's scaled by pressure=0.
 */
const POINTER_NOOP: TexturePointerPressure = {
  pos: [0, 0],
  pressure: 0,
  radiusPx: 100,
  maxLift: 0,
};

export type TextureWebGLRenderer = {
  draw: (opts: TextureDrawOptions) => void;
  resize: (width: number, height: number) => void;
  /** Start rAF loop for animated modes. Calls onFrame(time) each tick. */
  startLoop: (onFrame: (time: number) => void) => void;
  /** Stop rAF loop. */
  stopLoop: () => void;
  /** Destroy GPU resources (program, buffers, VAO). Does NOT call loseContext. */
  destroy: () => void;
};

// ── Compile helpers ────────────────────────────────────────────────────────────

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
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

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
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

// ── Factory ────────────────────────────────────────────────────────────────────

export function createTextureWebGLRenderer(
  canvas: HTMLCanvasElement,
  options: TextureRendererOptions = {},
): TextureWebGLRenderer | null {
  const {
    color0: initColor0 = "#1a1610",
    color1: initColor1 = "#a4441f",
    center: initCenter = [0.5, 0.5],
    opacity: initOpacity = 1.0,
  } = options;

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  let program: WebGLProgram;
  try {
    program = createProgram(gl);
  } catch {
    return null;
  }

  gl.useProgram(program);

  // ── Full-screen triangle VAO ─────────────────────────────────────────────────
  const posLoc = gl.getAttribLocation(program, "a_pos");
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // ── Uniform locations ────────────────────────────────────────────────────────
  const loc = {
    resolution: gl.getUniformLocation(program, "u_resolution"),
    center: gl.getUniformLocation(program, "u_center"),
    radius: gl.getUniformLocation(program, "u_radius"), // deprecated, unused
    shapeMode: gl.getUniformLocation(program, "u_shapeMode"),
    shapeHalf: gl.getUniformLocation(program, "u_shapeHalf"),
    shapeRadius: gl.getUniformLocation(program, "u_shapeRadius"),
    shapeFalloff: gl.getUniformLocation(program, "u_shapeFalloff"),
    mode: gl.getUniformLocation(program, "u_mode"),
    p: [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
      gl.getUniformLocation(program, `u_p${i}`),
    ),
    color0: gl.getUniformLocation(program, "u_color0"),
    color1: gl.getUniformLocation(program, "u_color1"),
    time: gl.getUniformLocation(program, "u_time"),
    opacity: gl.getUniformLocation(program, "u_opacity"),
    pointer: gl.getUniformLocation(program, "u_pointer"),
    pressure: gl.getUniformLocation(program, "u_pressure"),
    pressureRadius: gl.getUniformLocation(program, "u_pressureRadius"),
    pressureMaxLift: gl.getUniformLocation(program, "u_pressureMaxLift"),
  };

  // ── Mutable state ────────────────────────────────────────────────────────────
  let width = 0;
  let height = 0;
  let rafId = 0;

  // ── blend setup ─────────────────────────────────────────────────────────────
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return {
    resize(w: number, h: number) {
      if (w === width && h === height) return;
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    },

    draw(opts: TextureDrawOptions) {
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
        pointer: drawPointer,
      } = opts;

      const c0 = hexToRgb01(drawColor0 ?? initColor0);
      const c1 = hexToRgb01(drawColor1 ?? initColor1);
      const op = drawOpacity ?? initOpacity;
      const cx = drawCenter ?? initCenter;
      // Default shapeHalf to the current canvas resolution/2 — a sane,
      // non-degenerate value for shapeMode 0 (which never reads it).
      const shape = drawShape ?? {
        mode: 0 as const,
        half: [width / 2, height / 2] as [number, number],
        radius: 0,
        falloffPx: SHAPE_FALLOFF_NOOP_PX,
      };
      const pointer = drawPointer ?? POINTER_NOOP;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(loc.resolution, width, height);
      gl.uniform2f(loc.center, cx[0], cx[1]);
      gl.uniform1f(loc.radius, drawRadius ?? LED_FALLOFF_NOOP_RADIUS); // deprecated, unused
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

    startLoop(onFrame: (time: number) => void) {
      const tick = (now: number) => {
        onFrame(now / 1000);
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
      // loseContext() intentionally omitted — see file-level JSDoc.
    },
  };
}
