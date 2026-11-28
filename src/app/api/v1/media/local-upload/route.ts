import { NextResponse } from "next/server";
import { AppError } from "@/lib/action-result";
import { requireUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http/guards";
import { sniffMime } from "@/server/integrations/storage/image-size";
import { verifyLocalToken, writeLocalFile } from "@/server/integrations/storage/local";
import { actingForInvitation } from "@/server/services/admin-acting";

/** The key's folder must belong to the uploader, or to an invitation they may edit as an admin. */
async function mayWrite(userId: string, key: string) {
  if (key.startsWith(`invitoverse/${userId}/`)) return true;
  const [, owner, invitationId] = key.split("/");
  if (!owner || !invitationId) return false;
  const acting = await actingForInvitation({ userId }, invitationId).catch(() => null);
  return acting?.ctx.userId === owner;
}

const SAME_FAMILY: Record<string, string[]> = {
  "audio/x-m4a": ["audio/mp4", "video/mp4"],
  "audio/mp4": ["audio/mp4", "video/mp4"],
  "audio/aac": ["audio/aac", "audio/mpeg"],
  "video/quicktime": ["video/quicktime", "video/mp4"],
};

/** Development stand-in for Cloudinary's signed upload endpoint. */
export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") throw new AppError("NOT_FOUND");
    assertSameOrigin(req);
    const user = await requireUser();
    const form = await req.formData();
    const claims = verifyLocalToken(String(form.get("token") ?? ""));
    if (!claims || !(await mayWrite(user.id, claims.key)))
      throw new AppError("FORBIDDEN", "Upload link expired. Please try again.");
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError("VALIDATION", "No file received.");
    if (file.size > claims.maxBytes)
      throw new AppError("LIMIT_EXCEEDED", "That file is too large.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffMime(bytes);
    const ok =
      sniffed === claims.mimeType || (SAME_FAMILY[claims.mimeType] ?? []).includes(sniffed ?? "");
    if (!ok)
      throw new AppError("VALIDATION", "That file doesn't look like the type it claims to be.");
    await writeLocalFile(claims.key, bytes);
    return NextResponse.json({ key: claims.key });
  } catch (e) {
    return errorResponse(e);
  }
}
