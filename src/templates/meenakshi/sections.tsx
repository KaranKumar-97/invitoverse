"use client";

/* eslint-disable @next/next/no-img-element -- painted scene art, sized by layout */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { orderedNames } from "@/lib/invitation/couple";
import { dateParts, formatLongDate, formatTimeRange } from "@/lib/invitation/dates";
import type { InvitationEvent } from "@/lib/invitation/schema";
import { useInvitation } from "@/invitation-kit/context";
import { useCountdown } from "@/invitation-kit/countdown/useCountdown";
import { EventActions } from "@/invitation-kit/events/EventActions";
import { ScratchReveal } from "@/invitation-kit/interactive/ScratchReveal";
import { Gallery } from "@/invitation-kit/media/Gallery";
import { KitImage } from "@/invitation-kit/media/KitImage";
import { VideoBlock } from "@/invitation-kit/media/VideoBlock";
import { Reveal } from "@/invitation-kit/motion/Reveal";
import type { SectionProps } from "@/invitation-kit/types";
import { ART, FRAME_WINDOW, type ArtImage } from "./art";

/** Decorative scene image (always alt=""): reserves space from the art's natural size. */
function Art({
  art,
  className,
  style,
  eager = false,
}: {
  art: ArtImage;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
}) {
  return (
    <img
      src={art.src}
      width={art.w}
      height={art.h}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      style={style}
    />
  );
}

/**
 * Layered scroll parallax inside one section: every `[data-speed]` child appears to move at that
 * fraction of the scroll speed (1 = with the page, 0 = pinned). `[data-fade]` children also fade
 * out over one screen. Frame-synced, passive, transform/opacity only. Off under reduced motion,
 * before the invitation opens, or when `enabled` is false.
 */
function useLayerParallax(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const { reducedMotion, revealed } = useInvitation();
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled || reducedMotion || !revealed) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-speed]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      if (scrolled > rect.height) return;
      // Rects are in screen px; transforms apply inside the zoomed page, so convert back.
      const zoom = Number(getComputedStyle(root).getPropertyValue("--mk-zoom")) || 1;
      for (const el of layers) {
        const speed = Number(el.dataset.speed);
        el.style.transform = `translate3d(0, ${((scrolled * (1 - speed)) / zoom).toFixed(1)}px, 0)`;
        if (el.hasAttribute("data-fade"))
          el.style.opacity = Math.max(0, 1 - scrolled / (window.innerHeight * 0.85)).toFixed(3);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      for (const el of layers) {
        el.style.transform = "";
        el.style.opacity = "";
      }
    };
  }, [ref, enabled, reducedMotion, revealed]);
}

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mk-eyebrow ${className}`}>{children}</p>;
}

// ───────────── Hero: the names slip behind the gopuram ─────────────

export function Hero({ data }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  const p = dateParts(c.weddingDate);
  useLayerParallax(ref, Boolean(data.options.scrollMotion));
  // The save-the-date scene carries the date; the hero only shows it when that scene is off.
  const showDate = !data.sections.includes("countdown");
  return (
    <section ref={ref} className="relative overflow-clip" style={{ background: "var(--mk-sky)" }}>
      {/* Names: nearly pinned, layered BEHIND the tower, so the tower rises over them. */}
      <div
        data-speed="0.08"
        data-fade
        className="relative z-[1] px-6 pt-[28cqw] text-center group-data-[wide]/stage:pt-[17cqw]"
      >
        <Reveal y={14} as="p" className="mk-eyebrow mk-on-sky">
          Together with their families
        </Reveal>
        <h1 id="invite-title" tabIndex={-1} className="mk-on-sky mt-4 outline-none">
          <Reveal
            as="span"
            delay={0.1}
            y={22}
            className="mk-names block text-[clamp(2.4rem,11vw,3.6rem)] group-data-[wide]/stage:text-[2.85rem]"
          >
            {first}
          </Reveal>
          <Reveal
            as="span"
            delay={0.22}
            scaleFrom={0.8}
            className="f-script block py-1 text-[clamp(2rem,9vw,2.8rem)] leading-none text-[#fff4d6] group-data-[wide]/stage:text-[2.25rem]"
          >
            weds
          </Reveal>
          <Reveal
            as="span"
            delay={0.34}
            y={22}
            className="mk-names block text-[clamp(2.4rem,11vw,3.6rem)] group-data-[wide]/stage:text-[2.85rem]"
          >
            {second}
          </Reveal>
        </h1>
      </div>

      {/* Tower (0.9×) with the tree line at its foot (1×). Wider than the column on purpose. */}
      <div className="relative z-[2] mt-2 flex justify-center">
        <div data-speed="0.9" className="w-[118%] shrink-0">
          <Art art={ART.gopuram} eager className="block h-auto w-full" />
        </div>
        {/* Two full-width copies stacked exactly (mirror behind): every hard edge of the art
            sits off-screen, so the tree line has no seams or gaps. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {[true, false].map((mirror) => (
            <Art
              key={String(mirror)}
              art={ART.trees}
              className="absolute bottom-[-46%] left-[-10%] h-auto w-[120%] max-w-none"
              style={mirror ? { transform: "scaleX(-1)" } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Date band, only when the save-the-date scene is switched off. */}
      {showDate && (
        <div
          className="relative z-[3] px-6 pt-10 pb-16 text-center"
          style={{ background: "var(--mk-cream)" }}
        >
          <Reveal>
            <div className="mk-rule" />
            <p className="f-heading mt-5 text-lg tracking-[0.14em] text-[var(--c-accent)] uppercase">
              {p.weekday} · {p.day} {p.month} {p.year}
            </p>
            {c.city && <p className="mt-2 text-lg italic">{c.city}</p>}
          </Reveal>
        </div>
      )}
    </section>
  );
}

// ───────────── Blessing (families) in the full-screen carved arch ─────────────

export function Families({ data }: SectionProps) {
  const c = data.content;
  const sides =
    c.couple.order === "GROOM_FIRST"
      ? [c.families.groom, c.families.bride]
      : [c.families.bride, c.families.groom];
  return (
    <section
      className="relative min-h-[max(calc(100svh/var(--mk-zoom,1)),140cqw)] overflow-clip"
      style={{ background: "#e9e2cf" }}
    >
      <Art
        art={ART.blessingArch}
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <div className="relative flex min-h-[max(calc(100svh/var(--mk-zoom,1)),140cqw)] flex-col items-center px-[15%] pt-[max(calc(24svh/var(--mk-zoom,1)),40cqw)] pb-[max(calc(15svh/var(--mk-zoom,1)),12cqw)] text-center">
        <Reveal scaleFrom={0.85} className="relative">
          <div
            data-ambient
            aria-hidden="true"
            className="absolute -inset-3 rounded-full border border-dashed border-[#c8963c]/70"
            style={{ animation: "mk-turn 60s linear infinite" }}
          />
          <Art art={ART.ganesha} className="relative size-[5.5rem]" />
        </Reveal>
        {c.invocation && (
          <Reveal
            as="p"
            delay={0.08}
            className="f-heading mt-4 text-sm tracking-[0.08em] text-[var(--c-accent)]"
          >
            {c.invocation}
          </Reveal>
        )}
        <Reveal
          as="p"
          delay={0.14}
          className="f-script mt-3 text-[2rem] leading-tight text-[var(--mk-gold-ink)]"
        >
          With the blessings of
        </Reveal>
        <div className="mt-3 space-y-4">
          {sides.map((fam, i) => (
            <Reveal key={i} delay={0.2 + i * 0.08}>
              {fam.label && (
                <Eyebrow className="text-[0.6rem] text-[var(--c-muted)]">{fam.label}</Eyebrow>
              )}
              {fam.lines.map((l) => (
                <p key={l} className="mt-1 text-[1.15rem] leading-snug">
                  {l}
                </p>
              ))}
              {fam.grandparents.length > 0 && (
                <p className="mt-1 text-sm text-[var(--c-muted)] italic">
                  Grandchild of {fam.grandparents.join(" and ")}
                </p>
              )}
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.36} className="mt-5">
          <div className="mk-rule" />
          <p className="mx-auto mt-4 max-w-[26ch] text-[1.05rem] leading-snug italic">
            {c.messages.welcome}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────── Greeting: only for personalised guest links ─────────────

export function Greeting({ data }: SectionProps) {
  const g = data.guest;
  if (!g) return null;
  return (
    <section className="px-6 py-14 text-center" style={{ background: "var(--c-bg)" }}>
      <Reveal>
        <p className="f-script text-[2.2rem] leading-tight text-[var(--mk-gold-light)]">
          {g.greeting || `Dear ${g.displayName},`}
        </p>
        {g.personalNote && (
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-[var(--c-accent-contrast)] italic">
            “{g.personalNote}”
          </p>
        )}
      </Reveal>
    </section>
  );
}

// ───────────── Couple in the maroon temple arch ─────────────

export function Couple({ data }: SectionProps) {
  const { couple, media } = data.content;
  const people =
    couple.order === "GROOM_FIRST" ? [couple.groom, couple.bride] : [couple.bride, couple.groom];
  const photo = media.couplePhotos[0];
  const names = (
    <>
      <Reveal
        as="p"
        className={`f-script leading-tight ${photo ? "text-[2.3rem] text-[var(--mk-gold-light)]" : "text-[6cqw] text-[var(--mk-gold-ink)]"}`}
      >
        The bride &amp; the groom
      </Reveal>
      <div className={photo ? "mt-4 grid gap-6" : "mt-[1cqw] grid gap-[1.8cqw]"}>
        {people.map((p, i) => (
          <Reveal key={p.firstName + i} delay={0.1 + i * 0.1}>
            <h2
              className={`mk-names ${photo ? "text-[1.6rem]" : "text-[4cqw] text-[var(--c-accent)]"}`}
            >
              {p.firstName} {p.lastName}
            </h2>
            {p.shortBio && (
              <p
                className={
                  photo
                    ? "mt-2 text-[1.05rem] leading-snug italic opacity-90"
                    : "mt-[0.4cqw] text-[3.15cqw] leading-[1.22] text-[var(--c-muted)] italic"
                }
              >
                {p.shortBio}
              </p>
            )}
          </Reveal>
        ))}
      </div>
    </>
  );
  return (
    <section
      className={`relative overflow-clip ${photo ? "" : "pb-8"}`}
      style={{ background: "var(--c-bg)" }}
    >
      <div className="[container-type:inline-size] relative mx-auto max-w-[640px]">
        <Art art={ART.coupleArch} className="block h-auto w-full" />
        {photo ? (
          <Reveal
            scaleFrom={0.96}
            className="absolute top-[15.5%] right-[18%] bottom-[38%] left-[18%] overflow-hidden border-2 border-[#ecd08a] shadow-[0_20px_40px_-14px_rgba(60,10,0,0.55)]"
            style={{ borderRadius: "50% 50% 10px 10px / 30% 30% 10px 10px" }}
          >
            <KitImage
              media={photo}
              sizes="(max-width: 640px) 64vw, 410px"
              className="h-full w-full"
            />
          </Reveal>
        ) : (
          <>
            {/* Names and bios sit in the cream of the arch window, above the couple. */}
            <div className="absolute top-[25.5%] right-[21%] left-[21%] text-center">{names}</div>
            <Reveal y={40} className="absolute top-[50.5%] left-1/2 w-[35%] -translate-x-1/2">
              <div
                data-ambient
                style={{
                  animation: "mk-sway 6s ease-in-out infinite",
                  transformOrigin: "50% 100%",
                }}
              >
                <Art
                  art={ART.varmala}
                  className="h-auto w-full drop-shadow-[0_18px_18px_rgba(60,10,0,0.35)]"
                />
              </div>
            </Reveal>
          </>
        )}
      </div>
      {photo && (
        <div className="relative mx-auto max-w-[640px] px-6 pt-6 pb-16 text-center text-[var(--c-accent-contrast)]">
          {names}
        </div>
      )}
    </section>
  );
}

// ───────────── Events: a board per ceremony, the last one gets the temple gate ─────────────

const ORDINALS = ["one", "two", "three", "four", "five", "six", "seven"];

/** "Day one", "Day two"… across the event dates; the weekday for a single-day wedding. */
function dayLabeller(events: InvitationEvent[]) {
  const days = [...new Set(events.map((e) => e.date))].sort();
  return (e: InvitationEvent) => {
    const i = days.indexOf(e.date);
    return days.length > 1 && ORDINALS[i] ? `Day ${ORDINALS[i]}` : dateParts(e.date).weekday;
  };
}

function EventBoard({ e, day, variant }: { e: InvitationEvent; day: string; variant: 0 | 1 }) {
  const art = variant === 0 ? ART.eventArchA : ART.eventArchB;
  return (
    <Reveal
      as="li"
      y={36}
      className="[container-type:inline-size] relative aspect-[390/340] overflow-hidden border-t-2 border-black/30"
    >
      <Art art={art} className="absolute inset-0 h-full w-full object-cover" />
      <article
        className={`relative flex h-full flex-col items-center px-[11%] text-center ${variant === 0 ? "pt-[13%]" : "pt-[18%]"}`}
      >
        <Eyebrow className="text-[max(0.58rem,2.4cqw)] text-[var(--c-muted)]">{day}</Eyebrow>
        <h3 className="f-script text-[max(2rem,9.5cqw)] leading-[1.15] text-[var(--c-accent)]">
          {e.name}
        </h3>
        <p className="text-[max(0.95rem,3.9cqw)] leading-tight">
          <time dateTime={`${e.date}T${e.startTime}`}>{formatLongDate(e.date)}</time>
        </p>
        <p className="text-[max(0.9rem,3.6cqw)] leading-tight italic">
          {formatTimeRange(e.startTime, e.endTime)} · {e.venue.name}
        </p>
        <EventActions
          event={e}
          className="mt-[2.2cqw] justify-center gap-[1.6cqw]"
          buttonClassName="mk-pill min-h-8"
        />
      </article>
    </Reveal>
  );
}

/** The last celebration: full temple-gate scene with simple type and a glowing doorway. */
function FeatureEvent({ e, day }: { e: InvitationEvent; day: string }) {
  return (
    <Reveal y={30} className="relative" style={{ background: "var(--mk-cream)" }}>
      <div className="relative mx-auto max-w-[640px]">
        <Art art={ART.courtyard} className="block h-auto w-full" />
        <div
          data-ambient
          aria-hidden="true"
          className="absolute top-[55%] left-1/2 aspect-square w-[42%] rounded-full mix-blend-screen"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,226,160,0.9), rgba(255,190,100,0.35) 55%, transparent 80%)",
            animation: "mk-glow 4.5s ease-in-out infinite",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[45%]"
          style={{ background: "linear-gradient(180deg, transparent, var(--mk-cream) 70%)" }}
        />
      </div>
      <article className="relative mx-auto -mt-[42%] max-w-[640px] px-6 pb-16 text-center">
        <Eyebrow className="text-[var(--c-muted)]">{day}</Eyebrow>
        <h3 className="f-script mt-1 text-[clamp(3.2rem,15vw,4.4rem)] leading-none text-[var(--c-accent)]">
          {e.name}
        </h3>
        <div className="mk-rule mt-4" />
        <p className="mt-4 text-[1.2rem]">
          <time dateTime={`${e.date}T${e.startTime}`}>{formatLongDate(e.date)}</time>
        </p>
        <p className="text-[1.1rem] italic">{formatTimeRange(e.startTime, e.endTime)}</p>
        <p className="mt-2 text-[1.1rem]">{e.venue.name}</p>
        {e.venue.address && <p className="text-sm text-[var(--c-muted)]">{e.venue.address}</p>}
        {e.description && (
          <p className="mx-auto mt-3 max-w-sm leading-relaxed italic">{e.description}</p>
        )}
        {e.dressCode && (
          <Eyebrow className="mt-3 text-[0.62rem] text-[var(--c-muted)]">
            Dress code · {e.dressCode}
          </Eyebrow>
        )}
        <EventActions event={e} className="mt-5 justify-center gap-6" buttonClassName="mk-link" />
      </article>
    </Reveal>
  );
}

export function Events({ data }: SectionProps) {
  const events = data.content.events;
  const feature = Boolean(data.options.featureLastEvent) && events.length >= 2;
  const boards = feature ? events.slice(0, -1) : events;
  const last = feature ? events[events.length - 1] : undefined;
  const dayOf = dayLabeller(events);
  return (
    <section style={{ background: "var(--c-bg)" }}>
      <Reveal className="px-6 pt-14 pb-10 text-center">
        <Eyebrow className="text-[var(--mk-gold-light)]">Step inside</Eyebrow>
        <h2 className="f-script mt-1 text-[2.6rem] text-[#fff3d6]">The celebrations</h2>
        <div className="mk-rule mt-3" />
      </Reveal>
      <ol>
        {boards.map((e, i) => (
          <EventBoard key={e.id} e={e} day={dayOf(e)} variant={(i % 2) as 0 | 1} />
        ))}
      </ol>
      {last && <FeatureEvent e={last} day={dayOf(last)} />}
    </section>
  );
}

// ───────────── Save the date on the temple hills ─────────────

export function Countdown({ data }: SectionProps) {
  const p = dateParts(data.content.weddingDate);
  const v = useCountdown(data.countdownTo);
  const medallion = (
    <div className="flex aspect-square w-full flex-col items-center justify-center rounded-full border-2 border-[#c8963c] bg-[var(--mk-cream)]">
      <Eyebrow className="text-[0.62rem] text-[var(--c-accent)]">{p.weekday}</Eyebrow>
      <p className="mk-names text-[3.4rem] leading-none text-[var(--c-accent)]">{p.day}</p>
      <Eyebrow className="text-[0.62rem] text-[var(--c-accent)]">
        {p.month} {p.year}
      </Eyebrow>
    </div>
  );
  return (
    <section
      className="relative min-h-[max(calc(100svh/var(--mk-zoom,1)),210cqw)] overflow-clip"
      style={{ background: "var(--mk-cream)" }}
    >
      <Art art={ART.hills} className="absolute inset-0 h-full w-full object-cover object-bottom" />
      {/* Blend the paper into the cream above, so there's no seam after the hero. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-24"
        style={{ background: "linear-gradient(180deg, var(--mk-cream), transparent)" }}
      />
      <div className="relative flex flex-col items-center px-6 pt-[27cqw] pb-[60cqw] text-center">
        <Reveal>
          <Eyebrow className="text-[var(--c-accent)]">Save the date</Eyebrow>
          <h2 className="f-script mt-1 text-[2.6rem] leading-tight text-[var(--mk-gold-ink)]">
            Mark your calendar
          </h2>
        </Reveal>
        <Reveal delay={0.1} scaleFrom={0.9} className="mt-5">
          {data.options.scratchDate ? (
            <ScratchReveal
              className="w-[11.5rem] rounded-full"
              label="Scratch me"
              tapLabel="Or tap to reveal"
              tapClassName="text-[var(--c-text)]"
              foil={["#f3d68e", "#a8741f"]}
            >
              {medallion}
            </ScratchReveal>
          ) : (
            <div className="w-[11.5rem] rounded-full shadow-[0_0_0_6px_rgba(247,236,213,0.7)]">
              {medallion}
            </div>
          )}
        </Reveal>
        <Reveal delay={0.2} className="mt-4">
          {v?.isPast ? (
            <p className="f-heading tracking-[0.14em] text-[var(--c-accent)] uppercase">
              The celebrations have begun
            </p>
          ) : (
            <p
              role="timer"
              aria-live="off"
              className="f-heading text-[0.85rem] tracking-[0.2em] text-[var(--c-accent)] uppercase tabular-nums"
            >
              {v ? `${v.days} days · ${v.hours} hrs · ${v.minutes} min` : " "}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ───────────── Story gallery in the gilded frame ─────────────

function GildedCarousel({
  images,
}: {
  images: SectionProps["data"]["content"]["media"]["gallery"];
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = track.current;
    if (el && el.clientWidth) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const w = FRAME_WINDOW;
  const many = images.length > 8;
  return (
    <div>
      <div className="relative mx-auto aspect-[1998/1492] w-[94%] drop-shadow-[0_24px_30px_rgba(60,20,0,0.35)]">
        <div
          className="absolute overflow-hidden bg-black"
          style={{
            left: `${w.left}%`,
            right: `${w.right}%`,
            top: `${w.top}%`,
            bottom: `${w.bottom}%`,
          }}
        >
          <div
            ref={track}
            onScroll={onScroll}
            role="region"
            aria-label="Photo gallery"
            tabIndex={0}
            className="mk-noscrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {images.map((m, i) => (
              <div key={m.assetId + i} className="h-full w-full shrink-0 snap-center">
                <KitImage
                  media={m}
                  sizes="(max-width: 640px) 70vw, 400px"
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        </div>
        <Art art={ART.gildedFrame} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
      {images[active]?.alt && (
        <p className="mx-auto mt-6 max-w-xs text-center text-[1.15rem] italic">
          {images[active]?.alt}
        </p>
      )}
      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Previous photo"
            className="grid size-11 place-items-center rounded-full text-[var(--c-accent)]"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          {many ? (
            <span className="f-heading min-w-16 text-center text-sm tracking-[0.2em] text-[var(--c-accent)]">
              {active + 1} / {images.length}
            </span>
          ) : (
            images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Photo ${i + 1} of ${images.length}`}
                aria-current={i === active || undefined}
                className="grid h-6 w-6 place-items-center"
              >
                <span
                  aria-hidden="true"
                  className="block h-1.5 w-1.5 rounded-full transition-transform duration-300"
                  style={{
                    background: "var(--c-accent)",
                    opacity: i === active ? 1 : 0.35,
                    transform: i === active ? "scaleX(3)" : "none",
                  }}
                />
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Next photo"
            className="grid size-11 place-items-center rounded-full text-[var(--c-accent)]"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export function GallerySection({ data }: SectionProps) {
  const images = [...data.content.media.gallery, ...data.content.media.familyPhotos];
  if (images.length === 0) return null;
  return (
    <section
      className="px-4 py-20"
      style={{ background: "radial-gradient(120% 80% at 50% 20%, #fff7e6, var(--mk-cream))" }}
    >
      <Reveal className="mb-10 text-center">
        <Eyebrow className="text-[var(--c-accent)]">Our story</Eyebrow>
        <h2 className="f-script mt-1 text-[2.7rem] leading-tight text-[var(--mk-gold-ink)]">
          Moments together
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        {String(data.options.galleryStyle ?? "frame") === "grid" ? (
          <Gallery
            images={images}
            variant="grid"
            itemClassName="overflow-hidden rounded-md border-2 border-[#c8963c]"
          />
        ) : (
          <GildedCarousel images={images} />
        )}
      </Reveal>
    </section>
  );
}

// ───────────── Video and message ─────────────

export function Video({ data }: SectionProps) {
  const v = data.content.media.video;
  if (!v) return null;
  return (
    <section className="px-5 py-16" style={{ background: "var(--mk-cream)" }}>
      <Reveal className="mb-8 text-center">
        <Eyebrow className="text-[var(--c-accent)]">A little film</Eyebrow>
        <h2 className="f-script mt-1 text-[2.5rem] text-[var(--mk-gold-ink)]">Our story</h2>
      </Reveal>
      <Reveal className="mx-auto max-w-[640px] overflow-hidden rounded-md border-4 border-[#c8963c] shadow-[0_24px_40px_-24px_rgba(60,20,0,0.6)]">
        <VideoBlock video={v} />
      </Reveal>
    </section>
  );
}

export function Message({ data }: SectionProps) {
  const m = data.content.messages;
  if (!m.invitation) return null;
  return (
    <section className="px-6 py-16 text-center" style={{ background: "var(--mk-cream)" }}>
      <Reveal>
        <Art art={ART.ganesha} className="mx-auto size-16" />
        <p className="inv-pre-line mx-auto mt-6 max-w-md text-xl leading-relaxed italic">
          {m.invitation}
        </p>
        <div className="mk-rule mt-6" />
      </Reveal>
    </section>
  );
}

// ───────────── Closing: the temple glowing in the theme colours ─────────────

const DIYAS = [
  [30, 22],
  [62, 18],
  [45, 34],
  [24, 48],
  [72, 44],
  [52, 58],
  [36, 70],
  [66, 72],
] as const;

export function Footer({ data }: SectionProps) {
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  return (
    <footer
      className="relative overflow-clip"
      style={{
        background:
          "linear-gradient(180deg, var(--c-bg) 0%, color-mix(in srgb, var(--c-bg) 72%, #c8963c) 38%, color-mix(in srgb, #c8963c 75%, var(--c-bg)) 64%, #e7c98c 80%, var(--mk-cream) 94%)",
      }}
    >
      <Reveal className="relative z-[1] px-6 pt-20 text-center text-[#fff3d6]">
        <p className="f-script text-[2.6rem] leading-tight">We await your presence</p>
        {c.messages.closing && (
          <p className="mx-auto mt-2 max-w-xs text-lg opacity-95">{c.messages.closing}</p>
        )}
      </Reveal>
      <div className="relative mx-auto mt-6 w-[64%] max-w-[360px]" aria-hidden="true">
        <Art
          art={ART.gopuram}
          className="block h-auto w-full"
          style={{ filter: "brightness(0.6) saturate(0.8) sepia(0.25)" }}
        />
        {DIYAS.map(([x, y], i) => (
          <span
            key={i}
            data-ambient
            className="absolute size-1.5 rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: "#ffd27a",
              boxShadow: "0 0 8px 3px rgba(255,190,90,0.7)",
              animation: `vs-twinkle ${2.4 + (i % 3) * 0.7}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>
      <Reveal
        className="relative z-[1] -mt-16 rounded-t-[1.75rem] px-6 pt-10 pb-28 text-center"
        style={{ background: "var(--mk-cream)" }}
      >
        <p className="mk-names text-[1.5rem] text-[var(--c-accent)]">
          {first} &amp; {second}
        </p>
        {c.hashtag && <p className="mt-2 text-lg italic">{c.hashtag}</p>}
        <p className="mk-eyebrow mt-10 text-[0.6rem] text-[var(--c-muted)]">
          Made with{" "}
          <Link href="/?ref=invite" className="underline-offset-4 hover:underline">
            {BRAND.name}
          </Link>
        </p>
      </Reveal>
    </footer>
  );
}
