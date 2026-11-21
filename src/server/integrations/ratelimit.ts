import "server-only";

/**
 * Fixed-window rate limiting (docs/04-api-design.md §5).
 * Upstash Redis (REST) when UPSTASH_REDIS_REST_URL/TOKEN are set, so limits hold across Vercel
 * instances; otherwise per-instance memory (development). Fails open if Redis is unreachable —
 * a rate limiter outage must never take invitations down.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

function memoryHit(key: string, windowMs: number): number {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000)
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    return 1;
  }
  w.count += 1;
  return w.count;
}

async function redisHit(key: string, windowMs: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const bucket = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", bucket],
        ["PEXPIRE", bucket, String(windowMs), "NX"],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(800),
    });
    if (!res.ok) return 0;
    const [incr] = (await res.json()) as Array<{ result?: number }>;
    return typeof incr?.result === "number" ? incr.result : 0;
  } catch {
    return 0; // fail open
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; count: number }> {
  const count = (await redisHit(key, windowMs)) ?? memoryHit(key, windowMs);
  return { ok: count <= limit, count };
}

/** Current count in this window, without incrementing. */
export async function peekCount(key: string, windowMs: number): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const bucket = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
      const res = await fetch(`${url.replace(/\/$/, "")}/get/${encodeURIComponent(bucket)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(800),
      });
      const body = (await res.json()) as { result?: string | null };
      return Number(body.result ?? 0) || 0;
    } catch {
      return 0;
    }
  }
  const w = windows.get(key);
  return w && w.resetAt > Date.now() ? w.count : 0;
}

export function clientIp(req: Request | Headers): string {
  const h = req instanceof Headers ? req : req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

const BOT_UA =
  /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slack|discord|twitter|linkedin|preview|embedly|headless/i;
export const isBot = (req: Request) => BOT_UA.test(req.headers.get("user-agent") ?? "");
