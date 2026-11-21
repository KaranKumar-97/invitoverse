import { cn } from "@/lib/utils";

/** Card cover: the couple photo if there is one, otherwise the template's colours with the title. */
export function InvitationCover({
  title,
  coverImageUrl,
  swatch,
  className,
}: {
  title: string;
  coverImageUrl: string | null;
  swatch: { bg: string; accent: string; text: string };
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: swatch.bg }}>
      {coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 40%, color-mix(in srgb, ${swatch.bg} 85%, transparent))`,
        }}
      />
      <div className="absolute inset-x-4 bottom-4">
        <p className="font-display text-lg leading-tight" style={{ color: swatch.accent }}>
          {title.replace(/ Wedding$/, "")}
        </p>
      </div>
      <div
        className="absolute inset-3 rounded-[10px] border"
        style={{ borderColor: `color-mix(in srgb, ${swatch.accent} 35%, transparent)` }}
      />
    </div>
  );
}
