/**
 * Generates original, license-free placeholder "photographs" (SVG) for template demos.
 * Replace with commissioned/licensed photography before launch (see CREDITS.md per template).
 *   node scripts/generate-demo-art.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const svg = (w, h, body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(w / 90)}"/></filter><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.08 0"/></filter></defs>${body}<rect width="100%" height="100%" filter="url(#grain)"/></svg>`;

function bokeh(r, w, h, colors, n, minR, maxR, opacity = [0.25, 0.7]) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const c = colors[Math.floor(r() * colors.length)];
    const rad = minR + r() * (maxR - minR);
    out += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h).toFixed(0)}" r="${rad.toFixed(0)}" fill="${c}" opacity="${(opacity[0] + r() * (opacity[1] - opacity[0])).toFixed(2)}" filter="url(#b)"/>`;
  }
  return out;
}

function bg(id, w, h, stops, angle = "0,0,0,1") {
  const [x1, y1, x2, y2] = angle.split(",");
  return {
    defs: `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
      .map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(2)}" stop-color="${c}"/>`)
      .join("")}</linearGradient>`,
    body: `<rect width="${w}" height="${h}" fill="url(#${id})"/>`,
  };
}

/** Palace skyline: domes, chhatris, arches. */
function palace(w, h, base, color) {
  const y = h * base;
  let d = `M0 ${h} L0 ${y}`;
  const step = w / 9;
  for (let i = 0; i < 9; i++) {
    const x = i * step;
    const top = y - (i % 3 === 1 ? h * 0.16 : h * 0.07);
    d += ` L${x + step * 0.15} ${y} L${x + step * 0.15} ${top + h * 0.03} Q${x + step * 0.5} ${top - h * 0.06} ${x + step * 0.85} ${top + h * 0.03} L${x + step * 0.85} ${y}`;
  }
  d += ` L${w} ${y} L${w} ${h} Z`;
  let arches = "";
  for (let i = 0; i < 12; i++) {
    const ax = (w / 12) * i + w / 48;
    arches += `<path d="M${ax} ${h * 0.97} L${ax} ${y + h * 0.08} Q${ax + w / 48} ${y + h * 0.03} ${ax + w / 24} ${y + h * 0.08} L${ax + w / 24} ${h * 0.97} Z" fill="#000" opacity="0.18"/>`;
  }
  return `<path d="${d}" fill="${color}"/>${arches}`;
}

/** Stepped temple towers (gopurams) on the horizon, edges lined with lamp dots. */
function temples(w, h, base, color, lamp) {
  const y = h * base;
  let out = `<rect x="0" y="${y}" width="${w}" height="${h - y}" fill="${color}"/>`;
  const towers = [
    [0.22, 0.16, 0.34],
    [0.5, 0.22, 0.5],
    [0.8, 0.15, 0.3],
  ];
  for (const [cxF, bwF, hF] of towers) {
    const cx = w * cxF;
    let bw = w * bwF;
    let top = y;
    const tiers = 6;
    const th = (h * hF) / tiers;
    for (let i = 0; i < tiers; i++) {
      out += `<rect x="${(cx - bw / 2).toFixed(0)}" y="${(top - th).toFixed(0)}" width="${bw.toFixed(0)}" height="${th.toFixed(0)}" fill="${color}"/>`;
      for (let k = 0; k <= 6; k++)
        out += `<circle cx="${(cx - bw / 2 + (bw * k) / 6).toFixed(0)}" cy="${(top - th).toFixed(0)}" r="${(w / 300).toFixed(1)}" fill="${lamp}"/>`;
      top -= th;
      bw *= 0.82;
    }
    out += `<path d="M${(cx - bw / 2).toFixed(0)} ${top.toFixed(0)} Q${cx.toFixed(0)} ${(top - th * 1.6).toFixed(0)} ${(cx + bw / 2).toFixed(0)} ${top.toFixed(0)} Z" fill="${color}"/>`;
  }
  return out;
}

function stringLights(r, w, h, color, rows = 3) {
  let out = "";
  for (let k = 0; k < rows; k++) {
    const y0 = h * (0.12 + k * 0.14);
    const sag = h * (0.06 + r() * 0.05);
    out += `<path d="M-20 ${y0} Q${w / 2} ${y0 + sag * 2} ${w + 20} ${y0}" stroke="#2a1a10" stroke-width="2" fill="none" opacity="0.5"/>`;
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const x = -20 + t * (w + 40);
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag * 2) + t * t * y0;
      out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(w / 70).toFixed(0)}" fill="${color}" opacity="0.9" filter="url(#b)"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(w / 260).toFixed(1)}" fill="#fff8e1"/>`;
    }
  }
  return out;
}

function garland(r, w, h, colors) {
  let out = "";
  for (let g = 0; g < 4; g++) {
    const x = w * (0.12 + g * 0.25);
    for (let i = 0; i < 26; i++) {
      const c = colors[Math.floor(r() * colors.length)];
      out += `<circle cx="${(x + Math.sin(i / 2) * 6).toFixed(0)}" cy="${(i * (h / 26)).toFixed(0)}" r="${(w / 34).toFixed(0)}" fill="${c}"/><circle cx="${(x + Math.sin(i / 2) * 6 - 4).toFixed(0)}" cy="${(i * (h / 26) - 4).toFixed(0)}" r="${(w / 90).toFixed(0)}" fill="#fff" opacity="0.25"/>`;
    }
  }
  return out;
}

/** Abstract couple silhouettes under an arch at golden hour. */
function couple(w, h, sky, sun, ink) {
  const g = bg("sky", w, h, sky);
  const cx = w / 2;
  const groundY = h * 0.86;
  const fig = (x, flip, bride) => {
    const s = flip ? -1 : 1;
    const head = `<circle cx="${x}" cy="${h * 0.47}" r="${w * 0.045}" fill="${ink}"/>`;
    const turban = bride
      ? `<path d="M${x - s * w * 0.06} ${h * 0.44} Q${x} ${h * 0.39} ${x + s * w * 0.05} ${h * 0.45} L${x + s * w * 0.14} ${groundY} L${x - s * w * 0.1} ${groundY} Z" fill="${ink}" opacity="0.92"/>`
      : `<ellipse cx="${x}" cy="${h * 0.435}" rx="${w * 0.05}" ry="${w * 0.03}" fill="${ink}"/>`;
    const body = bride
      ? `<path d="M${x - w * 0.05} ${h * 0.52} Q${x} ${h * 0.5} ${x + w * 0.05} ${h * 0.52} L${x + w * 0.16} ${groundY} L${x - w * 0.16} ${groundY} Z" fill="${ink}"/>`
      : `<path d="M${x - w * 0.06} ${h * 0.52} Q${x} ${h * 0.5} ${x + w * 0.06} ${h * 0.52} L${x + w * 0.08} ${h * 0.75} L${x + w * 0.05} ${groundY} L${x - w * 0.05} ${groundY} L${x - w * 0.08} ${h * 0.75} Z" fill="${ink}"/>`;
    return body + head + turban;
  };
  const arch = `<path d="M${w * 0.08} ${h} L${w * 0.08} ${h * 0.35} Q${w * 0.08} ${h * 0.08} ${cx} ${h * 0.04} Q${w * 0.92} ${h * 0.08} ${w * 0.92} ${h * 0.35} L${w * 0.92} ${h} L${w} ${h} L${w} 0 L0 0 L0 ${h} Z" fill="${ink}" opacity="0.88"/>`;
  return svg(
    w,
    h,
    `${g.body}<circle cx="${cx}" cy="${h * 0.58}" r="${w * 0.28}" fill="${sun}" opacity="0.85" filter="url(#b)"/><circle cx="${cx}" cy="${h * 0.58}" r="${w * 0.18}" fill="${sun}"/>` +
      `<rect x="0" y="${groundY}" width="${w}" height="${h - groundY}" fill="${ink}"/>` +
      fig(cx - w * 0.085, false, false) +
      fig(cx + w * 0.085, true, true) +
      arch,
    g.defs,
  );
}

function write(dir, name, content) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), content);
}

const SETS = {
  "royal-heritage": {
    couple: { sky: ["#2a0e12", "#7a1f2b", "#e09a3e"], sun: "#f3c969", ink: "#1c0a0c" },
    gallery: [
      {
        kind: "palace",
        w: 1600,
        h: 1067,
        sky: ["#2b0f1a", "#8c2f39", "#f0a54a"],
        ink: "#2a0e12",
        lights: "#f6c560",
        seed: 11,
      },
      {
        kind: "garland",
        w: 1067,
        h: 1600,
        sky: ["#4a1219", "#7a1f2b"],
        flowers: ["#f59e0b", "#ea580c", "#facc15"],
        seed: 12,
      },
      { kind: "lights", w: 1600, h: 1067, sky: ["#12060a", "#3b1418"], color: "#f8c95a", seed: 13 },
      {
        kind: "bokeh",
        w: 1067,
        h: 1600,
        sky: ["#3b1418", "#1f0a0d"],
        colors: ["#c9a227", "#f6e7c8", "#e07a3e"],
        seed: 14,
      },
      {
        kind: "palace",
        w: 1600,
        h: 1067,
        sky: ["#0d2a22", "#1f5a49", "#e6b85c"],
        ink: "#0b1f19",
        lights: "#ffd977",
        seed: 15,
      },
      {
        kind: "garland",
        w: 1600,
        h: 1067,
        sky: ["#7a1f2b", "#3b1418"],
        flowers: ["#fde68a", "#f97316", "#dc2626"],
        seed: 16,
      },
    ],
  },
  deepam: {
    couple: { sky: ["#1e1030", "#5a2a4a", "#f2a541"], sun: "#ffd27a", ink: "#140a20" },
    gallery: [
      {
        kind: "temple",
        w: 1600,
        h: 1067,
        sky: ["#1e1030", "#6a2c4c", "#f2a541"],
        ink: "#140a20",
        lights: "#ffd27a",
        seed: 31,
      },
      {
        kind: "garland",
        w: 1067,
        h: 1600,
        sky: ["#2a1840", "#5a1f3a"],
        flowers: ["#fffaf0", "#f6a823", "#f2711f"],
        seed: 32,
      },
      { kind: "lights", w: 1600, h: 1067, sky: ["#120818", "#2a1840"], color: "#ffc45a", seed: 33 },
      {
        kind: "bokeh",
        w: 1067,
        h: 1600,
        sky: ["#2a1840", "#140a20"],
        colors: ["#ffd27a", "#f2a541", "#fff3d6"],
        seed: 34,
      },
      {
        kind: "temple",
        w: 1600,
        h: 1067,
        sky: ["#0f0a1c", "#2a1840", "#7a3b2e"],
        ink: "#0b0614",
        lights: "#ffb347",
        seed: 35,
      },
      {
        kind: "garland",
        w: 1600,
        h: 1067,
        sky: ["#5e0f12", "#2a0a0c"],
        flowers: ["#fde68a", "#f97316", "#fffaf0"],
        seed: 36,
      },
    ],
  },
  "minimal-luxury": {
    couple: { sky: ["#efe8dc", "#d9cbb4", "#b9a688"], sun: "#f8f3ea", ink: "#2b2622" },
    gallery: [
      {
        kind: "bokeh",
        w: 1067,
        h: 1600,
        sky: ["#f4efe6", "#d8ccb8"],
        colors: ["#ffffff", "#c8b796", "#a8977a"],
        seed: 21,
      },
      { kind: "lights", w: 1600, h: 1067, sky: ["#2b2622", "#4b423a"], color: "#f2e3c4", seed: 22 },
      {
        kind: "bokeh",
        w: 1600,
        h: 1067,
        sky: ["#d9d4c7", "#9da593"],
        colors: ["#ffffff", "#e8e2d4", "#7f8a75"],
        seed: 23,
      },
      {
        kind: "palace",
        w: 1067,
        h: 1600,
        sky: ["#f2ece2", "#cdbfa8"],
        ink: "#3a332d",
        lights: "#fff6e0",
        seed: 24,
      },
    ],
  },
};

for (const [slug, set] of Object.entries(SETS)) {
  const dir = join("public", "templates", slug, "demo");
  write(dir, "couple.svg", couple(1200, 1600, set.couple.sky, set.couple.sun, set.couple.ink));
  set.gallery.forEach((g, i) => {
    const r = rng(g.seed);
    const b = bg("g", g.w, g.h, g.sky);
    let body = b.body;
    if (g.kind === "palace")
      body +=
        bokeh(r, g.w, g.h * 0.6, [g.lights, "#fff"], 26, g.w / 80, g.w / 30) +
        palace(g.w, g.h, 0.62, g.ink);
    if (g.kind === "temple")
      body +=
        bokeh(r, g.w, g.h * 0.55, [g.lights, "#fff"], 22, g.w / 90, g.w / 32) +
        temples(g.w, g.h, 0.8, g.ink, g.lights);
    if (g.kind === "garland")
      body +=
        bokeh(r, g.w, g.h, ["#000"], 10, g.w / 10, g.w / 5, [0.1, 0.25]) +
        garland(r, g.w, g.h, g.flowers);
    if (g.kind === "lights")
      body +=
        bokeh(r, g.w, g.h, [g.color], 30, g.w / 120, g.w / 40, [0.1, 0.4]) +
        stringLights(r, g.w, g.h, g.color);
    if (g.kind === "bokeh") body += bokeh(r, g.w, g.h, g.colors, 70, g.w / 60, g.w / 12);
    write(dir, `gallery-${i + 1}.svg`, svg(g.w, g.h, body, b.defs));
  });
  console.log(`wrote ${slug}: couple + ${set.gallery.length} gallery images`);
}
