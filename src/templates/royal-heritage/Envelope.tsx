"use client";

// WAAPI-based mini animate (~2 KB) keeps the guest page light; transforms are written as strings.
import { useAnimate } from "motion/react-mini";
import { useState } from "react";
import { coupleTitle, monogram } from "@/lib/invitation/couple";
import type { EnvelopeProps } from "@/invitation-kit/types";
import { EASE_OUT } from "@/invitation-kit/motion/Reveal";
import { ArchFrame, DamaskPattern, Ornament, Seal } from "./decor";

const BASE_MS = 2600;
const GATE_EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

/**
 * Royal Heritage opening: seal cracks → flap opens → card rises → palace gates swing open.
 * Timings scale with intensity (durationMs / 2600). Reduced motion → 300ms crossfade.
 */
export function RoyalEnvelope({
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
  const mono = monogram(data.content.couple);
  const title = coupleTitle(data.content.couple);
  const sealStyle = String(data.options.sealStyle ?? "wax-gold");
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
      animate(
        "[data-seal-l]",
        { opacity: 0, transform: "translate(-40px, 70px) rotate(-32deg)" },
        { duration: d(0.4), ease: [0.5, 0, 1, 1] },
      );
      await animate(
        "[data-seal-r]",
        { opacity: 0, transform: "translate(40px, 76px) rotate(26deg)" },
        { duration: d(0.4), ease: [0.5, 0, 1, 1] },
      );
      await animate(
        "[data-flap]",
        { transform: "rotateX(90deg)" },
        { duration: d(0.25), ease: "easeIn" },
      );
      const flap = root.querySelector<HTMLElement>("[data-flap]");
      if (flap) flap.style.zIndex = "1";
      await animate(
        "[data-flap]",
        { transform: "rotateX(180deg)" },
        { duration: d(0.25), ease: "easeOut" },
      );
      await animate(
        "[data-card]",
        { transform: "translateY(-46%)" },
        { duration: d(0.4), ease: EASE_OUT },
      );
      animate("[data-stage]", { opacity: 0, transform: "scale(0.94)" }, { duration: d(0.25) });
      await animate("[data-gates]", { opacity: 1 }, { duration: d(0.25) });
      onReveal();
      animate("[data-backdrop]", { opacity: 0 }, { duration: d(0.3) });
      animate(
        "[data-gate-l]",
        { transform: "rotateY(-108deg)" },
        { duration: d(0.9), ease: GATE_EASE },
      );
      await animate(
        "[data-gate-r]",
        { transform: "rotateY(108deg)" },
        { duration: d(0.9), ease: GATE_EASE },
      );
    } catch {
      /* interrupted (e.g. skipped) */
    }
    onOpened();
  };

  return (
    <div ref={scope} className="absolute inset-0 overflow-hidden">
      {/* Backdrop */}
      <div data-backdrop className="absolute inset-0" style={{ background: "var(--c-bg)" }}>
        <DamaskPattern />
      </div>

      {/* Palace gates (shown after the card rises) */}
      <div
        data-gates
        aria-hidden="true"
        className="absolute inset-0 flex opacity-0 [perspective:1800px]"
      >
        {(["l", "r"] as const).map((side) => (
          <div
            key={side}
            {...{ [`data-gate-${side}`]: "" }}
            className={`rh-gate relative h-full w-1/2 [backface-visibility:hidden] ${side === "l" ? "origin-left border-r" : "origin-right border-l"}`}
            style={{ borderColor: "color-mix(in srgb, var(--c-accent) 60%, transparent)" }}
          >
            <div className="absolute inset-x-[12%] top-[14%] bottom-[8%]">
              <ArchFrame />
            </div>
            <div
              className="absolute inset-x-[22%] top-[30%] bottom-[18%] rounded-t-full border"
              style={{ borderColor: "color-mix(in srgb, var(--c-accent) 35%, transparent)" }}
            />
            <div
              className={`absolute top-1/2 size-9 -translate-y-1/2 rounded-full border-2 ${side === "l" ? "right-4" : "left-4"}`}
              style={{
                borderColor: "var(--c-accent)",
                boxShadow: "0 0 18px color-mix(in srgb, var(--c-accent) 40%, transparent)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Stage */}
      <div
        data-stage
        className="relative flex h-full flex-col items-center justify-center px-6 pb-10 text-center"
      >
        {data.content.invocation && (
          <p className="mb-5 text-base text-[var(--c-accent)]">{data.content.invocation}</p>
        )}
        <p className="rh-eyebrow">
          {guest ? "A special invitation for" : "You are cordially invited"}
        </p>
        {guest ? (
          <p className="f-script mt-2 max-w-[18ch] text-[clamp(2rem,9vw,2.75rem)] leading-tight text-[var(--c-accent)]">
            {guest.displayName}
          </p>
        ) : (
          <Ornament className="mt-3" />
        )}

        {/* Envelope */}
        <div
          data-ambient
          className="mt-10 w-[min(84vw,400px)]"
          style={{ animation: "vs-float 6s ease-in-out infinite" }}
        >
          <div className="relative aspect-[1.45/1] [perspective:1200px]" aria-hidden="true">
            <div
              className="absolute inset-0 rounded-[4px]"
              style={{ background: "color-mix(in srgb, var(--c-surface) 75%, #000)" }}
            />
            <div
              data-card
              className="absolute inset-x-[6%] top-[7%] bottom-[5%] z-[2] flex flex-col items-center justify-start rounded-[2px] pt-[9%]"
              style={{ background: "var(--c-text)", color: "var(--c-bg)" }}
            >
              <span className="f-heading text-[0.6rem] tracking-[0.35em] uppercase opacity-70">
                The wedding of
              </span>
              <span className="f-display mt-1 text-lg">{title}</span>
            </div>
            <div
              className="absolute inset-0 z-[3] rounded-[4px] [clip-path:polygon(0_0,50%_52%,100%_0,100%_100%,0_100%)]"
              style={{
                background:
                  "linear-gradient(180deg, var(--c-surface), color-mix(in srgb, var(--c-surface) 80%, #000))",
              }}
            >
              <svg
                viewBox="0 0 145 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <path
                  d="M0 0 L72.5 52 L145 0"
                  fill="none"
                  stroke="var(--c-accent)"
                  strokeWidth="0.6"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.8"
                />
                <rect
                  x="4"
                  y="4"
                  width="137"
                  height="92"
                  fill="none"
                  stroke="var(--c-accent)"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.55"
                />
              </svg>
            </div>
            <div
              data-flap
              className="absolute inset-x-0 top-0 z-[4] h-[56%] origin-top [clip-path:polygon(0_0,100%_0,50%_100%)]"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--c-surface) 85%, var(--c-accent)), var(--c-surface))",
              }}
            >
              <svg
                viewBox="0 0 145 56"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <path
                  d="M2 1 L72.5 54 L143 1"
                  fill="none"
                  stroke="var(--c-accent)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="absolute top-[56%] left-1/2 z-[5] size-16 -translate-x-1/2 -translate-y-1/2 sm:size-[72px]">
              <div data-seal-l className="absolute inset-0 [clip-path:inset(0_50%_0_0)]">
                <Seal monogram={mono} variant={sealStyle} className="size-full" />
              </div>
              <div data-seal-r className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
                <Seal monogram={mono} variant={sealStyle} className="size-full" />
              </div>
            </div>
          </div>
        </div>

        <p className="f-display mt-8 text-xl tracking-wide text-[var(--c-text)]">{title}</p>

        <div data-cta className="mt-8 flex flex-col items-center">
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
              className="rh-heading relative overflow-hidden rounded-full px-9 py-4 text-sm shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]"
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
          <p className="rh-eyebrow mt-4 text-[0.65rem]">Tap to open</p>
        </div>
      </div>
    </div>
  );
}
