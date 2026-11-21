/* Royal Heritage ornaments. All strokes/fills use currentColor or theme variables. */
import { cn } from "@/lib/utils";

/** ——◆—— divider with dots. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 24"
      className={cn("h-5 w-48 text-[var(--c-accent)]", className)}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 12 H92" />
        <path d="M148 12 H240" />
        <path d="M120 2 L130 12 L120 22 L110 12 Z" fill="currentColor" fillOpacity="0.25" />
        <path d="M120 6 L126 12 L120 18 L114 12 Z" fill="currentColor" />
        <path d="M100 12 Q105 4 110 12 Q105 20 100 12" />
        <path d="M140 12 Q135 4 130 12 Q135 20 140 12" />
      </g>
      <circle cx="88" cy="12" r="2" fill="currentColor" />
      <circle cx="152" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

/** Mughal / jharokha pointed arch outline that stretches to its container. */
export function ArchFrame({ className, double = true }: { className?: string; double?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 400"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <g fill="none" stroke="var(--c-accent)" vectorEffect="non-scaling-stroke">
        <path
          d="M4 400 V150 C4 95 40 62 100 4 C160 62 196 95 196 150 V400"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {double && (
          <path
            d="M12 400 V154 C12 104 46 72 100 16 C154 72 188 104 188 154 V400"
            strokeWidth="0.75"
            strokeOpacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </g>
    </svg>
  );
}

/** Quarter mandala for frame corners. Rotate via className for other corners. */
export function MandalaCorner({ className }: { className?: string }) {
  const petals = Array.from({ length: 7 }, (_, i) => (i * 90) / 6);
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("pointer-events-none size-24 text-[var(--c-accent)] sm:size-32", className)}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.75">
        {[18, 34, 52, 74, 98].map((r) => (
          <path key={r} d={`M${r} 0 A${r} ${r} 0 0 1 0 ${r}`} strokeOpacity={r > 60 ? 0.5 : 1} />
        ))}
        {petals.map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path d="M34 0 Q44 -7 52 0 Q44 7 34 0" fill="currentColor" fillOpacity="0.18" />
            <path d="M52 0 Q64 -10 74 0 Q64 10 52 0" />
            <circle cx="86" cy="0" r="2.2" fill="currentColor" stroke="none" />
          </g>
        ))}
        <circle cx="0" cy="0" r="10" fill="currentColor" fillOpacity="0.3" />
      </g>
    </svg>
  );
}

/** Lotus with a diya flame — the ornament above the invocation. */
export function InvocationArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn("h-14 w-20 text-[var(--c-accent)]", className)}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path
          d="M60 20 C56 28 56 34 60 40 C64 34 64 28 60 20 Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
        <path
          d="M60 40 C46 44 40 56 42 66 C50 62 56 54 60 40 Z"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <path
          d="M60 40 C74 44 80 56 78 66 C70 62 64 54 60 40 Z"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <path
          d="M60 44 C52 52 52 62 60 70 C68 62 68 52 60 44 Z"
          fill="currentColor"
          fillOpacity="0.35"
        />
        <path d="M42 66 C30 62 20 64 12 70 C26 74 38 72 46 68" />
        <path d="M78 66 C90 62 100 64 108 70 C94 74 82 72 74 68" />
        <path d="M20 74 H100" strokeOpacity="0.6" />
      </g>
      <circle cx="60" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Repeating damask lattice used as the "Silk damask" background preset. */
export function DamaskPattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <pattern id="rh-damask" width="72" height="96" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="var(--c-accent)" strokeWidth="0.8" opacity="0.12">
            <path d="M36 0 C52 16 52 32 36 48 C20 32 20 16 36 0 Z" />
            <path d="M36 48 C52 64 52 80 36 96 C20 80 20 64 36 48 Z" />
            <path d="M0 48 C16 32 16 16 0 0" />
            <path d="M72 48 C56 32 56 16 72 0" />
            <path d="M0 48 C16 64 16 80 0 96" />
            <path d="M72 48 C56 64 56 80 72 96" />
            <circle cx="36" cy="24" r="4" />
            <circle cx="36" cy="72" r="4" />
            <circle cx="0" cy="48" r="3" fill="var(--c-accent)" />
            <circle cx="72" cy="48" r="3" fill="var(--c-accent)" />
          </g>
        </pattern>
        <radialGradient id="rh-vignette" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.12" />
          <stop offset="60%" stopColor="var(--c-bg)" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#rh-damask)" />
      <rect width="100%" height="100%" fill="url(#rh-vignette)" />
    </svg>
  );
}

/** Wax seal or medallion with the couple's monogram. */
export function Seal({
  monogram,
  variant,
  className,
}: {
  monogram: string;
  variant: string;
  className?: string;
}) {
  const wax = variant === "wax-red" ? "#8E1B22" : "var(--c-accent)";
  if (variant === "medallion") {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-full border-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
          className,
        )}
        style={{ background: "var(--c-surface)", borderColor: "var(--c-accent)" }}
      >
        <div
          className="grid size-[78%] place-items-center rounded-full border"
          style={{ borderColor: "color-mix(in srgb, var(--c-accent) 60%, transparent)" }}
        >
          <span className="rh-foil font-[family-name:var(--f-display)] text-[1.35rem] leading-none tracking-wider">
            {monogram}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.5)]",
        className,
      )}
      style={{
        background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${wax} 55%, white), ${wax} 55%, color-mix(in srgb, ${wax} 55%, black))`,
        clipPath:
          "polygon(50% 0%, 61% 4%, 72% 2%, 79% 11%, 90% 14%, 92% 26%, 100% 35%, 96% 47%, 100% 59%, 93% 69%, 92% 81%, 81% 85%, 73% 96%, 61% 95%, 50% 100%, 39% 95%, 27% 96%, 19% 85%, 8% 81%, 7% 69%, 0% 59%, 4% 47%, 0% 35%, 8% 26%, 10% 14%, 21% 11%, 28% 2%, 39% 4%)",
      }}
    >
      <div
        className="grid size-[70%] place-items-center rounded-full"
        style={{
          boxShadow: `inset 0 2px 4px color-mix(in srgb, ${wax} 40%, black), inset 0 -2px 3px color-mix(in srgb, ${wax} 50%, white)`,
        }}
      >
        <span
          className="font-[family-name:var(--f-display)] text-[1.3rem] leading-none tracking-wider"
          style={{
            color: `color-mix(in srgb, ${wax} 45%, black)`,
            textShadow: `0 1px 0 color-mix(in srgb, ${wax} 50%, white)`,
          }}
        >
          {monogram}
        </span>
      </div>
    </div>
  );
}
