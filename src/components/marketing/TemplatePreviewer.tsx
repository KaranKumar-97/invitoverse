"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhoneFrame } from "./PhoneFrame";
import { TrackedLink } from "./TrackedLink";

type Props = {
  slug: string;
  name: string;
  poster: string;
  palettes: Array<{ id: string; name: string; bg: string; accent: string }>;
  fontPairs: Array<{ id: string; name: string }>;
};

const DEVICES = {
  // 864 (not 844) fills the PhoneFrame screen exactly once its bezel padding is taken out.
  mobile: { width: 390, height: 864 },
  desktop: { width: 1440, height: 900 },
} as const;

/**
 * Live preview on the template detail page (docs/09 §5): the real demo route in an iframe,
 * scaled into a phone or desktop frame. Palette/font chips reload it with query params.
 * The iframe mounts only on large screens; phones get the poster and a full-screen link.
 */
export function TemplatePreviewer({ slug, name, poster, palettes, fontPairs }: Props) {
  const [large, setLarge] = useState<boolean | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICES>("mobile");
  const [palette, setPalette] = useState(palettes[0]?.id ?? "");
  const [font, setFont] = useState(fontPairs[0]?.id ?? "");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setLarge(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const query = new URLSearchParams({ palette, font }).toString();
  const demoHref = `/templates/${slug}/preview?${query}`;

  return (
    <div>
      {large ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div
              role="group"
              aria-label="Preview device"
              className="inline-flex rounded-full border border-line bg-surface p-1"
            >
              {(["mobile", "desktop"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  onClick={() => setDevice(d)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium",
                    device === d
                      ? "bg-primary text-primary-foreground"
                      : "text-ink-soft hover:text-ink",
                  )}
                >
                  {d === "mobile" ? (
                    <Smartphone className="size-4" />
                  ) : (
                    <Monitor className="size-4" />
                  )}
                  {d === "mobile" ? "Mobile" : "Desktop"}
                </button>
              ))}
            </div>
            <TrackedLink
              href={demoHref}
              event="cta_live_invite"
              data={{ from: "detail", template: slug }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon hover:underline"
            >
              <Maximize2 className="size-4" /> View full screen
            </TrackedLink>
          </div>
          {device === "mobile" ? (
            <PhoneFrame className="mx-auto w-[340px]">
              <ScaledFrame
                key={query}
                src={`${demoHref}&embed=1`}
                title={`${name} live preview`}
                {...DEVICES.mobile}
              />
            </PhoneFrame>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-float">
              <div className="flex h-8 items-center gap-1.5 border-b border-line px-3" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2.5 rounded-full bg-line" />
                ))}
              </div>
              <ScaledFrame
                key={query}
                src={`${demoHref}&embed=1`}
                title={`${name} live preview`}
                {...DEVICES.desktop}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center">
          <PhoneFrame className="w-[min(300px,74vw)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- poster is already sized for this frame */}
            <img
              src={poster}
              alt={`${name} invitation envelope`}
              className="size-full object-cover"
            />
          </PhoneFrame>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm lg:justify-start">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Palette</span>
          {palettes.map((p) => {
            const swatch = {
              background: `linear-gradient(135deg, ${p.bg} 50%, ${p.accent} 50%)`,
            };
            const ring = "size-7 rounded-full ring-2 ring-offset-2 ring-offset-canvas";
            // Phones have no inline preview: each swatch opens the full-screen demo in that palette.
            return large ? (
              <button
                key={p.id}
                type="button"
                title={p.name}
                aria-label={`Preview palette: ${p.name}`}
                aria-pressed={palette === p.id}
                onClick={() => setPalette(p.id)}
                className={cn(ring, palette === p.id ? "ring-ink" : "ring-transparent")}
                style={swatch}
              />
            ) : (
              <a
                key={p.id}
                href={`/templates/${slug}/preview?palette=${p.id}`}
                title={p.name}
                aria-label={`Open live demo in ${p.name}`}
                className={cn(ring, "ring-transparent")}
                style={swatch}
              />
            );
          })}
        </div>
        {large && fontPairs.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-muted-foreground">Fonts</span>
            {fontPairs.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={font === f.id}
                onClick={() => setFont(f.id)}
                className={cn(
                  "h-8 rounded-full px-3",
                  font === f.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-line bg-surface hover:border-ink/30",
                )}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** An iframe rendered at a fixed logical viewport and scaled to its container's width. */
function ScaledFrame({
  src,
  title,
  width,
  height,
}: {
  src: string;
  title: string;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{
        height: scale ? height * scale : undefined,
        aspectRatio: scale ? undefined : `${width}/${height}`,
      }}
    >
      {scale > 0 && (
        <iframe
          src={src}
          title={title}
          className="absolute top-0 left-0 origin-top-left border-0"
          style={{ width, height, transform: `scale(${scale})` }}
          allow="autoplay; fullscreen"
        />
      )}
    </div>
  );
}
