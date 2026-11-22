"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaRef } from "@/lib/invitation/schema";
import { cn } from "@/lib/utils";
import { useInvitation } from "../context";
import { KitImage } from "./KitImage";

/**
 * Swipeable photo carousel (scroll-snap, so swiping is native and smooth). Cards tilt slightly
 * like polaroids and straighten when centred. Dots show position and are tappable; tapping a
 * card opens it in the lightbox via `onOpen`.
 */
export function Carousel({
  images,
  onOpen,
  cardClassName,
  captionClassName,
  showCaptions = true,
}: {
  images: MediaRef[];
  onOpen: (index: number) => void;
  cardClassName?: string;
  captionClassName?: string;
  showCaptions?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { reducedMotion } = useInvitation();

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        Array.from(el.children).forEach((c, i) => {
          const card = c as HTMLElement;
          const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  const go = (i: number) => {
    const card = track.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  return (
    <div>
      <div
        ref={track}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-5 overflow-x-auto px-[14%] pt-4 pb-8 [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-roledescription="carousel"
        aria-label="Photos"
      >
        {images.map((img, i) => {
          const tilt = reducedMotion || i === active ? 0 : i % 2 ? 3 : -3;
          return (
            <button
              key={img.assetId}
              type="button"
              onClick={() => onOpen(i)}
              aria-label={
                img.alt ? `View photo: ${img.alt}` : `View photo ${i + 1} of ${images.length}`
              }
              className={cn(
                "w-[72%] max-w-[300px] shrink-0 snap-center bg-[#fffaf0] p-2.5 pb-3 text-left shadow-[0_22px_40px_-18px_rgba(0,0,0,0.55)] transition-transform duration-500",
                cardClassName,
              )}
              style={{ transform: `rotate(${tilt}deg) scale(${i === active ? 1 : 0.94})` }}
            >
              <KitImage media={img} sizes="300px" className="aspect-[4/5] w-full" />
              {showCaptions && img.alt && (
                <span
                  className={cn("mt-2 block truncate text-sm text-[#5a3a1a]", captionClassName)}
                >
                  {img.alt}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {images.length > 1 && (
        <div className="flex justify-center" aria-label="Choose photo" role="group">
          {images.map((img, i) => (
            <button
              key={img.assetId}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active || undefined}
              className="grid size-6 place-items-center"
            >
              <span
                className="block h-1.5 w-[18px] rounded-full transition-[transform,opacity] duration-300"
                style={{
                  transform: `scaleX(${i === active ? 1 : 0.34})`,
                  background: "var(--c-accent)",
                  opacity: i === active ? 1 : 0.4,
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
