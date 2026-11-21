"use client";

import { Children, type ReactNode } from "react";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { PaperTexture } from "./decor";

/** Mobile: single column. Desktop: hero pinned on the left, content scrolls on the right. */
export function MinimalLayout({
  data,
  children,
}: {
  data: RenderableInvitation;
  children: ReactNode;
}) {
  const [hero, ...rest] = Children.toArray(children);
  const texture = Boolean(data.options.paperTexture) && data.theme.background.presetId === "linen";
  return (
    <div className="relative">
      <div aria-hidden="true" className="fixed inset-0" style={{ background: "var(--c-bg)" }}>
        {texture && <PaperTexture />}
      </div>
      <div className="relative z-10 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div
          className="lg:sticky lg:top-0 lg:h-dvh lg:border-r"
          style={{ borderColor: "color-mix(in srgb, var(--c-text) 10%, transparent)" }}
        >
          {hero}
        </div>
        <main className="mx-auto w-full max-w-[640px] lg:py-10">{rest}</main>
      </div>
    </div>
  );
}
