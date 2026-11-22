"use client";

import { useEffect, useState } from "react";

/**
 * Meenakshi is laid out once, as a phone-proportioned column up to DESIGN_WIDTH, and scaled
 * uniformly beyond that (CSS `zoom`), so a desktop shows the same composition, just larger.
 * `page` scales the scrolling content by width. `cover` scales the full-screen cover's text, also
 * capped by height so it fits on short, wide screens.
 * Note: CSS zoom also scales viewport units, so zoomed content divides them by `--mk-zoom`.
 */
export const DESIGN_WIDTH = 640;

export function useStageZoom() {
  const [zoom, setZoom] = useState({ page: 1, cover: 1 });
  useEffect(() => {
    const update = () => {
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      setZoom({
        page: Math.max(1, w / DESIGN_WIDTH),
        cover: Math.max(1, Math.min(w / DESIGN_WIDTH, h / 760)),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return zoom;
}
