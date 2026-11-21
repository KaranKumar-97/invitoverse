"use client";

import { useEffect, useState } from "react";
import { useInvitation } from "../context";

export type ParticleKind = "gold-dust" | "petals" | "sparkle";

const BASE_COUNT = { SUBTLE: 10, STANDARD: 22, DRAMATIC: 34 } as const;

// Deterministic pseudo-random so a given index always looks the same.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Transform-only ambient particles. Rendered after mount (no SSR mismatch), disabled under
 * reduced motion or when the owner turns particles off, and halved on low-memory devices.
 */
export function Particles({
  kind,
  className,
  colors,
}: {
  kind: ParticleKind;
  className?: string;
  colors?: string[];
}) {
  const { data, reducedMotion, revealed } = useInvitation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reducedMotion || !data.animation.particles) return setCount(0);
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (nav.connection?.saveData) return setCount(0);
    const base = BASE_COUNT[data.animation.intensity];
    setCount(nav.deviceMemory && nav.deviceMemory <= 4 ? Math.ceil(base / 2) : base);
  }, [reducedMotion, data.animation.particles, data.animation.intensity]);

  if (!count || !revealed) return null;
  const palette = colors ?? ["var(--c-accent)"];

  return (
    <div
      aria-hidden="true"
      className={className ?? "pointer-events-none fixed inset-0 z-30 overflow-hidden"}
    >
      {Array.from({ length: count }, (_, i) => {
        const left = rand(i, 1) * 100;
        const size = kind === "petals" ? 10 + rand(i, 2) * 10 : 2 + rand(i, 2) * 4;
        const duration = (kind === "petals" ? 9 : 12) + rand(i, 3) * 10;
        const delay = -rand(i, 4) * duration;
        const drift = (rand(i, 5) - 0.5) * 160;
        const color = palette[i % palette.length];
        const common: React.CSSProperties = {
          left: `${left}%`,
          width: size,
          height: kind === "petals" ? size * 0.7 : size,
          ["--drift" as string]: `${drift}px`,
          ["--spin" as string]: `${(rand(i, 6) - 0.5) * 720}deg`,
          willChange: "transform, opacity",
        };
        if (kind === "petals") {
          return (
            <span
              key={i}
              data-ambient
              className="absolute top-0 block rounded-[60%_0_60%_0]"
              style={{
                ...common,
                background: color,
                opacity: 0.85,
                animation: `vs-fall ${duration}s linear ${delay}s infinite`,
              }}
            />
          );
        }
        return (
          <span
            key={i}
            data-ambient
            className="absolute bottom-0 block rounded-full"
            style={{
              ...common,
              background: color,
              boxShadow: `0 0 ${size * 3}px ${color}`,
              animation:
                kind === "sparkle"
                  ? `vs-twinkle ${2 + rand(i, 7) * 3}s ease-in-out ${delay}s infinite`
                  : `vs-rise ${duration}s linear ${delay}s infinite`,
              ...(kind === "sparkle" ? { top: `${rand(i, 8) * 100}%`, bottom: "auto" } : {}),
            }}
          />
        );
      })}
    </div>
  );
}
