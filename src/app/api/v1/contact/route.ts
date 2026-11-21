import { NextResponse } from "next/server";
import { AppError } from "@/lib/action-result";
import { assertSameOrigin, errorResponse } from "@/server/http/guards";
import { clientIp, rateLimit } from "@/server/integrations/ratelimit";
import { submitContact } from "@/server/services/contact";

const HOUR = 60 * 60 * 1000;

/** POST /api/v1/contact — landing contact form (docs/04 §2, 5/hour/IP). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!(await rateLimit(`contact:${clientIp(req)}`, 5, HOUR)).ok) {
      throw new AppError(
        "RATE_LIMITED",
        "Too many messages. Please try again later or WhatsApp us.",
      );
    }
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new AppError("VALIDATION", "Invalid request.");
    }
    await submitContact(body);
    // Dropped (bot) submissions get the same response as real ones.
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
