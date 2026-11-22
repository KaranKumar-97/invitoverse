"use client";

/* eslint-disable @next/next/no-img-element -- full-page painted backdrop */
import type { ReactNode } from "react";
import { Particles } from "@/invitation-kit/particles/Particles";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { ART, FRAME_MASK } from "./art";

/**
 * A fixed painted page (floral arch on top, pavilions in the bottom corners) behind the
 * scrolling content. Painting and content share one column (--md-col in styles.css): on
 * phones it fills the screen (sides cropped a little); on wide screens it is as tall as the
 * viewport, centred, with the page colour either side; on short landscape screens it keeps a
 * readable width and the painting crops top and bottom instead.
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
          <div className="md-col absolute top-0 left-1/2 h-dvh -translate-x-1/2">
            <img
              src={ART.page.src}
              alt=""
              width={ART.page.w}
              height={ART.page.h}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
      <main className="md-col @container relative z-10 mx-auto overflow-x-clip">
        {painted && (
          // The frame again, window cut out, pinned above the content so text and cards slide
          // behind the arch, border and pavilions. Takes no space (-mb). The hero sits above
          // it (md-hero-layer), so the frame shows only once the hero scrolls away.
          <div
            aria-hidden="true"
            className="pointer-events-none sticky top-0 z-20 -mb-[100dvh] h-dvh"
            style={{
              maskImage: FRAME_MASK,
              maskSize: "cover",
              maskPosition: "center",
              maskRepeat: "no-repeat",
            }}
          >
            <img
              src={ART.page.src}
              alt=""
              width={ART.page.w}
              height={ART.page.h}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {children}
      </main>
      {Boolean(data.options.petals) && (
        <Particles kind="petals" colors={["#e8862a", "#f7c948", "#e98a9a", "#fff4f0"]} />
      )}
    </div>
  );
}
