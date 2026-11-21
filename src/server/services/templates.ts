import "server-only";
import { prisma } from "@/server/db/prisma";
import { isTemplateSlug, templateManifests, type TemplateSlug } from "@/templates/registry";

export type TemplateOption = {
  slug: TemplateSlug;
  name: string;
  tagline: string;
  styleLabel: string;
  tier: "FREE" | "PREMIUM";
  isNew: boolean;
  swatch: { bg: string; accent: string; text: string };
};

/** Active catalogue rows that also have template code registered. */
export async function listAvailableTemplates(): Promise<TemplateOption[]> {
  const rows = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, tier: true, isNew: true },
  });
  return rows
    .filter((r) => isTemplateSlug(r.slug))
    .map((r) => {
      const m = templateManifests[r.slug as TemplateSlug];
      const c = m.palettes[0].colors;
      return {
        slug: m.slug as TemplateSlug,
        name: m.name,
        tagline: m.tagline,
        styleLabel: m.styleLabel,
        tier: r.tier,
        isNew: r.isNew,
        swatch: { bg: c.bg, accent: c.accent, text: c.text },
      };
    });
}
