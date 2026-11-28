/**
 * One-shot celebratory petal shower (e.g. after a scratch-card reveal). Petals are plain DOM
 * elements animated with the Web Animations API — transform + opacity only — then removed.
 * Does nothing under reduced motion.
 */
const DEFAULT_COLORS = ["#f6a8b8", "#f27a96", "#ffd27a", "#fff3e0", "#f6a823"];

/**
 * Flowers shower down from the top of the screen across its whole width: each petal falls slowly
 * (≈4.5–7 s) with a gentle side-to-side sway and a lazy spin, staggered over ~1.4 s so the shower
 * builds and tapers. Small gold sparks mix in for shimmer. `origin` only picks the layer's host
 * (the invitation root), not where petals start.
 */
export function burstPetals(
  origin: Element,
  { count = 70, colors = DEFAULT_COLORS, reducedMotion = false } = {},
) {
  if (reducedMotion || typeof window === "undefined" || !("animate" in Element.prototype)) return;
  const host = (origin.closest(".inv-root") as HTMLElement | null) ?? document.body;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden";
  host.appendChild(layer);

  const w = window.innerWidth;
  const h = window.innerHeight;
  let pending = count;
  for (let i = 0; i < count; i++) {
    // Outer element falls at a steady pace; the inner petal sways and spins on its own smooth
    // ease-in-out loop, so the drift never zigzags.
    const petal = document.createElement("span");
    const shape = document.createElement("span");
    const spark = i % 6 === 0;
    const size = spark ? 4 + Math.random() * 3 : 8 + Math.random() * 12;
    const round = spark || Math.random() > 0.55;
    const color = spark ? "#ffe3a1" : colors[i % colors.length];
    // Spread evenly across the width (with jitter), starting just above the top edge.
    const x = ((i + Math.random()) / count) * w;
    petal.style.cssText = `position:absolute;left:${x}px;top:-28px;will-change:transform,opacity`;
    shape.style.cssText = `display:block;width:${size}px;height:${size * (round ? 1 : 0.7)}px;background:${color};border-radius:${round ? "50%" : "80% 0 80% 0"};${spark ? "box-shadow:0 0 8px 2px rgba(255,214,120,0.7);" : ""}will-change:transform`;
    petal.appendChild(shape);
    layer.appendChild(petal);

    const fall = h + 70;
    const drift = (Math.random() - 0.5) * 90;
    const duration = 4500 + Math.random() * 2500;
    const delay = Math.random() * 1400;
    const sway = (18 + Math.random() * 30) * (Math.random() > 0.5 ? 1 : -1);
    const spin = (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 200);
    const swayMs = 1400 + Math.random() * 900;
    shape.animate(
      [
        { transform: `translateX(${-sway}px) rotate(0deg)` },
        { transform: `translateX(${sway}px) rotate(${spin}deg)` },
      ],
      {
        duration: swayMs,
        delay,
        direction: "alternate",
        iterations: Math.ceil(duration / swayMs) + 1,
        easing: "ease-in-out",
        fill: "both",
      },
    );
    const anim = petal.animate(
      [
        { transform: "translate(0px, 0px)", opacity: 0 },
        { transform: `translate(${drift * 0.08}px, ${fall * 0.08}px)`, opacity: 1, offset: 0.08 },
        { transform: `translate(${drift * 0.8}px, ${fall * 0.8}px)`, opacity: 1, offset: 0.8 },
        { transform: `translate(${drift}px, ${fall}px)`, opacity: 0.4 },
      ],
      { duration, delay, easing: "linear", fill: "both" },
    );
    anim.onfinish = () => {
      petal.remove();
      if (--pending === 0) layer.remove();
    };
  }
}
