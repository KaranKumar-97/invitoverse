import { getManifest } from "@/templates/registry";

const FALLBACK = { bg: "#2A0E12", accent: "#C9A227", text: "#F6E7C8" };

export function templateSwatch(slug: string) {
  const c = getManifest(slug)?.palettes[0].colors;
  return c ? { bg: c.bg, accent: c.accent, text: c.text } : FALLBACK;
}
