"use client";

/* eslint-disable @next/next/no-img-element -- full-page custom backdrop */
import type { CSSProperties, ReactNode } from "react";
import { Particles } from "@/invitation-kit/particles/Particles";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { ART, PAGE_SLICE, type ArtImage } from "./art";

/** CSS variables for one `.md-paint` layer (see styles.css). */
const paint = (art: ArtImage): CSSProperties =>
  ({
    "--md-img": `url(${art.src})`,
    "--md-art-w": art.w,
    "--md-art-h": art.h,
    "--md-slice-t": PAGE_SLICE.top,
    "--md-slice-b": PAGE_SLICE.bottom,
  }) as CSSProperties;

/**
 * A fixed painted page (floral arch on top, pavilions in the bottom corners) behind the
 * scrolling content, plus the same painting's frame (window cut out) pinned above it, so text
 * and cards slide behind the arch, border and pavilions. Painting and content share one column
 * (--md-col): on wide screens it is as tall as the viewport, centred, with the page colour either
 * side; on phones the painting keeps its full width (floral sides visible) and stretches only its
 * plain middle band; on short landscape screens it keeps a readable width and crops top/bottom.
 */
export function MandirLayout({
  data,
  children,
}: {
  data: RenderableInvitation;
  children: ReactNode;
}) {
  const { presetId, src } = data.theme.background;
  const painted = !src && presetId !== "plain";
  return (
    <div className="relative">
      <div aria-hidden="true" className="fixed inset-0" style={{ background: "var(--c-bg)" }}>
        {src && (
          <>
            <img src={src} alt="" className="h-full w-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: "color-mix(in srgb, var(--c-bg) 72%, transparent)" }}
            />
          </>
        )}
        {painted && (
          <div
            className="md-col md-paint absolute top-0 left-1/2 h-dvh -translate-x-1/2"
            style={paint(ART.page)}
          />
        )}
      </div>
      <main className="md-col @container relative z-10 mx-auto overflow-x-clip">
        {painted && (
          // Pinned above the content; takes no space (-mb). The hero sits above it (z-30 in
          // sections.tsx), so the frame shows only once the hero scrolls away.
          <div
            aria-hidden="true"
            className="md-paint pointer-events-none sticky top-0 z-20 -mb-[100dvh] h-dvh"
            style={paint(ART.frame)}
          />
        )}
        {children}
      </main>
      {Boolean(data.options.petals) && (
        <Particles kind="petals" colors={["#e8862a", "#f7c948", "#e98a9a", "#fff4f0"]} />
      )}
    </div>
  );
}
