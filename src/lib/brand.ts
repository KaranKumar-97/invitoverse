/**
 * The product name — the ONE place it lives. Everything user-facing (logo, page titles, emails,
 * link previews, legal pages, the "Made with" badge on invitations) reads from here.
 *
 * Rename: change the default below, or set NEXT_PUBLIC_BRAND_NAME in Vercel and redeploy
 * (it's read at build time). Internal names (database, repo, storage folders) never use it.
 */
const name = (process.env.NEXT_PUBLIC_BRAND_NAME || "Invitation Banao").trim();
const words = name.split(/\s+/);

export const BRAND = {
  name,
  /** Logo: leading words in ink, last word in gold foil. Single-word names get a gold dot instead. */
  lead: words.length > 1 ? words.slice(0, -1).join(" ") : name,
  accent: words.length > 1 ? words[words.length - 1]! : "",
} as const;
