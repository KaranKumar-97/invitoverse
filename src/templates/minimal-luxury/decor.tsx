import { cn } from "@/lib/utils";

/** Fine paper/linen grain via SVG turbulence. Purely decorative. */
export function PaperTexture({
  className,
  opacity = 0.07,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <filter id="ml-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 1 0" />
      </filter>
      <filter id="ml-linen">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.9" numOctaves="2" />
        <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0.6 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ml-grain)" opacity={opacity} />
      <rect width="100%" height="100%" filter="url(#ml-linen)" opacity={opacity * 0.6} />
    </svg>
  );
}

/** Monogram in a hairline circle. `embossed` renders blind-embossed (same colour as paper). */
export function Monogram({
  letters,
  italic,
  embossed,
  className,
}: {
  letters: string;
  italic?: boolean;
  embossed?: boolean;
  className?: string;
}) {
  const chars = [...letters];
  return (
    <div
      aria-hidden // decorative initials; the couple's names are in the heading
      className={cn("grid aspect-square place-items-center rounded-full border", className)}
      style={{
        borderColor: embossed
          ? "color-mix(in srgb, var(--c-text) 12%, transparent)"
          : "color-mix(in srgb, var(--c-accent) 60%, transparent)",
      }}
    >
      <span
        className={cn(
          "f-display leading-none tracking-[0.06em]",
          italic && "italic",
          embossed ? "ml-emboss" : "text-[var(--c-text)]",
        )}
      >
        {chars.length === 2 ? (
          <>
            {chars[0]}
            <span
              className="mx-[0.08em] align-middle text-[0.45em] text-[var(--c-accent)]"
              style={embossed ? { color: "inherit" } : undefined}
            >
              &amp;
            </span>
            {chars[1]}
          </>
        ) : (
          letters
        )}
      </span>
    </div>
  );
}
