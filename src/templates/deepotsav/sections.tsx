"use client";

/* eslint-disable @next/next/no-img-element -- scene art, sized by layout */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { monogram, orderedNames } from "@/lib/invitation/couple";
import { dateParts, formatLongDate, formatTime, formatTimeRange } from "@/lib/invitation/dates";
import type { InvitationEvent } from "@/lib/invitation/schema";
import { useInvitation } from "@/invitation-kit/context";
import { useCountdown } from "@/invitation-kit/countdown/useCountdown";
import { EventActions } from "@/invitation-kit/events/EventActions";
import { Gallery } from "@/invitation-kit/media/Gallery";
import { KitImage } from "@/invitation-kit/media/KitImage";
import { VideoBlock } from "@/invitation-kit/media/VideoBlock";
import { ScratchReveal } from "@/invitation-kit/interactive/ScratchReveal";
import { Reveal } from "@/invitation-kit/motion/Reveal";
import { ScrollMotion } from "@/invitation-kit/motion/ScrollMotion";
import type { SectionProps } from "@/invitation-kit/types";
import { ART, type ArtImage } from "./art";
import { Fireworks } from "./Fireworks";
import { SceneNames } from "./scene";

// ───────────── Shared pieces ─────────────

/** Gold rule with a small lotus bud in the middle. */
function GoldRule({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 16"
      className={`dp-gold h-3.5 w-36 ${className}`}
      fill="none"
    >
      <path d="M6 8H62M98 8H154" stroke="currentColor" strokeWidth="0.8" />
      <path d="M62 8l3-2.2 3 2.2-3 2.2zM92 8l3-2.2 3 2.2-3 2.2z" fill="currentColor" />
      <path
        d="M80 1.5c-2.6 3-2.6 7.4 0 10.8 2.6-3.4 2.6-7.8 0-10.8zM80 12.3c-2.2-4.2-6-6-9.4-5.6.9 3.9 4.3 6 9.4 5.6zM80 12.3c2.2-4.2 6-6 9.4-5.6-.9 3.9-4.3 6-9.4 5.6z"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function Title({
  eyebrow,
  children,
  className = "",
}: {
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={`mb-8 flex flex-col items-center text-center ${className}`}>
      {eyebrow && <p className="dp-eyebrow mb-1">{eyebrow}</p>}
      <h2 className="f-script dp-gold text-[clamp(2.5rem,12cqw,3.2rem)] leading-[1.15]">
        {children}
      </h2>
      <GoldRule className="mt-1" />
    </Reveal>
  );
}

function useMove(data: SectionProps["data"]) {
  const { reducedMotion } = useInvitation();
  return Boolean(data.options.scrollMotion) && !reducedMotion;
}

function Motion({
  on,
  to,
  distance,
  className,
  style,
  children,
}: {
  on: boolean;
  to: { y?: number; scale?: number; opacity?: number };
  distance?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return on ? (
    <ScrollMotion to={to} distance={distance} className={className} style={style}>
      {children}
    </ScrollMotion>
  ) : (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/** A small clay diya with a flickering flame; `lit` delays tie it to a row lighting up. */
function Diya({ delay = 0, size = 1 }: { delay?: number; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="dp-diya"
      style={{ "--delay": `${delay}ms`, "--s": size } as CSSProperties}
    >
      <i />
    </span>
  );
}

/** The main ceremony: the event on the wedding date that looks like the wedding, else the last. */
function mainEvent(events: readonly InvitationEvent[], weddingDate: string) {
  const sameDay = events.filter((e) => e.date === weddingDate);
  return (
    sameDay.find((e) => e.icon === "mandap" || e.icon === "rings") ??
    sameDay[0] ??
    events[events.length - 1]
  );
}

// ───────────── Hero + date ─────────────

/**
 * The cover's final frame, kept: the lit temple on the river with the names in the sky. With
 * scroll motion the temple sinks slowly while the names drift up and fade; fireworks open over the
 * shikhara now and then. The gold date tiles follow on the jaali.
 */
export function Hero({ data }: SectionProps) {
  const move = useMove(data);
  const { reducedMotion } = useInvitation();
  const fireworks = data.options.fireworks !== false && !reducedMotion;
  return (
    <section className="relative">
      <div className="relative h-[100dvh] min-h-[34rem] overflow-hidden bg-[#0b1230]">
        <Motion on={move} to={{ y: 140, scale: 1.04 }} distance={1} className="absolute inset-0">
          <img
            src={ART.lit.src}
            alt=""
            width={ART.lit.w}
            height={ART.lit.h}
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </Motion>
        <div aria-hidden="true" className="dp-sky-dim absolute inset-0" />
        <span aria-hidden="true" className="dp-stars absolute inset-x-0 top-0 h-1/2" data-ambient />
        <span
          aria-hidden="true"
          className="dp-shimmer absolute inset-x-0 top-[57%] h-[24%]"
          data-ambient
        />
        {fireworks && <Fireworks ambient className="absolute inset-x-0 top-0 h-[70%] w-full" />}
        <Motion
          on={move}
          to={{ y: -90, opacity: 0 }}
          distance={0.7}
          className="absolute inset-x-0 top-0"
        >
          <SceneNames data={data} heading />
        </Motion>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28"
          style={{ background: "linear-gradient(180deg, transparent, var(--c-bg))" }}
        />
      </div>
      <TheDate data={data} />
    </section>
  );
}

function DateTile({ value, small = false }: { value: string; small?: boolean }) {
  return (
    <div className="dp-tile grid aspect-[5/6] w-full place-items-center px-1 select-none">
      <span
        className={`dp-ink leading-none ${small ? "text-[clamp(1rem,5cqw,1.35rem)]" : "text-[clamp(2rem,10cqw,2.6rem)]"}`}
        style={{ fontFamily: "var(--f-heading)" }}
      >
        {value}
      </span>
    </div>
  );
}

/** "The Date": day, month and year on three gold tiles, each scratched (or tapped) open. */
function TheDate({ data }: Pick<SectionProps, "data">) {
  const p = dateParts(data.content.weddingDate);
  const main = mainEvent(data.content.events, data.content.weddingDate);
  const scratch = Boolean(data.options.scratchDate);
  const tiles: Array<[string, string, boolean]> = [
    ["Day", p.day, false],
    ["Month", p.month, true],
    ["Year", p.year, false],
  ];
  return (
    <div className="relative px-6 pt-8 pb-16 text-center">
      <Title>The Date</Title>
      {scratch && (
        <Reveal as="p" className="dp-eyebrow -mt-4 mb-6">
          ✦ Scratch to reveal the date ✦
        </Reveal>
      )}
      <Reveal className="mx-auto grid w-[min(88cqw,22rem)] grid-cols-3 gap-3">
        {tiles.map(([label, value, small]) =>
          scratch ? (
            <ScratchReveal
              key={label}
              label=""
              threshold={0.45}
              foilImage={ART.scratchFoil.src}
              surfaceStyle={{ borderRadius: 14 }}
              tapClassName="mt-1.5 no-underline dp-eyebrow opacity-100"
              tapLabel={
                <>
                  {label}
                  <span className="sr-only"> — tap to reveal</span>
                </>
              }
            >
              <DateTile value={value} small={small} />
            </ScratchReveal>
          ) : (
            <div key={label} className="flex flex-col items-center">
              <DateTile value={value} small={small} />
              <p className="dp-eyebrow mt-3">{label}</p>
            </div>
          ),
        )}
      </Reveal>
      <Reveal as="p" className="mt-6 text-lg italic" style={{ color: "var(--c-muted)" }}>
        {p.weekday}
        {main && main.date === data.content.weddingDate ? `, ${formatTime(main.startTime)}` : ""}
        {main?.description && main.date === data.content.weddingDate ? (
          <span className="block text-base">{main.description}</span>
        ) : null}
      </Reveal>
    </div>
  );
}

// ───────────── Greeting ─────────────

/** The deity in a carved gold arch, the invocation, the monogram and the welcome. */
export function Greeting({ data }: SectionProps) {
  const c = data.content;
  const g = data.guest;
  const deity = String(data.options.deity ?? "ganesha") !== "none";
  return (
    <section className="relative px-8 pt-12 pb-14 text-center">
      {deity && (
        <Reveal y={30} className="dp-arch mx-auto w-[min(62cqw,15rem)]">
          <div className="dp-arch-inner grid aspect-[4/5] place-items-center">
            <img
              src={ART.ganesha.src}
              alt=""
              width={ART.ganesha.w}
              height={ART.ganesha.h}
              loading="lazy"
              className="dp-deity w-[62%]"
            />
          </div>
        </Reveal>
      )}
      {c.invocation && (
        <Reveal as="p" className="dp-gold mt-5 text-lg">
          {c.invocation}
        </Reveal>
      )}
      <Reveal className="mx-auto mt-5 grid size-16 place-items-center rounded-full border border-[var(--dp-line)]">
        <span
          className="dp-gold text-xl tracking-[0.12em]"
          style={{ fontFamily: "var(--f-heading)" }}
        >
          {monogram(c.couple)}
        </span>
      </Reveal>
      {g && (
        <Reveal as="p" className="f-script dp-gold mt-6 text-[2.4rem] leading-tight">
          {g.greeting || `Dear ${g.displayName},`}
        </Reveal>
      )}
      {c.messages.welcome && (
        <Reveal as="p" className="mx-auto mt-5 max-w-[24rem] text-[1.2rem] leading-relaxed">
          {c.messages.welcome}
        </Reveal>
      )}
      {g?.personalNote && (
        <Reveal as="p" className="mt-4 italic" style={{ color: "var(--c-muted)" }}>
          “{g.personalNote}”
        </Reveal>
      )}
    </section>
  );
}

// ───────────── Couple ─────────────

/** The formal block: each partner's full name, parents and a line about them, in a gold frame. */
export function Couple({ data }: SectionProps) {
  const { couple, families, weddingDate, city } = data.content;
  const people =
    couple.order === "GROOM_FIRST"
      ? [
          { p: couple.groom, fam: families.groom },
          { p: couple.bride, fam: families.bride },
        ]
      : [
          { p: couple.bride, fam: families.bride },
          { p: couple.groom, fam: families.groom },
        ];
  const photos = data.content.media.couplePhotos.slice(0, 2);
  return (
    <section className="px-5 py-10">
      <div className="dp-frame px-6 py-12 text-center">
        <h2 className="sr-only">{orderedNames(couple).join(" & ")}</h2>
        {people.map(({ p, fam }, i) => (
          <div key={i}>
            {i === 1 && (
              <Reveal
                as="p"
                scaleFrom={0.7}
                className="dp-gold my-5 text-[1.6rem] italic"
                style={{ fontFamily: "var(--f-heading)" }}
              >
                with
              </Reveal>
            )}
            <Reveal>
              {photos[i] && (
                <div className="dp-arch-photo mx-auto mb-4 w-[min(44cqw,10rem)]">
                  <KitImage media={photos[i]} sizes="160px" alt="" className="h-full w-full" />
                </div>
              )}
              <p className="f-script dp-gold text-[clamp(2.4rem,12cqw,3.1rem)] leading-[1.15]">
                {p.firstName} {p.lastName}
              </p>
              {(fam.label || fam.lines.length > 0) && (
                <>
                  {fam.label && <p className="dp-eyebrow mt-2">{fam.label}</p>}
                  {fam.lines.map((l) => (
                    <p key={l} className="text-[1.1rem]">
                      {l}
                    </p>
                  ))}
                </>
              )}
              {p.shortBio && (
                <p
                  className="mx-auto mt-3 max-w-[20rem] italic"
                  style={{ color: "var(--c-muted)" }}
                >
                  {p.shortBio}
                </p>
              )}
            </Reveal>
          </div>
        ))}
        <Reveal className="mt-8 flex flex-col items-center">
          <GoldRule />
          <p className="mt-2 text-[1.05rem]">
            {formatLongDate(weddingDate)}
            {city ? ` · ${city}` : ""}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────── Our story ─────────────

export function Message({ data }: SectionProps) {
  const text = data.content.messages.invitation;
  if (!text) return null;
  return (
    <section className="px-8 py-14 text-center">
      <Title>Our story</Title>
      <Reveal className="relative mx-auto max-w-[24rem]">
        <p className="inv-pre-line text-[1.2rem] leading-relaxed">{text}</p>
      </Reveal>
      <Reveal className="mt-8 flex justify-center gap-5">
        <Diya delay={0} />
        <Diya delay={300} />
        <Diya delay={600} />
      </Reveal>
    </section>
  );
}

// ───────────── Gallery ─────────────

export function GallerySection({ data }: SectionProps) {
  const images = [...data.content.media.gallery, ...data.content.media.familyPhotos];
  if (images.length === 0) return null;
  return (
    <section className="py-14">
      <Title>Us, so far</Title>
      <Gallery
        images={images}
        variant="carousel"
        itemClassName="dp-arch-photo"
        captionClassName="text-center italic text-[var(--c-muted)]"
      />
      <p className="dp-eyebrow mt-4 text-center">Swipe to see more</p>
    </section>
  );
}

// ───────────── Events ─────────────

const EVENT_ART: Record<InvitationEvent["icon"], [ArtImage, string]> = {
  mehndi: [ART.mehendi, "50% 20%"],
  haldi: [ART.eventHaldi, "45% 35%"],
  music: [ART.eventSangeet, "50% 30%"],
  baraat: [ART.eventSangeet, "50% 30%"],
  rings: [ART.eventWedding, "62% 50%"],
  mandap: [ART.eventWedding, "62% 50%"],
  reception: [ART.eventReception, "40% 55%"],
  cocktail: [ART.eventReception, "40% 55%"],
  puja: [ART.eventGeneric, "55% 60%"],
  generic: [ART.eventGeneric, "55% 60%"],
};

/**
 * "The celebrations": a lamp-lit timeline. A gold line runs down the middle; each function has its
 * art in an arched frame on one side and its day, time, venue and dress code on the other,
 * alternating sides, with a diya on the line that lights as it scrolls in.
 */
export function Events({ data }: SectionProps) {
  const events = data.content.events;
  return (
    <section className="px-4 py-14">
      <Title>The celebrations</Title>
      <ol aria-label="Events" className="dp-timeline relative mx-auto max-w-[26rem]">
        {events.map((e, i) => {
          const p = dateParts(e.date);
          const [img, focus] = EVENT_ART[e.icon] ?? EVENT_ART.generic;
          const flip = i % 2 === 1;
          return (
            <li key={e.id} className="relative grid grid-cols-2 gap-x-7 pb-10 last:pb-0">
              <Reveal
                x={flip ? 24 : -24}
                y={0}
                className={`dp-arch-photo self-start ${flip ? "order-2" : ""}`}
              >
                <img
                  src={img.src}
                  alt=""
                  width={img.w}
                  height={img.h}
                  loading="lazy"
                  className="aspect-[4/5] h-full w-full object-cover"
                  style={{ objectPosition: focus }}
                />
              </Reveal>
              <span aria-hidden="true" className="absolute top-6 left-1/2 -translate-x-1/2">
                <Diya />
              </span>
              <Reveal
                x={flip ? -24 : 24}
                y={0}
                className={`flex flex-col ${flip ? "order-1 items-end text-right" : "items-start text-left"}`}
              >
                <p className="dp-eyebrow">
                  <time dateTime={`${e.date}T${e.startTime}`}>
                    {p.weekdayShort}, {p.day} {p.monthShort}
                  </time>
                </p>
                <p
                  className="dp-gold mt-1 text-[1.65rem] leading-none"
                  style={{ fontFamily: "var(--f-heading)" }}
                >
                  {formatTime(e.startTime).toLowerCase()}
                </p>
                <h3 className="f-script dp-gold mt-1 text-[2rem] leading-tight">{e.name}</h3>
                <p className="text-[1.02rem] leading-snug">{e.venue.name}</p>
                {e.endTime && (
                  <p className="text-sm" style={{ color: "var(--c-muted)" }}>
                    {formatTimeRange(e.startTime, e.endTime)}
                  </p>
                )}
                {e.description && (
                  <p className="mt-1 text-sm italic" style={{ color: "var(--c-muted)" }}>
                    {e.description}
                  </p>
                )}
                {e.dressCode && <p className="dp-gold mt-1 text-sm italic">Dress: {e.dressCode}</p>}
                <EventActions
                  event={e}
                  className={`mt-2 flex-col gap-1 ${flip ? "items-end" : "items-start"}`}
                  buttonClassName="dp-link"
                />
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ───────────── Countdown ─────────────

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
    <section className="px-6 py-14 text-center">
      <Title>{v?.isPast ? "The celebrations have begun" : "The celebration begins"}</Title>
      {!v?.isPast && (
        <Reveal
          className="mx-auto flex max-w-[22rem] items-start justify-center"
          role="timer"
          aria-live="off"
        >
          {cells.map(([label, n], i) => (
            <div key={label} className="flex items-start">
              {i > 0 && (
                <span aria-hidden="true" className="dp-gold px-1.5 text-[2.2rem] leading-none">
                  :
                </span>
              )}
              <div className="flex w-[4.2rem] flex-col items-center">
                <span
                  className="dp-gold text-[2.6rem] leading-none tabular-nums"
                  style={{ fontFamily: "var(--f-heading)" }}
                >
                  {n === undefined ? "––" : String(n).padStart(2, "0")}
                </span>
                <span
                  className="mt-2 text-xs tracking-[0.18em] uppercase"
                  style={{ color: "var(--c-muted)" }}
                >
                  {label}
                </span>
              </div>
            </div>
          ))}
        </Reveal>
      )}
      <Reveal as="p" className="mt-6 text-lg italic" style={{ color: "var(--c-muted)" }}>
        until {p.weekday}, {p.day} {p.month} {p.year}
      </Reveal>
      <Reveal className="mt-8 flex justify-center gap-4">
        {Array.from({ length: 9 }, (_, i) => (
          <Diya key={i} delay={i * 160} size={0.85} />
        ))}
      </Reveal>
    </section>
  );
}

// ───────────── Families ─────────────

export function Families({ data }: SectionProps) {
  const { families, couple } = data.content;
  const order =
    couple.order === "GROOM_FIRST"
      ? [
          { fam: families.groom, last: couple.groom.lastName },
          { fam: families.bride, last: couple.bride.lastName },
        ]
      : [
          { fam: families.bride, last: couple.bride.lastName },
          { fam: families.groom, last: couple.groom.lastName },
        ];
  const elders = order.flatMap((o) => o.fam.grandparents);
  const hosts = order.map((o) => o.last).filter(Boolean) as string[];
  if (elders.length === 0 && hosts.length === 0) return null;
  return (
    <section className="px-8 py-14 text-center">
      <Title>Our families</Title>
      {elders.length > 0 && (
        <Reveal>
          <p className="dp-eyebrow">With the blessings of</p>
          {elders.map((l) => (
            <p key={l} className="mt-1 text-[1.15rem]">
              {l}
            </p>
          ))}
        </Reveal>
      )}
      {hosts.length > 0 && (
        <Reveal className="mt-8">
          <p className="dp-eyebrow">Eager to see you</p>
          {hosts.map((h) => (
            <p key={h} className="mt-1 text-[1.15rem]">
              The {h} family
            </p>
          ))}
        </Reveal>
      )}
    </section>
  );
}

export function Video({ data }: SectionProps) {
  const v = data.content.media.video;
  if (!v) return null;
  return (
    <section className="px-6 py-14">
      <Title>A little film</Title>
      <Reveal className="dp-frame overflow-hidden p-1.5">
        <VideoBlock video={v} />
      </Reveal>
    </section>
  );
}

// ───────────── Footer ─────────────

/** Getting there (the main ceremony's venue), the closing line and the temple once more. */
export function Footer({ data }: SectionProps) {
  const c = data.content;
  const main = mainEvent(c.events, c.weddingDate);
  const [first, second] = orderedNames(c.couple);
  const { reducedMotion } = useInvitation();
  return (
    <footer className="relative overflow-hidden text-center">
      {main && (
        <div className="px-8 pt-14">
          <Title>Getting there</Title>
          <Reveal>
            <p className="dp-eyebrow text-[0.75rem]">{main.venue.name}</p>
            {main.venue.address && (
              <p className="mx-auto mt-2 max-w-[20rem]">{main.venue.address}</p>
            )}
            {main.venue.mapsUrl && (
              <a
                href={main.venue.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dp-button mt-6 inline-flex min-h-11 items-center px-7 text-sm tracking-[0.16em] uppercase"
              >
                Open in Google Maps
              </a>
            )}
          </Reveal>
        </div>
      )}
      <Reveal className="px-8 pt-16">
        <p className="f-script dp-gold text-[clamp(2.4rem,11cqw,3rem)] leading-tight">
          {first} &amp; {second}
        </p>
        {c.hashtag && <p className="mt-1 text-lg italic">{c.hashtag}</p>}
        {c.messages.closing && (
          <p className="mx-auto mt-4 max-w-xs italic" style={{ color: "var(--c-muted)" }}>
            {c.messages.closing}
          </p>
        )}
        <div className="mx-auto mt-6 grid size-14 place-items-center rounded-full border border-[var(--dp-line)]">
          <span className="dp-gold tracking-[0.12em]" style={{ fontFamily: "var(--f-heading)" }}>
            {monogram(c.couple)}
          </span>
        </div>
      </Reveal>
      <div className="relative mt-10 h-[26rem] overflow-hidden">
        <img
          src={ART.front.src}
          alt=""
          width={ART.front.w}
          height={ART.front.h}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[50%_58%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, var(--c-bg) 0%, transparent 45%)" }}
        />
        {data.options.fireworks !== false && !reducedMotion && (
          <Fireworks ambient ambientEveryMs={5200} className="absolute inset-0 h-full w-full" />
        )}
        <p className="dp-eyebrow absolute inset-x-0 bottom-5 text-[0.6rem] text-[#FFF4DA]">
          Crafted with love on{" "}
          <Link href="/?ref=invite" className="underline-offset-4 hover:underline">
            {BRAND.name}
          </Link>
        </p>
      </div>
    </footer>
  );
}
