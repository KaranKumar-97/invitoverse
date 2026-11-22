"use client";

/* eslint-disable @next/next/no-img-element -- painted scene art, sized by layout */
import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { coupleTitle, orderedNames } from "@/lib/invitation/couple";
import { dateParts, formatLongDate, formatTimeRange } from "@/lib/invitation/dates";
import { useInvitation } from "@/invitation-kit/context";
import { useCountdown } from "@/invitation-kit/countdown/useCountdown";
import { EventActions } from "@/invitation-kit/events/EventActions";
import { Gallery } from "@/invitation-kit/media/Gallery";
import { KitImage } from "@/invitation-kit/media/KitImage";
import { VideoBlock } from "@/invitation-kit/media/VideoBlock";
import { Reveal } from "@/invitation-kit/motion/Reveal";
import { ScrollMotion } from "@/invitation-kit/motion/ScrollMotion";
import { ScratchReveal } from "@/invitation-kit/interactive/ScratchReveal";
import type { SectionProps } from "@/invitation-kit/types";
import { ART } from "./art";
import { ArchCard, SunDivider } from "./decor";

const wrap = "px-8 py-16 @md:px-12 @md:py-20";

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <Reveal className="mb-10 text-center">
      {eyebrow && <p className="md-eyebrow">{eyebrow}</p>}
      <h2 className="md-heading mt-2 text-[1.9rem] leading-tight @md:text-[2.2rem]">{title}</h2>
      <SunDivider className="mx-auto mt-3" />
    </Reveal>
  );
}

/** Scroll-driven motion when on; a plain wrapper otherwise. */
function Motion({
  on,
  to,
  distance,
  className,
  children,
}: {
  on: boolean;
  to: { y?: number; scale?: number; opacity?: number };
  distance?: number;
  className?: string;
  children: ReactNode;
}) {
  return on ? (
    <ScrollMotion to={to} distance={distance} className={className}>
      {children}
    </ScrollMotion>
  ) : (
    <div className={className}>{children}</div>
  );
}

/**
 * The temple at sunset. With "walk in" on, the scene stays pinned while guests scroll and
 * slowly grows toward the temple door, as if walking up the aisle; the names lift away.
 */
export function Hero({ data }: SectionProps) {
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  const p = dateParts(c.weddingDate);
  const { reducedMotion } = useInvitation();
  const walk = Boolean(data.options.scrollMotion) && !reducedMotion;
  return (
    <section className={`relative z-30 ${walk ? "md-hero-track" : ""}`}>
      <div className="md-hero sticky top-0 overflow-hidden">
        <Motion
          on={walk}
          to={{ scale: 1.6 }}
          distance={0.75}
          className="absolute inset-0 origin-[50%_64%]"
        >
          <img
            src={ART.temple.src}
            alt=""
            width={ART.temple.w}
            height={ART.temple.h}
            fetchPriority="high"
            className="h-full w-full object-cover object-[50%_72%]"
          />
        </Motion>
        {/* Soft sky wash behind the names. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[48%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(253,226,205,0.7), rgba(253,226,205,0.35) 60%, transparent)",
          }}
        />
        <Motion
          on={walk}
          to={{ y: -110, opacity: 0 }}
          distance={0.4}
          className="relative z-10 flex flex-col items-center px-6 pt-[max(4.5rem,12dvh)] text-center"
        >
          {c.invocation && (
            <Reveal y={8} as="p" className="md-accent text-sm">
              {c.invocation}
            </Reveal>
          )}
          <h1 id="invite-title" tabIndex={-1} className="mt-3 outline-none">
            <Reveal
              as="span"
              delay={0.1}
              y={22}
              className="f-display md-accent block text-[clamp(2.7rem,12.5cqw,4.4rem)] leading-[1.02]"
            >
              {first}
            </Reveal>
            <Reveal
              as="span"
              delay={0.22}
              scaleFrom={0.7}
              className="f-script md-accent block text-[clamp(1.5rem,6.5cqw,2.1rem)] leading-none"
            >
              weds
            </Reveal>
            <Reveal
              as="span"
              delay={0.34}
              y={22}
              className="f-display md-accent block text-[clamp(2.7rem,12.5cqw,4.4rem)] leading-[1.02]"
            >
              {second}
            </Reveal>
          </h1>
          <Reveal delay={0.48} className="mt-4">
            <p className="md-heading text-[0.8rem] font-medium tracking-[0.22em] uppercase">
              {p.weekday} · {p.day} {p.month} {p.year}
            </p>
            {c.city && <p className="mt-1.5 text-base italic">{c.city}</p>}
          </Reveal>
        </Motion>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20"
          style={{ background: "linear-gradient(180deg, transparent, var(--c-bg))" }}
        />
      </div>
    </section>
  );
}

export function Greeting({ data }: SectionProps) {
  const g = data.guest;
  return (
    <section className={`${wrap} pt-28`}>
      <Reveal className="mx-auto max-w-sm text-center">
        <SunDivider className="mx-auto" />
        {g ? (
          <p className="f-script md-accent mt-5 text-[2.3rem] leading-tight">
            {g.greeting || `Dear ${g.displayName},`}
          </p>
        ) : (
          <p className="md-eyebrow mt-5">Together with their families</p>
        )}
        <p className="mt-5 text-lg leading-relaxed @md:text-xl">{data.content.messages.welcome}</p>
        {g?.personalNote && (
          <p className="mt-6 text-base text-[var(--c-muted)] italic">“{g.personalNote}”</p>
        )}
        <SunDivider className="mx-auto mt-8" />
      </Reveal>
    </section>
  );
}

/** Each partner's parents in small type above their name, joined by a script "and". */
export function Families({ data }: SectionProps) {
  const { families, couple } = data.content;
  const pairs =
    couple.order === "GROOM_FIRST"
      ? [
          { person: couple.groom, fam: families.groom },
          { person: couple.bride, fam: families.bride },
        ]
      : [
          { person: couple.bride, fam: families.bride },
          { person: couple.groom, fam: families.groom },
        ];
  return (
    <section className={`${wrap} text-center`}>
      {pairs.map(({ person, fam }, i) => (
        <div key={person.firstName + i}>
          {i === 1 && (
            <Reveal
              as="p"
              className="f-script my-5 text-[2.2rem] leading-none text-[var(--c-text)]"
            >
              and
            </Reveal>
          )}
          <Reveal delay={0.05}>
            {(fam.label || fam.lines.length > 0) && (
              <p className="md-accent mx-auto max-w-xs text-sm font-semibold">
                {[fam.label, fam.lines.join(" · ")].filter(Boolean).join(" ")}
              </p>
            )}
            <h3 className="f-display md-accent mt-2 text-[clamp(2.4rem,11cqw,3.4rem)] leading-[1.02]">
              {person.firstName}
              {person.lastName && <span className="block">{person.lastName}</span>}
            </h3>
            {fam.grandparents.length > 0 && (
              <p className="mt-3 text-sm text-[var(--c-muted)] italic">
                Grandchild of {fam.grandparents.join(" and ")}
              </p>
            )}
          </Reveal>
        </div>
      ))}
      <SunDivider className="mx-auto mt-10" />
    </section>
  );
}

/** A gold card: scratch it to reveal the wedding date (petals burst when it clears). */
function SaveTheDate({ data }: { data: SectionProps["data"] }) {
  const p = dateParts(data.content.weddingDate);
  return (
    <div className="mb-20 flex flex-col items-center">
      <SectionTitle eyebrow="A little surprise" title="Save the date" />
      <Reveal>
        <ScratchReveal
          className="w-[min(78cqw,320px)] rounded-2xl"
          label="Scratch to reveal the date"
          tapLabel="Tap here to reveal instead"
          tapClassName="text-[var(--c-muted)] underline underline-offset-4"
          foil={["#F3D27A", "#B8862B"]}
        >
          <div className="md-tile flex aspect-[1.5/1] flex-col items-center justify-center px-6 text-center">
            <p className="md-eyebrow">{p.weekday}</p>
            <p className="f-display md-accent mt-1 text-6xl leading-none">{p.day}</p>
            <p className="md-heading mt-2 text-sm tracking-[0.22em] uppercase">
              {p.month} · {p.year}
            </p>
            {data.content.city && (
              <p className="mt-1.5 text-sm text-[var(--c-muted)] italic">{data.content.city}</p>
            )}
          </div>
        </ScratchReveal>
      </Reveal>
    </div>
  );
}

export function Countdown({ data }: SectionProps) {
  const v = useCountdown(data.countdownTo);
  const p = dateParts(data.content.weddingDate);
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
        eyebrow="Counting down"
        title={v?.isPast ? "The celebrations have begun" : "Until we say “I do”"}
      />
      {!v?.isPast && (
        <Reveal className="mx-auto grid max-w-[21rem] grid-cols-4 gap-2" role="timer" aria-live="off">
          {cells.map(([label, n]) => (
            <div key={label} className="md-tile flex flex-col items-center px-1 pt-3 pb-2.5">
              <span className="f-display text-[1.65rem] leading-none tabular-nums">
                {n === undefined ? "––" : String(n).padStart(2, "0")}
              </span>
              <span className="md-eyebrow mt-1.5 text-[0.52rem]! tracking-[0.08em]!">{label}</span>
            </div>
          ))}
        </Reveal>
      )}
      <Reveal as="p" className="mt-6 text-center text-[var(--c-muted)]">
        {p.weekday}, {p.day} {p.month} {p.year}
        {data.content.city ? ` · ${data.content.city}` : ""}
      </Reveal>
    </section>
  );
}

/** Each function on its own arched card, like a temple niche. */
export function Events({ data }: SectionProps) {
  return (
    <section className={wrap}>
      <SectionTitle eyebrow="Mark your calendar" title="On the following events" />
      <ol className="mx-auto flex max-w-sm flex-col gap-10">
        {data.content.events.map((e, i) => (
          <Reveal as="li" key={e.id} delay={Math.min(i * 0.05, 0.2)}>
            <ArchCard>
              <article className="px-6 pt-1 pb-7 text-center">
                <SunDivider className="mx-auto" />
                <h3 className="f-display md-accent mt-2 text-[2rem] leading-tight">{e.name}</h3>
                <p className="md-heading mt-1 text-[0.72rem] font-semibold tracking-[0.2em] uppercase">
                  <time dateTime={`${e.date}T${e.startTime}`}>{formatLongDate(e.date)}</time>
                </p>
                <p className="mt-1 text-[var(--c-muted)] italic">
                  {formatTimeRange(e.startTime, e.endTime)}
                </p>
                <p className="md-heading mt-4 text-lg">{e.venue.name}</p>
                {e.venue.address && (
                  <p className="mt-0.5 text-sm text-[var(--c-muted)]">{e.venue.address}</p>
                )}
                {e.description && <p className="mt-3 italic">{e.description}</p>}
                {e.dressCode && (
                  <p className="md-accent mt-2 text-sm italic">Dress: {e.dressCode}</p>
                )}
                <EventActions
                  event={e}
                  className="mt-5 justify-center"
                  buttonClassName="md-button"
                />
              </article>
            </ArchCard>
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
      <div className="grid gap-12 text-center @lg:grid-cols-2 @lg:gap-8">
        {people.map((p, i) => (
          <Reveal key={p.firstName + i} delay={i * 0.12}>
            {photos[i] && (
              <div className="md-polaroid mx-auto mb-6 w-[min(62cqw,220px)] -rotate-2">
                <KitImage media={photos[i]} sizes="220px" className="aspect-[4/5] w-full" />
              </div>
            )}
            <h3 className="f-display md-accent text-3xl">
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
  if (images.length === 0) return null;
  return (
    <section className="py-16 @md:py-20">
      <div className="px-8">
        <SectionTitle eyebrow="Our moments" title="Before the big day" />
      </div>
      {String(data.options.galleryStyle ?? "carousel") === "grid" ? (
        <div className="px-8">
          <Gallery images={images} variant="grid" itemClassName="md-polaroid" />
        </div>
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
      <SectionTitle eyebrow="A little film" title="Our story" />
      <Reveal className="md-polaroid">
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
        <SunDivider className="mx-auto" />
        <p className="inv-pre-line mx-auto mt-6 max-w-sm text-xl leading-relaxed italic @md:text-2xl">
          {m.invitation}
        </p>
      </Reveal>
    </section>
  );
}

export function Footer({ data }: SectionProps) {
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  return (
    <footer className="relative px-8 pt-6 pb-44 text-center">
      <Reveal>
        <p className="f-display md-accent text-[clamp(2.4rem,11cqw,3.2rem)] leading-[1.05]">
          {first}
          <span className="block">&amp; {second}</span>
        </p>
        {c.hashtag && (
          <p className="md-heading mt-3 text-sm tracking-[0.12em] text-[var(--md-gold)]">
            {c.hashtag}
          </p>
        )}
        {c.messages.closing && (
          <p className="mx-auto mt-5 max-w-xs text-[var(--c-muted)] italic">{c.messages.closing}</p>
        )}
        <p className="md-eyebrow mt-8 text-[0.6rem]">
          Crafted with love on{" "}
          <Link href="/?ref=invite" className="underline-offset-4 hover:underline">
            {BRAND.name}
          </Link>
        </p>
      </Reveal>
    </footer>
  );
}
