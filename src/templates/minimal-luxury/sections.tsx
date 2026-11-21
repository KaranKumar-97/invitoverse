"use client";

import Link from "next/link";
import { coupleTitle, monogram, orderedNames } from "@/lib/invitation/couple";
import { dateParts, formatTimeRange } from "@/lib/invitation/dates";
import { useCountdown } from "@/invitation-kit/countdown/useCountdown";
import { EventActions } from "@/invitation-kit/events/EventActions";
import { Gallery } from "@/invitation-kit/media/Gallery";
import { KitImage } from "@/invitation-kit/media/KitImage";
import { VideoBlock } from "@/invitation-kit/media/VideoBlock";
import { Reveal } from "@/invitation-kit/motion/Reveal";
import type { SectionProps } from "@/invitation-kit/types";
import { Monogram } from "./decor";
import { BRAND } from "@/lib/brand";

const wrap = "px-6 py-20 sm:px-10 sm:py-24";

function Title({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Reveal className="mb-12 text-center">
      <p className="ml-caps">{eyebrow}</p>
      <h2 className="f-display mt-4 text-[clamp(2rem,7vw,2.6rem)] leading-tight font-normal">
        {title}
      </h2>
    </Reveal>
  );
}

function Rule() {
  return <div aria-hidden="true" className="ml-rule mx-auto w-full max-w-[12rem]" />;
}

export function Hero({ data }: SectionProps) {
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  const p = dateParts(c.weddingDate);
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center lg:h-full">
      <Reveal scaleFrom={0.92} duration={1.1}>
        <Monogram
          letters={monogram(c.couple)}
          italic={data.options.monogramStyle === "italic"}
          className="w-20 text-2xl"
        />
      </Reveal>
      <Reveal delay={0.15} as="p" className="ml-caps mt-10">
        Together with their families
      </Reveal>
      <h1 id="invite-title" tabIndex={-1} className="mt-8 outline-none">
        <Reveal
          as="span"
          delay={0.25}
          y={16}
          duration={1}
          className="f-display block text-[clamp(3rem,15vw,5.25rem)] leading-[0.95] font-normal"
        >
          {first}
        </Reveal>
        <Reveal
          as="span"
          delay={0.4}
          className="f-script my-3 block text-2xl text-[var(--c-accent)] italic"
        >
          and
        </Reveal>
        <Reveal
          as="span"
          delay={0.5}
          y={16}
          duration={1}
          className="f-display block text-[clamp(3rem,15vw,5.25rem)] leading-[0.95] font-normal"
        >
          {second}
        </Reveal>
      </h1>
      <Reveal delay={0.7} className="mt-10 w-full">
        <Rule />
      </Reveal>
      <Reveal delay={0.8} as="p" className="f-heading mt-8 text-xl tracking-[0.3em]">
        <time dateTime={c.weddingDate}>
          {p.dayPadded} · {p.monthNumber} · {p.year}
        </time>
      </Reveal>
      {c.city && (
        <Reveal delay={0.9} as="p" className="ml-caps mt-4">
          {c.city}
        </Reveal>
      )}
      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 h-12 w-px -translate-x-1/2 overflow-hidden lg:hidden"
      >
        <span
          data-ambient
          className="block h-full w-full"
          style={{
            background: "var(--c-text)",
            opacity: 0.35,
            animation: "vs-float 2.6s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}

export function Greeting({ data }: SectionProps) {
  const g = data.guest;
  return (
    <section className={`${wrap} text-center`}>
      <Reveal className="mx-auto max-w-md">
        {g ? (
          <p className="f-heading text-[2rem] leading-tight italic">
            {g.greeting || `Dear ${g.displayName},`}
          </p>
        ) : (
          <p className="ml-caps">Welcome</p>
        )}
        <p className="f-heading mt-6 text-xl leading-relaxed sm:text-[1.35rem]">
          {data.content.messages.welcome}
        </p>
        {g?.personalNote && <p className="mt-6 text-[var(--c-muted)]">{g.personalNote}</p>}
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
      <div className="grid grid-cols-1 items-start gap-10 text-center sm:grid-cols-[1fr_auto_1fr] sm:gap-8">
        {sides.map((fam, i) => (
          <div key={i} className="contents">
            {i === 1 && (
              <div
                aria-hidden="true"
                className="ml-rule hidden h-16 w-px self-center sm:block"
                style={{ height: "4rem", width: 1 }}
              />
            )}
            <Reveal delay={i * 0.1}>
              {fam.label && <p className="ml-caps">{fam.label}</p>}
              {fam.lines.map((l) => (
                <p key={l} className="f-heading mt-3 text-xl">
                  {l}
                </p>
              ))}
              {fam.grandparents.length > 0 && (
                <p className="mt-3 text-sm text-[var(--c-muted)]">
                  Grandchild of {fam.grandparents.join(" and ")}
                </p>
              )}
            </Reveal>
          </div>
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
    ["Min", v?.minutes],
    ["Sec", v?.seconds],
  ];
  return (
    <section className={`${wrap} text-center`}>
      <Reveal as="p" className="ml-caps">
        {v?.isPast ? "Thank you for celebrating with us" : "Until we say yes"}
      </Reveal>
      {!v?.isPast && (
        <Reveal
          delay={0.1}
          className="mx-auto mt-8 flex max-w-md items-start justify-center"
          role="timer"
          aria-live="off"
        >
          {cells.map(([label, n], i) => (
            <div key={label} className="flex flex-1 items-start">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="ml-rule mt-5 h-8 w-px"
                  style={{ height: "2rem", width: 1 }}
                />
              )}
              <div className="flex-1">
                <span className="f-display block text-[2.6rem] leading-none tabular-nums">
                  {n === undefined ? "––" : String(n).padStart(2, "0")}
                </span>
                <span className="ml-caps mt-2 block text-[0.58rem]">{label}</span>
              </div>
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
      <Title eyebrow="The celebrations" title="Schedule" />
      <ol className="mx-auto max-w-xl">
        {data.content.events.map((e, i) => {
          const p = dateParts(e.date);
          return (
            <Reveal
              as="li"
              key={e.id}
              delay={Math.min(i * 0.06, 0.24)}
              className="border-t py-10 first:border-t-0 first:pt-0"
              style={{ borderColor: "color-mix(in srgb, var(--c-text) 12%, transparent)" }}
            >
              <article className="grid grid-cols-[4.5rem_1fr] gap-5 sm:grid-cols-[6rem_1fr] sm:gap-8">
                <div>
                  <time dateTime={`${e.date}T${e.startTime}`} className="block">
                    <span className="f-display block text-[2.6rem] leading-none">{p.day}</span>
                    <span className="ml-caps mt-2 block text-[0.58rem]">
                      {p.monthShort} {p.year}
                    </span>
                    <span className="ml-caps mt-1 block text-[0.58rem]">{p.weekdayShort}</span>
                  </time>
                </div>
                <div>
                  <h3 className="f-heading text-[1.65rem] leading-tight">{e.name}</h3>
                  <p className="ml-caps mt-2 text-[0.6rem]">
                    {formatTimeRange(e.startTime, e.endTime)}
                  </p>
                  <p className="mt-4">{e.venue.name}</p>
                  {e.venue.address && (
                    <p className="mt-1 text-sm text-[var(--c-muted)]">{e.venue.address}</p>
                  )}
                  {e.description && (
                    <p className="mt-4 text-[0.95rem] leading-relaxed">{e.description}</p>
                  )}
                  {e.dressCode && (
                    <p className="mt-4 text-sm">
                      <span className="ml-caps text-[0.58rem]">Attire</span>
                      <span className="ml-3 italic">{e.dressCode}</span>
                    </p>
                  )}
                  <EventActions event={e} className="mt-5 gap-6" buttonClassName="ml-link" />
                </div>
              </article>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

export function Couple({ data }: SectionProps) {
  const { couple, media } = data.content;
  const people =
    couple.order === "GROOM_FIRST" ? [couple.groom, couple.bride] : [couple.bride, couple.groom];
  const photo = media.couplePhotos[0];
  return (
    <section className={wrap}>
      <Title eyebrow="The couple" title={coupleTitle(couple, "and")} />
      {photo && (
        <Reveal
          className="mx-auto max-w-sm border p-2"
          style={{ borderColor: "color-mix(in srgb, var(--c-text) 12%, transparent)" }}
        >
          <KitImage
            media={photo}
            sizes="(min-width: 640px) 384px, 90vw"
            className="aspect-[3/4] w-full"
          />
        </Reveal>
      )}
      <div className="mx-auto mt-12 grid max-w-xl gap-10 text-center sm:grid-cols-2">
        {people.map((p, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <h3 className="f-display text-2xl">
              {p.firstName} {p.lastName}
            </h3>
            {p.shortBio && (
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--c-muted)]">
                {p.shortBio}
              </p>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function GallerySection({ data }: SectionProps) {
  return (
    <section className={wrap}>
      <Title eyebrow="Moments" title="Gallery" />
      <Gallery
        images={[...data.content.media.gallery, ...data.content.media.familyPhotos]}
        variant="editorial"
      />
    </section>
  );
}

export function Video({ data }: SectionProps) {
  const v = data.content.media.video;
  if (!v) return null;
  return (
    <section className={wrap}>
      <Title eyebrow="Film" title="Our story" />
      <Reveal>
        <VideoBlock video={v} />
      </Reveal>
    </section>
  );
}

export function Message({ data }: SectionProps) {
  const text = data.content.messages.invitation;
  if (!text) return null;
  return (
    <section className={`${wrap} text-center`}>
      <Reveal className="mx-auto max-w-lg">
        <span
          aria-hidden="true"
          className="f-display block text-6xl leading-none text-[var(--c-accent)]"
        >
          “
        </span>
        <p className="f-heading inv-pre-line mt-2 text-[1.45rem] leading-relaxed italic">{text}</p>
      </Reveal>
    </section>
  );
}

export function Footer({ data }: SectionProps) {
  const c = data.content;
  return (
    <footer className="px-6 pt-16 pb-28 text-center">
      <Reveal>
        <Rule />
        <Monogram
          letters={monogram(c.couple)}
          italic={data.options.monogramStyle === "italic"}
          className="mx-auto mt-14 w-16 text-lg"
        />
        {c.messages.closing && (
          <p className="f-heading mt-8 text-2xl italic">{c.messages.closing}</p>
        )}
        {c.hashtag && <p className="ml-caps mt-6">{c.hashtag}</p>}
        <p className="ml-caps mt-14 text-[0.55rem] opacity-70">
          Made with{" "}
          <Link href="/?ref=invite" className="underline-offset-4 hover:underline">
            {BRAND.name}
          </Link>
        </p>
      </Reveal>
    </footer>
  );
}
