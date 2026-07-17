"use client";

/**
 * createSchemaStore — a generic store factory driven by a ParamRegistry.
 *
 * Replicates the site's shipped tuning-store pattern EXACTLY (see
 * bloom-tuning/store.ts and feed/hover-fx/tuning.ts, the reference
 * implementations this was extracted from):
 *
 *   - Production/SSR: getSnapshot ALWAYS returns a module-level frozen
 *     defaults record, built once from the registry's `default` fields.
 *     localStorage is never read in production, so baked defaults always
 *     ship regardless of any overrides accumulated during dev sessions.
 *   - Development: getSnapshot returns a CACHED resolved record — the same
 *     object reference until a write actually changes a value. A fresh
 *     `{ ...record }` on every call reads to useSyncExternalStore as a
 *     perpetual store change and crashes PRODUCTION with a React #185
 *     infinite re-render loop (invisible in `next dev`, fatal in `next
 *     start`) — see feedback-usesyncexternalstore-uncached-snapshot-prod-crash.md.
 *   - setValue clamps number-kind values to [min, max] and is a no-op
 *     outside NODE_ENV === "development".
 *   - localStorage writes are gated to NODE_ENV === "development" (and to
 *     the presence of `window`, for SSR safety).
 */

import { useSyncExternalStore } from "react";
import type { ParamRegistry } from "./registry";

/** The runtime value shape a schema store deals in, across all ParamSpec kinds. */
export type ParamValue = number | boolean | string;

export type SchemaValueMap = Record<string, ParamValue>;

export interface SchemaStore {
  /** React hook: subscribes to the store and returns the live value for `key`. */
  useValue(key: string): ParamValue | undefined;
  /** Set one param's value (dev only). Clamps, persists, and notifies subscribers. */
  setValue(key: string, value: ParamValue): void;
  /**
   * Set several params in one shot (dev only). Clamps each, persists ONCE,
   * and notifies subscribers ONCE — for callers (e.g. a panel that saves a
   * whole legacy object per keystroke) that would otherwise fire dozens of
   * individual localStorage writes for a single user interaction.
   */
  setMany(values: Record<string, ParamValue>): void;
  /** Current full value map. Stable reference until a value actually changes. */
  snapshot(): SchemaValueMap;
  /** Reset all values back to registry defaults (dev only persistence clear). */
  reset(): void;
  /** Subscribe to store changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

export function createSchemaStore(
  registry: ParamRegistry,
  storageKey: string,
): SchemaStore {
  const keys = Object.keys(registry);

  function defaultsRecord(): SchemaValueMap {
    const out: SchemaValueMap = {};
    for (const key of keys) {
      out[key] = registry[key].default as ParamValue;
    }
    return out;
  }

  // Frozen module-level snapshot — Object.is-stable across every call.
  // Returned verbatim in production/SSR and as the base every resolved
  // dev-mode snapshot merges over.
  const FROZEN_DEFAULTS: SchemaValueMap = Object.freeze(defaultsRecord());

  /** Resolved snapshot cache — a STABLE reference until a write changes a value. */
  let _cache: SchemaValueMap | null = null;
  const _listeners = new Set<() => void>();

  function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
  }

  /** Clamp/validate a candidate value against its spec. Unknown kinds pass through. */
  function clampValue(key: string, value: ParamValue): ParamValue {
    const spec = registry[key];
    if (!spec) return value;

    if (spec.kind === "number" && typeof value === "number") {
      let v = value;
      if (Number.isFinite(v)) {
        if (spec.min !== undefined) v = Math.max(spec.min, v);
        if (spec.max !== undefined) v = Math.min(spec.max, v);
      } else {
        v = spec.default as number;
      }
      return v;
    }

    if (spec.kind === "enum" && typeof value === "string") {
      return spec.options?.includes(value) ? value : (spec.default as ParamValue);
    }

    if (spec.kind === "boolean") {
      return typeof value === "boolean" ? value : (spec.default as ParamValue);
    }

    if (spec.kind === "color") {
      return typeof value === "string" ? value : (spec.default as ParamValue);
    }

    return value;
  }

  function resolveFromStorage(): SchemaValueMap {
    if (typeof window === "undefined") return FROZEN_DEFAULTS;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return FROZEN_DEFAULTS;
      const parsed = JSON.parse(raw);
      if (!isPlainObject(parsed)) return FROZEN_DEFAULTS;

      const merged = defaultsRecord();
      let changed = false;
      for (const key of keys) {
        if (!(key in parsed)) continue;
        const clamped = clampValue(key, parsed[key] as ParamValue);
        if (clamped !== merged[key]) {
          merged[key] = clamped;
          changed = true;
        }
      }
      // No real overrides → return the shared frozen reference (stable identity).
      return changed ? Object.freeze(merged) : FROZEN_DEFAULTS;
    } catch {
      return FROZEN_DEFAULTS;
    }
  }

  function getCache(): SchemaValueMap {
    if (_cache === null) _cache = resolveFromStorage();
    return _cache;
  }

  function persist(map: SchemaValueMap): void {
    // localStorage writes are dev-only, mirroring the shipped stores.
    if (process.env.NODE_ENV !== "development") return;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(map));
    } catch {
      // Storage quota — silently skip.
    }
  }

  function notify(): void {
    _listeners.forEach((listener) => listener());
  }

  /**
   * Client snapshot. In production this is ALWAYS the frozen registry
   * defaults (never reads localStorage), so the baked feel ships unchanged
   * and React's Object.is snapshot comparison stays stable (no #185 loop).
   * In development the cached object reference only changes when a write
   * actually changes a value.
   */
  function getSnapshot(): SchemaValueMap {
    if (process.env.NODE_ENV !== "development") return FROZEN_DEFAULTS;
    return getCache();
  }

  /** Server snapshot — always the frozen defaults (no localStorage on server). */
  function getServerSnapshot(): SchemaValueMap {
    return FROZEN_DEFAULTS;
  }

  function setValue(key: string, value: ParamValue): void {
    if (process.env.NODE_ENV !== "development") return;
    if (!Object.prototype.hasOwnProperty.call(registry, key)) return;

    const clamped = clampValue(key, value);
    const current = getCache();
    if (current[key] === clamped) return; // no real change — keep the stable reference

    const next: SchemaValueMap = { ...current, [key]: clamped };
    _cache = Object.freeze(next);
    persist(_cache);
    notify();
  }

  function setMany(values: SchemaValueMap): void {
    if (process.env.NODE_ENV !== "development") return;
    const current = getCache();
    let changed = false;
    const next: SchemaValueMap = { ...current };
    for (const key of Object.keys(values)) {
      if (!Object.prototype.hasOwnProperty.call(registry, key)) continue;
      const clamped = clampValue(key, values[key]);
      if (next[key] !== clamped) {
        next[key] = clamped;
        changed = true;
      }
    }
    if (!changed) return; // no real change — keep the stable reference
    _cache = Object.freeze(next);
    persist(_cache);
    notify();
  }

  function reset(): void {
    _cache = FROZEN_DEFAULTS;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // no-op
      }
    }
    notify();
  }

  function subscribe(listener: () => void): () => void {
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }

  function useValue(key: string): ParamValue | undefined {
    const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return snap[key];
  }

  return {
    useValue,
    setValue,
    setMany,
    snapshot: getSnapshot,
    reset,
    subscribe,
  };
}
