import type { Page } from "@playwright/test";

/**
 * Hand-rolled WCAG 2.2 AA spot checks (no axe dependency — product owner's choice).
 * Covers what automated tools catch most often: names, labels, alt text, headings, lang,
 * duplicate ids, target size (2.5.8) and text contrast (1.4.3) on solid backgrounds.
 */
export type A11yIssue = { rule: string; detail: string };

export async function auditA11y(page: Page, opts: { skipContrastWithin?: string } = {}) {
  // Render sections that content-visibility would skip, so computed styles are real.
  await page.addStyleTag({ content: "*{content-visibility:visible!important}" });
  await page.evaluate(async () => {
    document.querySelectorAll(".mk-auto-hide").forEach((el) => el.classList.remove("mk-auto-hide"));
    // Chrome only computes styles for a previously skipped subtree once it is rendered:
    // scroll through the page so every section has been on screen.
    const y0 = window.scrollY;
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.scrollTo(0, y0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  return page.evaluate(({ skipContrastWithin }) => {
    const issues: { rule: string; detail: string }[] = [];
    const push = (rule: string, el: Element | null, extra = "") => {
      const tag = el
        ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`
        : "";
      const text = el ? (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40) : "";
      issues.push({ rule, detail: `${tag} "${text}" ${extra}`.trim() });
    };

    const visible = (el: Element) => {
      const he = el as HTMLElement;
      if (he.closest("[aria-hidden='true'], [inert], dialog:not([open])")) return false;
      const s = getComputedStyle(he);
      if (s.visibility === "hidden" || s.display === "none") return false;
      const r = he.getBoundingClientRect();
      return r.width > 1 && r.height > 1; // 1×1 = visually hidden (sr-only)
    };

    const nameOf = (el: Element): string => {
      const he = el as HTMLElement;
      const aria = he.getAttribute("aria-label");
      if (aria?.trim()) return aria.trim();
      const by = he.getAttribute("aria-labelledby");
      if (by)
        return by
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ")
          .trim();
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        const labels = (el as HTMLInputElement).labels;
        if (labels?.length)
          return [...labels]
            .map((l) => l.textContent ?? "")
            .join(" ")
            .trim();
        if (el instanceof HTMLInputElement && ["submit", "button"].includes(el.type))
          return el.value;
        return he.getAttribute("title") ?? (el as HTMLInputElement).placeholder ?? "";
      }
      const imgAlts = [...he.querySelectorAll("img[alt], svg[aria-label]")]
        .map((i) => i.getAttribute("alt") ?? i.getAttribute("aria-label") ?? "")
        .join(" ");
      return `${he.innerText || he.textContent || ""} ${imgAlts} ${he.getAttribute("title") ?? ""}`.trim();
    };

    // 3.1.1 language
    if (!document.documentElement.lang) push("html-lang", document.documentElement);

    // 4.1.2 names for interactive elements
    const interactive = document.querySelectorAll(
      "a[href], button, [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='radio'], [role='checkbox'], [role='switch'], summary",
    );
    for (const el of interactive) if (visible(el) && !nameOf(el)) push("name", el);

    // 1.3.1 / 3.3.2 labels for form fields
    for (const el of document.querySelectorAll("input:not([type=hidden]), textarea, select")) {
      if (!visible(el)) continue;
      const t = (el as HTMLInputElement).type;
      if (["submit", "button", "reset", "image"].includes(t)) continue;
      // A placeholder alone is not a label (it disappears while typing).
      const labelled =
        el.hasAttribute("aria-label") ||
        el.hasAttribute("aria-labelledby") ||
        Boolean((el as HTMLInputElement).labels?.length);
      if (!labelled || !nameOf(el)) push("label", el);
    }

    // 1.1.1 images
    for (const img of document.querySelectorAll("img")) {
      if (!img.hasAttribute("alt") && !img.closest("[aria-hidden='true']"))
        push("img-alt", img, img.src.slice(-40));
    }

    // 1.3.1 headings: one visible h1, no skipped levels
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible);
    const h1s = headings.filter((h) => h.tagName === "H1");
    if (h1s.length !== 1) push("h1-count", null, `found ${h1s.length}`);
    let prev = 0;
    for (const h of headings) {
      const level = Number(h.tagName[1]);
      if (prev && level > prev + 1) push("heading-order", h, `h${prev}→h${level}`);
      prev = level;
    }

    // 4.1.1-ish: duplicate ids break label/aria references
    const seen = new Map<string, number>();
    for (const el of document.querySelectorAll("[id]")) seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
    for (const [id, n] of seen)
      if (n > 1 && id) push("duplicate-id", document.getElementById(id), `#${id} ×${n}`);

    // 2.5.8 target size: 24×24, or smaller with a 24px circle around it clear of other targets.
    const targets = [...interactive].filter(visible);
    const rects = targets.map((el) => el.getBoundingClientRect());
    targets.forEach((el, i) => {
      if (el.closest("p, dd") || getComputedStyle(el).display === "inline") return;
      const r = rects[i]!;
      if (r.width >= 24 && r.height >= 24) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const crowded = rects.some((o, j) => {
        if (j === i || targets[j]!.contains(el) || el.contains(targets[j]!)) return false;
        const dx = Math.max(o.left - cx, 0, cx - o.right);
        const dy = Math.max(o.top - cy, 0, cy - o.bottom);
        return Math.hypot(dx, dy) < 12;
      });
      if (crowded) push("target-size", el, `${Math.round(r.width)}×${Math.round(r.height)}`);
    });

    // 1.4.3 contrast on solid backgrounds
    const parse = (c: string) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1]!
        .split(/[ ,/]+/)
        .filter(Boolean)
        .map(Number);
      return { r: r!, g: g!, b: b!, a };
    };
    const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const f = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const bgOf = (el: Element): { r: number; g: number; b: number } | null => {
      let node: Element | null = el;
      while (node) {
        const s = getComputedStyle(node);
        if (s.backgroundImage !== "none") return null; // gradients/images: can't judge
        const c = parse(s.backgroundColor);
        if (c && c.a >= 0.95) return c;
        if (c && c.a > 0.05) return null; // translucent layer: can't judge reliably
        node = node.parentElement;
      }
      return { r: 255, g: 255, b: 255 };
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const checked = new Set<Element>();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const el = node.parentElement;
      if (!el || checked.has(el) || !(node.textContent ?? "").trim()) continue;
      checked.add(el);
      if (!visible(el) || (skipContrastWithin && el.closest(skipContrastWithin))) continue;
      if (el.closest("[disabled], [aria-disabled='true'], svg")) continue;
      const s = getComputedStyle(el);
      let op = 1;
      for (let n: Element | null = el; n; n = n.parentElement)
        op *= Number(getComputedStyle(n).opacity);
      if (op < 0.99) continue; // mid-animation or deliberately faded decoration
      const fg = parse(s.color);
      const bg = bgOf(el);
      if (!fg || !bg) continue;
      const mix = {
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
      };
      const [l1, l2] = [lum(mix), lum(bg)].sort((a, b) => b - a);
      const ratio = (l1! + 0.05) / (l2! + 0.05);
      const size = parseFloat(s.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5))
        push(
          "contrast",
          el,
          `${ratio.toFixed(2)}:1 ${s.color} on rgb(${bg.r},${bg.g},${bg.b}) ${size}px`,
        );
    }
    return issues;
  }, opts);
}

export function formatIssues(issues: A11yIssue[]) {
  return issues.map((i) => `${i.rule}: ${i.detail}`);
}
