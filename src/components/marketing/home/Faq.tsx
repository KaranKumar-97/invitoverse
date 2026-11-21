import { Plus } from "lucide-react";
import { FAQ } from "@/lib/marketing/content";
import { SectionHeading } from "./SectionHeading";

/** Accordion built on <details> — accessible and zero JavaScript. */
export function Faq() {
  return (
    <section id="faq" className="mk-auto-hide scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" accent="answered" />
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-lg font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
              </summary>
              <p className="pr-8 pb-5 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
