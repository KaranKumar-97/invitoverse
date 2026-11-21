/**
 * Marketing catalogue (docs/09 §3.2, §4). Built from the template registry, so a new template appears
 * here automatically once registered and its media is captured (scripts/capture-template-media.mjs).
 * Plain module — safe for server pages and client components.
 */
import type { TemplateCategory, TemplateManifest } from "@/lib/invitation/manifest";
import { TEMPLATE_SLUGS, templateManifests, type TemplateSlug } from "@/templates/registry";

export const CATEGORIES: ReadonlyArray<{ id: TemplateCategory; label: string; param: string }> = [
  { id: "ROYAL", label: "Royal", param: "royal" },
  { id: "MINIMAL", label: "Minimal", param: "minimal" },
  { id: "FLORAL", label: "Floral", param: "floral" },
  { id: "CINEMATIC", label: "Cinematic", param: "cinematic" },
  { id: "MODERN", label: "Modern", param: "modern" },
];

export type CatalogueItem = {
  slug: TemplateSlug;
  name: string;
  category: TemplateCategory;
  categoryParam: string;
  tagline: string;
  styleLabel: string;
  /** Registry order = featured order; higher = added later. */
  rank: number;
  swatches: Array<{ id: string; name: string; bg: string; accent: string }>;
  media: { poster: string; mp4: string; webm: string; og: string };
};

export type ComingSoonItem = {
  name: string;
  styleLabel: string;
  category: TemplateCategory;
  colors: { bg: string; accent: string; text: string };
};

export const COMING_SOON: ComingSoonItem[] = [
  {
    name: "Floral Romance",
    styleLabel: "Floral · Blush & Sage",
    category: "FLORAL",
    colors: { bg: "#F7E6E3", accent: "#7E9A7A", text: "#4A3A36" },
  },
  {
    name: "Cinematic Elegance",
    styleLabel: "Cinematic · Noir & Gold",
    category: "CINEMATIC",
    colors: { bg: "#121110", accent: "#C9A45C", text: "#EDE6DA" },
  },
  {
    name: "Modern Editorial",
    styleLabel: "Modern · Ivory & Terracotta",
    category: "MODERN",
    colors: { bg: "#F3EEE6", accent: "#B4532F", text: "#1E1A16" },
  },
];

export function templateMedia(slug: string) {
  const base = `/templates/${slug}`;
  return {
    poster: `${base}/poster.jpg`,
    mp4: `${base}/loop.mp4`,
    webm: `${base}/loop.webm`,
    og: `${base}/og.jpg`,
  };
}

function toItem(m: TemplateManifest, rank: number): CatalogueItem {
  return {
    slug: m.slug as TemplateSlug,
    name: m.name,
    category: m.category,
    categoryParam: CATEGORIES.find((c) => c.id === m.category)?.param ?? "all",
    tagline: m.tagline,
    styleLabel: m.styleLabel,
    rank,
    swatches: m.palettes.map((p) => ({
      id: p.id,
      name: p.name,
      bg: p.colors.bg,
      accent: p.colors.accent,
    })),
    media: templateMedia(m.slug),
  };
}

export const CATALOGUE: CatalogueItem[] = TEMPLATE_SLUGS.map((slug, i) =>
  toItem(templateManifests[slug], i),
);

export function relatedTemplates(slug: string, limit = 3): CatalogueItem[] {
  return CATALOGUE.filter((t) => t.slug !== slug).slice(0, limit);
}

/** Counts per category across live + coming-soon designs. */
export function categoryCounts() {
  const counts = new Map<TemplateCategory, number>();
  for (const t of CATALOGUE) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  return counts;
}

export const ENVELOPE_STYLE: Record<string, string> = {
  "palace-gates": "Wax-sealed envelope that opens onto palace gates",
  "card-slide": "Linen envelope; the card slides out and unfolds",
  "lamp-lighting": "A diya on a brass plate is lit; rings of light open the invitation",
};
export const REVEAL_STYLE: Record<string, string> = {
  "gilded-rise": "Sections rise with a gold rule drawing in",
  "quiet-fade": "Slow, quiet fades with generous spacing",
  "lamp-rise": "Sections rise softly in warm lamp-light",
};
