"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type FireworksHandle = {
  /** One burst at a point given as fractions of the canvas (0–1). */
  burst: (x: number, y: number) => void;
  /** A short volley of bursts over the temple. */
  volley: (count?: number, gapMs?: number) => void;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; c: string };
type Rocket = { x: number; y: number; ty: number; vy: number; tx: number };

/** Warm Diwali colours: gold, saffron, ivory, rose. */
const COLORS = ["255,214,120", "255,166,64", "255,240,200", "250,150,150", "255,196,90"];

/**
 * Canvas fireworks: a rocket climbs with a faint trail, then bursts into a ring of sparks that
 * slow, fall and fade. Drawn additively so overlapping sparks glow. Runs a frame loop only while
 * particles are alive; `ambient` fires an occasional volley while the canvas is on screen.
 */
export const Fireworks = forwardRef<
  FireworksHandle,
  { className?: string; ambient?: boolean; ambientEveryMs?: number }
>(function Fireworks({ className, ambient = false, ambientEveryMs = 4200 }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<Particle[]>([]);
  const rockets = useRef<Rocket[]>([]);
  const frame = useRef(0);
  const timers = useRef<number[]>([]);

  const size = () => {
    const el = canvas.current;
    if (!el) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(el.clientWidth * dpr);
    const h = Math.round(el.clientHeight * dpr);
    if (el.width !== w || el.height !== h) {
      el.width = w;
      el.height = h;
    }
    return { el, dpr, w, h };
  };

  const loop = () => {
    frame.current = 0;
    const s = size();
    const ctx = s?.el.getContext("2d");
    if (!s || !ctx) return;
    const { dpr, w, h } = s;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    rockets.current = rockets.current.filter((r) => {
      r.y += r.vy * dpr;
      r.vy *= 0.985;
      ctx.fillStyle = "rgba(255,226,170,0.9)";
      ctx.beginPath();
      ctx.arc(r.x, r.y, 1.6 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,190,110,0.25)";
      ctx.fillRect(r.x - 0.6 * dpr, r.y, 1.2 * dpr, 14 * dpr);
      if (r.y <= r.ty) {
        explode(r.x, r.y);
        return false;
      }
      return true;
    });

    parts.current = parts.current.filter((p) => p.life > 0);
    for (const p of parts.current) {
      p.x += p.vx * dpr;
      p.y += p.vy * dpr;
      p.vy += 0.028;
      p.vx *= 0.982;
      p.vy *= 0.982;
      p.life -= 0.011;
      const a = Math.max(0, p.life);
      ctx.fillStyle = `rgba(${p.c},${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (0.8 + a) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    if (parts.current.length || rockets.current.length) {
      frame.current = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  };

  const kick = () => {
    if (!frame.current) frame.current = requestAnimationFrame(loop);
  };

  const explode = (x: number, y: number) => {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    const c2 = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    const n = 90;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.08;
      const v = 1.9 + Math.random() * 2.1;
      parts.current.push({
        x,
        y,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
        life: 0.85 + Math.random() * 0.25,
        c: i % 3 === 0 ? c2 : c,
      });
    }
  };

  const burst = (fx: number, fy: number) => {
    const s = size();
    if (!s) return;
    rockets.current.push({
      x: fx * s.w,
      y: s.h * 0.62,
      tx: fx * s.w,
      ty: fy * s.h,
      vy: -(9 + Math.random() * 2),
    });
    kick();
  };

  const volley = (count = 5, gapMs = 320) => {
    const spots: Array<[number, number]> = [
      [0.3, 0.2],
      [0.7, 0.16],
      [0.5, 0.1],
      [0.2, 0.3],
      [0.8, 0.28],
      [0.42, 0.24],
      [0.62, 0.3],
    ];
    for (let i = 0; i < count; i++) {
      const [x, y] = spots[i % spots.length]!;
      timers.current.push(
        window.setTimeout(() => burst(x + (Math.random() - 0.5) * 0.06, y), i * gapMs),
      );
    }
  };

  useImperativeHandle(ref, () => ({ burst, volley }));

  // Ambient: a small volley now and then while the canvas is on screen and the tab is visible.
  useEffect(() => {
    const el = canvas.current;
    if (!ambient || !el || typeof IntersectionObserver === "undefined") return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = Boolean(e?.isIntersecting)), {
      threshold: 0.2,
    });
    io.observe(el);
    const id = window.setInterval(() => {
      if (visible && document.visibilityState === "visible")
        volley(2 + Math.round(Math.random()), 420);
    }, ambientEveryMs);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volley only reads refs
  }, [ambient, ambientEveryMs]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  return <canvas ref={canvas} aria-hidden="true" className={className} />;
});
