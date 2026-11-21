"use client";

import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { useInvitation } from "../context";

/** Shared easing (also used by envelope WAAPI sequences). */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_CSS = `cubic-bezier(${EASE_OUT.join(",")})`;

type RevealProps = HTMLAttributes<HTMLElement> & {
  /** Base travel in px (scaled by intensity). */
  y?: number;
  x?: number;
  delay?: number;
  duration?: number;
  scaleFrom?: number;
  as?: "div" | "section" | "li" | "header" | "footer" | "span" | "p";
};

/** True once the element has entered the viewport (never flips back). */
function useInViewOnce(ref: React.RefObject<HTMLElement | null>, rootMargin: string) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, inView]);
  return inView;
}

/**
 * Fades/rises children once, when they enter the viewport *and* the invitation has been opened.
 * Plain CSS transitions on transform/opacity (compositor-only) — no animation library on the
 * guest page. Under reduced motion it becomes a short opacity fade.
 */
export function Reveal({
  y = 24,
  x = 0,
  delay = 0,
  duration = 0.8,
  scaleFrom,
  as = "div",
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInViewOnce(ref, "0px 0px -8% 0px");
  const { revealed, reducedMotion, scale } = useInvitation();
  const show = inView && revealed;
  const Comp = as as "div";

  const seconds = reducedMotion ? 0.25 : duration * Math.max(scale, 0.6);
  const wait = reducedMotion ? 0 : delay;
  const hiddenTransform = reducedMotion
    ? "none"
    : `translate3d(${x * scale}px, ${y * scale}px, 0)${scaleFrom ? ` scale(${scaleFrom})` : ""}`;

  const motionStyle: CSSProperties = {
    opacity: show ? 1 : 0,
    transform: show ? "none" : hiddenTransform,
    transition: `opacity ${seconds}s ${EASE_CSS} ${wait}s, transform ${seconds}s ${EASE_CSS} ${wait}s`,
    willChange: show ? undefined : "opacity, transform",
  };

  return (
    <Comp ref={ref as React.Ref<HTMLDivElement>} {...rest} style={{ ...style, ...motionStyle }}>
      {children}
    </Comp>
  );
}

/** Reveal children one after another (stagger 70ms, capped at 600ms). */
export function Stagger({
  children,
  step = 0.07,
  ...rest
}: Omit<RevealProps, "children"> & { children: React.ReactNode[]; step?: number }) {
  return (
    <>
      {children.map((child, i) => (
        <Reveal key={i} delay={(rest.delay ?? 0) + Math.min(i * step, 0.6)} {...rest}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
