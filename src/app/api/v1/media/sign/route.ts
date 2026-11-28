import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/action-result";
import { requireUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http/guards";
import { actingForInvitation } from "@/server/services/admin-acting";
import { signUpload } from "@/server/services/media";

const Body = z.object({
  invitationId: z.string().min(1).max(40),
  role: z.enum(["COUPLE", "FAMILY", "GALLERY", "BACKGROUND", "VIDEO", "MUSIC"]),
  mimeType: z.string().max(60),
  bytes: z.number().int().positive(),
});

/** POST /api/v1/media/sign — authorise one direct upload (docs/04-api-design.md §2.4). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new AppError("VALIDATION");
    // Owners sign for themselves; admins with invitations.edit sign as the owner (docs/19 §4.2).
    const acting = await actingForInvitation({ userId: user.id }, parsed.data.invitationId);
    const ticket = await signUpload(acting.ctx, parsed.data);
    return NextResponse.json(ticket, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
