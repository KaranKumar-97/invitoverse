/** URL allow-lists for user-provided links and media (docs/13-security.md §4). */

const MAPS_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "www.google.com",
  "google.com",
  "maps.google.com",
  "www.google.co.in",
  "google.co.in",
]);

export function isAllowedMapsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    if (!MAPS_HOSTS.has(u.hostname)) return false;
    if (u.hostname === "goo.gl") return u.pathname.startsWith("/maps");
    if (u.hostname.includes("google."))
      return u.pathname.startsWith("/maps") || u.hostname.startsWith("maps.");
    return true;
  } catch {
    return false;
  }
}

/** Path served by the local development storage provider. */
export const LOCAL_MEDIA_PREFIX = "/api/v1/media/local/";

/** Media must be platform-hosted: bundled demo/template assets, our Cloudinary account, or local dev storage. */
export function isAllowedMediaUrl(value: string): boolean {
  if (
    value.startsWith("/templates/") ||
    value.startsWith("/music/") ||
    value.startsWith(LOCAL_MEDIA_PREFIX)
  ) {
    return !value.includes("..") && !value.includes("//", 1);
  }
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
