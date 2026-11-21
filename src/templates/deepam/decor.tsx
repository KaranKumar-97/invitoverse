/* Deepam artwork — original, hand-coded SVG. Colours come from theme variables (accent = brass/lamp
   light), except leaf green and marigold, which read well on every palette. */
import { useId } from "react";
import { cn } from "@/lib/utils";

const useSvgId = (name: string) => `dp-${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

const LEAF = "#4f7a3a";
const LEAF_DARK = "#3b5f2b";
const MARIGOLD = ["#f2711f", "#f6a823", "#e8571a"];

/** Teardrop flame with a bright core; `data-flame` lets the envelope animate it. */
export function Flame({ className, flicker = true }: { className?: string; flicker?: boolean }) {
  const flameId = useSvgId("flame");
  const haloId = useSvgId("halo");
  return (
    <svg viewBox="-20 -48 40 52" className={cn("overflow-visible", className)} aria-hidden="true">
      <defs>
        <radialGradient id={flameId} cx="50%" cy="78%" r="70%">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="0.35" stopColor="#ffe27a" />
          <stop offset="0.7" stopColor="#ff9f2e" />
          <stop offset="1" stopColor="#e8571a" />
        </radialGradient>
        <radialGradient id={haloId}>
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="-16" r="24" fill={`url(#${haloId})`} />
      <g
        data-ambient={flicker ? "" : undefined}
        style={{
          transformOrigin: "0 0",
          transformBox: "fill-box",
          animation: flicker ? "dp-flicker 1.6s ease-in-out infinite" : undefined,
        }}
      >
        <path d="M0 2 C-9 -8 -8 -24 0 -42 C8 -24 9 -8 0 2 Z" fill={`url(#${flameId})`} />
        <path d="M0 0 C-4 -6 -4 -14 0 -22 C4 -14 4 -6 0 0 Z" fill="#fffdf2" opacity="0.9" />
      </g>
    </svg>
  );
}

/** Clay-and-brass diya. The flame is a separate element so it can be lit. */
export function DiyaBowl({ className }: { className?: string }) {
  const bowlId = useSvgId("bowl");
  return (
    <svg viewBox="0 0 120 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={bowlId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--c-accent) 85%, #fff)" }} />
          <stop offset="0.45" style={{ stopColor: "var(--c-accent)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--c-accent) 55%, #000)" }} />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="58" rx="22" ry="4" fill="#000" opacity="0.25" />
      <path d="M46 54 H74 L70 46 H50 Z" fill={`url(#${bowlId})`} />
      <path
        d="M8 24 C14 48 40 52 60 52 C80 52 106 48 112 24 C100 30 82 31 60 31 C38 31 20 30 8 24 Z"
        fill={`url(#${bowlId})`}
      />
      <path
        d="M8 24 C20 30 38 31 60 31 C82 31 100 30 112 24 C104 20 86 18 60 18 C34 18 16 20 8 24 Z"
        style={{ fill: "color-mix(in srgb, var(--c-accent) 45%, #000)" }}
      />
      <path
        d="M52 18 Q60 8 68 18"
        style={{ fill: "color-mix(in srgb, var(--c-accent) 70%, #000)" }}
      />
      <path
        d="M14 30 C30 38 90 38 106 30"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      {[24, 42, 60, 78, 96].map((x) => (
        <circle key={x} cx={x} cy={41} r="1.6" fill="#fff" opacity="0.35" />
      ))}
    </svg>
  );
}

/** A complete small lamp (bowl + flame) for rows, countdown and dividers. */
export function Lamp({ className, flicker = true }: { className?: string; flicker?: boolean }) {
  return (
    <span className={cn("relative inline-block", className)} aria-hidden="true">
      <DiyaBowl className="absolute inset-x-0 bottom-0 w-full" />
      <Flame
        className="absolute bottom-[38%] left-1/2 h-[70%] -translate-x-1/2"
        flicker={flicker}
      />
    </span>
  );
}

/** One kolam ring: dots on a circle plus looping petals (`petals` loops between dots). */
export function KolamRing({
  r,
  petals,
  className,
  dot = 1.6,
}: {
  r: number;
  petals: number;
  className?: string;
  dot?: number;
}) {
  const loops: string[] = [];
  const dots: Array<[number, number]> = [];
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const b = ((i + 1) / petals) * Math.PI * 2;
    const mid = (a + b) / 2;
    const p = (ang: number, rad: number) =>
      `${(100 + rad * Math.cos(ang)).toFixed(2)} ${(100 + rad * Math.sin(ang)).toFixed(2)}`;
    loops.push(`M${p(a, r)} Q${p(mid, r * 1.32)} ${p(b, r)} Q${p(mid, r * 0.78)} ${p(a, r)}`);
    dots.push([100 + r * 1.12 * Math.cos(mid), 100 + r * 1.12 * Math.sin(mid)]);
  }
  return (
    <svg viewBox="0 0 200 200" className={cn("overflow-visible", className)} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        <path d={loops.join(" ")} />
      </g>
      <g fill="currentColor">
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={dot} />
        ))}
      </g>
    </svg>
  );
}

/** South-Indian temple tower: tiers with niches, a vaulted crown and kalasam finials. Lamps line
 *  each tier (`lit` adds glow). */
export function Gopuram({
  className,
  lit = true,
  style,
}: {
  className?: string;
  lit?: boolean;
  style?: React.CSSProperties;
}) {
  const lampglowId = useSvgId("lampglow");
  const tiers = 6;
  const base = { w: 168, h: 46, y: 300 };
  const parts: React.ReactNode[] = [];
  const lamps: Array<[number, number]> = [];
  let y = base.y;
  let w = base.w;
  for (let i = 0; i < tiers; i++) {
    const h = i === 0 ? base.h : 34 - i * 2;
    const x = 120 - w / 2;
    parts.push(
      <g key={i}>
        <rect x={x} y={y - h} width={w} height={h} />
        <rect x={x - 4} y={y - h - 4} width={w + 8} height={5} />
        {Array.from({ length: Math.max(2, Math.round(w / 26)) }).map((_, k, arr) => {
          const nx = x + (w / arr.length) * (k + 0.5);
          return (
            <path
              key={k}
              d={`M${nx - 5} ${y - 4} V${y - h + 10} Q${nx} ${y - h + 4} ${nx + 5} ${y - h + 10} V${y - 4} Z`}
              fill="#000"
              opacity="0.22"
            />
          );
        })}
      </g>,
    );
    for (let k = 0; k <= Math.round(w / 18); k++)
      lamps.push([x - 2 + (k * (w + 4)) / Math.round(w / 18), y - h - 6]);
    y = y - h - 4;
    w = w - 22;
  }
  // Barrel-vault crown and finials.
  const cw = w + 16;
  const cx = 120 - cw / 2;
  return (
    <svg viewBox="0 0 240 310" className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={lampglowId}>
          <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#ffb347" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill="currentColor">
        {parts}
        <path d={`M${cx} ${y} V${y - 14} Q120 ${y - 40} ${cx + cw} ${y - 14} V${y} Z`} />
        {[cx + 10, 120, cx + cw - 10].map((fx) => (
          <g key={fx}>
            <rect x={fx - 1} y={y - (fx === 120 ? 56 : 40)} width="2" height="14" />
            <path
              d={`M${fx - 4} ${y - (fx === 120 ? 44 : 28)} Q${fx} ${y - (fx === 120 ? 60 : 44)} ${fx + 4} ${y - (fx === 120 ? 44 : 28)} Z`}
            />
          </g>
        ))}
        <path
          d={`M100 ${base.y} V${base.y - 30} Q120 ${base.y - 44} 140 ${base.y - 30} V${base.y} Z`}
          fill="#000"
          opacity="0.35"
        />
      </g>
      {lit &&
        lamps.map(([lx, ly], i) => (
          <g key={i}>
            <circle cx={lx} cy={ly} r="5" fill={`url(#${lampglowId})`} />
            <circle cx={lx} cy={ly} r="1.2" fill="#fff6d6" />
          </g>
        ))}
    </svg>
  );
}

/** Mango-leaf and marigold toran (door garland) that spans its container's width. */
export function Toran({ className }: { className?: string }) {
  const items = 15;
  return (
    <svg
      viewBox="0 0 300 46"
      preserveAspectRatio="xMidYMin meet"
      className={cn("w-full", className)}
      aria-hidden="true"
    >
      <path
        d="M0 4 Q150 14 300 4"
        fill="none"
        style={{ stroke: "var(--c-accent)" }}
        strokeWidth="1.2"
        opacity="0.8"
      />
      {Array.from({ length: items }).map((_, i) => {
        const x = 10 + (i * 280) / (items - 1);
        const t = x / 300;
        const y = 4 + 20 * t * (1 - t);
        return i % 2 === 0 ? (
          <g key={i}>
            <path
              d={`M${x} ${y} C${x - 7} ${y + 12} ${x - 4} ${y + 30} ${x} ${y + 38} C${x + 4} ${y + 30} ${x + 7} ${y + 12} ${x} ${y} Z`}
              fill={i % 4 === 0 ? LEAF : LEAF_DARK}
            />
            <path
              d={`M${x} ${y + 2} V${y + 34}`}
              stroke="#a7c48f"
              strokeWidth="0.5"
              opacity="0.6"
            />
          </g>
        ) : (
          <g key={i}>
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={y + 10}
              style={{ stroke: "var(--c-accent)" }}
              strokeWidth="0.6"
            />
            <circle cx={x} cy={y + 14} r="5.5" fill={MARIGOLD[i % 3]} />
            <circle cx={x} cy={y + 14} r="2.4" fill="#ffd27a" opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
}

/** Kalash with mango leaves and a coconut — the auspicious pot (used in the footer). */
export function Kalash({ className }: { className?: string }) {
  const kalashId = useSvgId("kalash");
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={kalashId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--c-accent) 60%, #000)" }} />
          <stop
            offset="0.45"
            style={{ stopColor: "color-mix(in srgb, var(--c-accent) 85%, #fff)" }}
          />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--c-accent) 55%, #000)" }} />
        </linearGradient>
      </defs>
      {[-50, -25, 0, 25, 50].map((deg) => (
        <path
          key={deg}
          d="M50 40 C44 28 46 14 50 4 C54 14 56 28 50 40 Z"
          fill={deg % 50 === 0 ? LEAF : LEAF_DARK}
          transform={`rotate(${deg} 50 40)`}
        />
      ))}
      <ellipse cx="50" cy="34" rx="12" ry="11" fill="#8a5a2b" />
      <path d="M40 28 Q50 22 60 28" fill="none" stroke="#5c3a1a" strokeWidth="1.2" />
      <path d="M34 44 H66 L62 50 H38 Z" fill={`url(#${kalashId})`} />
      <path d="M38 50 C14 62 16 104 50 108 C84 104 86 62 62 50 Z" fill={`url(#${kalashId})`} />
      <path d="M26 74 Q50 82 74 74" fill="none" stroke="#e8571a" strokeWidth="2.2" />
      <path
        d="M28 82 Q50 90 72 82"
        fill="none"
        style={{ stroke: "var(--c-bg)" }}
        strokeOpacity="0.5"
        strokeWidth="0.8"
      />
      <circle cx="50" cy="66" r="3" fill="#c81e1e" />
      <ellipse cx="50" cy="111" rx="20" ry="3.5" fill="#000" opacity="0.25" />
    </svg>
  );
}

/** Lotus with fine rules either side. */
export function LotusDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 28"
      className={cn("h-6 w-52 text-[var(--c-accent)]", className)}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M0 18 H84" opacity="0.7" />
        <path d="M156 18 H240" opacity="0.7" />
        <path d="M120 20 C112 14 112 6 120 2 C128 6 128 14 120 20 Z" />
        <path d="M120 20 C108 18 101 12 102 6 C110 7 116 12 120 20" />
        <path d="M120 20 C132 18 139 12 138 6 C130 7 124 12 120 20" />
        <path d="M120 22 C104 23 94 18 90 12 C100 12 110 16 120 22" />
        <path d="M120 22 C136 23 146 18 150 12 C140 12 130 16 120 22" />
      </g>
      <circle cx="88" cy="18" r="1.8" fill="currentColor" />
      <circle cx="152" cy="18" r="1.8" fill="currentColor" />
    </svg>
  );
}

/** Brass puja plate (thali) with an engraved rim, for the opening. */
export function Thali({ className }: { className?: string }) {
  const thaliId = useSvgId("thali");
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={thaliId} cx="45%" cy="40%" r="65%">
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--c-accent) 70%, #fff)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--c-accent)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--c-accent) 45%, #000)" }} />
        </radialGradient>
      </defs>
      <circle cx="100" cy="104" r="96" fill="#000" opacity="0.28" />
      <circle cx="100" cy="100" r="96" fill={`url(#${thaliId})`} />
      <circle
        cx="100"
        cy="100"
        r="84"
        fill="none"
        stroke="#000"
        strokeOpacity="0.25"
        strokeWidth="1.2"
      />
      <circle
        cx="100"
        cy="100"
        r="80"
        style={{ fill: "color-mix(in srgb, var(--c-accent) 60%, #000)" }}
        opacity="0.35"
      />
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={(100 + 90 * Math.cos(a)).toFixed(2)}
            cy={(100 + 90 * Math.sin(a)).toFixed(2)}
            r="1.3"
            fill="#fff"
            opacity="0.45"
          />
        );
      })}
    </svg>
  );
}
