"use client";

// WAAPI-based mini animate (~2 KB); transforms are written as strings.
import { useAnimate } from "motion/react-mini";
import { useState } from "react";
import { coupleTitle } from "@/lib/invitation/couple";
import type { EnvelopeProps } from "@/invitation-kit/types";
import { EASE_OUT } from "@/invitation-kit/motion/Reveal";
import { DiyaBowl, Flame, KolamRing, LotusDivider, Thali } from "./decor";

const BASE_MS = 2600;

/**
 * Deepam opening: an unlit diya on a brass plate inside a kolam. Tap → the flame catches → a
 * glow blooms → kolam rings ripple outward → the light widens and the invitation appears.
 * Timings scale with intensity (durationMs / 2600). Reduced motion → 300ms crossfade.
 */
export function DeepamEnvelope({
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
  const title = coupleTitle(data.content.couple);
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
        "[data-cta]",
        { opacity: 0, transform: "translateY(12px)" },
        { duration: d(0.2) },
      );
      // The lamp catches.
      animate(
        "[data-glow]",
        { opacity: [0, 0.95], transform: ["scale(0.2)", "scale(1)"] },
        { duration: d(0.55), ease: EASE_OUT },
      );
      await animate(
        "[data-flame]",
        { opacity: [0, 1], transform: ["scale(0.15)", "scale(1.18)", "scale(1)"] },
        { duration: d(0.5), ease: EASE_OUT },
      );
      // Rings of light ripple out through the kolam.
      for (const [i, sel] of ["[data-ring='1']", "[data-ring='2']", "[data-ring='3']"].entries()) {
        animate(
          sel,
          { opacity: 0, transform: `scale(${1.5 + i * 0.25}) rotate(${18 + i * 8}deg)` },
          { duration: d(0.75), delay: d(i * 0.09), ease: EASE_OUT },
        );
      }
      await animate(
        "[data-text]",
        { opacity: 0, transform: "translateY(-10px)" },
        { duration: d(0.45) },
      );
      // The light widens and the invitation appears underneath.
      onReveal();
      animate(
        "[data-plate]",
        { opacity: 0, transform: "scale(1.35)" },
        { duration: d(0.55), ease: EASE_OUT },
      );
      animate(
        "[data-glow]",
        { opacity: 0, transform: "scale(4.5)" },
        { duration: d(0.75), ease: EASE_OUT },
      );
      await animate("[data-backdrop]", { opacity: 0 }, { duration: d(0.7) });
    } catch {
      /* interrupted (e.g. skipped) */
    }
    onOpened();
  };

  return (
    <div ref={scope} className="absolute inset-0 overflow-hidden">
      <div
        data-backdrop
        className="dp-kolam-bg absolute inset-0"
        style={{
          backgroundColor: "var(--c-bg)",
          boxShadow: "inset 0 0 180px rgba(0,0,0,0.45)",
        }}
      />
      {/* Light that blooms from the lamp (the page underneath shows through as it fades). */}
      <div
        data-glow
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[min(120vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,240,200,0.95), rgba(255,190,90,0.55) 35%, rgba(255,160,60,0.18) 60%, transparent 75%)",
        }}
      />

      <div className="relative flex h-full flex-col items-center justify-center px-6 pb-8 text-center">
        <div data-text className="flex flex-col items-center">
          {data.content.invocation && (
            <p className="mb-4 text-base text-[var(--c-accent)]">{data.content.invocation}</p>
          )}
          <p className="dp-eyebrow">
            {guest ? "A special invitation for" : "You are invited to the wedding of"}
          </p>
          {guest ? (
            <p className="f-script mt-2 max-w-[18ch] text-[clamp(2rem,9vw,2.75rem)] leading-tight text-[var(--c-accent)]">
              {guest.displayName}
            </p>
          ) : (
            <p className="f-display dp-glow-text mt-3 text-[clamp(1.6rem,7vw,2.2rem)] leading-tight">
              {title}
            </p>
          )}
          <LotusDivider className="mt-3" />
        </div>

        {/* Brass plate with kolam and the diya */}
        <div data-plate className="relative mt-7 w-[min(74vw,330px)]">
          <div
            data-ambient
            className="relative aspect-square"
            style={{ animation: "vs-float 6s ease-in-out infinite" }}
          >
            <Thali className="absolute inset-0 h-full w-full" />
            <div
              className="absolute inset-0"
              style={{ color: "color-mix(in srgb, var(--c-bg) 70%, transparent)" }}
            >
              <div data-ring="3" className="absolute inset-[7%]">
                <KolamRing r={78} petals={24} dot={1.4} className="h-full w-full" />
              </div>
              <div data-ring="2" className="absolute inset-[17%]">
                <KolamRing r={70} petals={16} dot={1.8} className="h-full w-full" />
              </div>
              <div data-ring="1" className="absolute inset-[27%] opacity-60">
                <KolamRing r={60} petals={8} dot={2.4} className="h-full w-full" />
              </div>
            </div>
            {/* Diya: bowl + flame (unlit until tapped) */}
            <div className="absolute top-[45%] left-1/2 w-[46%] -translate-x-1/2">
              <DiyaBowl className="relative z-[2] w-full" />
              <div
                data-flame
                className="absolute bottom-[70%] left-1/2 z-[1] h-[92%] w-[34%] -translate-x-1/2 opacity-0"
                style={{ transformOrigin: "50% 100%" }}
              >
                <Flame className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>

        <div data-cta className="mt-9 flex flex-col items-center">
          <div className="relative">
            <span
              data-ambient
              aria-hidden="true"
              className="absolute -inset-1 rounded-full border"
              style={{
                borderColor: "var(--c-accent)",
                animation: "vs-pulse-ring 2.2s ease-out infinite",
              }}
            />
            <button
              type="button"
              onClick={open}
              disabled={busy}
              className="dp-heading relative overflow-hidden rounded-full px-9 py-4 text-sm tracking-[0.18em] uppercase shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]"
              style={{ background: "var(--c-accent)", color: "var(--c-accent-contrast)" }}
            >
              <span
                data-ambient
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1/3 bg-white/35"
                style={{ animation: "vs-shimmer 3.2s ease-in-out infinite" }}
              />
              <span className="relative">Open Invitation</span>
            </button>
          </div>
          <p className="dp-eyebrow mt-4 text-[0.65rem]">Tap to light the lamp</p>
        </div>
      </div>
    </div>
  );
}
