import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GuestManager } from "@/components/guests/GuestManager";
import { AppError } from "@/lib/action-result";
import { formatLongDate, formatTime } from "@/lib/invitation/dates";
import { requireUserOrRedirect } from "@/server/auth/session";
import { actingForInvitation } from "@/server/services/admin-acting";
import { listGuests } from "@/server/services/guests";
import { getInvitationForEditor } from "@/server/services/invitations";

export const metadata: Metadata = { title: "Guests" };

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserOrRedirect(`/dashboard/invitations/${id}/guests`);
  // Owners, or admins with invitations.guests acting as the owner (docs/19 §4.2).
  const acting = await actingForInvitation({ userId: user.id }, id, "invitations.guests").catch(
    (e) => {
      if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
      throw e;
    },
  );
  const ctx = acting.ctx;
  const [inv, guests] = await Promise.all([
    getInvitationForEditor(ctx, id),
    listGuests(ctx, id),
  ]).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const c = inv.content.couple;
  const [a, b] =
    c.order === "GROOM_FIRST"
      ? [c.groom.firstName, c.bride.firstName]
      : [c.bride.firstName, c.groom.firstName];
  const events = inv.content.events.map((e) => ({
    id: e.id,
    name: e.name || "Untitled event",
    when:
      [e.date ? formatLongDate(e.date) : "", e.startTime ? formatTime(e.startTime) : ""]
        .filter(Boolean)
        .join(" · ") || "No date yet",
  }));
  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/invitations"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Invitations
      </Link>
      <PageHeader
        title="Guests"
        description={`${inv.title} · personal invitation links`}
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/dashboard/invitations/${id}/edit`}>
              <Pencil /> Edit invitation
            </Link>
          </Button>
        }
      />
      <GuestManager
        invitationId={id}
        slug={inv.slug}
        published={inv.status === "PUBLISHED"}
        coupleTitle={`${a || "Bride"} & ${b || "Groom"}`}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        events={events}
        initialGuests={guests}
      />
    </div>
  );
}
