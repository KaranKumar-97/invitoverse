"use client";

/* eslint-disable @next/next/no-img-element -- full-screen scene art, sized by layout */
// WAAPI-based mini animate (~2 KB); transforms are written as strings.
import { useAnimate } from "motion/react-mini";
import { useRef, useState, type CSSProperties } from "react";
import type { EnvelopeProps } from "@/invitation-kit/types";
import { EASE_OUT } from "@/invitation-kit/motion/Reveal";
import { ART, FLOATING_DIYA, LIGHTING_FILM } from "./art";
import { Fireworks, type FireworksHandle } from "./Fireworks";
import { SceneNames } from "./scene";

const BASE_MS = 6000;
const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

/**
 * Deepotsav opening. The temple waits in the dark (a still frame) until the guest taps. Then the
 * floating diya flares, the lighting film plays (lamps catch along the ghats, then the temple
 * glows from the base to the shikhara), fireworks open over the temple and the names write
 * themselves into the sky. The hero underneath shows the same lit frame with the same names, so
 * the cover simply fades away. Timings scale with intensity (durationMs / 6000); if the film
 * can't play, the lit frame crossfades in instead. Reduced motion → 300ms crossfade.
 */
export function DeepotsavEnvelope({
  data,
  reducedMotion,
  onOpenStart,
  onReveal,
  onOpened,
}: EnvelopeProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const film = useRef<HTMLVideoElement>(null);
  const fireworks = useRef<FireworksHandle>(null);
  const [busy, setBusy] = useState(false);
  const f = data.durationMs / BASE_MS;
  const d = (s: number) => s * f;
  const guest = data.guest;
  const showFireworks = data.options.fireworks !== false;

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
      const lighting = d(4.2);
      animate("[data-ui]", { opacity: 0, transform: "translateY(12px)" }, { duration: 0.35 });
      // The floating diya flares as it "catches".
      animate(
        "[data-flare]",
        { opacity: [0, 1, 0.75], transform: ["scale(0.2)", "scale(1.25)", "scale(1)"] },
        { duration: d(0.9), ease: EASE_OUT },
      );
      await wait(d(0.35));

      // Lamps catch along the ghats and up the temple: the film, sped up to fit the intensity.
      const v = film.current;
      let playing = false;
      if (v && v.canPlayType?.("video/mp4")) {
        try {
          v.currentTime = LIGHTING_FILM.from;
          v.playbackRate = Math.min(
            4,
            Math.max(0.5, (LIGHTING_FILM.to - LIGHTING_FILM.from) / lighting),
          );
          await Promise.race([v.play(), wait(0.6).then(() => Promise.reject(new Error("slow")))]);
          playing = true;
          animate(v, { opacity: 1 }, { duration: 0.2 });
        } catch {
          playing = false;
        }
      }
      // Without the film, the lit frame fades in over the same time.
      animate(
        "[data-lit]",
        { opacity: 1 },
        { duration: playing ? 0.6 : lighting, delay: playing ? lighting - 0.3 : 0 },
      );
      animate("[data-dim]", { opacity: 1 }, { duration: d(1.2), delay: lighting * 0.7 });
      if (showFireworks)
        window.setTimeout(() => fireworks.current?.volley(5, 300 * f), lighting * 750);
      await wait(lighting * 0.92);
      root.querySelector("[data-writing]")?.setAttribute("data-on", "");
      await wait(d(1.5));
      v?.pause();
      onReveal();
      await animate(root, { opacity: 0 }, { duration: d(0.6) });
    } catch {
      /* interrupted (e.g. skipped) */
    }
    onOpened();
  };

  return (
    <div
      ref={scope}
      className="absolute inset-0 overflow-hidden"
      style={{ background: "#0b1230", "--dp-f": f } as CSSProperties}
    >
      {/* Wide screens: a soft, dark copy of the scene fills the sides. */}
      <img
        src={ART.unlit.src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
      />
      <div className="dp-col @container absolute inset-y-0 left-1/2 -translate-x-1/2 overflow-hidden">
        <img
          src={ART.unlit.src}
          alt=""
          width={ART.unlit.w}
          height={ART.unlit.h}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <video
          ref={film}
          src={LIGHTING_FILM.src}
          poster={ART.unlit.src}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover opacity-0"
        />
        <img
          data-lit
          src={ART.lit.src}
          alt=""
          width={ART.lit.w}
          height={ART.lit.h}
          className="absolute inset-0 h-full w-full object-cover opacity-0"
        />
        <span
          data-flare
          aria-hidden="true"
          className="dp-flare absolute opacity-0"
          style={{ left: `${FLOATING_DIYA.left}%`, top: `${FLOATING_DIYA.top}%` }}
        />
        <div data-dim aria-hidden="true" className="dp-sky-dim absolute inset-0 opacity-0" />
        {showFireworks && <Fireworks ref={fireworks} className="absolute inset-0 h-full w-full" />}
        {/* The names that write themselves in (same layout as the hero's). */}
        <div data-writing aria-hidden="true" className="absolute inset-x-0 top-0">
          <SceneNames data={data} />
        </div>
        <span aria-hidden="true" className="dp-stars absolute inset-x-0 top-0 h-1/2" data-ambient />

        <div
          data-ui
          className="absolute inset-0 flex flex-col items-center px-10 pt-[max(5.5rem,13dvh)] pb-[max(3rem,env(safe-area-inset-bottom))] text-center"
        >
          <p className="dp-on-night text-[0.7rem] font-semibold tracking-[0.3em] uppercase">
            {guest ? "A special invitation for" : "You're invited to a wedding"}
          </p>
          {guest ? (
            <p className="f-script dp-on-night mt-3 max-w-[16ch] text-[clamp(2.2rem,10vw,2.9rem)] leading-tight">
              {guest.displayName}
            </p>
          ) : (
            data.content.city && (
              <p
                className="dp-on-night mt-2 text-[1.35rem] italic"
                style={{ fontFamily: "var(--f-heading)" }}
              >
                in {data.content.city}
              </p>
            )
          )}
          <p
            aria-hidden="true"
            className="dp-on-night dp-beckon-text mt-auto mb-[15dvh] text-[1.35rem] italic"
            style={{ fontFamily: "var(--f-heading)" }}
          >
            Tap to light the diya
          </p>
        </div>
        {/* A soft glow pulses round the floating diya, inviting the tap. */}
        <span
          data-ui
          data-ambient
          aria-hidden="true"
          className="dp-beckon pointer-events-none absolute"
          style={{ left: `${FLOATING_DIYA.left}%`, top: `${FLOATING_DIYA.top}%` }}
        />
        {/* No button chrome: the whole cover is the tap target. */}
        <button
          type="button"
          onClick={open}
          disabled={busy}
          aria-label="Tap to light the diya · Open invitation"
          className="dp-cover-tap absolute inset-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
