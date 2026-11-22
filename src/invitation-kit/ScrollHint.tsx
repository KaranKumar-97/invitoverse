"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Floating "Scroll to explore" pill shown just after the invitation opens. Disappears on the
 * first scroll or after a few seconds. Purely visual guidance (hidden from screen readers).
 */
export function ScrollHint({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (window.scrollY > 40) return;
    const showTimer = window.setTimeout(() => setShow(true), 900);
    const hideTimer = window.setTimeout(() => setShow(false), 8000);
    const onScroll = () => {
      if (window.scrollY > 40) setShow(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [active]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs tracking-[0.14em] whitespace-nowrap uppercase shadow-lg backdrop-blur-md transition-opacity duration-500"
      style={{
        background: "color-mix(in srgb, var(--c-surface) 82%, transparent)",
        color: "var(--c-text)",
        border: "1px solid color-mix(in srgb, var(--c-accent) 40%, transparent)",
        opacity: show ? 1 : 0,
        transform: "translate(-50%, 0)",
        animation: show && !reducedMotion ? "vs-hint-bob 2.4s ease-in-out infinite" : undefined,
      }}
    >
      Scroll to explore <ChevronDown className="size-3.5" />
    </div>
  );
}
