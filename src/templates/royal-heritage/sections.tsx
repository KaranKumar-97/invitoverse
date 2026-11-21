"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { coupleTitle, monogram, orderedNames } from "@/lib/invitation/couple";
import { dateParts, formatLongDate, formatTimeRange } from "@/lib/invitation/dates";
import { useCountdown } from "@/invitation-kit/countdown/useCountdown";
import { EventActions } from "@/invitation-kit/events/EventActions";
import { EventIcon } from "@/invitation-kit/events/EventIcon";
import { Gallery } from "@/invitation-kit/media/Gallery";
import { KitImage } from "@/invitation-kit/media/KitImage";
import { VideoBlock } from "@/invitation-kit/media/VideoBlock";
import { Reveal } from "@/invitation-kit/motion/Reveal";
import type { SectionProps } from "@/invitation-kit/types";
import { ArchFrame, InvocationArt, MandalaCorner, Ornament, Seal } from "./decor";

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <Reveal className="mb-10 text-center">
      {eyebrow && <p className="rh-eyebrow">{eyebrow}</p>}
      <h2 className="rh-heading rh-foil mt-3 text-[1.65rem] leading-tight sm:text-3xl">{title}</h2>
      <Ornament className="mx-auto mt-4" />
    </Reveal>
  );
}

const wrap = "px-5 py-16 sm:px-8 sm:py-20";

export function Hero({ data }: SectionProps) {
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  const p = dateParts(c.weddingDate);
  return (
    <section className="relative flex min-h-dvh items-center justify-center px-5 py-16">
      {Boolean(data.options.showMandalaBorder) && (
        <>
          <MandalaCorner className="absolute top-0 left-0" />
          <MandalaCorner className="absolute top-0 right-0 -scale-x-100" />
        </>
      )}
      <div className="relative w-full max-w-[440px] px-7 pt-24 pb-14 text-center">
        <ArchFrame />
        {Boolean(data.options.showInvocationArt) && (
          <Reveal y={10}>
            <InvocationArt className="mx-auto" />
          </Reveal>
        )}
        {c.invocation && (
          <Reveal delay={0.1} as="p" className="mt-2 text-lg text-[var(--c-accent)]">
            {c.invocation}
          </Reveal>
        )}
        <Reveal delay={0.2} as="p" className="rh-eyebrow mt-8">
          The wedding of
        </Reveal>
        <h1 id="invite-title" tabIndex={-1} className="mt-5 outline-none">
          <Reveal
            as="span"
            delay={0.3}
            y={30}
            className="rh-foil f-display block text-[clamp(2.5rem,12.5vw,4.4rem)] leading-[1.08]"
          >
            {first}
          </Reveal>
          <Reveal
            as="span"
            delay={0.45}
            scaleFrom={0.7}
            className="f-script my-1 block text-[clamp(2.4rem,11vw,3.6rem)] leading-none text-[var(--c-accent)]"
          >
            &amp;
          </Reveal>
          <Reveal
            as="span"
            delay={0.6}
            y={30}
            className="rh-foil f-display block text-[clamp(2.5rem,12.5vw,4.4rem)] leading-[1.08]"
          >
            {second}
          </Reveal>
        </h1>
        <Reveal delay={0.75}>
          <Ornament className="mx-auto mt-8" />
        </Reveal>
        <Reveal
          delay={0.85}
          className="rh-heading mt-6 flex items-center justify-center gap-3 text-[var(--c-text)] sm:gap-4"
        >
          <span className="w-[6.5rem] border-y border-[color-mix(in_srgb,var(--c-accent)_50%,transparent)] py-2 text-[0.68rem] tracking-[0.22em]">
            {p.weekday}
          </span>
          <span className="rh-foil f-display text-5xl leading-none">{p.day}</span>
          <span className="w-[6.5rem] border-y border-[color-mix(in_srgb,var(--c-accent)_50%,transparent)] py-2 text-[0.68rem] tracking-[0.22em]">
            {p.month} {p.year}
          </span>
        </Reveal>
        {c.city && (
          <Reveal delay={0.95} as="p" className="rh-eyebrow mt-6">
            {c.city}
          </Reveal>
        )}
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
      <Reveal className="rh-card mx-auto max-w-md px-7 py-10 text-center sm:px-10">
        {g ? (
          <p className="f-script text-[2.2rem] leading-tight text-[var(--c-accent)]">
            {g.greeting || `Dear ${g.displayName},`}
          </p>
        ) : (
          <p className="rh-eyebrow">Together with their families</p>
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
            {fam.label && <p className="rh-eyebrow">{fam.label}</p>}
            {fam.lines.map((l) => (
              <p key={l} className="f-heading mt-3 text-lg leading-snug">
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
      <SectionTitle
        eyebrow="The auspicious day"
        title={v?.isPast ? "The celebrations have begun" : "Counting the moments"}
      />
      {!v?.isPast && (
        <Reveal
          className="mx-auto grid max-w-md grid-cols-4 gap-2.5 sm:gap-4"
          role="timer"
          aria-live="off"
        >
          {cells.map(([label, n]) => (
            <div
              key={label}
              className="rounded-t-full border px-1 pt-7 pb-3 text-center"
              style={{
                borderColor: "color-mix(in srgb, var(--c-accent) 55%, transparent)",
                background: "color-mix(in srgb, var(--c-surface) 70%, transparent)",
              }}
            >
              <span className="rh-foil f-display block text-3xl tabular-nums sm:text-4xl">
                {n === undefined ? "––" : String(n).padStart(2, "0")}
              </span>
              <span className="rh-eyebrow mt-1 block text-[0.6rem] tracking-[0.2em]">{label}</span>
            </div>
          ))}
        </Reveal>
      )}
    </section>
  );
}

export function Events({ data }: SectionProps) {
  return (
    <section className={wrap}>
      <SectionTitle eyebrow="Join us for" title="The Festivities" />
      <ol className="mx-auto flex max-w-md flex-col gap-10">
        {data.content.events.map((e, i) => (
          <Reveal as="li" key={e.id} delay={Math.min(i * 0.05, 0.2)}>
            <article className="rh-card rounded-t-[999px] px-6 pt-16 pb-9 text-center sm:px-9">
              <span
                className="mx-auto grid size-12 place-items-center rounded-full border text-[var(--c-accent)]"
                style={{ borderColor: "color-mix(in srgb, var(--c-accent) 60%, transparent)" }}
              >
                <EventIcon icon={e.icon} className="size-5" />
              </span>
              <h3 className="rh-heading rh-foil mt-5 text-2xl">{e.name}</h3>
              <p className="mt-3 text-lg">
                <time dateTime={`${e.date}T${e.startTime}`}>{formatLongDate(e.date)}</time>
              </p>
              <p className="text-[var(--c-muted)]">{formatTimeRange(e.startTime, e.endTime)}</p>
              <Ornament className="mx-auto my-5 w-32" />
              <p className="f-heading text-base tracking-wide">{e.venue.name}</p>
              {e.venue.address && (
                <p className="mt-1 text-sm text-[var(--c-muted)]">{e.venue.address}</p>
              )}
              {e.description && <p className="mt-4 leading-relaxed italic">{e.description}</p>}
              {e.dressCode && (
                <p
                  className="rh-heading mt-4 inline-block rounded-full border px-3 py-1 text-[0.65rem]"
                  style={{ borderColor: "color-mix(in srgb, var(--c-accent) 45%, transparent)" }}
                >
                  Dress code · {e.dressCode}
                </p>
              )}
              <EventActions event={e} className="mt-6 justify-center" buttonClassName="rh-button" />
            </article>
          </Reveal>
        ))}
      </ol>
    </section>
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
      {photos.length === 1 && (
        <Reveal
          scaleFrom={0.96}
          className="mx-auto max-w-sm overflow-hidden rounded-t-full border p-1.5"
          style={{ borderColor: "var(--c-accent)" }}
        >
          <KitImage
            media={photos[0]}
            sizes="(min-width: 640px) 384px, 90vw"
            className="aspect-[3/4] w-full rounded-t-full"
          />
        </Reveal>
      )}
      <div className="mt-10 grid gap-10 text-center sm:grid-cols-2 sm:gap-8">
        {people.map((p, i) => (
          <Reveal key={p.firstName + i} delay={i * 0.12}>
            {photos.length > 1 && photos[i] && (
              <div
                className="mx-auto mb-5 max-w-[240px] overflow-hidden rounded-t-full border p-1"
                style={{ borderColor: "var(--c-accent)" }}
              >
                <KitImage
                  media={photos[i]}
                  sizes="240px"
                  className="aspect-[3/4] w-full rounded-t-full"
                />
              </div>
            )}
            <h3 className="f-display rh-foil text-3xl">
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
      <SectionTitle eyebrow="Glimpses" title="Cherished Moments" />
      <Gallery
        images={images}
        variant="masonry"
        itemClassName="rounded-[2px] border p-1 border-[color-mix(in_srgb,var(--c-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--c-surface)_70%,transparent)]"
      />
    </section>
  );
}

export function Video({ data }: SectionProps) {
  const v = data.content.media.video;
  if (!v) return null;
  return (
    <section className={wrap}>
      <SectionTitle eyebrow="A little film" title="Our Story" />
      <Reveal
        className="overflow-hidden rounded-[2px] border p-1.5"
        style={{ borderColor: "color-mix(in srgb, var(--c-accent) 50%, transparent)" }}
      >
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
        <Ornament className="mx-auto" />
        <p className="inv-pre-line mx-auto mt-8 max-w-md text-xl leading-relaxed italic sm:text-2xl">
          {m.invitation}
        </p>
        <Ornament className="mx-auto mt-8" />
      </Reveal>
    </section>
  );
}

export function Footer({ data }: SectionProps) {
  const c = data.content;
  return (
    <footer className="relative px-5 pt-16 pb-28 text-center">
      {Boolean(data.options.showMandalaBorder) && (
        <>
          <MandalaCorner className="absolute bottom-0 left-0 -scale-y-100 opacity-70" />
          <MandalaCorner className="absolute right-0 bottom-0 -scale-100 opacity-70" />
        </>
      )}
      <Reveal className="relative">
        <Seal monogram={monogram(c.couple)} variant="medallion" className="mx-auto size-20" />
        <p className="f-script mt-8 text-3xl text-[var(--c-accent)]">With love</p>
        {c.messages.closing && (
          <p className="mx-auto mt-3 max-w-sm text-lg">{c.messages.closing}</p>
        )}
        {c.hashtag && <p className="rh-heading rh-foil mt-8 text-lg">{c.hashtag}</p>}
        <p className="rh-eyebrow mt-12 text-[0.6rem] opacity-70">
          Made with{" "}
          <Link href="/?ref=invite" className="underline-offset-4 hover:underline">
            Vivah Studio
          </Link>
        </p>
      </Reveal>
    </footer>
  );
}
