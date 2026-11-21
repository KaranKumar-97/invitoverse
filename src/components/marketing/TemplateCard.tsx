"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CatalogueItem, ComingSoonItem } from "@/lib/marketing/catalogue";
import { track } from "@/lib/analytics";
import { LoopVideo } from "./LoopVideo";

/** Catalogue card: 9:16 live loop of the template's opening + name, style and palette swatches. */
export function TemplateCard({
  item,
  priority = false,
}: {
  item: CatalogueItem;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/templates/${item.slug}`}
      onClick={() => track("template_card_click", { template: item.slug })}
      className="group block rounded-xl focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted shadow-card transition-[transform,box-shadow] duration-300 lg:group-hover:-translate-y-1 lg:group-hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--gold-1)_60%,transparent),var(--shadow-float)]">
        <LoopVideo
          poster={item.media.poster}
          mp4={item.media.mp4}
          webm={item.media.webm}
          label={`${item.name} invitation opening`}
          lazy={!priority}
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold tracking-tight">{item.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.styleLabel}</p>
        </div>
        <div className="mt-1.5 flex shrink-0 -space-x-1.5" aria-hidden>
          {item.swatches.map((s) => (
            <span
              key={s.id}
              className="size-4 rounded-full ring-2 ring-canvas"
              style={{ background: `linear-gradient(135deg, ${s.bg} 50%, ${s.accent} 50%)` }}
            />
          ))}
        </div>
      </div>
      <span className="mt-2 inline-flex items-center gap-1 px-1 text-sm font-medium text-maroon">
        View design
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function ComingSoonCard({ item }: { item: ComingSoonItem }) {
  const { bg, accent, text } = item.colors;
  return (
    <div aria-label={`${item.name}, coming soon`}>
      <div
        className="relative grid aspect-[9/16] place-items-center overflow-hidden rounded-xl p-6 text-center shadow-card"
        style={{ background: bg, color: text }}
      >
        <div
          aria-hidden
          className="absolute inset-4 rounded-lg border opacity-40"
          style={{ borderColor: accent }}
        />
        <div className="relative">
          <p
            className="text-[11px] font-semibold tracking-[0.3em] uppercase"
            style={{ color: text }}
          >
            Coming soon
          </p>
          <p className="mt-4 font-display text-3xl leading-tight font-semibold">
            {item.name.split(" ").map((w) => (
              <span key={w} className="block">
                {w}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className="mt-4 px-1">
        <p className="font-display text-xl font-semibold tracking-tight text-ink-soft">
          {item.name}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{item.styleLabel} · Coming soon</p>
      </div>
    </div>
  );
}
