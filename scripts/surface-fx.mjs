#!/usr/bin/env node
/**
 * surface-fx CLI — agent-side face for the /api/dev/surface-fx relay.
 *
 * Talks to a running `next dev` server's dev-only bridge route so an agent
 * (this CLI, or a future MCP wrapper fronting the same HTTP calls) can read
 * and write the same surface-fx ParamRegistry a human dials in the browser
 * via the Celestial / texture-tuning / bloom-tuning dev panels.
 *
 * Zero dependencies — plain Node (global fetch, Node >=18). stdout is
 * designed to be read by an agent: stable column-aligned text, one
 * fact per line, no spinners, no ANSI color codes.
 *
 * Usage:
 *   node scripts/surface-fx.mjs list [--group <prefix>] [--port 3000]
 *   node scripts/surface-fx.mjs get <key> [--port 3000]
 *   node scripts/surface-fx.mjs set <key> <value> [--port 3000]
 *   node scripts/surface-fx.mjs watch [--group <prefix>] [--port 3000]
 *   node scripts/surface-fx.mjs diff [--group <prefix>] [--port 3000] [--json]
 */

const DEFAULT_PORT = 3000;

class CliError extends Error {}

function parseArgs(argv) {
  const args = { _: [], port: DEFAULT_PORT, group: undefined, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--port") {
      args.port = Number(argv[++i]);
      continue;
    }
    if (a === "--group") {
      args.group = argv[++i];
      continue;
    }
    if (a === "--ui-port") {
      // Forwarded to surface-fx-ui.mjs via process.argv on `ui`; unused by
      // every other command.
      args.uiPort = Number(argv[++i]);
      continue;
    }
    if (a === "--json") {
      args.json = true;
      continue;
    }
    args._.push(a);
  }
  return args;
}

function baseUrl(port) {
  return `http://localhost:${port}/api/dev/surface-fx`;
}

async function apiGet(port, action, extraParams = {}) {
  const url = new URL(baseUrl(port));
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(extraParams)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new CliError(
      `Could not reach the dev server at ${url.origin}. Is \`npm run dev\` running on port ${port}? (${err.message})`,
    );
  }
  if (res.status === 404) {
    throw new CliError(
      "surface-fx bridge route returned 404 — either this is a production build (the route is dev-only) or the dev server isn't running the branch that ships it. Run against `next dev`.",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new CliError(`GET ?action=${action} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function apiPost(port, body) {
  const url = baseUrl(port);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new CliError(
      `Could not reach the dev server at ${url}. Is \`npm run dev\` running on port ${port}? (${err.message})`,
    );
  }
  if (res.status === 404) {
    throw new CliError(
      "surface-fx bridge route returned 404 — either this is a production build (the route is dev-only) or the dev server isn't running the branch that ships it. Run against `next dev`.",
    );
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new CliError(json.error || `POST "${body.action}" failed: ${res.status}`);
  }
  return json;
}

function fmtValue(v) {
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function printTable(rows, headers) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)),
  );
  const line = (cells) => cells.map((c, i) => String(c ?? "").padEnd(widths[i])).join("  ");
  console.log(line(headers));
  console.log(line(widths.map((w) => "-".repeat(w))));
  for (const r of rows) console.log(line(r));
}

function rangeOf(spec) {
  if (spec.kind === "number") return `${spec.min ?? "-"}..${spec.max ?? "-"}`;
  if (spec.kind === "enum" && spec.options) return spec.options.join("|");
  return "-";
}

// ── Commands ─────────────────────────────────────────────────────────────

async function cmdList(port, group) {
  const [{ specs }, { params, connected }] = await Promise.all([
    apiGet(port, "list", { group }),
    apiGet(port, "snapshot"),
  ]);

  if (specs.length === 0) {
    console.log(group ? `No params matching group "${group}".` : "No params registered.");
    return;
  }

  const rows = specs.map((spec) => [
    spec.key,
    params[spec.key] !== undefined ? fmtValue(params[spec.key]) : "(no client)",
    fmtValue(spec.default),
    rangeOf(spec),
    spec.describe,
  ]);
  printTable(rows, ["key", "current", "default", "range", "describe"]);
  console.log(`\n${specs.length} param(s).${connected ? "" : " (no live client tab connected — \"current\" is stale/absent)"}`);
}

async function cmdGet(port, key) {
  if (!key) throw new CliError("Usage: surface-fx get <key>");
  const { specs } = await apiGet(port, "list");
  const spec = specs.find((s) => s.key === key);
  if (!spec) throw new CliError(`Unknown key: "${key}"`);

  const { params, connected } = await apiGet(port, "snapshot");
  const current = params[key];
  console.log(
    `${key} = ${current !== undefined ? fmtValue(current) : "(no client connected)"}  (default ${fmtValue(spec.default)}, range ${rangeOf(spec)})`,
  );
  if (!connected) {
    console.log("warning: no live client tab is connected (or its last report is stale).");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cmdSet(port, key, rawValue) {
  if (!key || rawValue === undefined) throw new CliError("Usage: surface-fx set <key> <value>");
  const { specs } = await apiGet(port, "list");
  const spec = specs.find((s) => s.key === key);
  if (!spec) throw new CliError(`Unknown key: "${key}"`);

  let value;
  if (spec.kind === "number") {
    value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new CliError(`"${rawValue}" is not a valid number for "${key}".`);
    }
  } else if (spec.kind === "boolean") {
    value = rawValue === "true";
  } else {
    value = rawValue;
  }

  const result = await apiPost(port, { action: "set", key, value });
  const clamped = result.clamped;
  console.log(
    `queued: ${key} = ${fmtValue(clamped)}${clamped !== value ? ` (clamped from ${fmtValue(value)})` : ""}`,
  );

  // Poll snapshot until a live client reflects the write, or 3s timeout.
  const deadline = Date.now() + 3000;
  let applied = false;
  let sawConnectedClient = false;
  while (Date.now() < deadline) {
    await sleep(150);
    const snap = await apiGet(port, "snapshot");
    if (snap.connected) sawConnectedClient = true;
    if (snap.params[key] === clamped) {
      applied = true;
      break;
    }
  }

  if (applied) {
    console.log(`applied: live client now reports ${key} = ${fmtValue(clamped)}`);
  } else if (!sawConnectedClient) {
    console.log(
      "no live client tab is connected — the write is queued and will apply the next time a browser tab with the site open polls the bridge (poll interval 1s).",
    );
  } else {
    console.log(`timed out after 3s waiting for the live client to reflect ${key} = ${fmtValue(clamped)}.`);
  }
}

async function cmdWatch(port, group) {
  console.log(`watching${group ? ` group "${group}"` : " all params"} on port ${port} — Ctrl+C to stop`);
  let last = null;
  for (;;) {
    const { params, connected } = await apiGet(port, "snapshot");
    const keys = group ? Object.keys(params).filter((k) => k.startsWith(group)) : Object.keys(params);
    if (last === null && !connected) {
      console.log("(no live client tab connected yet — waiting)");
    }
    for (const key of keys) {
      const value = params[key];
      if (last === null || last[key] !== value) {
        console.log(`${new Date().toISOString()}  ${key} = ${fmtValue(value)}`);
      }
    }
    last = params;
    await sleep(1000);
  }
}

async function cmdDiff(port, group, json) {
  const [{ specs }, { params, connected }] = await Promise.all([
    apiGet(port, "list", { group }),
    apiGet(port, "snapshot"),
  ]);

  const changed = [];
  let checked = 0;
  for (const spec of specs) {
    const current = params[spec.key];
    if (current === undefined) continue;
    checked++;
    // Values pass through the same clamp on both sides (spec default vs.
    // live store value), so exact equality is sufficient — no epsilon.
    if (current !== spec.default) {
      changed.push({ key: spec.key, current, default: spec.default });
    }
  }

  if (json) {
    console.log(JSON.stringify({ connected, checked, changed }));
    return;
  }

  if (changed.length === 0) {
    console.log(`no changes — all params at baked defaults (${checked} checked)`);
  } else {
    for (const c of changed) {
      console.log(`${c.key} = ${fmtValue(c.current)} (default ${fmtValue(c.default)})`);
    }
  }
  if (!connected) {
    console.log("warning: no live client tab is connected (or its last report is stale).");
  } else if (checked < specs.length) {
    console.log(`(${specs.length - checked} params not reported by client — not compared)`);
  }
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node scripts/surface-fx.mjs list [--group <prefix>] [--port 3000]",
      "  node scripts/surface-fx.mjs get <key> [--port 3000]",
      "  node scripts/surface-fx.mjs set <key> <value> [--port 3000]",
      "  node scripts/surface-fx.mjs watch [--group <prefix>] [--port 3000]",
      "  node scripts/surface-fx.mjs diff [--group <prefix>] [--port 3000] [--json]",
      "  node scripts/surface-fx.mjs ui [--port 3000] [--ui-port 4041]",
    ].join("\n"),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [cmd, a1, a2] = args._;

  try {
    switch (cmd) {
      case "list":
        await cmdList(args.port, args.group);
        break;
      case "get":
        await cmdGet(args.port, a1);
        break;
      case "set":
        await cmdSet(args.port, a1, a2);
        break;
      case "watch":
        await cmdWatch(args.port, args.group);
        break;
      case "diff":
        await cmdDiff(args.port, args.group, args.json);
        break;
      case "ui":
        // surface-fx-ui.mjs reads --port/--ui-port from process.argv itself
        // and starts its own server on import (no args to forward here).
        await import("./surface-fx-ui.mjs");
        break;
      default:
        printUsage();
        process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    if (err instanceof CliError) {
      console.error(`error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

main();
