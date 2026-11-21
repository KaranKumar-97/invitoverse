import { z } from "zod";
import { clientIp, isBot, rateLimit } from "@/server/integrations/ratelimit";
import { recordGuestOpen, recordPublicOpen } from "@/server/services/public-invitations";

const Body = z.object({ slug: z.string().max(48), token: z.string().max(40).optional() });
const NO_CONTENT = () =>
  new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

/**
 * POST /api/v1/beacon/open — counts an invitation open (docs/04-api-design.md §2.5).
 * Always 204: never reveals whether a slug or guest token exists.
 */
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) return NO_CONTENT();
    if (isBot(req) || !(await rateLimit(`beacon:${clientIp(req)}`, 20, 60_000)).ok)
      return NO_CONTENT();
    const parsed = Body.safeParse(JSON.parse(await req.text()));
    if (parsed.success) {
      if (parsed.data.token) await recordGuestOpen(parsed.data.slug, parsed.data.token);
      else await recordPublicOpen(parsed.data.slug);
    }
  } catch {
    /* malformed body: ignore */
  }
  return NO_CONTENT();
}
