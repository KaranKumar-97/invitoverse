#!/usr/bin/env node
/**
 * Gzipped first-load JS per route (layouts + page), from a production build.
 * Usage: node scripts/bundle-report.mjs [distDir=.next] [--json]
 * Budgets: docs/01-prd.md §7 (NFR-3), docs/09 §7 (home ≤ 150 KB), guest pages ≤ 180 KB.
 */
import { readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const dist = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : ".next";
const manifest = JSON.parse(readFileSync(path.join(dist, "app-build-manifest.json"), "utf8")).pages;
const cache = new Map();
const gz = (f) => {
  if (!cache.has(f)) {
    const p = path.join(dist, f);
    cache.set(f, existsSync(p) ? gzipSync(readFileSync(p)).length : 0);
  }
  return cache.get(f);
};

/** Layout chain for a page key, e.g. "/(invite)/i/[slug]/page" → root + group layouts. */
function layoutsFor(page) {
  const parts = page
    .replace(/\/page$/, "")
    .split("/")
    .filter(Boolean);
  const keys = ["/layout"];
  for (let i = 1; i <= parts.length; i++) keys.push(`/${parts.slice(0, i).join("/")}/layout`);
  return keys.filter((k) => manifest[k]);
}

const BUDGETS = [
  [/^\/\(marketing\)\/page$/, 150],
  [/^\/\(invite\)\//, 180],
];

const rows = Object.keys(manifest)
  .filter((k) => k.endsWith("/page"))
  .map((page) => {
    const files = new Set(
      [...layoutsFor(page), page].flatMap((k) => manifest[k]).filter((f) => f.endsWith(".js")),
    );
    const kb = [...files].reduce((n, f) => n + gz(f), 0) / 1024;
    const budget = BUDGETS.find(([re]) => re.test(page))?.[1];
    return { page, kb: Math.round(kb), budget };
  })
  .sort((a, b) => b.kb - a.kb);

if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
else
  for (const r of rows)
    console.log(
      `${String(r.kb).padStart(4)} KB  ${r.page}${r.budget ? `  (budget ${r.budget}${r.kb > r.budget ? " ✗ OVER" : " ✓"})` : ""}`,
    );
process.exitCode = rows.some((r) => r.budget && r.kb > r.budget) ? 1 : 0;
