"use client";

// WAAPI-based mini animate (~2 KB) keeps the guest page light; transforms are written as strings.
import { useAnimate } from "motion/react-mini";
import { useState } from "react";
import { monogram, orderedNames } from "@/lib/invitation/couple";
import { dateParts } from "@/lib/invitation/dates";
import { EASE_OUT } from "@/invitation-kit/motion/Reveal";
import type { EnvelopeProps } from "@/invitation-kit/types";
import { Monogram, PaperTexture } from "./decor";

const BASE_MS = 2500;

/**
 * Minimal Luxury opening: flap lifts (revealing a fine liner) → card slides out →
 * the card unfolds to fill the screen → paper dissolves into the invitation.
 */
export function MinimalEnvelope({
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
  const [first, second] = orderedNames(data.content.couple);
  const p = dateParts(data.content.weddingDate);
  const italic = data.options.monogramStyle === "italic";
  const texture = Boolean(data.options.paperTexture);

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
        { opacity: 0, transform: "translateY(10px)" },
        { duration: d(0.2) },
      );
      await animate(
        "[data-flap]",
        { transform: "rotateX(90deg)" },
        { duration: d(0.3), ease: "easeIn" },
      );
      const flap = root.querySelector<HTMLElement>("[data-flap]");
      if (flap) flap.style.zIndex = "1";
      await animate(
        "[data-flap]",
        { transform: "rotateX(180deg)" },
        { duration: d(0.3), ease: "easeOut" },
      );
      await animate(
        "[data-card]",
        { transform: "translateY(-62%)" },
        { duration: d(0.6), ease: EASE_OUT },
      );

      // Unfold: a blank sheet starts exactly over the card and grows to fill the screen.
      const card = root.querySelector<HTMLElement>("[data-card]");
      const sheet = root.querySelector<HTMLElement>("[data-sheet]");
      if (card && sheet) {
        const r = card.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const sx = Math.max(r.width / vw, 0.01);
        const sy = Math.max(r.height / vh, 0.01);
        sheet.style.transform = `translate(${r.left + r.width / 2 - vw / 2}px, ${r.top + r.height / 2 - vh / 2}px) scale(${sx}, ${sy})`;
        sheet.style.opacity = "1";
        card.style.visibility = "hidden";
        animate(
          "[data-body]",
          { opacity: 0, transform: "translateY(60px)" },
          { duration: d(0.5), ease: "easeIn" },
        );
        animate("[data-titles]", { opacity: 0 }, { duration: d(0.3) });
        await animate(
          sheet,
          { transform: "translate(0px, 0px) scale(1, 1)" },
          { duration: d(0.7), ease: [0.76, 0, 0.24, 1] },
        );
      }
      onReveal();
      await animate(root, { opacity: 0 }, { duration: d(0.45), ease: "easeOut" });
    } catch {
      /* interrupted */
    }
    onOpened();
  };

  return (
    <div
      ref={scope}
      className="absolute inset-0 overflow-hidden"
      style={{ background: "var(--c-bg)" }}
    >
      {texture && <PaperTexture />}

      <div className="relative flex h-full flex-col items-center justify-center px-6 pb-8 text-center">
        <div data-titles>
          <p className="ml-caps">{data.guest ? "An invitation for" : "You are invited"}</p>
          {data.guest && (
            <p className="f-heading mt-3 text-[clamp(1.75rem,7vw,2.25rem)] leading-tight italic">
              {data.guest.displayName}
            </p>
          )}
        </div>

        {/* Envelope */}
        <div data-body className="mt-12 w-[min(82vw,380px)]">
          <div data-ambient style={{ animation: "vs-float 7s ease-in-out infinite" }}>
            <div className="relative aspect-[1.5/1] [perspective:1100px]" aria-hidden="true">
              <div
                className="absolute inset-0 shadow-[0_30px_60px_-28px_rgba(30,27,24,0.45)]"
                style={{ background: "color-mix(in srgb, var(--c-surface) 92%, var(--c-text))" }}
              />
              <div
                data-card
                className="absolute inset-x-[5%] top-[6%] bottom-[6%] z-[2] flex flex-col items-center justify-start gap-2 border pt-[7%]"
                style={{
                  background: "var(--c-surface)",
                  borderColor: "color-mix(in srgb, var(--c-text) 10%, transparent)",
                }}
              >
                <Monogram
                  letters={monogram(data.content.couple)}
                  italic={italic}
                  className="w-11 text-[0.95rem]"
                />
                <span className="ml-caps text-[0.55rem]">
                  {p.dayPadded} · {p.monthNumber} · {p.year}
                </span>
              </div>
              <div
                className="absolute inset-0 z-[3] [clip-path:polygon(0_0,50%_50%,100%_0,100%_100%,0_100%)]"
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--c-surface) 96%, var(--c-text)), var(--c-surface))",
                }}
              >
                {texture && <PaperTexture opacity={0.05} />}
                <svg
                  viewBox="0 0 150 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                >
                  <path
                    d="M0 0 L75 50 L150 0"
                    fill="none"
                    stroke="var(--c-text)"
                    strokeOpacity="0.12"
                    strokeWidth="0.75"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              <div
                data-flap
                className="absolute inset-x-0 top-0 z-[4] h-[54%] origin-top [transform-style:preserve-3d]"
              >
                <div
                  className="absolute inset-0 [backface-visibility:hidden] [clip-path:polygon(0_0,100%_0,50%_100%)]"
                  style={{
                    background:
                      "linear-gradient(180deg, var(--c-surface), color-mix(in srgb, var(--c-surface) 94%, var(--c-text)))",
                  }}
                >
                  <div className="absolute inset-x-0 bottom-[14%] flex justify-center">
                    <Monogram
                      letters={monogram(data.content.couple)}
                      italic={italic}
                      embossed
                      className="w-12 text-base"
                    />
                  </div>
                </div>
                {/* Liner, visible once the flap is open */}
                <div
                  className="absolute inset-0 [transform:rotateX(180deg)] [backface-visibility:hidden] [clip-path:polygon(50%_0,100%_100%,0_100%)]"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 22%, var(--c-surface)) 0 2px, var(--c-surface) 2px 9px)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <p data-titles className="f-display mt-10 text-2xl tracking-wide">
          {first} <span className="f-script text-lg text-[var(--c-accent)] italic">and</span>{" "}
          {second}
        </p>

        <div data-cta className="mt-9 flex flex-col items-center">
          <button
            type="button"
            onClick={open}
            disabled={busy}
            className="min-h-12 rounded-full px-9 text-[0.7rem] tracking-[0.32em] uppercase transition-transform active:scale-[0.98]"
            style={{
              background: "var(--c-text)",
              color: "var(--c-bg)",
              fontFamily: "var(--f-body)",
            }}
          >
            Open Invitation
          </button>
          <p className="ml-caps mt-4 text-[0.6rem]">Tap to open</p>
        </div>
      </div>

      {/* Full-screen paper used for the unfold */}
      <div
        data-sheet
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 opacity-0"
        style={{ background: "var(--c-bg)" }}
      >
        {texture && <PaperTexture />}
      </div>
    </div>
  );
}
