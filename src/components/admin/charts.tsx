"use client";

import { useState } from "react";

const nf = new Intl.NumberFormat("en-IN");
const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/**
 * One series per day as thin bars in the studio's primary ink (single series → no legend; the
 * title names it). Hover or focus a day for its value; a table view sits underneath.
 */
export function DayBars({
  title,
  points,
}: {
  title: string;
  points: Array<{ date: string; value: number }>;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.value));
  const W = 600;
  const H = 140;
  const slot = W / points.length;
  const bar = Math.max(1, slot - 2); // 2px surface gap between bars
  const total = points.reduce((a, p) => a + p.value, 0);
  const active = hover === null ? null : points[hover];

  return (
    <figure className="rounded-xl border border-line bg-surface p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{title}</span>
        <span className="text-sm text-ink-soft tabular-nums">
          {active
            ? `${dayLabel(active.date)}: ${nf.format(active.value)}`
            : `${nf.format(total)} total`}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title}: ${nf.format(total)} over ${points.length} days, peak ${nf.format(max)}`}
        className="mt-3 h-32 w-full overflow-visible text-primary"
        onMouseLeave={() => setHover(null)}
      >
        <line x1="0" x2={W} y1={H} y2={H} className="stroke-line" strokeWidth="1" />
        {points.map((p, i) => {
          const h = p.value === 0 ? 0 : Math.max(2, (p.value / max) * (H - 6));
          return (
            <g key={p.date} onMouseEnter={() => setHover(i)}>
              {/* Hit target taller and wider than the mark. */}
              <rect x={i * slot} y="0" width={slot} height={H} fill="transparent" />
              {h > 0 && (
                <rect
                  x={i * slot + 1}
                  y={H - h}
                  width={bar}
                  height={h}
                  rx={Math.min(4, bar / 2)}
                  fill="currentColor"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{points[0] && dayLabel(points[0].date)}</span>
        <span>{points.at(-1) && dayLabel(points.at(-1)!.date)}</span>
      </div>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-muted-foreground">Table view</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted-foreground">
              <th className="font-medium">Day</th>
              <th className="text-right font-medium">{title}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date}>
                <td>{dayLabel(p.date)}</td>
                <td className="text-right tabular-nums">{nf.format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Ranked horizontal bars (one series): label, bar, value. */
export function RankBars({
  title,
  rows,
  note,
}: {
  title: string;
  rows: Array<{ label: string; value: number; detail?: string }>;
  note?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure className="rounded-xl border border-line bg-surface p-4">
      <figcaption className="text-sm font-medium text-ink">{title}</figcaption>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <li
            key={r.label}
            className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm"
          >
            <span className="truncate text-ink-soft" title={r.label}>
              {r.label}
            </span>
            <span className="h-2 rounded-full bg-muted" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-ink tabular-nums">
              {nf.format(r.value)}
              {r.detail && <span className="ml-1 text-muted-foreground">{r.detail}</span>}
            </span>
          </li>
        ))}
        {!rows.length && <li className="text-sm text-muted-foreground">No data yet.</li>}
      </ul>
    </figure>
  );
}
