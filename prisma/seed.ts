/**
 * Seed script (docs/03-database.md §8).
 * Upserts catalogue rows from the template registry (code is the source of truth for rendering;
 * the Template table holds catalogue/commerce fields). Templates that are planned but not built
 * yet are kept inactive so the create flow only offers working designs.
 */
import { PrismaClient, type TemplateCategory } from "@prisma/client";
import { MUSIC_LIBRARY } from "../src/lib/invitation/music-library";
import { templateManifests } from "../src/templates/registry";

const prisma = new PrismaClient();

const PLANNED: Array<{
  slug: string;
  name: string;
  tagline: string;
  category: TemplateCategory;
  tags: string[];
}> = [
  {
    slug: "floral-romance",
    name: "Floral Romance",
    tagline: "Watercolour blooms and falling petals.",
    category: "FLORAL",
    tags: ["blush", "sage", "garden"],
  },
  {
    slug: "cinematic-elegance",
    name: "Cinematic Elegance",
    tagline: "A premiere for your love story.",
    category: "CINEMATIC",
    tags: ["noir", "gold", "film"],
  },
  {
    slug: "modern-editorial",
    name: "Modern Editorial",
    tagline: "A magazine cover made for two.",
    category: "MODERN",
    tags: ["terracotta", "editorial", "bold"],
  },
];

async function main() {
  const built = Object.values(templateManifests);
  let order = 10;
  for (const m of built) {
    const data = {
      name: m.name,
      tagline: m.tagline,
      category: m.category as TemplateCategory,
      tags: m.palettes.map((p) => p.name),
      version: m.version,
      sortOrder: order,
    };
    // Visibility, order, New badge, tier and price are managed in /admin/templates (docs/19 §4.1),
    // so a deploy only sets them when the template is first added.
    const { sortOrder, ...descriptive } = data;
    await prisma.template.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        ...descriptive,
        sortOrder,
        tier: "FREE",
        isActive: true,
        isNew: true,
      },
      update: descriptive,
    });
    order += 10;
  }
  for (const t of PLANNED) {
    if (built.some((m) => m.slug === t.slug)) continue;
    await prisma.template.upsert({
      where: { slug: t.slug },
      create: { ...t, tier: "FREE", isActive: false, sortOrder: order },
      update: {
        name: t.name,
        tagline: t.tagline,
        category: t.category,
        tags: t.tags,
        isActive: false,
      },
    });
    order += 10;
  }
  // Music library: import the bundled tracks once; after that they're managed in /admin/assets/music.
  for (const [i, t] of MUSIC_LIBRARY.entries()) {
    await prisma.musicTrack.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        title: t.title,
        mood: t.mood,
        url: t.src,
        durationSec: t.durationSec,
        provider: "STATIC",
        licence: "UNLICENSED",
        licenceNote: "Supplied by the owner (film / artist recording); see docs/16",
        sortOrder: (i + 1) * 10,
      },
      update: {},
    });
  }
  console.log(`Seeded ${built.length} active template(s) and ${PLANNED.length} planned.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
