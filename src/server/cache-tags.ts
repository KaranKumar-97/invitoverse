import "server-only";
import { revalidateTag } from "next/cache";

/** Cache tags for public invitation data (docs/14-deployment.md §4). */
export const slugTag = (slug: string) => `slug:${slug}`;

/**
 * Purge cached public pages/OG images for these slugs. Safe to call outside a Next.js request
 * (e.g. scripts/tests), where there is no cache to purge.
 */
export function invalidatePublic(...slugs: Array<string | null | undefined>) {
  for (const slug of new Set(slugs.filter(Boolean) as string[])) {
    try {
      revalidateTag(slugTag(slug));
    } catch {
      /* not running inside Next.js */
    }
  }
}
