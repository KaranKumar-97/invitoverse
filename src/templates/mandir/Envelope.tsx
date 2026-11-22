"use client";

/* eslint-disable @next/next/no-img-element -- painted scene art, sized by layout */
// WAAPI-based mini animate (~2 KB); transforms are written as strings.
import { useAnimate } from "motion/react-mini";
import { useState, type CSSProperties } from "react";
import { coupleTitle } from "@/lib/invitation/couple";
import type { EnvelopeProps } from "@/invitation-kit/types";
import { EASE_OUT } from "@/invitation-kit/motion/Reveal";
import { ARCH_CLIP, ART, DOORWAY, GATE, LEAF_CLIP } from "./art";

const BASE_MS = 2800;
const PERSPECTIVE = "perspective(1400px)";

/** One door leaf: the matching half of the gate painting, cut to the arch. */
function Leaf({ side }: { side: "left" | "right" }) {
  const leafW = DOORWAY.width / 2; // % of the gate
  const style: CSSProperties = {
    // Show the gate at its stage size, offset so this half of the doorway lines up exactly.
    backgroundImage: `url(${GATE.src})`,
    backgroundSize: `${(100 / leafW) * 100}% ${(100 / DOORWAY.height) * 100}%`,
    backgroundPosition: `${((side === "left" ? DOORWAY.left : DOORWAY.left + leafW) / (100 - leafW)) * 100}% ${(DOORWAY.top / (100 - DOORWAY.height)) * 100}%`,
    clipPath: LEAF_CLIP[side],
    transformOrigin: side === "left" ? "0% 50%" : "100% 50%",
    transform: `${PERSPECTIVE} rotateY(0deg)`,
    backfaceVisibility: "hidden",
  };
  return (
    <div
      data-leaf={side}
      className={`absolute inset-y-0 w-1/2 ${side === "left" ? "left-0" : "right-0"}`}
      style={style}
    />
  );
}

/**
 * Mandir opening: carved temple doors hung with brass bells. Tap → the doors swing inwards,
 * golden light and the sunset temple appear in the doorway → the view moves through the door
 * and the invitation (which opens on the same temple scene) is revealed underneath.
 * Timings scale with intensity (durationMs / 2800). Reduced motion → 300ms crossfade.
 */
export function MandirEnvelope({
  data,
  reducedMotion,
  onOpenStart,
  onReveal,
  onOpened,
}: EnvelopeProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [busy, setBusy] = useState(false);
  const f = data.durationMs / BASE_MS;
  const d = (s: number) => s * f;
  const guest = data.guest;

  const open = async () => {
    if (busy) return;
    setBusy(true);
    onOpenStart();
    const root = scope.current;
    if (!root) return onOpened();
    try {
      if (reducedMotion) {
        onReveal();
        await animate(root, { opacity: 0 }, { duration: 0.3 });
        return onOpened();
      }
      await animate(
        "[data-ui]",
        { opacity: 0, transform: "translateY(14px)" },
        { duration: d(0.25) },
      );
      // Golden light spills through the gap as the doors swing inwards.
      animate("[data-light]", { opacity: [0, 1] }, { duration: d(0.6), delay: d(0.15) });
      animate(
        "[data-leaf='left']",
        { transform: `${PERSPECTIVE} rotateY(100deg)` },
        { duration: d(1.15), ease: [0.55, 0.05, 0.25, 1] },
      );
      await animate(
        "[data-leaf='right']",
        { transform: `${PERSPECTIVE} rotateY(-100deg)` },
        { duration: d(1.15), ease: [0.55, 0.05, 0.25, 1] },
      );
      // Walk through the doorway.
      onReveal();
      animate("[data-light]", { opacity: 0 }, { duration: d(0.5) });
      animate("[data-backdrop]", { opacity: 0 }, { duration: d(0.8) });
      await animate(
        "[data-stage]",
        { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 },
        { duration: d(0.95), ease: EASE_OUT },
      );
    } catch {
      /* interrupted (e.g. skipped) */
    }
    onOpened();
  };

  const doorway: CSSProperties = {
    left: `${DOORWAY.left}%`,
    top: `${DOORWAY.top}%`,
    width: `${DOORWAY.width}%`,
    height: `${DOORWAY.height}%`,
  };

  return (
    <div ref={scope} className="absolute inset-0 overflow-hidden">
      <div data-backdrop className="absolute inset-0" style={{ background: "#2a1306" }}>
        {/* Wide screens: the gate is shown whole at full height; a soft blur of it fills the sides. */}
        <img
          src={GATE.src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
        />
      </div>
      {/*
        Full height: fills (and crops) a phone, shown whole on a wide screen. On short
        landscape screens it keeps at least 26rem of width and crops top and bottom instead.
      */}
      <div
        data-stage
        className="absolute top-1/2 left-1/2 aspect-[750/1333]"
        style={{
          width: "max(calc(100dvh * 750 / 1333), min(100vw, 26rem))",
          transform: "translate(-50%, -50%)",
          transformOrigin: `50% ${DOORWAY.top + DOORWAY.height * 0.55}%`,
        }}
      >
        <img
          src={GATE.src}
          alt=""
          width={GATE.w}
          height={GATE.h}
          className="absolute inset-0 h-full w-full"
          fetchPriority="high"
        />
        <div className="absolute" style={doorway}>
          {/* Seen through the open doors: the temple at sunset, washed in golden light. */}
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: ARCH_CLIP }}>
            <img
              src={ART.temple.src}
              alt=""
              width={ART.temple.w}
              height={ART.temple.h}
              decoding="async"
              className="h-full w-full object-cover object-[50%_62%]"
            />
            <div
              data-light
              className="absolute inset-0 opacity-0"
              style={{
                background:
                  "radial-gradient(60% 55% at 50% 60%, rgba(255,244,214,0.95), rgba(255,206,140,0.45) 55%, transparent 80%)",
              }}
            />
          </div>
          <Leaf side="left" />
          <Leaf side="right" />
        </div>
      </div>

      {/* Invitation line + call to action over the marble floor. */}
      <div
        data-ui
        className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pt-24 pb-[max(2.25rem,env(safe-area-inset-bottom))] text-center [@media(max-height:500px)]:pt-10 [@media(max-height:500px)]:pb-4"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(42,19,6,0.55) 38%, rgba(42,19,6,0.82))",
          color: "#FFF3E2",
        }}
      >
        <p className="md-eyebrow" style={{ color: "#F3D79A" }}>
          {guest ? "A special invitation for" : "You are invited to the wedding of"}
        </p>
        <p
          className={`mt-2 max-w-[20ch] leading-tight ${guest ? "f-script text-[clamp(2rem,9vw,2.6rem)]" : "f-display text-[clamp(1.5rem,6.5vw,2rem)]"}`}
        >
          {guest ? guest.displayName : coupleTitle(data.content.couple)}
        </p>
        <div className="relative mt-6">
          <span
            data-ambient
            aria-hidden="true"
            className="absolute -inset-1 rounded-full border border-[#F3D79A]"
            style={{ animation: "vs-pulse-ring 2.2s ease-out infinite" }}
          />
          <button
            type="button"
            onClick={open}
            disabled={busy}
            className="relative overflow-hidden rounded-full px-9 py-3.5 text-sm tracking-[0.18em] uppercase shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]"
            style={{
              fontFamily: "var(--f-heading)",
              background: "linear-gradient(180deg, #F6DA92, #C9963B)",
              color: "#3A1A08",
            }}
          >
            <span
              data-ambient
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1/3 bg-white/40"
              style={{ animation: "vs-shimmer 3.2s ease-in-out infinite" }}
            />
            <span className="relative">Open Invitation</span>
          </button>
        </div>
        <p className="mt-3 text-sm italic opacity-85">Tap to open the temple doors</p>
      </div>
    </div>
  );
}
