"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useInvitation } from "../context";
import { burstPetals } from "./petalBurst";

type Props = {
  /** What's hidden under the foil (e.g. the date). */
  children: ReactNode;
  /** Text printed on the foil. */
  label?: string;
  /** Text for the accessible / no-scratch fallback button. */
  tapLabel?: string;
  /** Fraction of foil to scratch before it clears by itself. */
  threshold?: number;
  /** Two foil colours (CSS colours or variables); defaults to the template accent. */
  foil?: [string, string];
  className?: string;
  /** Extra class for the fallback button. */
  tapClassName?: string;
  onReveal?: () => void;
};

/**
 * Scratch-to-reveal card: a foil layer drawn on a canvas over `children`. Dragging a finger or
 * mouse erases it; past `threshold` the rest dissolves, petals burst and phones give a short
 * buzz. A visible "tap to reveal" button keeps it usable by keyboard and screen readers, and the
 * hidden content stays out of the accessibility tree until revealed.
 */
export function ScratchReveal({
  children,
  label = "Scratch to reveal",
  tapLabel = "Or tap to reveal",
  threshold = 0.3,
  foil,
  className,
  tapClassName,
  onReveal,
}: Props) {
  const { reducedMotion } = useInvitation();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [canScratch, setCanScratch] = useState(true);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const moves = useRef(0);

  // Side effects run outside the state updater: React may call updaters twice (Strict Mode),
  // which burst petals and fired onReveal twice.
  const done = useRef(false);
  const reveal = useCallback(() => {
    if (done.current) return;
    done.current = true;
    drawing.current = false;
    setRevealed(true);
    if (wrap.current) burstPetals(wrap.current, { reducedMotion });
    try {
      navigator.vibrate?.(25);
    } catch {
      /* not supported */
    }
    onReveal?.();
  }, [onReveal, reducedMotion]);

  // Depend on the colour values, not the array: callers usually pass an inline literal, and a
  // parent that re-renders (e.g. a ticking countdown) would otherwise repaint the foil every
  // second and wipe the guest's scratching.
  const [foilA, foilB] = foil ?? [];

  // Paint the foil, sized to the card at device pixel ratio.
  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    if (!el || !box || revealed) return;
    const ctx = el.getContext("2d");
    if (!ctx) {
      setCanScratch(false);
      return;
    }
    let painted = false;
    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = box.getBoundingClientRect();
      const w = Math.max(1, Math.round(width * dpr));
      const h = Math.max(1, Math.round(height * dpr));
      // ResizeObserver also fires once on observe and on sub-pixel noise: nothing to redo.
      if (painted && w === el.width && h === el.height) return;
      // Keep what was already scratched when the card really changes size.
      let scratched: HTMLCanvasElement | null = null;
      if (painted) {
        scratched = document.createElement("canvas");
        scratched.width = el.width;
        scratched.height = el.height;
        scratched.getContext("2d")?.drawImage(el, 0, 0);
      }
      painted = true;
      el.width = w;
      el.height = h;
      const css = getComputedStyle(box);
      const accent = css.getPropertyValue("--c-accent").trim() || "#c9a227";
      const [a, b] = foilA && foilB ? [foilA, foilB] : [accent, "#fff3cf"];
      const g = ctx.createLinearGradient(0, 0, el.width, el.height);
      g.addColorStop(0, a);
      g.addColorStop(0.45, b);
      g.addColorStop(0.55, a);
      g.addColorStop(1, b);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, el.width, el.height);
      // Fine sparkle texture.
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (let i = 0; i < (el.width * el.height) / 900; i++)
        ctx.fillRect(Math.random() * el.width, Math.random() * el.height, dpr, dpr);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.font = `600 ${Math.round(13 * dpr)}px ${css.getPropertyValue("--f-heading") || "serif"}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label.toUpperCase(), el.width / 2, el.height / 2);
      if (scratched) {
        // Keep the new foil only where the old one was still intact (scaled to the new size).
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(scratched, 0, 0, el.width, el.height);
        ctx.globalCompositeOperation = "source-over";
      }
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(box);
    return () => ro.disconnect();
  }, [foilA, foilB, label, revealed]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = e.currentTarget.width / r.width;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
  };

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    const from = last.current ?? p;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 40 * (e.currentTarget.width / e.currentTarget.getBoundingClientRect().width);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    // Check progress every few moves (sampling keeps it cheap on old phones).
    if (++moves.current % 6 === 0) checkProgress(e.currentTarget);
  };

  const checkProgress = (el: HTMLCanvasElement) => {
    const ctx = el.getContext("2d");
    if (!ctx || done.current) return;
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) {
      total++;
      if (data[i]! < 40) clear++;
    }
    if (total && clear / total >= threshold) reveal();
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    // Lifting the finger after a long stroke should count, not wait for the next touch.
    checkProgress(e.currentTarget);
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div ref={wrap} className="relative w-full overflow-hidden rounded-[inherit]">
        <div aria-hidden={!revealed || undefined}>{children}</div>
        {!revealed && canScratch && (
          <canvas
            ref={canvas}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full cursor-grab touch-none"
            onPointerDown={(e) => {
              drawing.current = true;
              last.current = point(e);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={scratch}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
        )}
        {revealed && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: "var(--c-accent)",
              animation: reducedMotion ? undefined : "vs-foil-clear 600ms ease-out forwards",
              opacity: reducedMotion ? 0 : undefined,
            }}
          />
        )}
      </div>
      {!revealed && (
        <button
          type="button"
          onClick={reveal}
          className={cn(
            "mt-3 min-h-11 px-3 text-sm underline underline-offset-4 opacity-90 hover:opacity-100",
            tapClassName,
          )}
        >
          {tapLabel}
        </button>
      )}
    </div>
  );
}
