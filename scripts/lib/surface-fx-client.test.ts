// @ts-nocheck — surface-fx-client.mjs is untyped JS; the test file calls its
//   exports via a direct import and accesses returned values freely.
/**
 * surface-fx-client.test.ts — unit test for clampValue's boolean-kind
 * coercion. Guards against silently coercing an unexpected value (e.g. the
 * number 1) to `false` instead of throwing.
 */
import { describe, expect, it } from "vitest";
import { clampValue, SurfaceFxError } from "./surface-fx-client.mjs";

describe("clampValue — boolean kind", () => {
  const spec = { key: "test.flag", kind: "boolean" };

  it("passes through a real boolean", () => {
    expect(clampValue(spec, true)).toBe(true);
    expect(clampValue(spec, false)).toBe(false);
  });

  it("accepts the exact strings \"true\" and \"false\"", () => {
    expect(clampValue(spec, "true")).toBe(true);
    expect(clampValue(spec, "false")).toBe(false);
  });

  it("throws SurfaceFxError for a non-boolean value like the number 1, instead of silently coercing to false", () => {
    expect(() => clampValue(spec, 1)).toThrow(SurfaceFxError);
  });
});
