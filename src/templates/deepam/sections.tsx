"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { coupleTitle, orderedNames } from "@/lib/invitation/couple";
import { dateParts, formatLongDate, formatTimeRange } from "@/lib/invitation/dates";
import { useCountdown } from "@/invitation-kit/countdown/useCountdown";
import { EventActions } from "@/invitation-kit/events/EventActions";
import { EventIcon } from "@/invitation-kit/events/EventIcon";
import { Gallery } from "@/invitation-kit/media/Gallery";
import { KitImage } from "@/invitation-kit/media/KitImage";
import { VideoBlock } from "@/invitation-kit/media/VideoBlock";
import { Reveal } from "@/invitation-kit/motion/Reveal";
import { ScrollMotion } from "@/invitation-kit/motion/ScrollMotion";
import { ScratchReveal } from "@/invitation-kit/interactive/ScratchReveal";
import type { SectionProps } from "@/invitation-kit/types";
import { Gopuram, Kalash, KolamRing, Lamp, LotusDivider, Toran } from "./decor";

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <Reveal className="mb-10 text-center">
      {eyebrow && <p className="dp-eyebrow">{eyebrow}</p>}
      <h2 className="dp-heading dp-glow-text mt-3 text-[1.75rem] leading-tight sm:text-[2rem]">
        {title}
      </h2>
      <LotusDivider className="mx-auto mt-4" />
    </Reveal>
  );
}

const wrap = "px-5 py-16 sm:px-8 sm:py-20";

/** Scroll-driven motion when the template option is on; a plain wrapper otherwise. */
function HeroMotion({
  on,
  to,
  children,
  className,
}: {
  on: boolean;
  to: { y?: number; scale?: number; opacity?: number };
  children: React.ReactNode;
  className?: string;
}) {
  return on ? (
    <ScrollMotion to={to} className={className}>
      {children}
    </ScrollMotion>
  ) : (
    <div className={className}>{children}</div>
  );
}

export function Hero({ data }: SectionProps) {
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  const p = dateParts(c.weddingDate);
  return (
    <section className="relative flex min-h-dvh flex-col items-center px-5 pb-24 text-center">
      {Boolean(data.options.showToran) && (
        <Toran className="absolute top-0 left-1/2 max-w-[440px] -translate-x-1/2" />
      )}
      <div className="relative mt-20 flex w-full max-w-[460px] flex-1 flex-col items-center justify-center">
        {c.invocation && (
          <Reveal y={10} as="p" className="text-lg text-[var(--c-accent)]">
            {c.invocation}
          </Reveal>
        )}
        {Boolean(data.options.showGopuram) && (
          <Reveal delay={0.1} scaleFrom={0.94} className="relative mt-6 w-[min(64vw,250px)]">
            <div
              aria-hidden="true"
              className="absolute inset-x-[-30%] top-[20%] bottom-[-10%] rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in srgb, var(--c-accent) 28%, transparent), transparent)",
              }}
            />
            <HeroMotion on={Boolean(data.options.scrollMotion)} to={{ scale: 1.4, y: 40 }}>
              <Gopuram
                className="relative w-full"
                lit
                // Tower colour: accent mixed with temple-stone brown, so it reads as stone on every palette.
                style={{ color: "color-mix(in srgb, var(--c-accent) 45%, #3a2416)" }}
              />
            </HeroMotion>
          </Reveal>
        )}
        <Reveal delay={0.2} as="p" className="dp-eyebrow mt-8">
          The wedding of
        </Reveal>
        <h1 id="invite-title" tabIndex={-1} className="mt-4 outline-none">
          <Reveal
            as="span"
            delay={0.3}
            y={26}
            className="f-display dp-glow-text block text-[clamp(2.6rem,12vw,4.2rem)] leading-[1.05]"
          >
            {first}
          </Reveal>
          <Reveal
            as="span"
            delay={0.42}
            scaleFrom={0.7}
            className="f-script my-1 block text-[clamp(2.2rem,10vw,3.2rem)] leading-none text-[var(--c-text)]"
          >
            &amp;
          </Reveal>
          <Reveal
            as="span"
            delay={0.54}
            y={26}
            className="f-display dp-glow-text block text-[clamp(2.6rem,12vw,4.2rem)] leading-[1.05]"
          >
            {second}
          </Reveal>
        </h1>
        <Reveal delay={0.7} className="mt-7 flex flex-col items-center">
          <LotusDivider />
          <p className="dp-heading mt-4 text-lg tracking-[0.12em] sm:text-xl">
            {p.weekday} · {p.day} {p.month} {p.year}
          </p>
          {c.city && <p className="dp-eyebrow mt-3">{c.city}</p>}
        </Reveal>
      </div>
      <ChevronDown
        data-ambient
        aria-hidden="true"
        className="absolute bottom-6 left-1/2 size-5 -translate-x-1/2 text-[var(--c-accent)] opacity-70"
        style={{ animation: "vs-float 2.4s ease-in-out infinite" }}
      />
    </section>
  );
}

export function Greeting({ data }: SectionProps) {
  const g = data.guest;
  return (
    <section className={wrap}>
      <Reveal className="dp-card dp-scallop mx-auto max-w-md px-7 pt-14 pb-10 text-center sm:px-10">
        <Lamp className="absolute top-0 left-1/2 h-14 w-16 -translate-x-1/2 -translate-y-1/2" />
        {g ? (
          <p className="f-script text-[2.2rem] leading-tight text-[var(--c-accent)]">
            {g.greeting || `Dear ${g.displayName},`}
          </p>
        ) : (
          <p className="dp-eyebrow">Together with their families</p>
        )}
        <p className="mt-5 text-lg leading-relaxed sm:text-xl">{data.content.messages.welcome}</p>
        {g?.personalNote && (
          <p className="mt-6 text-base text-[var(--c-muted)] italic">“{g.personalNote}”</p>
        )}
      </Reveal>
    </section>
  );
}

export function Families({ data }: SectionProps) {
  const { families, couple } = data.content;
  const sides =
    couple.order === "GROOM_FIRST"
      ? [families.groom, families.bride]
      : [families.bride, families.groom];
  return (
    <section className={wrap}>
      <SectionTitle eyebrow="With the blessings of" title="Our Families" />
      <div className="grid gap-10 text-center sm:grid-cols-2 sm:gap-6">
        {sides.map((fam, i) => (
          <Reveal key={i} delay={i * 0.12}>
            {fam.label && <p className="dp-eyebrow">{fam.label}</p>}
            {fam.lines.map((l) => (
              <p key={l} className="dp-heading mt-3 text-lg leading-snug">
                {l}
              </p>
            ))}
            {fam.grandparents.length > 0 && (
              <p className="mt-4 text-sm text-[var(--c-muted)] italic">
                Grandchild of {fam.grandparents.join(" and ")}
              </p>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Scratch the brass foil to reveal the wedding date. */
function SaveTheDate({ data }: { data: SectionProps["data"] }) {
  const p = dateParts(data.content.weddingDate);
  return (
    <Reveal className="mb-16 flex flex-col items-center text-center">
      <p className="dp-eyebrow">Mark your calendar</p>
      <h2 className="dp-heading dp-glow-text mt-3 text-[1.75rem] sm:text-[2rem]">Save the Date</h2>
      <LotusDivider className="mx-auto mt-4" />
      <ScratchReveal
        className="mt-7 w-[min(84vw,330px)] rounded-[28px]"
        label="Scratch to reveal the date"
        tapLabel="Or tap to reveal"
        tapClassName="text-[var(--c-muted)]"
      >
        <div className="dp-card flex aspect-[1.6/1] flex-col items-center justify-center px-6">
          <p className="dp-eyebrow">{p.weekday}</p>
          <p className="f-display dp-glow-text mt-1 text-6xl leading-none">{p.day}</p>
          <p className="dp-heading mt-2 tracking-[0.2em] uppercase">
            {p.month} · {p.year}
          </p>
          {data.content.city && (
            <p className="mt-2 text-sm text-[var(--c-muted)] italic">{data.content.city}</p>
          )}
        </div>
      </ScratchReveal>
    </Reveal>
  );
}

export function Countdown({ data }: SectionProps) {
  const v = useCountdown(data.countdownTo);
  const cells: Array<[string, number | undefined]> = [
    ["Days", v?.days],
    ["Hours", v?.hours],
    ["Minutes", v?.minutes],
    ["Seconds", v?.seconds],
  ];
  return (
    <section className={wrap}>
      {Boolean(data.options.scratchDate) && <SaveTheDate data={data} />}
      <SectionTitle
        eyebrow="The auspicious muhurtham"
        title={v?.isPast ? "The celebrations have begun" : "Counting the moments"}
      />
      {!v?.isPast && (
        <Reveal
          className="mx-auto grid max-w-md grid-cols-4 gap-2.5 sm:gap-4"
          role="timer"
          aria-live="off"
        >
          {cells.map(([label, n], i) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-2xl border px-1 pt-2 pb-3 text-center"
              style={{
                borderColor: "color-mix(in srgb, var(--c-accent) 45%, transparent)",
                background: "color-mix(in srgb, var(--c-surface) 75%, transparent)",
              }}
            >
              <Lamp className="h-9 w-10" flicker={i % 2 === 0} />
              <span className="f-display dp-glow-text mt-1 block text-3xl tabular-nums sm:text-4xl">
                {n === undefined ? "––" : String(n).padStart(2, "0")}
              </span>
              <span className="dp-eyebrow mt-1 block text-[0.6rem] tracking-[0.18em]">{label}</span>
            </div>
          ))}
        </Reveal>
      )}
    </section>
  );
}

/** Lamp-lit timeline: a thread of light with a lamp marking each function. */
export function Events({ data }: SectionProps) {
  return (
    <section className={wrap}>
      <SectionTitle eyebrow="Join us for" title="The Celebrations" />
      <ol className="relative mx-auto max-w-md">
        <span
          aria-hidden="true"
          className="absolute top-4 bottom-4 left-[22px] w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent, color-mix(in srgb, var(--c-accent) 60%, transparent) 8%, color-mix(in srgb, var(--c-accent) 60%, transparent) 92%, transparent)",
          }}
        />
        {data.content.events.map((e, i) => (
          <Reveal
            as="li"
            key={e.id}
            delay={Math.min(i * 0.05, 0.2)}
            className="relative pb-10 pl-14 last:pb-0"
          >
            <Lamp className="absolute top-0 left-0 h-10 w-11" flicker={i % 2 === 0} />
            <article className="dp-card px-6 py-7 sm:px-8">
              <div className="flex items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full border text-[var(--c-accent)]"
                  style={{ borderColor: "color-mix(in srgb, var(--c-accent) 55%, transparent)" }}
                >
                  <EventIcon icon={e.icon} className="size-[18px]" />
                </span>
                <h3 className="dp-heading dp-glow-text text-[1.4rem] leading-tight">{e.name}</h3>
              </div>
              <p className="mt-4 text-lg">
                <time dateTime={`${e.date}T${e.startTime}`}>{formatLongDate(e.date)}</time>
              </p>
              <p className="text-[var(--c-muted)]">{formatTimeRange(e.startTime, e.endTime)}</p>
              <p className="dp-heading mt-4 text-base">{e.venue.name}</p>
              {e.venue.address && (
                <p className="mt-1 text-sm text-[var(--c-muted)]">{e.venue.address}</p>
              )}
              {e.description && <p className="mt-4 leading-relaxed italic">{e.description}</p>}
              {e.dressCode && (
                <p
                  className="dp-eyebrow mt-4 inline-block rounded-full border px-3 py-1 text-[0.62rem] tracking-[0.18em]"
                  style={{ borderColor: "color-mix(in srgb, var(--c-accent) 45%, transparent)" }}
                >
                  Dress code · {e.dressCode}
                </p>
              )}
              <EventActions event={e} className="mt-6" buttonClassName="dp-button" />
            </article>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

/** Circular portrait framed by a kolam ring. */
function KolamPortrait({
  media,
  size,
}: {
  media: Parameters<typeof KitImage>[0]["media"];
  size: string;
}) {
  return (
    <div className="relative mx-auto aspect-square" style={{ width: size }}>
      <div className="absolute -inset-[9%] text-[var(--c-accent)]" aria-hidden="true">
        <KolamRing r={88} petals={20} dot={1.6} className="h-full w-full" />
      </div>
      <KitImage
        media={media}
        sizes={size}
        className="aspect-square w-full overflow-hidden rounded-full border-2 border-[color-mix(in_srgb,var(--c-accent)_70%,transparent)]"
      />
    </div>
  );
}

export function Couple({ data }: SectionProps) {
  const { couple, media } = data.content;
  const people =
    couple.order === "GROOM_FIRST" ? [couple.groom, couple.bride] : [couple.bride, couple.groom];
  const photos = media.couplePhotos;
  return (
    <section className={wrap}>
      <SectionTitle eyebrow="The bride & groom" title={coupleTitle(couple)} />
      {photos.length === 1 && photos[0] && (
        <Reveal scaleFrom={0.95}>
          <KolamPortrait media={photos[0]} size="min(70vw, 300px)" />
        </Reveal>
      )}
      <div className="mt-12 grid gap-10 text-center sm:grid-cols-2 sm:gap-8">
        {people.map((p, i) => (
          <Reveal key={p.firstName + i} delay={i * 0.12}>
            {photos.length > 1 && photos[i] && (
              <div className="mb-8">
                <KolamPortrait media={photos[i]} size="200px" />
              </div>
            )}
            <h3 className="f-display dp-glow-text text-3xl">
              {p.firstName} {p.lastName}
            </h3>
            {p.shortBio && (
              <p className="mt-3 leading-relaxed text-[var(--c-muted)] italic">{p.shortBio}</p>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function GallerySection({ data }: SectionProps) {
  const images = [...data.content.media.gallery, ...data.content.media.familyPhotos];
  return (
    <section className={wrap}>
      <SectionTitle eyebrow="Glimpses" title="Moments of Light" />
      {String(data.options.galleryStyle ?? "carousel") === "grid" ? (
        <Gallery
          images={images}
          variant="grid"
          itemClassName="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--c-accent)_40%,transparent)]"
        />
      ) : (
        <Gallery images={images} variant="carousel" />
      )}
    </section>
  );
}

export function Video({ data }: SectionProps) {
  const v = data.content.media.video;
  if (!v) return null;
  return (
    <section className={wrap}>
      <SectionTitle eyebrow="A little film" title="Our Story" />
      <Reveal className="dp-card overflow-hidden p-2">
        <VideoBlock video={v} />
      </Reveal>
    </section>
  );
}

export function Message({ data }: SectionProps) {
  const m = data.content.messages;
  if (!m.invitation) return null;
  return (
    <section className={`${wrap} text-center`}>
      <Reveal>
        <div className="flex items-end justify-center gap-6" aria-hidden="true">
          <Lamp className="h-9 w-10" />
          <Lamp className="h-12 w-14" />
          <Lamp className="h-9 w-10" flicker={false} />
        </div>
        <p className="inv-pre-line mx-auto mt-8 max-w-md text-xl leading-relaxed italic sm:text-2xl">
          {m.invitation}
        </p>
        <LotusDivider className="mx-auto mt-8" />
      </Reveal>
    </section>
  );
}

export function Footer({ data }: SectionProps) {
  const c = data.content;
  return (
    <footer className="relative px-5 pt-16 pb-28 text-center">
      <Reveal className="relative">
        <Kalash className="mx-auto h-28 w-24" />
        <p className="f-script mt-6 text-3xl text-[var(--c-accent)]">With love</p>
        {c.messages.closing && (
          <p className="mx-auto mt-3 max-w-sm text-lg">{c.messages.closing}</p>
        )}
        {c.hashtag && <p className="dp-heading dp-glow-text mt-8 text-lg">{c.hashtag}</p>}
        <p className="dp-eyebrow mt-12 text-[0.6rem] opacity-80">
          Made with{" "}
          <Link href="/?ref=invite" className="underline-offset-4 hover:underline">
            {BRAND.name}
          </Link>
        </p>
      </Reveal>
    </footer>
  );
}
