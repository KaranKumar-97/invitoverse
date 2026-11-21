import { ABOUT } from "@/lib/marketing/content";
import { SectionHeading } from "./SectionHeading";

export function About({ standalone = false }: { standalone?: boolean }) {
  const ValueHeading = standalone ? "h2" : "h3";
  return (
    <section
      id="about"
      className="mk-auto-hide scroll-mt-20 border-y border-line bg-surface py-20 sm:py-24"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionHeading eyebrow="About us" title={ABOUT.lead} as={standalone ? "h1" : "h2"} />
          <div className="mt-6 space-y-4 text-lg text-ink-soft">
            {ABOUT.body.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </div>
        </div>
        <ul className="grid content-center gap-4">
          {ABOUT.values.map((v, i) => (
            <li
              key={v.title}
              className="flex gap-5 rounded-xl border border-line bg-canvas p-6 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-float"
            >
              <span className="font-display text-3xl font-semibold text-[var(--gold-ink)]">
                0{i + 1}
              </span>
              <div>
                <ValueHeading className="text-lg font-semibold">{v.title}</ValueHeading>
                <p className="mt-1 text-ink-soft">{v.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
