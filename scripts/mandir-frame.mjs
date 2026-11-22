/**
 * Builds the Mandir template's frame overlay from its page painting:
 *   public/templates/mandir/art/page.webp  →  public/templates/mandir/art/frame.webp
 * The frame is the same painting with the plain paper "window" inside the arch made transparent,
 * so the invitation can layer it above the content (text slides behind the arch, border and
 * pavilions). Re-run after replacing page.webp:
 *   node scripts/mandir-frame.mjs [--preview out.png]
 *
 * The window is traced row by row: from the centre outwards to the first non-paper pixel (the
 * arch's inner gold line, then leaves, pavilions and bushes), pulled INSET px towards the centre
 * so the art stays whole. Each half is traced separately (the painting is not quite symmetric).
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// sharp ships with Next.js (pnpm keeps it out of the root node_modules).
const fromNext = createRequire(createRequire(import.meta.url).resolve("next/package.json"));
const sharp = fromNext("sharp");

const ROOT = join(fileURLToPath(import.meta.url), "../..");
const DIR = join(ROOT, "public/templates/mandir/art");
const INPUT = join(DIR, "page.webp");
const OUTPUT = join(DIR, "frame.webp");
const INSET = 4; // px kept between the art and the window
const NEIGH = 3; // rows either side considered, so a stray leaf tip is never cut
const FEATHER = 2.5; // px of soft edge

const { data, info } = await sharp(INPUT).raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const C = info.channels;
const MID = W / 2;
const px = (x, y) => {
  const i = (y * W + x) * C;
  return [data[i], data[i + 1], data[i + 2]];
};

// Paper colour, from the middle of the page.
let pr = 0,
  pg = 0,
  pb = 0,
  n = 0;
for (let y = Math.round(H * 0.4); y < H * 0.6; y += 3)
  for (let x = Math.round(W * 0.35); x < W * 0.65; x += 3) {
    const [r, g, b] = px(x, y);
    pr += r;
    pg += g;
    pb += b;
    n++;
  }
pr /= n;
pg /= n;
pb /= n;
const paperLum = 0.3 * pr + 0.59 * pg + 0.11 * pb;
const isArt = (x, y) => {
  const [r, g, b] = px(x, y);
  return 0.3 * r + 0.59 * g + 0.11 * b < paperLum - 26 || Math.hypot(r - pr, g - pg, b - pb) > 30;
};

/** One side of the window (dir -1 = left, 1 = right), top to bottom. */
function side(dir) {
  const hit = new Array(H).fill(null);
  for (let y = 0; y < H; y++)
    for (let s = 0; s < MID - 1; s++) {
      const x = Math.round(MID + dir * (s + 0.5) - 0.5);
      const x2 = x + dir;
      if (isArt(x, y) && x2 >= 0 && x2 < W && isArt(x2, y)) {
        hit[y] = s;
        break;
      }
    }
  const pts = [];
  for (let y = 0; y < H; y += 2) {
    let m = Infinity;
    for (let k = Math.max(0, y - NEIGH); k <= Math.min(H - 1, y + NEIGH); k++)
      if (hit[k] !== null) m = Math.min(m, hit[k]);
    if (m === Infinity || m - INSET < 0) continue;
    pts.push([Math.round(MID + dir * (m - INSET + 0.5) - 0.5), y]);
  }
  pts.push([pts.at(-1)[0], H + 25]); // run off the bottom edge (into the padding below)
  return rdp(pts, 1.5);
}

/** Ramer–Douglas–Peucker simplification. */
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts.at(-1)];
  let idx = 0,
    max = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const d =
      Math.abs((b[1] - a[1]) * x - (b[0] - a[0]) * y + b[0] * a[1] - b[1] * a[0]) /
      Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  return max > eps
    ? [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)]
    : [a, b];
}

const left = side(-1);
const right = side(1);
const windowPath = `M${[...left, ...right.slice().reverse()].map((p) => p.join(" ")).join("L")}Z`;
// Opaque everywhere except the window. Only the window's edge is feathered (blurring the whole
// shape would also fade the image's outer edges). Rendered PAD px taller and cropped, because the
// window runs off the bottom edge and the blur would otherwise fade it there.
const PAD = 30;
const HP = H + PAD;
const mask = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${HP}"><defs><filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${FEATHER}"/></filter><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${HP}"><rect width="${W}" height="${HP}" fill="#fff"/><path filter="url(#f)" fill="#000" d="${windowPath}"/></mask></defs><rect width="${W}" height="${HP}" fill="#fff" mask="url(#m)"/></svg>`,
  ),
)
  .extract({ left: 0, top: 0, width: W, height: H })
  .png()
  .toBuffer();

const frame = sharp(INPUT)
  .ensureAlpha()
  .composite([{ input: mask, blend: "dest-in" }]);
await frame.clone().webp({ quality: 82, alphaQuality: 85, effort: 6 }).toFile(OUTPUT);

const previewAt = process.argv.indexOf("--preview");
if (previewAt > 0) {
  // Frame over magenta: anything pink is see-through.
  await sharp({ create: { width: W, height: H, channels: 4, background: "#ff00ff" } })
    .composite([{ input: await frame.clone().png().toBuffer() }])
    .png()
    .toFile(process.argv[previewAt + 1]);
}
console.log(`frame.webp written (${left.length + right.length} outline points)`);
