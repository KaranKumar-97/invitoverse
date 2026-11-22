"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useInvitation } from "../context";

type Pose = { y?: number; scale?: number; opacity?: number };

/**
 * Scroll-driven motion: interpolates from `from` to `to` as its section scrolls from resting to
 * scrolled past (progress 0 → 1 over `distance` × viewport height). Frame-synced, passive
 * listener, transform/opacity only. Static under reduced motion or before the invitation opens.
 */
export function ScrollMotion({
  from = {},
  to,
  distance = 0.9,
  className,
  style,
  children,
}: {
  from?: Pose;
  to: Pose;
  distance?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion, revealed, scale } = useInvitation();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion || !revealed) return;
    const anchor = (el.closest("[data-section]") as HTMLElement | null) ?? el;
    const k = Math.max(scale, 0.6);
    let frame = 0;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const update = () => {
      frame = 0;
      const top = anchor.getBoundingClientRect().top;
      const t = Math.min(1, Math.max(0, -top / (window.innerHeight * distance)));
      const y = lerp(from.y ?? 0, to.y ?? from.y ?? 0, t) * k;
      const s = lerp(from.scale ?? 1, to.scale ?? from.scale ?? 1, t);
      const o = lerp(from.opacity ?? 1, to.opacity ?? from.opacity ?? 1, t);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      el.style.opacity = o.toFixed(3);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.style.transform = "";
      el.style.opacity = "";
    };
  }, [
    reducedMotion,
    revealed,
    scale,
    distance,
    from.y,
    from.scale,
    from.opacity,
    to.y,
    to.scale,
    to.opacity,
  ]);

  return (
    <div ref={ref} className={className} style={{ ...style, willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}
