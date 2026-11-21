"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  name: string;
  palettes: Array<{ id: string; name: string; swatch: [string, string] }>;
  fontPairs: Array<{ id: string; name: string }>;
  current: { palette: string; font: string; guest: boolean };
};

/** Floating control bar on template demos: palette, fonts, guest view, and the "Use this design" CTA. */
export function DemoBar({ slug, name, palettes, fontPairs, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center p-2 font-sans sm:p-3">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-white/15 bg-[#17130f]/85 px-3 py-2 text-white shadow-2xl backdrop-blur-xl sm:px-4",
          pending && "opacity-80",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-white/60 sm:inline">Live demo</span>
          <span className="truncate text-sm font-medium">{name}</span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white/70 hover:bg-white/10"
            aria-expanded={expanded}
          >
            Customize{" "}
            <ChevronDown
              className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
            />
          </button>
          <Link
            href={`/dashboard/invitations/new?template=${slug}`}
            className="ml-auto shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-[#17130f] hover:bg-white/90 sm:text-sm"
          >
            Use this design
          </Link>
          <button
            type="button"
            onClick={() => setHidden(true)}
            aria-label="Hide demo bar"
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {expanded && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-3 pb-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/60">Palette</span>
              {palettes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set("palette", p.id)}
                  title={p.name}
                  aria-label={`Palette: ${p.name}`}
                  aria-pressed={current.palette === p.id}
                  className={cn(
                    "size-6 rounded-full ring-2 ring-offset-2 ring-offset-[#17130f]",
                    current.palette === p.id ? "ring-white" : "ring-transparent",
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${p.swatch[0]} 50%, ${p.swatch[1]} 50%)`,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="mr-0.5 text-white/60">Fonts</span>
              {fontPairs.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => set("font", f.id)}
                  aria-pressed={current.font === f.id}
                  className={cn(
                    "rounded-full px-2.5 py-1",
                    current.font === f.id
                      ? "bg-white text-[#17130f]"
                      : "bg-white/10 hover:bg-white/20",
                  )}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={current.guest}
                onChange={(e) => set("guest", e.target.checked ? "1" : null)}
                className="accent-white"
              />
              <span>Personal guest view</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
