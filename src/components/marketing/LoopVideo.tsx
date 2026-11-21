"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  poster: string;
  mp4: string;
  webm: string;
  label: string;
  className?: string;
  /** Load and play only while on screen (default true). */
  lazy?: boolean;
};

/**
 * Muted, inline loop of a template's opening (docs/09 §3.1–3.2). Shows the poster first and only
 * attaches the video once in view on capable devices — never with Save-Data or reduced motion.
 */
export function LoopVideo({ poster, mp4, webm, label, className, lazy = true }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!conn?.saveData && !reduced) setEnabled(true);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!enabled || !video) return;
    const play = () => void video.play().catch(() => {});
    if (!lazy) {
      play();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? play() : video.pause()),
      { rootMargin: "120px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [enabled, lazy]);

  return (
    <video
      ref={ref}
      className={cn("size-full object-cover", className)}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      disablePictureInPicture
    >
      {enabled && (
        <>
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
        </>
      )}
    </video>
  );
}
