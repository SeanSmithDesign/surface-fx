/**
 * surface-fx-client — zero-dependency HTTP client for the dev-only
 * /api/dev/surface-fx relay (src/app/api/dev/surface-fx/route.ts).
 *
 * Extracted from scripts/surface-fx.mjs's command bodies so a second agent
 * face (scripts/surface-fx-mcp.mjs) can share the same network calls,
 * spec-lookup, and value-clamp logic instead of duplicating the schema
 * rules. scripts/surface-fx.mjs itself is NOT rewired to import this
 * module this pass — its shipped command bodies stay byte-identical.
 *
 * Plain Node (global fetch, Node >=18). No dependencies.
 */

export class SurfaceFxError extends Error {}

export function baseUrl(port) {
  return `http://localhost:${port}/api/dev/surface-fx`;
}

export async function apiGet(port, action, extraParams = {}) {
  const url = new URL(baseUrl(port));
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(extraParams)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new SurfaceFxError(
      `Could not reach the dev server at ${url.origin}. Is \`npm run dev\` running on port ${port}? (${err.message})`,
    );
  }
  if (res.status === 404) {
    throw new SurfaceFxError(
      "surface-fx bridge route returned 404 — either this is a production build (the route is dev-only) or the dev server isn't running the branch that ships it. Run against `next dev`.",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new SurfaceFxError(`GET ?action=${action} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function apiPost(port, body) {
  const url = baseUrl(port);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new SurfaceFxError(
      `Could not reach the dev server at ${url}. Is \`npm run dev\` running on port ${port}? (${err.message})`,
    );
  }
  if (res.status === 404) {
    throw new SurfaceFxError(
      "surface-fx bridge route returned 404 — either this is a production build (the route is dev-only) or the dev server isn't running the branch that ships it. Run against `next dev`.",
    );
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new SurfaceFxError(json.error || `POST "${body.action}" failed: ${res.status}`);
  }
  return json;
}

/** Find a param's spec by key in a `list`-action specs array, or throw. */
export function findSpec(specs, key) {
  const spec = specs.find((s) => s.key === key);
  if (!spec) throw new SurfaceFxError(`Unknown key: "${key}"`);
  return spec;
}

/**
 * Coerce a raw value to its spec-declared type and clamp numbers to
 * spec.min/max — mirroring the bridge route's own clampAgainstSpec
 * (src/app/api/dev/surface-fx/route.ts) so callers get an actionable error
 * or a clamped value before POSTing. The bridge re-validates and re-clamps
 * server-side regardless; this is a client-side mirror, not a replacement.
 */
export function clampValue(spec, rawValue) {
  if (spec.kind === "number") {
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new SurfaceFxError(`"${rawValue}" is not a valid number for "${spec.key}".`);
    }
    let clamped = value;
    if (spec.min !== undefined) clamped = Math.max(spec.min, clamped);
    if (spec.max !== undefined) clamped = Math.min(spec.max, clamped);
    return clamped;
  }

  if (spec.kind === "boolean") {
    if (typeof rawValue === "boolean") return rawValue;
    if (rawValue === "true") return true;
    if (rawValue === "false") return false;
    throw new SurfaceFxError(
      `"${rawValue}" is not a valid boolean for "${spec.key}". Use true or false.`,
    );
  }

  // enum | color — both string-shaped.
  const value = String(rawValue);
  if (spec.kind === "enum" && spec.options && !spec.options.includes(value)) {
    throw new SurfaceFxError(
      `Parameter "${spec.key}" must be one of: ${spec.options.join(", ")}`,
    );
  }
  return value;
}

export function fmtValue(v) {
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

export function rangeOf(spec) {
  if (spec.kind === "number") return `${spec.min ?? "-"}..${spec.max ?? "-"}`;
  if (spec.kind === "enum" && spec.options) return spec.options.join("|");
  return "-";
}
