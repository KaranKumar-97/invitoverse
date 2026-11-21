import { cn } from "@/lib/utils";

/**
 * Section title block: gold-hairline label, serif headline, optional lead.
 * `accent` — the ending of `title` to set in italic gold foil (e.g. "design").
 */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  lead,
  center,
  invert,
  as: Tag = "h2",
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  lead?: string;
  center?: boolean;
  invert?: boolean;
  as?: "h1" | "h2";
}) {
  const hasAccent = Boolean(accent && title.endsWith(accent));
  const head = hasAccent ? title.slice(0, title.length - accent!.length) : title;
  return (
    <div className={cn(center && "mx-auto text-center", "max-w-2xl")}>
      <p
        className={`text-eyebrow eyebrow-rule ${center ? "is-center" : ""} ${invert ? "text-gold" : "text-maroon"}`}
      >
        {eyebrow}
      </p>
      <Tag className="text-display-l mt-3 text-balance">
        {head}
        {hasAccent && <span className="text-foil">{accent}</span>}
      </Tag>
      {lead && (
        <p className={cn("mt-4 text-lg text-pretty", invert ? "text-white/70" : "text-ink-soft")}>
          {lead}
        </p>
      )}
    </div>
  );
}
