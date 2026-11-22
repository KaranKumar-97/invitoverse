/**
 * One-shot celebratory petal burst (e.g. after a scratch-card reveal). Petals are plain DOM
 * elements animated with the Web Animations API — transform + opacity only — then removed.
 * Does nothing under reduced motion.
 */
const DEFAULT_COLORS = ["#f6a8b8", "#f27a96", "#ffd27a", "#fff3e0", "#f6a823"];

export function burstPetals(
  origin: Element,
  { count = 26, colors = DEFAULT_COLORS, reducedMotion = false } = {},
) {
  if (reducedMotion || typeof window === "undefined" || !("animate" in Element.prototype)) return;
  const host = (origin.closest(".inv-root") as HTMLElement | null) ?? document.body;
  const box = origin.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden";
  host.appendChild(layer);

  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  let pending = count;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement("span");
    const size = 8 + Math.random() * 10;
    const round = Math.random() > 0.5;
    petal.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size * (round ? 1 : 0.7)}px;background:${colors[i % colors.length]};border-radius:${round ? "50%" : "80% 0 80% 0"};will-change:transform,opacity`;
    layer.appendChild(petal);
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * Math.min(window.innerWidth, 520) * 0.45;
    const dx = Math.cos(angle) * dist;
    const up = Math.sin(angle) * dist * 0.6 - 60;
    const fall = 220 + Math.random() * 260;
    const spin = (Math.random() - 0.5) * 720;
    const anim = petal.animate(
      [
        { transform: "translate(-50%,-50%) scale(0.4) rotate(0deg)", opacity: 0 },
        {
          transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${up}px)) scale(1) rotate(${spin * 0.4}deg)`,
          opacity: 1,
          offset: 0.3,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${up + fall}px)) scale(0.9) rotate(${spin}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 1600 + Math.random() * 900,
        easing: "cubic-bezier(0.22,1,0.36,1)",
        delay: Math.random() * 120,
      },
    );
    anim.onfinish = () => {
      petal.remove();
      if (--pending === 0) layer.remove();
    };
  }
}
