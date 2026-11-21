/**
 * Synthesizes two short, original, loopable demo tracks (no samples, no licensing issues).
 *   node scripts/generate-demo-music.mjs   (macOS: converts WAV → AAC .m4a with afconvert)
 * Replace with licensed royalty-free recordings before launch.
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SR = 22050;

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const g = peak > 0 ? 0.8 / peak : 1;
  samples.forEach((s, i) =>
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * g)) * 32767), 44 + i * 2),
  );
  return buf;
}

/** Karplus–Strong plucked string. */
function pluck(out, start, freq, dur, amp, decay = 0.996) {
  const n = Math.floor(SR / freq);
  const ring = Array.from({ length: n }, () => Math.random() * 2 - 1);
  const len = Math.floor(dur * SR);
  for (let i = 0; i < len && start + i < out.length; i++) {
    const idx = i % n;
    const next = (idx + 1) % n;
    const v = ring[idx];
    ring[idx] = decay * 0.5 * (v + ring[next]);
    out[start + i] += v * amp * Math.min(1, i / 40);
  }
}

/** Soft electric-piano-ish tone: sine + few harmonics with exponential decay. */
function bell(out, start, freq, dur, amp) {
  const len = Math.floor(dur * SR);
  for (let i = 0; i < len && start + i < out.length; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 2.2) * Math.min(1, i / 200);
    out[start + i] +=
      amp *
      env *
      (Math.sin(2 * Math.PI * freq * t) +
        0.35 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 4) +
        0.12 * Math.sin(2 * Math.PI * freq * 3 * t) * Math.exp(-t * 6));
  }
}

function drone(out, freqs, amp) {
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    freqs.forEach((f, k) => {
      const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * (0.11 + k * 0.03) * t + k);
      v +=
        lfo *
        (Math.sin(2 * Math.PI * f * t) +
          0.5 * Math.sin(2 * Math.PI * f * 2 * t) +
          0.25 * Math.sin(2 * Math.PI * f * 3 * t));
    });
    out[i] += (v / freqs.length) * amp;
  }
}

function fadeEdges(out, secs = 0.8) {
  const n = Math.floor(secs * SR);
  for (let i = 0; i < n; i++) {
    out[i] *= i / n;
    out[out.length - 1 - i] *= i / n;
  }
}

// Track 1 — "Raag Dawn": tanpura-like drone + plucked phrase in Bhupali (S R G P D).
function raagDawn() {
  const dur = 28;
  const out = new Float32Array(dur * SR);
  const Sa = 146.83; // D3
  drone(out, [Sa, Sa * 1.5, Sa * 2], 0.22);
  const scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2];
  const phrase = [
    0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 5, 4, 3, 2, 1, 0, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 2, 0,
  ];
  phrase.forEach((deg, i) =>
    pluck(out, Math.floor((0.6 + i * 0.95) * SR), Sa * 2 * scale[deg], 2.2, 0.55),
  );
  fadeEdges(out);
  return out;
}

// Track 2 — "Ivory Waltz": gentle arpeggiated chords in A major, 3/4.
function ivoryWaltz() {
  const dur = 26;
  const out = new Float32Array(dur * SR);
  const A = 220;
  const chords = [
    [1, 5 / 4, 3 / 2],
    [(9 / 8) * 0.75, (3 / 2) * 0.75 * 1.25, (9 / 8) * 1.5 * 0.75],
    [5 / 6, 1, 5 / 4],
    [3 / 4, 15 / 16, 9 / 8],
  ];
  const beat = 0.62;
  for (let bar = 0; bar < 13; bar++) {
    const c = chords[bar % chords.length];
    const t0 = 0.4 + bar * beat * 3;
    bell(out, Math.floor(t0 * SR), (A * c[0]) / 2, 2.4, 0.5);
    bell(out, Math.floor((t0 + beat) * SR), A * c[1], 1.8, 0.32);
    bell(out, Math.floor((t0 + beat * 2) * SR), A * c[2], 1.8, 0.32);
    if (bar % 2 === 1) bell(out, Math.floor((t0 + beat * 1.5) * SR), A * c[2] * 2, 1.6, 0.18);
  }
  fadeEdges(out);
  return out;
}

const dir = join("public", "music");
mkdirSync(dir, { recursive: true });
for (const [id, fn] of [
  ["raag-dawn", raagDawn],
  ["ivory-waltz", ivoryWaltz],
]) {
  const tmp = join(tmpdir(), `${id}.wav`);
  writeFileSync(tmp, wav(fn()));
  execFileSync("afconvert", [
    "-f",
    "m4af",
    "-d",
    "aac",
    "-b",
    "64000",
    tmp,
    join(dir, `${id}.m4a`),
  ]);
  rmSync(tmp);
  console.log(`wrote public/music/${id}.m4a`);
}
