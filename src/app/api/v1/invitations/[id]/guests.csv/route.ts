import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/guards";
import { exportGuestsCsv } from "@/server/services/guests";

/** GET /api/v1/invitations/{id}/guests.csv — owner-only guest list with personal links. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const { filename, csv } = await exportGuestsCsv({ userId: user.id }, (await params).id, appUrl);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
