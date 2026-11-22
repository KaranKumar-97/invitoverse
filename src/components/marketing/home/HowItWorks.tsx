import Image from "next/image";
import { Check, CheckCheck } from "lucide-react";
import { templateMedia } from "@/lib/marketing/catalogue";
import { SITE } from "@/lib/marketing/site";
import { SectionHeading } from "./SectionHeading";

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

/* Small illustrations built from real template art — CSS transform/opacity motion only. */

const poster = (slug: string) => templateMedia(slug).poster;

/** A tiny phone showing a template's opening poster. */
function MiniPhone({
  slug,
  label,
  className,
  style,
  children,
}: {
  slug: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative aspect-[9/16] overflow-hidden rounded-[14px] bg-black shadow-float ring-[3px] ring-[#0f0d0c] ${className ?? ""}`}
      style={style}
    >
      <Image src={poster(slug)} alt={label ?? ""} fill sizes="120px" className="object-cover" />
      {children}
    </div>
  );
}

function PickArt() {
  const designs = [
    { slug: "mandir", tilt: "-9deg", x: "-58%", delay: "400ms" },
    { slug: "meenakshi", tilt: "0deg", x: "0%", delay: "0ms" },
    { slug: "royal-heritage", tilt: "9deg", x: "58%", delay: "800ms" },
  ];
  return (
    <div className="relative h-[78%] w-full" aria-hidden>
      {designs.map((d, i) => (
        <div
          key={d.slug}
          className="absolute top-1/2 left-1/2 h-full"
          style={{ transform: `translate(calc(-50% + ${d.x}), -50%)`, zIndex: i === 1 ? 2 : 1 }}
        >
          <MiniPhone
            slug={d.slug}
            className={`mk-float h-full ${i === 1 ? "" : "scale-[0.86] opacity-80"}`}
            style={{ "--tilt": d.tilt, "--delay": d.delay } as React.CSSProperties}
          >
            {i === 1 && (
              <span className="absolute right-1.5 bottom-1.5 grid size-6 place-items-center rounded-full bg-[#E7C77B] text-[#2A0E12] shadow-card">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
          </MiniPhone>
        </div>
      ))}
    </div>
  );
}

function EditArt() {
  const fields = [
    { label: "Bride", value: "Meera" },
    { label: "Groom", value: "Aarav", typing: true },
  ];
  return (
    <div className="flex h-[78%] w-[86%] items-center gap-4" aria-hidden>
      <div className="flex-1 space-y-2.5 rounded-lg border border-line bg-canvas p-3 shadow-card">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-[10px] font-medium text-muted-foreground">{f.label}</p>
            <p
              className={`mt-0.5 flex h-7 items-center rounded-md border px-2 text-xs font-medium ${
                f.typing ? "border-maroon/50 ring-2 ring-maroon/15" : "border-line"
              }`}
            >
              {f.value}
              {f.typing && <span className="mk-caret ml-px h-3.5 w-px bg-ink" />}
            </p>
          </div>
        ))}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {["Haldi", "Sangeet", "Wedding"].map((e) => (
            <span
              key={e}
              className="rounded-full bg-maroon-soft px-2 py-0.5 text-[10px] font-medium text-maroon"
            >
              {e}
            </span>
          ))}
        </div>
      </div>
      <div className="relative h-full">
        <MiniPhone slug="royal-heritage" className="h-full" />
        <span className="absolute -top-2 -right-2 rounded-full bg-[#E7C77B] px-2 py-0.5 text-[9px] font-semibold tracking-wide text-[#2A0E12] uppercase shadow-card">
          Live
        </span>
      </div>
    </div>
  );
}

/** WhatsApp-style chat. Fixed WhatsApp colours (with fixed text colours) in both themes. */
function ShareArt() {
  const host = new URL(SITE.url).host;
  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-2 bg-[#efe7dd] px-[9%] dark:bg-[#0b141a]"
      aria-hidden
    >
      <div className="ml-auto w-[78%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-1.5 text-[#111b21] shadow-card dark:bg-[#005c4b] dark:text-[#e9edef]">
        <div className="flex gap-2 rounded-lg bg-black/5 p-1.5 dark:bg-black/20">
          <div className="relative aspect-square w-11 shrink-0 overflow-hidden rounded-md">
            <Image
              src={templateMedia("royal-heritage").og}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 text-[10px] leading-tight">
            <p className="font-semibold">Meera &amp; Aarav — 13 Feb 2027</p>
            <p className="mt-0.5 truncate opacity-70">{host}</p>
          </div>
        </div>
        <p className="px-1 pt-1.5 text-[11px]">You&apos;re invited 💌</p>
        <p className="flex items-center justify-end gap-0.5 px-1 text-[9px] opacity-60">
          7:42 PM <CheckCheck className="size-3 text-[#53bdeb]" />
        </p>
      </div>
      <div
        className="mk-float w-[62%] rounded-xl rounded-tl-sm bg-white p-2 text-[11px] text-[#111b21] shadow-card dark:bg-[#202c33] dark:text-[#e9edef]"
        style={{ "--delay": "900ms" } as React.CSSProperties}
      >
        So beautiful! See you at the Sangeet 🎶
      </div>
    </div>
  );
}
