import { SectionHeading } from "./SectionHeading";
import { SITE } from "@/lib/marketing/site";

const STEPS = [
  {
    title: "Pick a design",
    text: "Signature designs, each with its own opening moment.",
    art: <PickArt />,
  },
  {
    title: "Make it yours",
    text: "Names, events, photos, music. See every change live.",
    art: <EditArt />,
  },
  {
    title: "Share with everyone",
    text: "One link for all, or a personal link for each family.",
    art: <ShareArt />,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mk-auto-hide scroll-mt-20 border-y border-line bg-surface bg-[radial-gradient(800px_300px_at_50%_0%,color-mix(in_srgb,var(--gold-2)_16%,transparent),transparent)] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From idea to WhatsApp in an evening"
          accent="in an evening"
          center
        />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="rounded-xl border border-line bg-canvas p-6 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-float"
            >
              <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-lg bg-surface">
                {s.art}
              </div>
              <p className="mt-6 text-sm font-semibold text-maroon">Step {i + 1}</p>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* Small looping illustrations — CSS transform/opacity only. */
function PickArt() {
  return (
    <div className="flex items-end gap-3" aria-hidden>
      {["#2A0E12", "#F4EFE6", "#7A1F2B"].map((c, i) => (
        <div
          key={c}
          className="mk-float h-28 w-16 rounded-lg shadow-card ring-1 ring-black/5"
          style={
            {
              background: c,
              "--delay": `${i * 500}ms`,
              "--tilt": `${(i - 1) * 6}deg`,
            } as React.CSSProperties
          }
        >
          {i === 1 && <div className="mx-auto mt-10 size-5 rounded-full border-2 border-maroon" />}
        </div>
      ))}
    </div>
  );
}

function EditArt() {
  return (
    <div className="flex w-[78%] gap-3" aria-hidden>
      <div className="flex-1 space-y-2 rounded-lg border border-line p-3">
        <div className="h-2 w-1/2 rounded bg-line" />
        <div className="h-6 rounded border border-maroon/40 bg-maroon-soft/50" />
        <div className="h-2 w-2/3 rounded bg-line" />
        <div className="h-6 rounded border border-line" />
      </div>
      <div className="grid w-16 place-items-center rounded-lg bg-[#2A0E12] px-1 text-center">
        <span className="mk-float font-display text-[11px] leading-tight text-[#E7C77B]">
          Meera
          <br />
          &amp;
          <br />
          Aarav
        </span>
      </div>
    </div>
  );
}

function ShareArt() {
  return (
    <div className="w-[70%] space-y-2" aria-hidden>
      <div className="ml-auto w-4/5 rounded-xl rounded-br-sm bg-[#dcf8c6] p-2.5 text-[11px] text-ink shadow-card">
        <p className="font-semibold">You&apos;re invited 💌</p>
        <p className="truncate text-[10px] text-ink-soft">{new URL(SITE.url).host}/i/meera-aarav</p>
      </div>
      <div
        className="mk-float w-3/5 rounded-xl rounded-bl-sm bg-surface p-2.5 text-[11px] shadow-card ring-1 ring-line"
        style={{ "--delay": "900ms" } as React.CSSProperties}
      >
        So beautiful! See you at the Sangeet 🎶
      </div>
    </div>
  );
}
