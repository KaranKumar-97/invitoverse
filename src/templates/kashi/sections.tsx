"use client";

/* eslint-disable @next/next/no-img-element -- painted scene art, sized by layout */
import { Pointer } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { orderedNames } from "@/lib/invitation/couple";
import { dateParts, formatLongDate, formatTime, formatTimeRange } from "@/lib/invitation/dates";
import type { InvitationEvent, MediaRef } from "@/lib/invitation/schema";
import { useInvitation } from "@/invitation-kit/context";
import { useCountdown } from "@/invitation-kit/countdown/useCountdown";
import { EventActions } from "@/invitation-kit/events/EventActions";
import { Gallery } from "@/invitation-kit/media/Gallery";
import { cloudinaryUrl, KitImage } from "@/invitation-kit/media/KitImage";
import { VideoBlock } from "@/invitation-kit/media/VideoBlock";
import { ScratchReveal } from "@/invitation-kit/interactive/ScratchReveal";
import { Reveal } from "@/invitation-kit/motion/Reveal";
import { ScrollMotion } from "@/invitation-kit/motion/ScrollMotion";
import type { SectionProps } from "@/invitation-kit/types";
import { ART, SANDSTONE_OPENING, type ArtImage } from "./art";

const sky = { background: `#3f86d2 url(${ART.sky.src}) center top / cover` };

function Rule({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-px w-28 ${className}`}
      style={{
        background: "linear-gradient(90deg, transparent, var(--ks-line), transparent)",
      }}
    />
  );
}

function SectionTitle({
  eyebrow,
  title,
  onSky = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  onSky?: boolean;
}) {
  return (
    <Reveal className="mb-8 text-center">
      {eyebrow && (
        <p className="ks-eyebrow" style={onSky ? { color: "var(--ks-sky-ink)" } : undefined}>
          {eyebrow}
        </p>
      )}
      <h2
        className="ks-heading mt-2 text-[1.9rem] leading-tight @md:text-[2.2rem]"
        style={onSky ? { color: "var(--ks-sky-ink)" } : undefined}
      >
        {title}
      </h2>
      <Rule className="mx-auto mt-3" />
    </Reveal>
  );
}

/** Scroll-driven motion when on; a plain wrapper otherwise. */
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

function useScrollMotion(data: SectionProps["data"]) {
  const { reducedMotion } = useInvitation();
  return Boolean(data.options.scrollMotion) && !reducedMotion;
}

/**
 * The cover's view, kept after opening: names in the sky inside the carved jharokha, the ghats
 * below. With scroll motion on, five layers move at different speeds — the sky and clouds lag
 * far behind, the names drift down and fade, the ghats climb over them and the jharokha (the
 * nearest layer) swells past the camera — then the date card lands on the ghat steps.
 */
export function Hero({ data }: SectionProps) {
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  const move = useScrollMotion(data);
  return (
    <section className="relative">
      {/* The painted sky sits on the frame too (under the moving sky layer), so text never
          reads against a flat fill. */}
      <div className="relative h-[max(100dvh,36rem)] overflow-hidden" style={sky}>
        <Motion
          on={move}
          to={{ y: 260 }}
          distance={1}
          className="absolute inset-x-0 top-0 h-[135%]"
        >
          <div className="h-full w-full" style={sky} />
        </Motion>
        {ART.clouds.map((cl, i) => (
          <Motion
            key={cl.src}
            on={move}
            to={{ y: i === 0 ? 170 : 110 }}
            distance={1}
            className="absolute"
            style={
              i === 0
                ? { left: "-12%", top: "34%", width: "52%" }
                : { right: "-16%", top: "41%", width: "60%" }
            }
          >
            <img src={cl.src} alt="" className="ks-drift w-full" data-ambient />
          </Motion>
        ))}
        <Motion
          on={move}
          to={{ y: 200, opacity: 0.1 }}
          distance={0.85}
          className="relative z-10 flex flex-col items-center px-10 pt-[max(7rem,17dvh)] text-center"
        >
          <Reveal
            as="p"
            y={8}
            className="ks-on-sky text-[0.75rem] font-semibold tracking-[0.28em] uppercase"
          >
            Together with their families
          </Reveal>
          <h1 id="invite-title" tabIndex={-1} className="mt-4 outline-none">
            <Reveal
              as="span"
              delay={0.1}
              y={22}
              className="f-display ks-on-sky block text-[clamp(2.6rem,12cqw,3.6rem)] leading-[1.02] font-semibold uppercase"
            >
              {first}
            </Reveal>
            <Reveal
              as="span"
              delay={0.22}
              scaleFrom={0.7}
              className="f-script ks-on-sky block text-[clamp(1.9rem,8.5cqw,2.6rem)] leading-tight"
            >
              &amp;
            </Reveal>
            <Reveal
              as="span"
              delay={0.34}
              y={22}
              className="f-display ks-on-sky block text-[clamp(2.6rem,12cqw,3.6rem)] leading-[1.02] font-semibold uppercase"
            >
              {second}
            </Reveal>
          </h1>
        </Motion>
        <Motion
          on={move}
          to={{ y: -100 }}
          distance={0.9}
          className="absolute inset-x-0 z-20"
          // Same framing as the cover (112% wide, bottom 110px below the fold, never above 44%)
          // so the hand-off doesn't jump; the hidden strip covers the ghats' climb on scroll.
          style={{
            top: `max(44%, calc(100% + 110px - var(--ks-col) * 1.12 * ${ART.ghats.h} / ${ART.ghats.w}))`,
          }}
        >
          <img
            src={ART.ghats.src}
            alt=""
            width={ART.ghats.w}
            height={ART.ghats.h}
            fetchPriority="high"
            className="ml-[-6%] w-[112%] max-w-none"
          />
        </Motion>
        <Motion
          on={move}
          to={{ scale: 1.55, opacity: 0, y: -30 }}
          distance={0.7}
          className="pointer-events-none absolute inset-0 z-30 origin-[50%_56%]"
        >
          <img
            src={ART.arch.src}
            alt=""
            width={ART.arch.w}
            height={ART.arch.h}
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </Motion>
      </div>
      <SaveOurDate data={data} />
    </section>
  );
}

/** Jharokha-shaped card (cusped arch head, notched base) in a 600×500 box. */
const CARD_PATH =
  "M0 196C0 160 26 138 62 138C98 138 112 112 150 104C196 94 232 78 262 46C280 28 292 14 300 0C308 14 320 28 338 46C368 78 404 94 450 104C488 112 502 138 538 138C574 138 600 160 600 196L600 462Q568 462 568 500L32 500Q32 462 0 462Z";
const CARD_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" preserveAspectRatio="none"><path d="${CARD_PATH}"/></svg>`,
)}") center / 100% 100% no-repeat`;

/** Gold double outline drawn over the card (the scratch surface itself is masked to the shape). */
function CardFrame() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 500"
      className="pointer-events-none absolute inset-x-0 top-0 aspect-[6/5] w-full overflow-visible drop-shadow-[0_14px_22px_rgba(60,40,10,0.35)]"
    >
      <defs>
        <linearGradient id="ks-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6DFA4" />
          <stop offset="0.45" stopColor="#C29546" />
          <stop offset="0.7" stopColor="#F2D795" />
          <stop offset="1" stopColor="#A87B32" />
        </linearGradient>
      </defs>
      <path d={CARD_PATH} fill="none" stroke="url(#ks-gold)" strokeWidth="9" />
      <path
        d={CARD_PATH}
        fill="none"
        stroke="#B8893C"
        strokeWidth="1.6"
        transform="translate(300 262) scale(0.955) translate(-300 -262)"
      />
    </svg>
  );
}

/** Thin rules with a lotus in the middle. */
function LotusRule({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 20" className={`h-4 w-36 ${className}`} fill="none">
      <path d="M8 12H58M102 12H152" stroke="currentColor" strokeWidth="0.8" />
      <path d="M58 12l3-2.5 3 2.5-3 2.5zM96 12l3-2.5 3 2.5-3 2.5z" fill="currentColor" />
      <path
        d="M80 3c-3 3.5-3 8.5 0 12.5 3-4 3-9 0-12.5zM80 15.5c-2.5-5-7-7-11-6.5 1 4.5 5 7 11 6.5zM80 15.5c2.5-5 7-7 11-6.5-1 4.5-5 7-11 6.5z"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <path d="M70 16.5h20" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

/**
 * "Save our date", in the flow right under the hero: a jharokha-shaped card in a gold frame.
 * With `scratchDate` on, a shiny gold foil (with a light sweeping across it) hides the date until guests scratch it away (the
 * hint under the card doubles as a tap-to-reveal button).
 */
function SaveOurDate({ data }: Pick<SectionProps, "data">) {
  const [revealed, setRevealed] = useState(false);
  const c = data.content;
  const p = dateParts(c.weddingDate);
  const date = (
    <div
      className="flex aspect-[6/5] flex-col items-center justify-center px-8 pt-[16%] text-center select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 60%, #fffaf0 0%, #f7ead0 75%, #efdcb8 100%)",
        color: "var(--ks-sky-ink)",
      }}
    >
      <p
        className="text-[0.72rem] font-semibold tracking-[0.3em] uppercase"
        style={{ color: "var(--ks-sky-gold)" }}
      >
        Save our date
      </p>
      <LotusRule className="mt-1.5" />
      <p className="f-display mt-2 text-[clamp(1.6rem,8cqw,2.1rem)] leading-none tracking-[0.06em] uppercase">
        {p.day} {p.month}
      </p>
      <p
        className="f-script mt-1 text-[clamp(2rem,10cqw,2.6rem)] leading-tight"
        style={{ color: "var(--ks-sky-gold)" }}
      >
        {p.weekday}
      </p>
      <LotusRule className="mt-1" />
      <p className="mt-1.5 text-sm font-semibold tracking-[0.2em] uppercase">
        {p.year}
        {c.city ? ` · ${c.city}` : ""}
      </p>
    </div>
  );
  return (
    <Reveal
      className="px-6 pt-10 pb-8"
      style={{ background: "linear-gradient(180deg, var(--c-bg), #f6ead2)" }}
    >
      <div className="relative mx-auto w-[min(86cqw,22rem)]">
        {data.options.scratchDate ? (
          <ScratchReveal
            label="Save our date"
            foilImage={ART.scratchFoil.src}
            onReveal={() => setRevealed(true)}
            surfaceStyle={{ mask: CARD_MASK, WebkitMask: CARD_MASK }}
            tapClassName="mt-5 no-underline text-[var(--ks-sky-ink)] opacity-100"
            tapLabel={
              <span className="flex flex-col items-center">
                <span aria-hidden="true" className="flex items-center gap-3">
                  <span className="h-px w-20 bg-[var(--ks-line)]" />
                  <Pointer className="size-6" strokeWidth={1.4} />
                  <span className="h-px w-20 bg-[var(--ks-line)]" />
                </span>
                <span className="mt-1.5 text-xl italic">Scratch to reveal</span>
                <span className="text-xs text-[var(--c-muted)]">or tap here</span>
              </span>
            }
          >
            {date}
          </ScratchReveal>
        ) : (
          <div style={{ mask: CARD_MASK, WebkitMask: CARD_MASK }}>{date}</div>
        )}
        {Boolean(data.options.scratchDate) && !revealed && (
          // A light sweep across the gold foil (inside the card shape) until it's scratched.
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 aspect-[6/5] overflow-hidden"
            style={{ mask: CARD_MASK, WebkitMask: CARD_MASK }}
          >
            <span data-ambient className="ks-sheen absolute inset-y-0 -left-1/2 w-1/2" />
          </div>
        )}
        <CardFrame />
      </div>
    </Reveal>
  );
}

/** Ganesha, the invocation and the welcome inside the arch that frames the ghats and palms. */
export function Greeting({ data }: SectionProps) {
  const g = data.guest;
  const c = data.content;
  return (
    <section
      className="relative overflow-hidden"
      style={{ ...sky, minHeight: `calc(var(--ks-col) * ${ART.ghatArch.h} / ${ART.ghatArch.w})` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.2))",
        }}
      />
      <img
        src={ART.ghatArch.src}
        alt=""
        width={ART.ghatArch.w}
        height={ART.ghatArch.h}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <Reveal
        className="relative mx-auto flex max-w-[30rem] flex-col items-center px-[14%] pt-[15%] pb-[58%] text-center"
        style={{ color: "var(--ks-sky-ink)" }}
      >
        <img
          src={ART.ganesha.src}
          alt=""
          width={ART.ganesha.w}
          height={ART.ganesha.h}
          loading="lazy"
          className="w-14 drop-shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
        />
        {c.invocation && <p className="mt-2 text-sm font-semibold">{c.invocation}</p>}
        {g && (
          <p
            className="f-script mt-4 text-[2.3rem] leading-tight"
            style={{ color: "var(--ks-sky-gold)" }}
          >
            {g.greeting || `Dear ${g.displayName},`}
          </p>
        )}
        <p className="mt-4 text-sm font-semibold tracking-[0.2em] uppercase">We cordially</p>
        <p
          className="f-display text-[clamp(3rem,15cqw,4.2rem)] leading-none tracking-[0.06em] uppercase"
          style={{ color: "var(--ks-sky-gold)" }}
        >
          Invite
        </p>
        <p className="mt-1 text-sm font-semibold tracking-[0.2em] uppercase">you</p>
        <p className="mt-4 rounded-2xl bg-[#fff8ea]/70 px-4 py-3 text-[1.08rem] leading-relaxed font-semibold">
          {c.messages.welcome}
        </p>
        {g?.personalNote && <p className="mt-5 italic">“{g.personalNote}”</p>}
      </Reveal>
    </section>
  );
}

/** Each partner's family on the sky, joined by a script ampersand, temples rising below. */
export function Families({ data }: SectionProps) {
  const { families, couple } = data.content;
  const pairs =
    couple.order === "GROOM_FIRST"
      ? [
          { person: couple.groom, fam: families.groom, role: "Grandson of" },
          { person: couple.bride, fam: families.bride, role: "Granddaughter of" },
        ]
      : [
          { person: couple.bride, fam: families.bride, role: "Granddaughter of" },
          { person: couple.groom, fam: families.groom, role: "Grandson of" },
        ];
  return (
    <section
      className="relative overflow-hidden px-[15%] pt-[33%] text-center"
      style={{ ...sky, paddingBottom: `calc(var(--ks-col) * 0.92)`, color: "var(--ks-sky-ink)" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.25))",
        }}
      />
      <div className="relative">
        <Reveal>
          <h2 className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase">With love from</h2>
        </Reveal>
        {pairs.map(({ person, fam, role }, i) => (
          <div key={person.firstName + i}>
            {i === 1 && (
              <Reveal
                as="p"
                scaleFrom={0.6}
                className="f-script my-4 text-[2.6rem] leading-none"
                style={{ color: "var(--ks-sky-gold)" }}
              >
                &amp;
              </Reveal>
            )}
            <Reveal delay={0.05} className="mt-5">
              {fam.grandparents.length > 0 && (
                <>
                  <p className="text-sm italic">{role}</p>
                  <p className="text-[1.05rem] leading-snug font-semibold">
                    {fam.grandparents.join(" · ")}
                  </p>
                </>
              )}
              {(fam.label || fam.lines.length > 0) && (
                <>
                  {fam.label && <p className="mt-2 text-sm italic">{fam.label}</p>}
                  <p className="text-[1.05rem] leading-snug font-semibold">
                    {fam.lines.join(" · ")}
                  </p>
                </>
              )}
              <h3
                className="f-display mt-3 text-[clamp(2.2rem,11cqw,3rem)] leading-[1.05]"
                style={{ color: "var(--ks-sky-gold)" }}
              >
                {person.firstName}
                {person.lastName && <span className="block text-[0.6em]">{person.lastName}</span>}
              </h3>
            </Reveal>
          </div>
        ))}
      </div>
      <img
        src={ART.ghats.src}
        alt=""
        width={ART.ghats.w}
        height={ART.ghats.h}
        loading="lazy"
        className="absolute inset-x-0 bottom-[-4%] w-full"
      />
      {/* The carved jharokha frames the families and names; its pillars grow with the content. */}
      <div aria-hidden="true" className="ks-jharokha pointer-events-none absolute inset-0" />
    </section>
  );
}

const BRIDE_INK = "#9b2f3c";
const GROOM_INK = "#1d4a80";
const people0Color = (order: string) => (order === "GROOM_FIRST" ? GROOM_INK : BRIDE_INK);
const people1Color = (order: string) => (order === "GROOM_FIRST" ? BRIDE_INK : GROOM_INK);

/**
 * The couple: a paper-cut diorama (sky, paper clouds, ghats, waves and the couple)
 * inside a sandstone arch, with their first names and short bios in the sky. Layers drift at
 * different speeds while scrolling. The couple's first photo, if uploaded, takes the paper
 * couple's place.
 */
/**
 * Depth parallax for a layered scene: sets `--p` on the scene from +1 (scene entering from below)
 * through 0 (centred) to -1 (leaving at the top), and `--mx`/`--my` from the pointer on devices
 * with a fine pointer. Layers (see `Depth`) turn those into transforms. Off → nothing moves.
 */
function useDepthScene(ref: React.RefObject<HTMLElement | null>, on: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !on) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      el.style.setProperty("--p", Math.max(-1, Math.min(1, p)).toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (fine) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      ["--p", "--mx", "--my"].forEach((v) => el.style.removeProperty(v));
    };
  }, [ref, on]);
}

/**
 * One layer of a depth scene: `z` is how far (px) it travels across the scroll — far layers
 * little, near layers a lot — `grow` how much it swells as it passes (near layers come at you),
 * and it shifts against the pointer in proportion to its depth.
 */
function Depth({
  z,
  grow = 0,
  className,
  style,
  children,
}: {
  z: number;
  grow?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const t = z * 0.18;
  return (
    <div
      className={`ks-depth ${className ?? ""}`}
      style={{
        ...style,
        transform: `translate3d(calc(var(--mx, 0) * ${-t}px), calc(var(--p, 0) * ${z}px + var(--my, 0) * ${-t}px), 0) scale(calc(1 - var(--p, 0) * ${grow}))`,
      }}
    >
      {children}
    </div>
  );
}

export function Couple({ data }: SectionProps) {
  const { couple, media } = data.content;
  const move = useScrollMotion(data);
  const scene = useRef<HTMLDivElement>(null);
  useDepthScene(scene, move);
  const people =
    couple.order === "GROOM_FIRST" ? [couple.groom, couple.bride] : [couple.bride, couple.groom];
  const photo = media.couplePhotos[0];
  const o = SANDSTONE_OPENING;
  return (
    <section className="relative" style={{ background: "#e9cf98" }}>
      <div
        ref={scene}
        className="relative w-full"
        style={{ aspectRatio: `${ART.sandstoneArch.w} / ${ART.sandstoneArch.h}` }}
      >
        <div
          className="absolute overflow-hidden"
          style={{
            left: `${o.left}%`,
            top: `${o.top}%`,
            width: `${o.width}%`,
            height: `${o.height}%`,
            background: "#8cc2ee",
          }}
        >
          {/* Furthest: the sky barely moves; each paper layer nearer the guest moves more. */}
          <Depth z={14} className="absolute -inset-[8%]">
            <div
              className="h-full w-full"
              style={{ background: `url(${ART.sky.src}) center / cover` }}
            />
          </Depth>
          <Depth z={34} className="absolute inset-x-0 top-[1%]">
            <img
              src={ART.paperClouds[1].src}
              alt=""
              loading="lazy"
              className="ks-drift ml-[-30%] w-[56%]"
              data-ambient
            />
          </Depth>
          <Depth z={52} className="absolute inset-x-0 top-[50%]">
            <img
              src={ART.paperClouds[0].src}
              alt=""
              loading="lazy"
              className="ks-drift mr-[-16%] ml-auto w-[60%]"
              data-ambient
            />
          </Depth>
          <Depth z={70} grow={0.03} className="ks-paper absolute top-[38%] left-[-14%] w-[128%]">
            <img src={ART.paperGhats.src} alt="" loading="lazy" className="w-full" />
          </Depth>
          <Depth
            z={110}
            grow={0.05}
            className="ks-paper absolute bottom-[-30%] left-[-10%] w-[120%]"
          >
            <img
              src={ART.paperWaves.src}
              alt=""
              loading="lazy"
              className="ks-bob w-full"
              data-ambient
            />
          </Depth>
          <Depth
            z={150}
            grow={0.08}
            className="ks-paper absolute bottom-[-3%] left-[13%] w-[74%] origin-bottom"
          >
            {photo ? (
              <div className="mx-auto w-[86%] overflow-hidden rounded-t-full border-[6px] border-[#fdf4e2] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
                <KitImage media={photo} sizes="300px" className="aspect-[4/5] w-full" />
              </div>
            ) : (
              <img src={ART.paperCouple.src} alt="" loading="lazy" className="w-full" />
            )}
          </Depth>
          {/* Inner shadow: the scene sits recessed behind the stone. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 shadow-[inset_0_18px_30px_-10px_rgba(60,40,10,0.55),inset_0_-10px_24px_-10px_rgba(60,40,10,0.4)]"
          />
        </div>
        <img
          src={ART.sandstoneArch.src}
          alt=""
          width={ART.sandstoneArch.w}
          height={ART.sandstoneArch.h}
          loading="lazy"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <Depth z={24} className="absolute inset-x-0 top-[14%] px-[17%] text-center">
          <h2 className="sr-only">
            Meet {people[0]!.firstName} &amp; {people[1]!.firstName}
          </h2>
          {people.map((p, i) => (
            <Reveal key={p.firstName + i} delay={i * 0.15}>
              {i === 1 && (
                <p
                  aria-hidden="true"
                  className="f-script my-1 text-[1.8rem] leading-none"
                  style={{ color: "#6b430b" }}
                >
                  &amp;
                </p>
              )}
              <p
                aria-hidden="true"
                className="f-script text-[clamp(2.4rem,12cqw,3.1rem)] leading-[1.1]"
                style={{ color: i === 0 ? people0Color(couple.order) : people1Color(couple.order) }}
              >
                {p.firstName}
              </p>
              {p.shortBio && (
                <p
                  className="mx-auto max-w-[16rem] text-[0.92rem] leading-snug font-semibold italic"
                  style={{ color: "#3d2c1c", textShadow: "0 1px 8px rgba(255,248,230,0.95)" }}
                >
                  {p.shortBio}
                </p>
              )}
            </Reveal>
          ))}
        </Depth>
      </div>
    </section>
  );
}

/** Arched card head (pointed jharokha) in a 300×240 box, open at the bottom. */
const EVENT_ARCH =
  "M0 240L0 104C0 68 22 50 50 46C80 42 104 32 122 17C134 7 144 2 150 0C156 2 166 7 178 17C196 32 220 42 250 46C278 50 300 68 300 104L300 240";
const EVENT_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" preserveAspectRatio="none"><path d="${EVENT_ARCH}Z"/></svg>`,
)}") center / 100% 100% no-repeat`;
const EVENT_GOLD = "#C9A04F";

/** Card art per kind of function: [image, focal point for the arched crop]. */
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

function EventArt({ event }: { event: InvitationEvent }) {
  const [img, focus] = EVENT_ART[event.icon] ?? EVENT_ART.generic;
  return (
    <img
      src={img.src}
      alt=""
      width={img.w}
      height={img.h}
      loading="lazy"
      className="h-full w-full object-cover"
      style={{ objectPosition: focus }}
    />
  );
}

/** Full details for one function in a modal sheet (native dialog: focus trap + Esc for free). */
function EventDialog({ event, onClose }: { event: InvitationEvent | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (event && !d.open) d.showModal();
    if (!event && d.open) d.close();
  }, [event]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="ks-event-title"
      className="ks-dialog m-auto w-[min(92vw,26rem)] rounded-[26px] border-[1.5px] p-0 text-center"
      style={{ borderColor: EVENT_GOLD, background: "#fbf4e4", color: "var(--ks-sky-ink)" }}
    >
      {event && (
        <div className="px-6 pt-7 pb-6">
          <p className="ks-eyebrow" style={{ color: "var(--ks-sky-gold)" }}>
            <time dateTime={`${event.date}T${event.startTime}`}>{formatLongDate(event.date)}</time>
          </p>
          <h3 id="ks-event-title" className="f-display mt-2 text-[2rem] leading-tight">
            {event.name}
          </h3>
          <p className="italic">{formatTimeRange(event.startTime, event.endTime)}</p>
          <LotusRule className="mx-auto my-3" />
          <p className="ks-heading text-lg">{event.venue.name}</p>
          {event.venue.address && <p className="mt-0.5 text-sm">{event.venue.address}</p>}
          {event.description && <p className="mt-3 italic">{event.description}</p>}
          {event.dressCode && (
            <p className="mt-2 text-sm italic" style={{ color: "var(--ks-sky-gold)" }}>
              Dress: {event.dressCode}
            </p>
          )}
          <EventActions event={event} className="justify-center pt-5" buttonClassName="ks-button" />
          <button
            type="button"
            onClick={onClose}
            className="mt-4 min-h-11 px-4 text-sm underline underline-offset-4"
          >
            Close
          </button>
        </div>
      )}
    </dialog>
  );
}

/**
 * "Wedding Events": arched jharokha cards on cream paper above the ghats — two per row on phones,
 * all in one row on wide screens (the section breaks out of the phone column there). Each card
 * opens its full details (venue, notes, calendar and map) in a dialog.
 */
export function Events({ data }: SectionProps) {
  const events = data.content.events;
  const [open, setOpen] = useState<InvitationEvent | null>(null);
  return (
    <section
      className="@container relative ml-[calc(50%-50vw)] w-screen overflow-clip pt-16 pb-[clamp(9rem,34vw,16rem)]"
      style={{
        background: "linear-gradient(180deg, #dfe9f1 0%, #f6ecd6 22%, #f3e6c9 100%)",
        color: "var(--ks-sky-ink)",
      }}
    >
      {/* Pale ghats: a band along the bottom on phones, the right-hand side on wide screens. */}
      <div
        aria-hidden="true"
        className="ks-events-ghats pointer-events-none absolute"
        style={{ backgroundImage: `url(${ART.ghats.src})` }}
      />
      <div className="relative mx-auto max-w-[68rem] px-4">
        <Reveal className="mb-8 text-center">
          <p className="ks-eyebrow" style={{ color: "var(--ks-sky-gold)" }}>
            Our celebrations
          </p>
          <h2 className="f-display mt-2 text-[clamp(2.2rem,9cqw,3.6rem)] leading-tight">
            Wedding Events
          </h2>
          <LotusRule className="mx-auto mt-2" />
          <p className="mt-2 italic">Join us in the joyous celebrations</p>
        </Reveal>
        <ol
          aria-label="Events"
          className="flex flex-wrap items-stretch justify-center gap-3 @[52rem]:gap-5"
        >
          {events.map((e, i) => {
            const p = dateParts(e.date);
            return (
              <li
                key={e.id}
                className="w-[calc(50%-0.375rem)] max-w-[15rem] @[52rem]:w-[calc(25%-1rem)]"
              >
                <Reveal delay={(i % 4) * 0.08} className="h-full">
                  <article className="flex h-full flex-col drop-shadow-[0_18px_22px_rgba(80,55,15,0.22)]">
                    <div className="relative aspect-[300/240]">
                      <div
                        className="absolute inset-0"
                        style={{ mask: EVENT_MASK, WebkitMask: EVENT_MASK }}
                      >
                        <EventArt event={e} />
                      </div>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 300 240"
                        preserveAspectRatio="none"
                        className="absolute inset-0 h-full w-full overflow-visible"
                      >
                        <path
                          d={EVENT_ARCH}
                          fill="none"
                          stroke={EVENT_GOLD}
                          strokeWidth="1.6"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                    <div
                      className="flex flex-1 flex-col items-center rounded-b-[22px] border-x-[1.6px] border-b-[1.6px] px-2 pt-3 pb-3 text-center"
                      style={{ borderColor: EVENT_GOLD, background: "#fbf4e4" }}
                    >
                      <h3 className="f-display text-[clamp(1.3rem,5.4cqw,1.7rem)] leading-tight">
                        {e.name}
                      </h3>
                      <p className="mt-1 text-[0.95rem]">
                        <time dateTime={`${e.date}T${e.startTime}`}>
                          {p.day} {p.monthShort} {p.year}
                        </time>
                        <span className="block">{formatTime(e.startTime)}</span>
                      </p>
                      <LotusRule className="mt-1.5 w-28" />
                      <button
                        type="button"
                        onClick={() => setOpen(e)}
                        className="mt-auto inline-flex min-h-11 items-center gap-1.5 px-2 text-sm"
                        aria-label={`View details: ${e.name}`}
                      >
                        View Details <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
      <EventDialog event={open} onClose={() => setOpen(null)} />
    </section>
  );
}

/** A small pile of prints; tapping it sends the top one to the back. */
function PhotoStack({ photos }: { photos: MediaRef[] }) {
  const [top, setTop] = useState(0);
  const tilts = [2, -8, 7];
  if (photos.length === 0) return null;
  const order = photos.map((_, i) => (i - top + photos.length) % photos.length);
  return (
    <Reveal className="mx-auto mb-10 w-[min(56cqw,210px)]">
      <button
        type="button"
        onClick={() => setTop((t) => (t + 1) % photos.length)}
        aria-label={photos.length > 1 ? "Show the next photo" : (photos[0].alt ?? "Photo")}
        className="relative block aspect-[4/5.4] w-full"
      >
        {photos.map((ph, i) => {
          const depth = order[i];
          return (
            <span
              key={ph.assetId}
              className="ks-print absolute inset-0 transition-transform duration-500"
              style={{
                zIndex: photos.length - depth,
                transform: `rotate(${tilts[depth % tilts.length]}deg) translateY(${depth * 6}px)`,
              }}
            >
              <KitImage media={ph} sizes="220px" alt="" className="h-full w-full" />
            </span>
          );
        })}
      </button>
    </Reveal>
  );
}

/** Countdown inside the sage Kashi mural, under a pile of the couple's prints. */
export function Countdown({ data }: SectionProps) {
  const v = useCountdown(data.countdownTo);
  const p = dateParts(data.content.weddingDate);
  const { couplePhotos, gallery } = data.content.media;
  const photos = [...couplePhotos, ...gallery].slice(0, 3);
  const cells: Array<[string, string, number | undefined]> = [
    ["D", "Days", v?.days],
    ["H", "Hours", v?.hours],
    ["M", "Minutes", v?.minutes],
    ["S", "Seconds", v?.seconds],
  ];
  return (
    <section
      className="ks-mural text-center"
      style={{ "--ks-mural": `url(${ART.muralSage.src})` } as CSSProperties}
    >
      <PhotoStack photos={photos} />
      <Reveal>
        <h2 className="ks-heading text-[2rem] leading-tight">
          {v?.isPast ? (
            "The celebrations have begun"
          ) : (
            <>
              Counting the <i>Days</i>
            </>
          )}
        </h2>
      </Reveal>
      {!v?.isPast && (
        <Reveal
          className="mx-auto mt-6 flex max-w-[18rem] justify-center gap-2"
          role="timer"
          aria-live="off"
        >
          {cells.map(([short, label, n]) => (
            <div key={label} className="flex flex-1 flex-col items-center">
              <span className="ks-circle f-display grid aspect-square w-full max-w-16 place-items-center text-[1.5rem] tabular-nums">
                {n === undefined ? "––" : String(n).padStart(2, "0")}
              </span>
              <abbr title={label} className="mt-1.5 text-xs text-[var(--c-muted)] no-underline">
                {short}
              </abbr>
            </div>
          ))}
        </Reveal>
      )}
      <Reveal as="p" className="mt-6 text-lg text-[var(--c-muted)] italic">
        {p.weekday}, {p.day} {p.month} {p.year}
      </Reveal>
    </section>
  );
}

/** One photo split into a 4×5 grid of rounded tiles that flip in on a diagonal wave. */
function TileReveal({ image }: { image: MediaRef }) {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion, revealed } = useInvitation();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !revealed || shown) return;
    if (reducedMotion || typeof IntersectionObserver === "undefined") return setShown(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion, revealed, shown]);
  const url = image.url.includes("res.cloudinary.com") ? cloudinaryUrl(image.url, 720) : image.url;
  const cols = 4;
  const rows = 5;
  return (
    <div
      ref={ref}
      role="img"
      aria-label={image.alt || "Photo of the couple"}
      data-shown={shown || undefined}
      className="mx-auto mb-10 grid w-full max-w-[17rem] gap-1"
      style={{
        aspectRatio: `${image.width} / ${image.height}`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: cols * rows }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        return (
          <span
            key={i}
            className="ks-tile rounded-md"
            style={
              {
                "--d": r + c,
                backgroundImage: `url(${url})`,
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${(c / (cols - 1)) * 100}% ${(r / (rows - 1)) * 100}%`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** Gallery in the navy mural: a tile-reveal feature photo, then arched cards (or a grid). */
export function GallerySection({ data }: SectionProps) {
  const images = [...data.content.media.gallery, ...data.content.media.familyPhotos];
  if (images.length === 0) return null;
  const grid = String(data.options.galleryStyle ?? "arches") === "grid";
  return (
    <section
      className="ks-mural"
      style={{ "--ks-mural": `url(${ART.muralNavy.src})` } as CSSProperties}
    >
      <SectionTitle
        eyebrow="Our moments"
        title={
          <>
            Moments by the <i>Ganga</i>
          </>
        }
      />
      <TileReveal image={images[0]} />
      {grid ? (
        <Gallery images={images} variant="grid" itemClassName="ks-print" />
      ) : (
        <div>
          <Gallery
            images={images}
            variant="carousel"
            itemClassName="overflow-hidden rounded-t-[999px] rounded-b-xl bg-[#fdf4e2] p-1.5 pb-1.5"
          />
        </div>
      )}
    </section>
  );
}

export function Video({ data }: SectionProps) {
  const v = data.content.media.video;
  if (!v) return null;
  return (
    <section className="px-8 py-16">
      <SectionTitle eyebrow="A little film" title="Our story" />
      <Reveal className="ks-print">
        <VideoBlock video={v} />
      </Reveal>
    </section>
  );
}

/** A last look at the ghats under drifting clouds; the names and closing line sit on a cream card. */
export function Footer({ data }: SectionProps) {
  const c = data.content;
  const [first, second] = orderedNames(c.couple);
  return (
    <footer className="relative overflow-hidden">
      <div
        className="relative h-[30rem]"
        style={{ background: "linear-gradient(180deg, #4f7fc4, #9dbfe6 70%)" }}
      >
        {ART.clouds.map((cl, i) => (
          <img
            key={cl.src}
            src={cl.src}
            alt=""
            loading="lazy"
            data-ambient
            className="ks-drift absolute"
            style={
              i === 0
                ? { left: "-14%", top: "26%", width: "48%" }
                : { right: "-18%", top: "24%", width: "52%", animationDelay: "-6s" }
            }
          />
        ))}
        <Reveal
          as="p"
          className="f-script ks-on-sky relative z-10 px-6 pt-14 text-center text-[clamp(2.4rem,11cqw,3rem)] leading-tight"
        >
          We await your presence
        </Reveal>
        <img
          src={ART.ghats.src}
          alt=""
          width={ART.ghats.w}
          height={ART.ghats.h}
          loading="lazy"
          className="absolute inset-x-0 bottom-[-36%] w-full"
        />
      </div>
      <div className="relative -mt-8 rounded-t-[28px] bg-[var(--c-surface)] px-8 pt-10 pb-40 text-center">
        <Reveal>
          <p className="f-display ks-accent text-[clamp(2.2rem,10cqw,2.8rem)] leading-[1.1]">
            {first} &amp; {second}
          </p>
          {c.hashtag && <p className="mt-2 text-lg italic">{c.hashtag}</p>}
          {c.messages.closing && (
            <p className="mx-auto mt-4 max-w-xs text-[var(--c-muted)] italic">
              {c.messages.closing}
            </p>
          )}
          <p className="ks-eyebrow mt-8 text-[0.6rem]">
            Crafted with love on{" "}
            <Link href="/?ref=invite" className="underline-offset-4 hover:underline">
              {BRAND.name}
            </Link>
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
