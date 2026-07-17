#!/usr/bin/env node
/**
 * surface-fx-mcp — stdio MCP server fronting the /api/dev/surface-fx
 * dev-only bridge, so an agent can tune the site's surface-fx params
 * (Celestial / texture-tuning / bloom-tuning / feed-hover registries)
 * natively instead of shelling out to scripts/surface-fx.mjs.
 *
 * THIN WRAPPER: this file holds zero schema knowledge of its own. It talks
 * to the same HTTP bridge the CLI talks to (via scripts/lib/surface-fx-client.mjs)
 * and never imports src/lib/surface-fx/ directly — the bridge route is the
 * single source of truth for the param registry.
 *
 * Usage:
 *   node scripts/surface-fx-mcp.mjs [--port 4040]
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  SurfaceFxError,
  apiGet,
  apiPost,
  findSpec,
  clampValue,
  fmtValue,
  rangeOf,
} from "./lib/surface-fx-client.mjs";

const DEFAULT_PORT = 4040;

function parsePort(argv) {
  const idx = argv.indexOf("--port");
  if (idx === -1) return DEFAULT_PORT;
  const value = Number(argv[idx + 1]);
  return Number.isFinite(value) ? value : DEFAULT_PORT;
}

const PORT = parsePort(process.argv.slice(2));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Uniform error → MCP tool-result mapping. Never throws past this boundary
 * — a stdio MCP server that crashes on a dead dev server is unusable. */
function toolError(err) {
  const message =
    err instanceof SurfaceFxError
      ? err.message
      : `unexpected error talking to the surface-fx bridge: ${err instanceof Error ? err.message : String(err)}`;
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

function toolOk(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

async function runTool(fn) {
  try {
    return await fn();
  } catch (err) {
    return toolError(err);
  }
}

const server = new McpServer({ name: "surface-fx", version: "1.0.0" });

// ── surface_fx_diff ─────────────────────────────────────────────────────

server.registerTool(
  "surface_fx_diff",
  {
    title: "surface-fx diff",
    description:
      "Default read for surface-fx params: returns only params whose live value differs from its baked default, plus whether a browser tab is connected to report live values. Token-lean — prefer this over surface_fx_list in loops.",
    inputSchema: {},
  },
  async () =>
    runTool(async () => {
      const [{ specs }, { params, connected }] = await Promise.all([
        apiGet(PORT, "list"),
        apiGet(PORT, "snapshot"),
      ]);

      const changed = [];
      let checked = 0;
      for (const spec of specs) {
        const current = params[spec.key];
        if (current === undefined) continue;
        checked++;
        if (current !== spec.default) {
          changed.push({ key: spec.key, current, default: spec.default });
        }
      }

      return toolOk({ connected, checked, total: specs.length, changed });
    }),
);

// ── surface_fx_get ───────────────────────────────────────────────────────

server.registerTool(
  "surface_fx_get",
  {
    title: "surface-fx get",
    description: "Read one surface-fx param's current value and its spec range (min/max or enum options).",
    inputSchema: { key: z.string().describe("The param key, e.g. \"texture.grain.intensity\".") },
  },
  async ({ key }) =>
    runTool(async () => {
      const { specs } = await apiGet(PORT, "list");
      const spec = findSpec(specs, key);
      const { params, connected } = await apiGet(PORT, "snapshot");
      const current = params[key];

      return toolOk({
        key,
        current: current !== undefined ? current : null,
        connected,
        default: spec.default,
        range: rangeOf(spec),
        describe: spec.describe,
      });
    }),
);

// ── surface_fx_set ───────────────────────────────────────────────────────

server.registerTool(
  "surface_fx_set",
  {
    title: "surface-fx set",
    description:
      "Queue a write to one agent-writable surface-fx param. Validates and clamps against the param's spec, then polls up to 3s for a connected browser tab to apply it. Returns queued=true always, and applied=true only if a live client reflected the change within the poll window.",
    inputSchema: {
      key: z.string().describe("The param key to write."),
      value: z
        .union([z.string(), z.number(), z.boolean()])
        .describe("The new value. Numbers are clamped to the param's min/max."),
    },
  },
  async ({ key, value }) =>
    runTool(async () => {
      const { specs } = await apiGet(PORT, "list");
      const spec = findSpec(specs, key);
      const clamped = clampValue(spec, value);

      const result = await apiPost(PORT, { action: "set", key, value: clamped });
      const queuedValue = result.clamped;

      const deadline = Date.now() + 3000;
      let applied = false;
      let sawConnectedClient = false;
      while (Date.now() < deadline) {
        await sleep(150);
        const snap = await apiGet(PORT, "snapshot");
        if (snap.connected) sawConnectedClient = true;
        if (snap.connected && snap.params[key] === queuedValue) {
          applied = true;
          break;
        }
      }

      let message;
      if (applied) {
        message = `applied: live client now reports ${key} = ${fmtValue(queuedValue)}`;
      } else if (!sawConnectedClient) {
        message =
          "no live client tab is connected — the write is queued and will apply the next time a browser tab with the site open polls the bridge (poll interval 1s).";
      } else {
        message = `timed out after 3s waiting for the live client to reflect ${key} = ${fmtValue(queuedValue)}.`;
      }

      return toolOk({
        key,
        requestedValue: value,
        clampedValue: queuedValue,
        wasClamped: queuedValue !== value,
        queued: true,
        applied,
        connected: sawConnectedClient,
        message,
      });
    }),
);

// ── surface_fx_list ─────────────────────────────────────────────────────

server.registerTool(
  "surface_fx_list",
  {
    title: "surface-fx list",
    description:
      "Full or filtered surface-fx param specs (key, kind, default, range, description, current value). WARNING: unfiltered (no group) returns all ~249 params and can run ~50k tokens — always pass `group` to scope the response, and prefer surface_fx_diff for a token-lean read of just what's changed.",
    inputSchema: {
      group: z
        .string()
        .optional()
        .describe("Filter to params whose key or group starts with this prefix, e.g. \"texture.grain\"."),
    },
  },
  async ({ group }) =>
    runTool(async () => {
      const [{ specs }, { params, connected }] = await Promise.all([
        apiGet(PORT, "list", { group }),
        apiGet(PORT, "snapshot"),
      ]);

      const rows = specs.map((spec) => ({
        key: spec.key,
        current: params[spec.key] !== undefined ? params[spec.key] : null,
        default: spec.default,
        range: rangeOf(spec),
        describe: spec.describe,
        agentWritable: spec.agentWritable,
      }));

      return toolOk({ connected, count: rows.length, specs: rows });
    }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
