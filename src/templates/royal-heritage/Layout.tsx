"use client";

import type { ReactNode } from "react";
import { Particles } from "@/invitation-kit/particles/Particles";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { DamaskPattern } from "./decor";

function Pillar({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 bottom-0 hidden w-[calc((100vw-640px)/2)] items-stretch justify-center xl:flex ${side === "left" ? "left-0" : "right-0"}`}
    >
      <div className="relative my-10 w-16">
        <div
          className="absolute inset-y-0 left-1/2 w-px -translate-x-[6px]"
          style={{ background: "color-mix(in srgb, var(--c-accent) 40%, transparent)" }}
        />
        <div
          className="absolute inset-y-0 left-1/2 w-px translate-x-[6px]"
          style={{ background: "color-mix(in srgb, var(--c-accent) 40%, transparent)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--c-accent) 0 3px, transparent 3.5px), radial-gradient(circle, color-mix(in srgb, var(--c-accent) 50%, transparent) 0 1.5px, transparent 2px)",
            backgroundSize: "100% 120px, 100% 40px",
            backgroundPosition: "center 0, center 20px",
            backgroundRepeat: "repeat-y",
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
}

export function RoyalLayout({
  data,
  children,
}: {
  data: RenderableInvitation;
  children: ReactNode;
}) {
  const { presetId, src } = data.theme.background;
  return (
    <div className="relative">
      <div aria-hidden="true" className="fixed inset-0" style={{ background: "var(--c-bg)" }}>
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: "color-mix(in srgb, var(--c-bg) 72%, transparent)" }}
            />
          </>
        ) : (
          presetId === "silk-damask" && <DamaskPattern />
        )}
      </div>
      <Pillar side="left" />
      <Pillar side="right" />
      <main className="relative z-10 mx-auto max-w-[640px]">{children}</main>
      <Particles kind="gold-dust" />
    </div>
  );
}
