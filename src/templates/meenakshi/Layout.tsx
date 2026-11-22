"use client";

import type { CSSProperties, ReactNode } from "react";
import { Particles } from "@/invitation-kit/particles/Particles";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { useStageZoom } from "./zoom";

export function MeenakshiLayout({
  data,
  children,
}: {
  data: RenderableInvitation;
  children: ReactNode;
}) {
  const zoom = useStageZoom();
  return (
    <div className="relative">
      {/* Base colour (only visible before the zoom is measured). */}
      <div
        aria-hidden="true"
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 40%, color-mix(in srgb, #c8963c 18%, var(--c-bg)), var(--c-bg) 70%)",
        }}
      />
      <main
        className="group/stage [container-type:inline-size] relative z-10 mx-auto max-w-[640px] overflow-x-clip"
        style={{ zoom: zoom.page, ["--mk-zoom" as string]: zoom.page } as CSSProperties}
        // Scaled up for a wide screen: a few elements use tighter, desktop-only sizes.
        data-wide={zoom.page > 1 ? "" : undefined}
      >
        {children}
      </main>
      {Boolean(data.options.petals) && (
        <Particles kind="petals" colors={["#f2a541", "#e8862a", "#f7c948"]} />
      )}
    </div>
  );
}
