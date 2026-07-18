#!/usr/bin/env node
/**
 * build-standalone.mjs — bundles stage-entry.ts (which itself imports the
 * browser-relevant parts of src/lib/surface-fx/ and src/lib/texture-shader/
 * — see that file's header comment for exactly what's pulled in) into a
 * single committed browser bundle: scripts/surface-fx-ui/standalone.js.
 *
 * WHY THE OUTPUT IS COMMITTED: the playground (scripts/surface-fx-ui.mjs) is
 * a zero-dependency static-file + proxy server with no build step at request
 * time — standalone.js is a versioned dev-tool artifact, like a vendored
 * library, not a build output regenerated per-request. Re-run this script
 * whenever src/lib/surface-fx/**, src/lib/texture-shader/**, or
 * stage-entry.ts changes in a way that should reach the playground's Stage
 * mode.
 *
 * Usage:
 *   node scripts/surface-fx-ui/build-standalone.mjs
 */

import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(__dirname, "stage-entry.ts");
const outfile = path.join(__dirname, "standalone.js");

async function main() {
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: "iife",
    target: "es2020",
    platform: "browser",
    sourcemap: false,
    minify: false,
    legalComments: "none",
    banner: {
      js:
        "// GENERATED FILE — built from scripts/surface-fx-ui/stage-entry.ts by\n" +
        "// scripts/surface-fx-ui/build-standalone.mjs. Do not hand-edit; re-run the\n" +
        "// build script instead. Committed as a versioned dev-tool artifact — the\n" +
        "// playground stays zero-dependency at runtime (no build step per request).",
    },
  });
  console.log(`surface-fx-ui: built ${path.relative(process.cwd(), outfile)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
