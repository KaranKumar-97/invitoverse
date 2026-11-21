export type LegalSection = { title: string; body: string[] };

/** Simple static legal page (docs/09 §1). */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-eyebrow text-maroon">Legal</p>
      <h1 className="text-display-l mt-3">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>
      <p className="mt-8 text-lg text-ink-soft">{intro}</p>
      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed text-ink-soft">
              {s.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
