"use client";

import type { ReactNode } from "react";
import { Particles } from "@/invitation-kit/particles/Particles";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { Lamp } from "./decor";

/** Desktop only: a column of lamps either side of the content, like a deepastambha. */
function LampColumn({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 bottom-0 hidden w-[calc((100vw-640px)/2)] justify-center xl:flex ${side === "left" ? "left-0" : "right-0"}`}
    >
      <div className="relative my-12 flex w-14 flex-col items-center justify-between">
        <div
          className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2"
          style={{ background: "color-mix(in srgb, var(--c-accent) 35%, transparent)" }}
        />
        {Array.from({ length: 7 }).map((_, i) => (
          <Lamp key={i} className="relative h-12 w-14" flicker={i % 2 === 0} />
        ))}
      </div>
    </div>
  );
}

export function DeepamLayout({
  data,
  children,
}: {
  data: RenderableInvitation;
  children: ReactNode;
}) {
  const { presetId, src } = data.theme.background;
  const lamps = String(data.options.lampRow ?? "both-sides") === "both-sides";
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
          <>
            {presetId === "kolam-dots" && <div className="dp-kolam-bg absolute inset-0" />}
            {/* Warm lamp-light rising from the bottom of the page. */}
            <div
              className="absolute inset-x-0 bottom-0 h-[55%]"
              style={{
                background:
                  "radial-gradient(70% 90% at 50% 100%, color-mix(in srgb, var(--c-accent) 20%, transparent), transparent 70%)",
              }}
            />
          </>
        )}
      </div>
      {lamps && (
        <>
          <LampColumn side="left" />
          <LampColumn side="right" />
        </>
      )}
      <main className="relative z-10 mx-auto max-w-[640px]">{children}</main>
      <Particles kind="gold-dust" colors={["#ffd27a", "#ffb347", "var(--c-accent)"]} />
    </div>
  );
}
