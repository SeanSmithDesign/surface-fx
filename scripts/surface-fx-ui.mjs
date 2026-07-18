#!/usr/bin/env node
/**
 * surface-fx-ui — standalone playground server for the surface-fx dev bridge
 * (src/app/api/dev/surface-fx/route.ts).
 *
 * Zero dependencies — plain Node `http` (Node >=18, global fetch). Serves one
 * self-contained HTML page (scripts/surface-fx-ui/playground.html) and
 * proxies /bridge requests server-side to the real dev site's bridge route.
 * The browser only ever talks to this tool's own origin — no CORS handling,
 * no changes to the Next route.
 *
 * The playground page renders controls from the LIVE schema (GET
 * /bridge?action=list) and drives the real dev site in an iframe; the
 * iframe's own SurfaceFxBridge (mounted by the site itself while `next dev`
 * is running) drains queued writes and applies them. This server never
 * touches the schema or the site — it is a thin proxy + static file server.
 *
 * Usage:
 *   node scripts/surface-fx-ui.mjs [--port 4040] [--ui-port 4041]
 *   node scripts/surface-fx.mjs ui [--port 4040] [--ui-port 4041]   (alias)
 */

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, "surface-fx-ui", "playground.html");
const STANDALONE_JS_PATH = path.join(__dirname, "surface-fx-ui", "standalone.js");

const DEFAULT_DEV_PORT = 4040;
const DEFAULT_UI_PORT = 4041;

function parseArgs(argv) {
  const args = { port: DEFAULT_DEV_PORT, uiPort: DEFAULT_UI_PORT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--port") {
      args.port = Number(argv[++i]);
      continue;
    }
    if (a === "--ui-port") {
      args.uiPort = Number(argv[++i]);
      continue;
    }
  }
  return args;
}

function isValidPort(n) {
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1 && n <= 65535;
}

function bridgeBase(devPort) {
  return `http://localhost:${devPort}/api/dev/surface-fx`;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      resolve(raw.length > 0 ? raw : undefined);
    });
    req.on("error", reject);
  });
}

/**
 * Proxies GET/POST /bridge?... straight through to the real dev server's
 * /api/dev/surface-fx route. Node-side fetch — the browser never makes a
 * cross-origin request.
 */
async function proxyBridge(req, res, devPort) {
  const incoming = new URL(req.url, "http://localhost");
  const target = new URL(bridgeBase(devPort));
  target.search = incoming.search;

  const body = req.method === "POST" ? await readRequestBody(req) : undefined;

  let upstream;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body,
    });
  } catch (err) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: false,
        error: `Could not reach the dev server at ${target.origin} — is the dev server running? bridge is dev-only. (${err.message})`,
      }),
    );
    return;
  }

  if (upstream.status === 404) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: false,
        error:
          "surface-fx bridge returned 404 — is the dev server running? bridge is dev-only (production builds 404 this route; make sure --port points at a `next dev` process).",
      }),
    );
    return;
  }

  const text = await upstream.text();
  res.writeHead(upstream.status, { "content-type": "application/json" });
  res.end(text);
}

async function serveHtml(res, devPort) {
  let html;
  try {
    html = await readFile(HTML_PATH, "utf8");
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(`Could not read playground.html: ${err.message}`);
    return;
  }
  html = html.replace("__DEV_PORT__", String(devPort));
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

/**
 * Serves the committed Stage-mode bundle (scripts/surface-fx-ui/standalone.js
 * — see scripts/surface-fx-ui/build-standalone.mjs). Static file, no proxy,
 * no build step — same "thin proxy + static file server" contract as
 * serveHtml above.
 */
async function serveStandaloneJs(res) {
  let js;
  try {
    js = await readFile(STANDALONE_JS_PATH, "utf8");
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(
      `Could not read standalone.js: ${err.message} — run ` +
        `"node scripts/surface-fx-ui/build-standalone.mjs" to generate it.`,
    );
    return;
  }
  res.writeHead(200, { "content-type": "application/javascript; charset=utf-8" });
  res.end(js);
}

function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${cmd} ${JSON.stringify(url)}`, () => {
    // Best-effort — headless/CI environments may not have a browser to open.
  });
}

async function main() {
  const { port: devPort, uiPort } = parseArgs(process.argv.slice(2));

  if (!isValidPort(devPort) || !isValidPort(uiPort)) {
    console.error(
      `surface-fx-ui: invalid port — --port and --ui-port must be integers between 1 and 65535 (got --port=${devPort}, --ui-port=${uiPort}).`,
    );
    process.exit(1);
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/bridge") {
      await proxyBridge(req, res, devPort);
      return;
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      await serveHtml(res, devPort);
      return;
    }
    if (url.pathname === "/standalone.js") {
      await serveStandaloneJs(res);
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(uiPort, "127.0.0.1", () => {
    const url = `http://localhost:${uiPort}/`;
    console.log(`surface-fx playground running at ${url}`);
    console.log(`  proxying /bridge -> ${bridgeBase(devPort)}`);
    console.log(`  driving dev site  -> http://localhost:${devPort}/`);
    openBrowser(url);
  });
}

main();
