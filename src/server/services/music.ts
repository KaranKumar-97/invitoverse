import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { MUSIC_LIBRARY, type LibraryTrack } from "@/lib/invitation/music-library";
import { prisma } from "@/server/db/prisma";

/** Cache tag for the managed music library (purged by admin music changes). */
export const MUSIC_TAG = "music";

const load = unstable_cache(
  async (): Promise<LibraryTrack[]> => {
    const rows = await prisma.musicTrack.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      mood: r.mood,
      src: r.url,
      durationSec: r.durationSec,
      active: r.isActive,
      replacedBy: r.replacedBy,
    }));
  },
  ["music-library"],
  { tags: [MUSIC_TAG] },
);

/**
 * Every track (hidden and retired ones too, so existing invitations keep playing), in library
 * order. Falls back to the bundled list when the database has none or can't be reached.
 */
export async function getMusicLibrary(): Promise<LibraryTrack[]> {
  try {
    const rows = await load();
    return rows.length ? rows : [...MUSIC_LIBRARY];
  } catch {
    return [...MUSIC_LIBRARY];
  }
}

/** Purge cached library reads and pages that resolve music. Safe outside a Next.js request. */
export function invalidateMusic() {
  try {
    revalidateTag(MUSIC_TAG);
    revalidatePath("/i", "layout");
    revalidatePath("/templates", "layout");
  } catch {
    /* not running inside Next.js */
  }
}
