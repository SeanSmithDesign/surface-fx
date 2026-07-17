import { afterEach, describe, expect, it, vi } from "vitest";
import { defineRegistry, SHEET_SHADOW_PARAMS } from "../schema/registry";
import { createSchemaStore } from "../schema/store";
import { createAgentFace } from "../schema/agent";
import type { ParamSpec } from "../schema/param";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("defineRegistry", () => {
  it("throws on duplicate keys", () => {
    const specs: ParamSpec[] = [
      {
        key: "dup.value",
        group: "dup",
        label: "A",
        kind: "number",
        default: 1,
        min: 0,
        max: 10,
        reducedMotionSafe: true,
        agentWritable: true,
        describe: "first",
      },
      {
        key: "dup.value",
        group: "dup",
        label: "B",
        kind: "number",
        default: 2,
        min: 0,
        max: 10,
        reducedMotionSafe: true,
        agentWritable: true,
        describe: "second",
      },
    ];
    expect(() => defineRegistry(specs)).toThrow(/duplicate param key/);
  });

  it("throws when an enum spec is missing options", () => {
    const specs: ParamSpec<string>[] = [
      {
        key: "enum.missing",
        group: "enum",
        label: "Missing",
        kind: "enum",
        default: "a",
        reducedMotionSafe: true,
        agentWritable: true,
        describe: "enum with no options",
      },
    ];
    expect(() => defineRegistry(specs)).toThrow(/requires a non-empty options/);
  });

  it("throws when a number spec has min > max", () => {
    const specs: ParamSpec[] = [
      {
        key: "num.badrange",
        group: "num",
        label: "Bad Range",
        kind: "number",
        default: 5,
        min: 10,
        max: 0,
        reducedMotionSafe: true,
        agentWritable: true,
        describe: "min greater than max",
      },
    ];
    expect(() => defineRegistry(specs)).toThrow(/min .* greater than max/);
  });

  it("builds a valid registry for the seeded sheet.shadow group", () => {
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    expect(Object.keys(registry)).toHaveLength(4);
    expect(registry["sheet.shadow.spreadPx"].default).toBe(56);
  });
});

describe("createSchemaStore", () => {
  it("clamps out-of-range number writes to [min, max] in dev mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-schema-clamp");

    store.setValue("sheet.shadow.spreadPx", 9999);
    expect(store.snapshot()["sheet.shadow.spreadPx"]).toBe(200);

    store.setValue("sheet.shadow.spreadPx", -50);
    expect(store.snapshot()["sheet.shadow.spreadPx"]).toBe(0);

    store.setValue("sheet.shadow.edgeDensity", 5);
    expect(store.snapshot()["sheet.shadow.edgeDensity"]).toBe(1);
  });

  it("is a no-op for setValue outside development (prod-mode)", () => {
    vi.stubEnv("NODE_ENV", "production");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-schema-prod-noop");

    const before = store.snapshot();
    store.setValue("sheet.shadow.spreadPx", 12);
    const after = store.snapshot();

    expect(after).toBe(before); // same frozen reference — write never applied
    expect(after["sheet.shadow.spreadPx"]).toBe(56); // still the registry default
  });

  it("returns a stable snapshot reference until a value actually changes", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-schema-stability");

    const first = store.snapshot();
    const second = store.snapshot();
    expect(second).toBe(first); // no writes in between — same reference

    store.setValue("sheet.shadow.falloffSoftness", 10);
    const third = store.snapshot();
    expect(third).not.toBe(first); // a real change mints a new reference

    const fourth = store.snapshot();
    expect(fourth).toBe(third); // stable again post-write
  });

  it("setValue is a no-op when the new value equals the current value", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-schema-noop-same");

    const before = store.snapshot();
    store.setValue("sheet.shadow.spreadPx", 56); // equals the default
    const after = store.snapshot();
    expect(after).toBe(before);
  });

  it("ignores writes to unknown keys", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-schema-unknown-key");

    const before = store.snapshot();
    store.setValue("not.a.real.key", 42);
    const after = store.snapshot();
    expect(after).toBe(before);
    expect(after["not.a.real.key"]).toBeUndefined();
  });

  it("falls back to the default when a boolean-kind write receives a non-boolean value", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry([
      {
        key: "bool.flag",
        group: "bool",
        label: "Flag",
        kind: "boolean",
        default: true,
        reducedMotionSafe: true,
        agentWritable: true,
        describe: "a boolean param",
      },
    ]);
    const store = createSchemaStore(registry, "test-schema-clamp-boolean");

    // A corrupted localStorage entry (or a bad agent write) supplying the
    // wrong JS type must NOT flow through into the snapshot verbatim.
    store.setValue("bool.flag", "yes" as unknown as boolean);
    expect(store.snapshot()["bool.flag"]).toBe(true); // falls back to default

    store.setValue("bool.flag", false); // a real boolean still writes through
    expect(store.snapshot()["bool.flag"]).toBe(false);
  });

  it("falls back to the default when a color-kind write receives a non-string value", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry([
      {
        key: "color.ink",
        group: "color",
        label: "Ink",
        kind: "color",
        default: "#111111",
        reducedMotionSafe: true,
        agentWritable: true,
        describe: "a color param",
      },
    ]);
    const store = createSchemaStore(registry, "test-schema-clamp-color");

    store.setValue("color.ink", 123456 as unknown as string);
    expect(store.snapshot()["color.ink"]).toBe("#111111"); // falls back to default

    store.setValue("color.ink", "#ff0000"); // a real string still writes through
    expect(store.snapshot()["color.ink"]).toBe("#ff0000");
  });
});

describe("createAgentFace", () => {
  it("list() returns every registered spec", () => {
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-agent-list");
    const agent = createAgentFace(registry, store);
    expect(agent.list()).toHaveLength(4);
    expect(agent.list().map((s) => s.key)).toContain("sheet.shadow.cornerFollow");
  });

  it("refuses to set a param with agentWritable: false", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry([
      {
        key: "agent.locked",
        group: "agent",
        label: "Locked",
        kind: "number",
        default: 5,
        min: 0,
        max: 10,
        reducedMotionSafe: true,
        agentWritable: false,
        describe: "not writable by an agent",
      },
    ]);
    const store = createSchemaStore(registry, "test-agent-refusal");
    const agent = createAgentFace(registry, store);

    const result = agent.set("agent.locked", 9);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not agent-writable/);
    expect(store.snapshot()["agent.locked"]).toBe(5); // unchanged
  });

  it("validates + clamps a writable param and reports the clamped value", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-agent-clamp");
    const agent = createAgentFace(registry, store);

    const result = agent.set("sheet.shadow.spreadPx", 500);
    expect(result.ok).toBe(true);
    expect(result.clamped).toBe(200);
    expect(store.snapshot()["sheet.shadow.spreadPx"]).toBe(200);
  });

  it("refuses an unknown key", () => {
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-agent-unknown");
    const agent = createAgentFace(registry, store);

    const result = agent.set("not.a.real.key", 1);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown parameter key/);
  });

  it("refuses a value of the wrong kind", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-agent-wrong-kind");
    const agent = createAgentFace(registry, store);

    const result = agent.set("sheet.shadow.spreadPx", "not-a-number" as unknown as number);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/expects a number/);
  });

  it("get() returns the live store value", () => {
    vi.stubEnv("NODE_ENV", "development");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-agent-get");
    const agent = createAgentFace(registry, store);

    expect(agent.get("sheet.shadow.edgeDensity")).toBe(0.85);
    store.setValue("sheet.shadow.edgeDensity", 0.5);
    expect(agent.get("sheet.shadow.edgeDensity")).toBe(0.5);
  });

  it("refuses a write outside development with an honest ok:false, not a misleading ok:true", () => {
    vi.stubEnv("NODE_ENV", "production");
    const registry = defineRegistry(SHEET_SHADOW_PARAMS);
    const store = createSchemaStore(registry, "test-agent-prod-refusal");
    const agent = createAgentFace(registry, store);

    const result = agent.set("sheet.shadow.spreadPx", 120);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("read-only outside development");
    expect(result.clamped).toBeUndefined();
    // The store's own prod gate means the write never actually happened.
    expect(store.snapshot()["sheet.shadow.spreadPx"]).toBe(56);
  });

  describe("diff()", () => {
    it("excludes params still at their registry default", () => {
      const registry = defineRegistry(SHEET_SHADOW_PARAMS);
      const store = createSchemaStore(registry, "test-agent-diff-untouched");
      const agent = createAgentFace(registry, store);

      expect(agent.diff()).toEqual({ ok: true, changed: [] });
    });

    it("includes a deviating number param", () => {
      vi.stubEnv("NODE_ENV", "development");
      const registry = defineRegistry(SHEET_SHADOW_PARAMS);
      const store = createSchemaStore(registry, "test-agent-diff-number");
      const agent = createAgentFace(registry, store);

      store.setValue("sheet.shadow.spreadPx", 80);
      const result = agent.diff();
      expect(result.ok).toBe(true);
      expect(result.changed).toEqual([
        { key: "sheet.shadow.spreadPx", current: 80, default: 56 },
      ]);
    });

    it("includes a deviating boolean param", () => {
      vi.stubEnv("NODE_ENV", "development");
      const registry = defineRegistry([
        {
          key: "bool.flag",
          group: "bool",
          label: "Flag",
          kind: "boolean",
          default: true,
          reducedMotionSafe: true,
          agentWritable: true,
          describe: "a boolean param",
        },
      ]);
      const store = createSchemaStore(registry, "test-agent-diff-boolean");
      const agent = createAgentFace(registry, store);

      store.setValue("bool.flag", false);
      expect(agent.diff().changed).toEqual([
        { key: "bool.flag", current: false, default: true },
      ]);
    });

    it("includes a deviating string (color) param", () => {
      vi.stubEnv("NODE_ENV", "development");
      const registry = defineRegistry([
        {
          key: "color.ink",
          group: "color",
          label: "Ink",
          kind: "color",
          default: "#111111",
          reducedMotionSafe: true,
          agentWritable: true,
          describe: "a color param",
        },
      ]);
      const store = createSchemaStore(registry, "test-agent-diff-string");
      const agent = createAgentFace(registry, store);

      store.setValue("color.ink", "#ff0000");
      expect(agent.diff().changed).toEqual([
        { key: "color.ink", current: "#ff0000", default: "#111111" },
      ]);
    });

    it("diffs @light and @dark theme-variant keys independently", () => {
      vi.stubEnv("NODE_ENV", "development");
      const registry = defineRegistry([
        {
          key: "bloom.ditherScale@light",
          group: "bloom",
          label: "Dither Scale (light)",
          kind: "number",
          default: 1,
          min: 0,
          max: 5,
          reducedMotionSafe: true,
          agentWritable: true,
          describe: "light-theme dither scale",
        },
        {
          key: "bloom.ditherScale@dark",
          group: "bloom",
          label: "Dither Scale (dark)",
          kind: "number",
          default: 1,
          min: 0,
          max: 5,
          reducedMotionSafe: true,
          agentWritable: true,
          describe: "dark-theme dither scale",
        },
      ]);
      const store = createSchemaStore(registry, "test-agent-diff-theme-variant");
      const agent = createAgentFace(registry, store);

      // Only the @light variant is changed — @dark stays at its default and
      // must not show up in the diff even though it shares the same base key.
      store.setValue("bloom.ditherScale@light", 2.5);
      expect(agent.diff().changed).toEqual([
        { key: "bloom.ditherScale@light", current: 2.5, default: 1 },
      ]);
    });

    it("returns to an empty diff after resetting a changed value back to its default", () => {
      vi.stubEnv("NODE_ENV", "development");
      const registry = defineRegistry(SHEET_SHADOW_PARAMS);
      const store = createSchemaStore(registry, "test-agent-diff-reset");
      const agent = createAgentFace(registry, store);

      store.setValue("sheet.shadow.spreadPx", 90);
      expect(agent.diff().changed).toHaveLength(1);

      store.setValue("sheet.shadow.spreadPx", 56); // back to default
      expect(agent.diff()).toEqual({ ok: true, changed: [] });
    });
  });
});
