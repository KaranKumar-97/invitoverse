/**
 * Removes personal data from anything leaving the app for logs or error tracking
 * (docs/13-security.md §10): guest tokens in URLs, email addresses and phone numbers.
 */
const GUEST_PATH = /(\/i\/[^/?#\s]+\/guest\/)[A-Za-z0-9_-]{8,}/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 10–14 digits, optionally single-space/dash separated (Indian mobiles, international numbers).
// Dates like 2027-02-14 have only 8 digits and are left alone.
const PHONE = /(?<![\w-])\+?\d(?:[\s-]?\d){9,13}(?![\w-])/g;
const SECRET_PARAMS = /([?&](?:token|code|email|callbackUrl)=)[^&#\s]*/gi;

export function scrubString(input: string): string {
  return input
    .replace(GUEST_PATH, "$1[token]")
    .replace(SECRET_PARAMS, "$1[redacted]")
    .replace(EMAIL, "[email]")
    .replace(PHONE, "[phone]");
}

/** Deep-scrubs strings inside plain objects/arrays (Sentry events, log payloads). */
export function scrubDeep<T>(value: T, depth = 0): T {
  if (depth > 8) return value;
  if (typeof value === "string") return scrubString(value) as T;
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, depth + 1)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (/^(cookie|cookies|authorization|set-cookie)$/i.test(k)) continue;
      out[k] = scrubDeep(v, depth + 1);
    }
    return out as T;
  }
  return value;
}
