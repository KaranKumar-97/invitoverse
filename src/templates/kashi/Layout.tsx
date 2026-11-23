"use client";

/* eslint-disable @next/next/no-img-element -- full-page custom backdrop */
import type { CSSProperties, ReactNode } from "react";
import { Particles } from "@/invitation-kit/particles/Particles";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { ARCH_SLICE, ART, MURAL_SLICE } from "./art";

/** True when the painted murals are on (default background), false for "Plain" or an upload. */
export function muralsOn(data: RenderableInvitation) {
  const { presetId, src } = data.theme.background;
  return !src && presetId !== "plain";
}

/**
 * One phone-width column of painted scenes, centred on wide screens with the soft sky (or the
 * owner's background) either side. Mural sections read their slice values from the variables set
 * here; "Plain" swaps the murals for flat cards (`.ks-plain`).
 */
export function KashiLayout({
  data,
  children,
}: {
  data: RenderableInvitation;
  children: ReactNode;
}) {
  const { src } = data.theme.background;
  const vars = {
    "--ks-sky-img": `url(${ART.sky.src})`,
    "--ks-slice-t": MURAL_SLICE.top,
    "--ks-slice-b": MURAL_SLICE.bottom,
    "--ks-slice-s": MURAL_SLICE.side,
    "--ks-arch": `url(${ART.arch.src})`,
    "--ks-arch-t": ARCH_SLICE.top,
    "--ks-arch-b": ARCH_SLICE.bottom,
    "--ks-arch-s": ARCH_SLICE.side,
  } as CSSProperties;
  return (
    <div className="relative overflow-x-clip" style={vars}>
      <div aria-hidden="true" className="fixed inset-0" style={{ background: "var(--c-bg)" }}>
        {src ? (
          <>
            <img src={src} alt="" className="h-full w-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: "color-mix(in srgb, var(--c-bg) 72%, transparent)" }}
            />
          </>
        ) : (
          <img
            src={ART.sky.src}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-45 blur-2xl"
          />
        )}
      </div>
      <main
        className={`ks-col @container relative z-10 mx-auto shadow-[0_0_80px_-30px_rgba(10,30,70,0.5)] ${muralsOn(data) ? "" : "ks-plain"}`}
        style={{ background: "var(--c-bg)" }}
      >
        {children}
      </main>
      {Boolean(data.options.petals) && (
        <Particles kind="petals" colors={["#f08a24", "#f7c948", "#e86a3a", "#fff1d6"]} />
      )}
    </div>
  );
}
