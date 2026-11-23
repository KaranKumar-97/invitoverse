"use client";

/* eslint-disable @next/next/no-img-element -- painted scene art, sized by layout */
// WAAPI-based mini animate (~2 KB); transforms are written as strings.
import { useAnimate } from "motion/react-mini";
import { useState } from "react";
import { orderedNames } from "@/lib/invitation/couple";
import type { EnvelopeProps } from "@/invitation-kit/types";
import { EASE_OUT } from "@/invitation-kit/motion/Reveal";
import { ART } from "./art";

const BASE_MS = 2400;

/**
 * Kashi opening: looking out through a carved stone jharokha at the ghats under a blue sky.
 * Tap → the cover text lifts away, the clouds drift and the ghats settle while the jharokha
 * stays; the hero underneath shows the same view (jharokha included) with the names, so the
 * hand-off is seamless. The jharokha only moves once guests scroll the hero.
 * Timings scale with intensity (durationMs / 2400). Reduced motion → 300ms crossfade.
 */
export function KashiEnvelope({
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
  const [first, second] = orderedNames(data.content.couple);

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
      animate(
        "[data-cloud='0']",
        { transform: "translateX(-10%)" },
        { duration: d(1), ease: EASE_OUT },
      );
      animate(
        "[data-cloud='1']",
        { transform: "translateX(10%)" },
        { duration: d(1), ease: EASE_OUT },
      );
      await animate(
        "[data-ghats]",
        { transform: "translateX(-50%) scale(1)" },
        { duration: d(1), ease: EASE_OUT },
      );
      onReveal();
      await animate(root, { opacity: 0 }, { duration: d(0.5) });
    } catch {
      /* interrupted (e.g. skipped) */
    }
    onOpened();
  };

  return (
    <div ref={scope} className="absolute inset-0 overflow-hidden" style={{ background: "#3f86d2" }}>
      {/* Wide screens: the sky fills the sides; the scene keeps a phone-width column. */}
      <img
        src={ART.sky.src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-y-0 left-1/2 w-[min(100vw,480px)] -translate-x-1/2 overflow-hidden"
        style={{ background: `#3f86d2 url(${ART.sky.src}) center / cover` }}
      >
        {ART.clouds.map((c, i) => (
          <div
            key={c.src}
            data-cloud={i}
            className="absolute"
            style={
              i === 0
                ? { left: "-12%", top: "34%", width: "52%" }
                : { right: "-16%", top: "41%", width: "60%" }
            }
          >
            <img src={c.src} alt="" className="ks-drift w-full" data-ambient />
          </div>
        ))}
        <img
          data-ghats
          src={ART.ghats.src}
          alt=""
          width={ART.ghats.w}
          height={ART.ghats.h}
          fetchPriority="high"
          className="absolute left-1/2 w-[112%] max-w-none origin-bottom"
          // Bottom 110px below the fold (matches the hero), but never above 44% of the screen:
          // short landscape screens crop the river instead of letting the temples climb into the names.
          style={{
            top: `max(44%, calc(100% + 110px - min(100vw, 480px) * 1.12 * ${ART.ghats.h} / ${ART.ghats.w}))`,
            transform: "translateX(-50%) scale(1.08)",
          }}
        />
        <img
          data-arch
          src={ART.arch.src}
          alt=""
          width={ART.arch.w}
          height={ART.arch.h}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div
          data-ui
          className="absolute inset-0 flex flex-col items-center px-10 pt-[max(7rem,17dvh)] pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center"
        >
          <p className="ks-on-sky text-[0.75rem] font-semibold tracking-[0.28em] uppercase">
            {guest ? "A special invitation for" : "The wedding of"}
          </p>
          {guest ? (
            <p className="f-script ks-on-sky mt-3 max-w-[16ch] text-[clamp(2.2rem,10vw,2.9rem)] leading-tight">
              {guest.displayName}
            </p>
          ) : (
            <p className="f-display ks-on-sky mt-4 text-[clamp(2.6rem,12vw,3.4rem)] leading-[1.02] font-semibold uppercase">
              {first}
              <span className="my-1 block text-[0.8rem] tracking-[0.3em]">weds</span>
              {second}
            </p>
          )}
          <div className="mt-auto flex flex-col items-center">
            <div className="relative">
              <span
                data-ambient
                aria-hidden="true"
                className="absolute -inset-1 rounded-full border border-[#F6DFA4]"
                style={{ animation: "vs-pulse-ring 2.2s ease-out infinite" }}
              />
              <button
                type="button"
                onClick={open}
                disabled={busy}
                className="relative overflow-hidden rounded-full px-9 py-3.5 text-sm tracking-[0.18em] uppercase shadow-[0_14px_30px_-10px_rgba(20,20,40,0.6)]"
                style={{
                  fontFamily: "var(--f-heading)",
                  background: "linear-gradient(180deg, #F2D795, #C29546)",
                  color: "#3A250C",
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
            <p className="ks-on-sky mt-3 text-sm italic">Tap to step onto the ghat</p>
          </div>
        </div>
      </div>
    </div>
  );
}
