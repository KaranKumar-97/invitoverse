import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/server/db/prisma";
import * as deepotsav from "@/templates/deepotsav/art";
import * as kashi from "@/templates/kashi/art";
import * as mandir from "@/templates/mandir/art";
import * as meenakshi from "@/templates/meenakshi/art";

/**
 * Replaceable template art (docs/19 §4.6). Templates reference art as /t-art/<slug>/<file>; the
 * route sends the browser to an admin's replacement when one exists, else the bundled file in
 * /public/templates/<slug>/art/.
 */
export const ART_TAG = "template-art";

export type ArtSlot = { key: string; file: string; width: number; height: number; video: boolean };

const MODULES: Record<string, Record<string, unknown>> = { deepotsav, kashi, mandir, meenakshi };

const FILE_RE = /^[a-z0-9][a-z0-9-]*\.(webp|jpg|jpeg|png|mp4)$/;

/** Collect every { src, w, h } (or video { src }) exported by a template's art module. */
function collect(slug: string): ArtSlot[] {
  const out = new Map<string, ArtSlot>();
  const walk = (v: unknown, key: string) => {
    if (!v || typeof v !== "object") return;
    const o = v as { src?: unknown; w?: unknown; h?: unknown };
    if (typeof o.src === "string" && o.src.startsWith(`/t-art/${slug}/`)) {
      const file = o.src.split("/").pop()!;
      if (!out.has(file))
        out.set(file, {
          key,
          file,
          width: typeof o.w === "number" ? o.w : 0,
          height: typeof o.h === "number" ? o.h : 0,
          video: file.endsWith(".mp4"),
        });
      return;
    }
    for (const [k, child] of Object.entries(v)) walk(child, key ? `${key}.${k}` : k);
  };
  walk(MODULES[slug], "");
  return [...out.values()];
}

export const ART_TEMPLATES = Object.keys(MODULES);

export function artSlots(slug: string): ArtSlot[] {
  return MODULES[slug] ? collect(slug) : [];
}

export function isArtFile(slug: string, file: string) {
  return FILE_RE.test(file) && artSlots(slug).some((s) => s.file === file);
}

const loadOverrides = unstable_cache(
  async () =>
    prisma.templateAssetOverride.findMany({
      select: { templateSlug: true, file: true, url: true },
    }),
  ["template-art-overrides"],
  { tags: [ART_TAG] },
);

/** The URL to serve for one art file: the admin's replacement, or the bundled original. */
export async function artUrl(slug: string, file: string): Promise<string> {
  const original = `/templates/${slug}/art/${file}`;
  try {
    const o = (await loadOverrides()).find((r) => r.templateSlug === slug && r.file === file);
    return o?.url ?? original;
  } catch {
    return original;
  }
}

export function invalidateArt() {
  try {
    revalidateTag(ART_TAG);
  } catch {
    /* not running inside Next.js */
  }
}
