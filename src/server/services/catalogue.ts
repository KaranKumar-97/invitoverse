import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { CATALOGUE, type CatalogueItem } from "@/lib/marketing/catalogue";
import { prisma } from "@/server/db/prisma";

/** Cache tag for everything that shows the template catalogue (purged by admin template changes). */
export const TEMPLATES_TAG = "templates";

type Row = {
  slug: string;
  isActive: boolean;
  retiredAt: Date | null;
  sortOrder: number;
  isNew: boolean;
};

const loadRows = unstable_cache(
  async (): Promise<Row[]> =>
    prisma.template.findMany({
      select: { slug: true, isActive: true, retiredAt: true, sortOrder: true, isNew: true },
    }),
  ["template-catalogue-rows"],
  { tags: [TEMPLATES_TAG] },
);

/**
 * The marketing catalogue as admins set it (docs/19 §4.1): only visible, non-retired templates,
 * in the admin's order. If the database can't be reached (e.g. a build without one), falls back
 * to the full code registry so marketing pages still render.
 */
export async function getVisibleCatalogue(): Promise<CatalogueItem[]> {
  let rows: Row[];
  try {
    rows = await loadRows();
  } catch (e) {
    console.error("[catalogue] falling back to registry", e);
    return CATALOGUE;
  }
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return CATALOGUE.filter((t) => {
    const r = bySlug.get(t.slug);
    return !r || (r.isActive && !r.retiredAt);
  }).sort((a, b) => (bySlug.get(a.slug)?.sortOrder ?? 0) - (bySlug.get(b.slug)?.sortOrder ?? 0));
}

/** Whether a template's marketing pages should be shown (hidden or retired → 404). */
export async function isTemplateListed(slug: string): Promise<boolean> {
  return (await getVisibleCatalogue()).some((t) => t.slug === slug);
}

/**
 * Purge cached catalogue reads and the static pages that list templates (home, /templates and each
 * /templates/<slug>) after an admin change. Safe outside a Next.js request (tests, scripts).
 */
export function invalidateCatalogue() {
  try {
    revalidateTag(TEMPLATES_TAG);
    revalidatePath("/");
    revalidatePath("/templates", "layout");
  } catch {
    /* not running inside Next.js */
  }
}
