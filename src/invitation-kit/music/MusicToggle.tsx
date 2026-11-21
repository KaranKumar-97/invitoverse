"use client";

import { Music2, VolumeX } from "lucide-react";
import type { MusicController } from "./useMusicController";

/** Floating round music button (bottom-right). Styled entirely from theme variables. */
export function MusicToggle({ music, visible }: { music: MusicController; visible: boolean }) {
  if (!music.available) return null;
  return (
    visible && (
      <button
        type="button"
        onClick={music.toggle}
        aria-pressed={music.playing}
        aria-label={music.playing ? "Pause music" : "Play music"}
        title={music.title ?? undefined}
        className="vs-pop-in fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 grid size-11 place-items-center rounded-full border shadow-lg backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--c-surface) 80%, transparent)",
          borderColor: "color-mix(in srgb, var(--c-accent) 45%, transparent)",
          color: "var(--c-accent)",
        }}
      >
        {music.playing ? (
          <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                data-ambient
                className="block h-full w-[3px] origin-bottom rounded-full bg-current"
                style={{ animation: `vs-eq ${0.7 + i * 0.13}s ease-in-out ${i * 0.1}s infinite` }}
              />
            ))}
          </span>
        ) : (
          <span className="relative" aria-hidden="true">
            <Music2 className="size-[18px]" />
            <VolumeX className="absolute -right-2 -bottom-1.5 size-3" />
          </span>
        )}
      </button>
    )
  );
}
