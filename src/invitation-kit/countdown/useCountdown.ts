"use client";

import { useEffect, useState } from "react";

export type CountdownValue = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

export function diffParts(targetMs: number, nowMs: number): CountdownValue {
  const diff = Math.max(0, targetMs - nowMs);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    isPast: targetMs <= nowMs,
  };
}

/**
 * Ticks every second. Returns null until mounted so server and first client render match.
 * Pauses while the tab is hidden.
 */
export function useCountdown(targetIso: string): CountdownValue | null {
  const [value, setValue] = useState<CountdownValue | null>(null);

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    let id: ReturnType<typeof setInterval> | null = null;
    const tick = () => setValue(diffParts(target, Date.now()));
    const start = () => {
      tick();
      if (!id) id = setInterval(tick, 1000);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [targetIso]);

  return value;
}
