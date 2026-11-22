import type { CSSProperties, ReactNode } from "react";

/** Thin gold rule with a small sunburst in the middle (section divider). */
export function SunDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 14"
      aria-hidden="true"
      className={`h-3.5 w-28 ${className}`}
      style={{ color: "var(--md-gold)" }}
    >
      <path d="M2 7h44M74 7h44" stroke="currentColor" strokeWidth="0.8" />
      <g fill="currentColor">
        <path d="M60 1.5l1.3 4.2 4.2 1.3-4.2 1.3L60 12.5l-1.3-4.2-4.2-1.3 4.2-1.3z" />
        <path d="M48.5 7l3-1.4v2.8zM71.5 7l-3-1.4v2.8z" />
      </g>
      <g stroke="currentColor" strokeWidth="0.6" strokeLinecap="round">
        <path d="M54 3.5l-1.8-1.5M66 3.5l1.8-1.5M54 10.5l-1.8 1.5M66 10.5l1.8 1.5" />
      </g>
    </svg>
  );
}

/**
 * Card with a cusped-arch top, like a temple niche. The cap is an SVG (stretches only
 * horizontally, so the curve stays graceful); the body is a bordered box under it.
 */
export function ArchCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`relative ${className}`} style={style}>
      <svg
        viewBox="0 0 300 46"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block h-11 w-full"
      >
        <path
          d="M0 46V40C0 30 10 24 26 23 38 11 62 5 88 9 108 3 130 0 150 0s42 3 62 9c26-4 50 2 62 14 16 1 26 7 26 17v6z"
          fill="var(--md-card)"
        />
        <path
          d="M.5 46V40C.5 30 10 24 26 23 38 11 62 5 88 9 108 3 130 .5 150 .5s42 2.5 62 8.5c26-4 50 2 62 14 16 1 25.5 7 25.5 17v6"
          fill="none"
          stroke="var(--md-line)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="md-card-body -mt-px">{children}</div>
    </div>
  );
}
