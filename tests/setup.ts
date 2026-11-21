import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// `server-only` throws when imported outside a React Server Component bundle.
vi.mock("server-only", () => ({}));

// next/font is a compile-time transform; in tests every font loader returns stub class names.
vi.mock("next/font/google", () => {
  const loader = () => ({
    className: "font-stub",
    variable: "--font-stub",
    style: { fontFamily: "stub" },
  });
  // Every Google font used in src/. Add new ones here when a template loads another family.
  const names = [
    "Bodoni_Moda",
    "Rozha_One",
    "Parisienne",
    "Marcellus",
    "EB_Garamond",
    "Cinzel",
    "Cinzel_Decorative",
    "Cormorant",
    "Cormorant_Garamond",
    "Fraunces",
    "Great_Vibes",
    "Inter",
    "Italiana",
    "Jost",
    "Libre_Caslon_Text",
    "Lora",
    "Manrope",
    "Noto_Sans_Gurmukhi",
    "Noto_Serif_Devanagari",
    "Pinyon_Script",
    "Playfair_Display",
    "Playfair_Display_SC",
  ];
  return Object.fromEntries(names.map((n) => [n, loader]));
});

if (typeof window !== "undefined") {
  // Controlled by tests via `setReducedMotion`.
  (globalThis as { __reducedMotion?: boolean }).__reducedMotion = false;
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion")
        ? Boolean((globalThis as { __reducedMotion?: boolean }).__reducedMotion)
        : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;

  class IO {
    private cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe(el: Element) {
      this.cb(
        [{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = IO as unknown as typeof IntersectionObserver;
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.HTMLMediaElement.prototype.play = function () {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = () => {};
  window.scrollTo = () => {};

  // Minimal Web Animations API stand-in: finishes after its duration (Motion commits the final keyframe).
  if (!Element.prototype.animate) {
    Element.prototype.animate = function (
      this: Element,
      keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions,
    ) {
      const ms =
        typeof options === "number"
          ? options
          : Number(options?.duration ?? 0) + Number(options?.delay ?? 0);
      const listeners: Array<() => void> = [];
      const anim = {
        playState: "running",
        currentTime: 0,
        startTime: 0,
        playbackRate: 1,
        onfinish: null as null | (() => void),
        oncancel: null,
        effect: {
          getComputedTiming: () => ({ duration: 0, progress: 1 }),
          updateTiming: () => {},
          getTiming: () => ({}),
        },
        finished: Promise.resolve() as Promise<unknown>,
        cancel() {},
        play() {},
        pause() {},
        finish() {},
        reverse() {},
        commitStyles() {},
        persist() {},
        addEventListener(_t: string, cb: () => void) {
          listeners.push(cb);
        },
        removeEventListener() {},
      };
      anim.finished = new Promise((resolve) =>
        setTimeout(() => {
          anim.playState = "finished";
          anim.onfinish?.();
          listeners.forEach((cb) => cb());
          resolve(anim);
        }, ms || 0),
      );
      void keyframes;
      return anim as unknown as Animation;
    };
  }
}
