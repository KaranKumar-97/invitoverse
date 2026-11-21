#!/usr/bin/env node
/**
 * Records marketing media for every template from its live demo route (docs/15 Phase 6, task 2):
 *   public/templates/<slug>/poster.jpg   — closed envelope, 390×844 @2x (served as AVIF/WebP via next/image)
 *   public/templates/<slug>/og.jpg       — 1200×630 social card (template detail OG image)
 *   public/templates/<slug>/loop.mp4     — envelope → reveal, ~6 s, muted, H.264
 *   public/templates/<slug>/loop.webm    — same, VP9
 *
 * Usage: node scripts/capture-template-media.mjs [baseUrl=http://localhost:3000] [slug…]
 * Requires a running app, Playwright Chromium and ffmpeg.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const [baseUrl = "http://localhost:3000", ...only] = process.argv.slice(2);
const SLUGS = only.length ? only : ["royal-heritage", "minimal-luxury"];
const PHONE = { width: 390, height: 844 };
const ff = (...args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args]);

// Hide the Next.js dev badge and the "Skip intro" control so they never appear in marketing media.
const CLEAN_CSS =
  "nextjs-portal{display:none!important}[data-envelope]>button{visibility:hidden!important}";

async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({ content: CLEAN_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}

async function capture(browser, slug) {
  const outDir = path.join("public/templates", slug);
  const demoUrl = `${baseUrl}/templates/${slug}/preview?embed=1`;
  const tmp = mkdtempSync(path.join(tmpdir(), `vs-${slug}-`));

  // Posters
  const phone = await browser.newContext({
    viewport: PHONE,
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
  });
  const p1 = await phone.newPage();
  await p1.goto(demoUrl);
  await settle(p1);
  await p1.screenshot({ path: path.join(tmp, "poster.png") });
  await phone.close();
  ff(
    "-i",
    path.join(tmp, "poster.png"),
    "-vf",
    "scale=780:-1",
    "-q:v",
    "4",
    path.join(outDir, "poster.jpg"),
  );

  // OG card
  const wide = await browser.newContext({ viewport: { width: 1200, height: 630 } });
  const p2 = await wide.newPage();
  await p2.goto(demoUrl);
  await settle(p2);
  await p2.screenshot({ path: path.join(tmp, "og.png") });
  await wide.close();
  ff("-i", path.join(tmp, "og.png"), "-q:v", "4", path.join(outDir, "og.jpg"));

  // Opening loop
  const started = Date.now();
  const rec = await browser.newContext({
    viewport: PHONE,
    recordVideo: { dir: tmp, size: PHONE },
  });
  const p3 = await rec.newPage();
  await p3.goto(demoUrl);
  await settle(p3);
  await p3.waitForTimeout(1200);
  const clickAt = (Date.now() - started) / 1000;
  await p3.getByRole("button", { name: "Open invitation" }).click();
  await p3.waitForFunction(
    () => document.querySelector("[data-phase]")?.dataset.phase === "open",
    null,
    {
      timeout: 10_000,
    },
  );
  await p3.waitForTimeout(1600);
  await rec.close();

  const raw = readdirSync(tmp).find((f) => f.endsWith(".webm"));
  const src = path.join(tmp, raw);
  const start = Math.max(0, clickAt - 1.0).toFixed(2);
  const common = ["-ss", start, "-t", "6.2", "-i", src, "-an", "-vf", "fps=24,scale=360:-2"];
  ff(
    ...common,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "30",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    path.join(tmp, "loop.mp4"),
  );
  ff(
    ...common,
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "42",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    path.join(tmp, "loop.webm"),
  );
  for (const f of ["loop.mp4", "loop.webm"]) renameSync(path.join(tmp, f), path.join(outDir, f));
  rmSync(tmp, { recursive: true, force: true });

  const kb = (f) => `${Math.round(statSync(path.join(outDir, f)).size / 1024)} KB`;
  console.log(
    `${slug}: poster.jpg ${kb("poster.jpg")}, og.jpg ${kb("og.jpg")}, loop.mp4 ${kb("loop.mp4")}, loop.webm ${kb("loop.webm")}`,
  );
}

const browser = await chromium.launch();
try {
  for (const slug of SLUGS) await capture(browser, slug);
} finally {
  await browser.close();
}
