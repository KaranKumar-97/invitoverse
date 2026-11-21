import { buildIcs } from "@/lib/invitation/ics";
import { coupleTitle } from "@/lib/invitation/couple";
import { publicInvitationUrl } from "@/lib/share";
import { getPublishedInvitationBySlug } from "@/server/services/public-invitations";

/**
 * GET /api/v1/ics/{slug}/{eventId} — add-to-calendar file for a published invitation.
 * Times are written in UTC, so calendars show them correctly in every timezone.
 * Phase 5: events restricted to selected guests will require `?t={token}`.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; eventId: string }> },
) {
  const { slug, eventId } = await params;
  const inv = await getPublishedInvitationBySlug(slug);
  const event = inv?.content.events.find((e) => e.id === eventId);
  if (!inv || !event) return new Response("Not found", { status: 404 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const ics = buildIcs({
    event,
    timezone: inv.content.timezone,
    coupleTitle: coupleTitle(inv.content.couple),
    uidDomain: new URL(appUrl).host,
    url: publicInvitationUrl(appUrl, inv.slug),
  });
  const filename = `${
    event.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "event"
  }.ics`;
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
