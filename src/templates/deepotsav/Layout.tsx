"use client";

/* eslint-disable @next/next/no-img-element -- full-page backdrop */
import type { ReactNode } from "react";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { ART } from "./art";

/**
 * One phone-width column (the scene art is portrait), centred on wide screens over a dark, blurred
 * copy of the lit temple (or the owner's background). The gold jaali pattern sits behind the
 * sections unless the owner picks "Plain".
 */
export function DeepotsavLayout({
  data,
  children,
}: {
  data: RenderableInvitation;
  children: ReactNode;
}) {
  const { src, presetId } = data.theme.background;
  const jaali = !src && presetId !== "plain";
  return (
    <div className="relative overflow-x-clip">
      <div aria-hidden="true" className="fixed inset-0" style={{ background: "var(--c-bg)" }}>
        <img
          src={src ?? ART.lit.src}
          alt=""
          className={`h-full w-full object-cover ${src ? "" : "scale-110 opacity-40 blur-2xl"}`}
        />
        <div
          className="absolute inset-0"
          style={{ background: "color-mix(in srgb, var(--c-bg) 70%, transparent)" }}
        />
      </div>
      <main
        className={`dp-col @container relative z-10 mx-auto shadow-[0_0_90px_-20px_rgba(0,0,0,0.7)] ${jaali ? "dp-jaali" : ""}`}
        style={{ backgroundColor: "var(--c-bg)" }}
      >
        {children}
      </main>
    </div>
  );
}
