/**
 * createAgentFace — a pure data layer over a (registry, store) pair.
 *
 * Exposes the same schema the React hooks and dev tuning panel use, shaped
 * for a non-React caller (an MCP server or CLI, wired in a later unit). No
 * server, no transport — just list/get/set against the registry and store.
 */

import type { ParamSpec } from "./param";
import type { ParamRegistry } from "./registry";
import type { ParamValue, SchemaStore } from "./store";

export interface AgentSetResult {
  ok: boolean;
  clamped?: ParamValue;
  error?: string;
}

/** One param whose live value has drifted from its registry-baked default. */
export interface AgentDiffEntry {
  key: string;
  current: ParamValue;
  default: ParamValue;
}

export interface AgentDiffResult {
  ok: true;
  changed: AgentDiffEntry[];
}

export interface AgentFace {
  /** All params in the registry — for an agent to discover what's tunable. */
  list(): ParamSpec<unknown>[];
  /** Current value for `key`, or undefined if the key isn't registered. */
  get(key: string): ParamValue | undefined;
  /**
   * Validate + clamp `value` against `key`'s spec and write it via the store.
   * Refuses keys that don't exist, aren't agentWritable, or fail kind validation.
   */
  set(key: string, value: ParamValue): AgentSetResult;
  /**
   * Params whose current store value differs from the registry's baked
   * default — the token-lean read for "what has changed so far", instead of
   * an agent paying for every param in `list()` just to spot a handful of
   * deviations.
   */
  diff(): AgentDiffResult;
}

export function createAgentFace(
  registry: ParamRegistry,
  store: SchemaStore,
): AgentFace {
  function list(): ParamSpec<unknown>[] {
    return Object.values(registry);
  }

  function get(key: string): ParamValue | undefined {
    if (!Object.prototype.hasOwnProperty.call(registry, key)) return undefined;
    return store.snapshot()[key];
  }

  function set(key: string, value: ParamValue): AgentSetResult {
    const spec = registry[key];
    if (!spec) {
      return { ok: false, error: `Unknown parameter key: "${key}"` };
    }
    if (!spec.agentWritable) {
      return { ok: false, error: `Parameter "${key}" is not agent-writable.` };
    }

    if (spec.kind === "number" && typeof value !== "number") {
      return { ok: false, error: `Parameter "${key}" expects a number.` };
    }
    if (spec.kind === "boolean" && typeof value !== "boolean") {
      return { ok: false, error: `Parameter "${key}" expects a boolean.` };
    }
    if (
      (spec.kind === "enum" || spec.kind === "color") &&
      typeof value !== "string"
    ) {
      return { ok: false, error: `Parameter "${key}" expects a string.` };
    }
    if (
      spec.kind === "enum" &&
      spec.options &&
      !spec.options.includes(value as string)
    ) {
      return {
        ok: false,
        error: `Parameter "${key}" must be one of: ${spec.options.join(", ")}`,
      };
    }

    // The store itself refuses writes outside development (see schema/store.ts's
    // setValue gate, which checks this exact same condition). Mirror it here
    // so a caller gets an honest refusal instead of a misleading ok:true for
    // a write that silently never happened.
    if (process.env.NODE_ENV !== "development") {
      return { ok: false, error: "read-only outside development" };
    }

    store.setValue(key, value);
    return { ok: true, clamped: store.snapshot()[key] };
  }

  function diff(): AgentDiffResult {
    // Reads are allowed everywhere (mirrors list/get) — in production the
    // store's snapshot is always the frozen registry defaults, so diff()
    // naturally reports no changes rather than needing a separate gate.
    const current = store.snapshot();
    const changed: AgentDiffEntry[] = [];
    for (const spec of Object.values(registry)) {
      const value = current[spec.key];
      if (value === undefined) continue;
      if (value !== spec.default) {
        changed.push({ key: spec.key, current: value, default: spec.default as ParamValue });
      }
    }
    return { ok: true, changed };
  }

  return { list, get, set, diff };
}
