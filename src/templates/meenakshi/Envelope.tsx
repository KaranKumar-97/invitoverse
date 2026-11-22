"use client";

/* eslint-disable @next/next/no-img-element -- painted scene art, sized by layout */
// WAAPI-based mini animate (~2 KB); transforms are written as strings.
import { useAnimate } from "motion/react-mini";
import { useState } from "react";
import { orderedNames } from "@/lib/invitation/couple";
import type { EnvelopeProps } from "@/invitation-kit/types";
import { ART } from "./art";
import { useStageZoom } from "./zoom";

const BASE_MS = 2600;
/** Smooth ease-in-out for the fade. */
const EASE_SCROLL: [number, number, number, number] = [0.65, 0, 0.35, 1];

/**
 * Meenakshi opening: a clear morning sky over a tree line with the gopuram's tip just showing.
 * Tap anywhere: the cover fades away, revealing the hero underneath (where the same tower
 * continues). Timings scale with intensity (durationMs / 2600). Reduced motion: quick fade.
 */
export function MeenakshiEnvelope({
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
  const guest = data.guest;
  const zoom = useStageZoom();

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
      // Cover text goes first (so names never show doubled), then the scene dissolves into the hero.
      animate("[data-cta]", { opacity: 0 }, { duration: d(0.2) });
      await animate("[data-text]", { opacity: 0 }, { duration: d(0.3) });
      onReveal();
      await animate(root, { opacity: 0 }, { duration: d(1.0), ease: EASE_SCROLL });
    } catch {
      /* interrupted (e.g. skipped) */
    }
    onOpened();
  };

  return (
    <div ref={scope} className="absolute inset-0 overflow-clip">
      {/* Full-screen scene; cqw units size the art from its width. */}
      <div
        data-scene
        className="[container-type:inline-size] relative h-full overflow-clip"
        style={{ background: "var(--mk-sky)" }}
      >
        {/* Gopuram, mostly hidden below the tree line. */}
        <div
          aria-hidden="true"
          className="absolute top-[55%] left-1/2 w-[min(98%,460px)] -translate-x-1/2"
        >
          <img
            data-tower
            src={ART.gopuram.src}
            width={ART.gopuram.w}
            height={ART.gopuram.h}
            alt=""
            fetchPriority="high"
            className="block h-auto w-full"
          />
        </div>

        {/* Tree line, tall screens: two full-width copies stacked exactly (no seams); they part on open. */}
        <div aria-hidden="true" className="mk-cover-tall pointer-events-none absolute inset-0">
          {(["r", "l"] as const).map((side) => (
            <img
              key={side}
              data-tree={side}
              src={ART.trees.src}
              width={ART.trees.w}
              height={ART.trees.h}
              alt=""
              className="absolute left-[-10cqw] h-auto w-[120cqw] max-w-none"
              style={{
                // Foliage starts ~13% down the art: put its top at 38% of the screen height.
                top: "calc(38% - 23.6cqw)",
                transform: side === "r" ? "scaleX(-1)" : undefined,
              }}
            />
          ))}
        </div>
        {/* Tree line, wide screens: a small stand of trees in each bottom corner. */}
        <div aria-hidden="true" className="mk-cover-wide pointer-events-none absolute inset-0">
          {(["l", "r"] as const).map((side) => (
            <img
              key={side}
              data-tree={side}
              src={ART.trees.src}
              width={ART.trees.w}
              height={ART.trees.h}
              alt=""
              className={`absolute bottom-[-4%] h-[52%] w-auto max-w-none ${side === "l" ? "left-[-2%]" : "right-[-2%]"}`}
              style={{
                // The art is cut flat on its inner side: feather just the last few pixels.
                maskImage: "linear-gradient(90deg, #000 86%, transparent 100%)",
                transform: side === "r" ? "scaleX(-1)" : undefined,
              }}
            />
          ))}
        </div>

        <div className="relative flex h-full flex-col items-center px-6 text-center">
          <div
            data-text
            className="mk-on-sky mt-[11svh] flex flex-col items-center"
            style={{ zoom: zoom.cover }}
          >
            <img
              src={ART.ganesha.src}
              width={96}
              height={96}
              alt=""
              className="size-[4.5rem] drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
            />
            <p className="mk-eyebrow mt-4">
              {guest ? "A special invitation for" : "You are invited to the wedding of"}
            </p>
            {guest ? (
              <p className="f-script mt-3 max-w-[16ch] text-[clamp(2.2rem,10vw,3rem)] leading-tight">
                {guest.displayName}
              </p>
            ) : (
              <p className="mk-names mt-3 text-[clamp(1.75rem,8vw,2.4rem)]">
                {first}
                <span className="f-script block py-1 text-[0.9em] font-normal">&amp;</span>
                {second}
              </p>
            )}
            {/* Hint follows the names, so it clears them at any text size. */}
            <p
              data-cta
              data-ambient
              className="mk-eyebrow mt-7 rounded-full bg-[rgba(10,40,90,0.35)] px-5 py-2.5 text-[0.72rem] whitespace-nowrap text-white [text-shadow:none]"
              style={{ animation: "mk-breathe 2.4s ease-in-out infinite" }}
            >
              Tap to enter the temple
            </p>
          </div>
        </div>

        {/* The whole cover is the tap target (one accessible button). */}
        <button
          type="button"
          onClick={open}
          disabled={busy}
          aria-label="Open invitation"
          className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-offset-[-8px]"
        />
      </div>
    </div>
  );
}
