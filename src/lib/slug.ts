/** Invitation slug rules (docs/03-database.md §3 Notes). Isomorphic. */

export const SLUG_MIN = 3;
export const SLUG_MAX = 48;
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "assets",
  "blog",
  "dashboard",
  "demo",
  "help",
  "i",
  "invite",
  "invitation",
  "invitations",
  "login",
  "logout",
  "new",
  "preview",
  "pricing",
  "privacy",
  "settings",
  "signin",
  "signup",
  "static",
  "support",
  "templates",
  "terms",
  "vivah",
  "vivah-studio",
  "www",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-$/, "");
}

export type SlugProblem = "TOO_SHORT" | "TOO_LONG" | "INVALID" | "RESERVED";

export function slugProblem(slug: string): SlugProblem | null {
  if (slug.length < SLUG_MIN) return "TOO_SHORT";
  if (slug.length > SLUG_MAX) return "TOO_LONG";
  if (!SLUG_REGEX.test(slug) || slug.includes("--")) return "INVALID";
  if (RESERVED_SLUGS.has(slug)) return "RESERVED";
  return null;
}

export const SLUG_PROBLEM_MESSAGES: Record<SlugProblem, string> = {
  TOO_SHORT: `Use at least ${SLUG_MIN} characters.`,
  TOO_LONG: `Use at most ${SLUG_MAX} characters.`,
  INVALID: "Use lowercase letters, numbers and single hyphens (no hyphen at the start or end).",
  RESERVED: "This link is reserved. Try another.",
};

/** Candidate slugs for a couple, most natural first. */
export function slugCandidates(a: string, b: string, weddingDate?: string): string[] {
  const x = slugify(a);
  const y = slugify(b);
  const year = weddingDate?.slice(0, 4);
  const base = [
    x && y ? `${x}-${y}` : x || y,
    x && y ? `${x}-weds-${y}` : "",
    x && y ? `${x}-and-${y}` : "",
  ];
  const withYear = year ? base.map((s) => (s ? `${s}-${year}` : "")) : [];
  return [...new Set([...base, ...withYear].filter((s) => s && !slugProblem(s)))];
}
