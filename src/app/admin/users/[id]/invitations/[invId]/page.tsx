import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RevealPhone } from "@/components/admin/UserControls";
import { Badge } from "@/components/ui/badge";
import { AppError } from "@/lib/action-result";
import { DraftContentSchema } from "@/lib/invitation/schema";
import { requireAdminPage } from "@/server/auth/admin";
import { getInvitationAdminView } from "@/server/services/admin-users";

export const metadata: Metadata = { title: "Invitation" };

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** One invitation, read-only: settings, draft content, guests (contacts masked), media. */
export default async function AdminInvitationPage({
  params,
}: {
  params: Promise<{ id: string; invId: string }>;
}) {
  const { user, access } = await requireAdminPage("users.view");
  const { id, invId } = await params;
  const inv = await getInvitationAdminView({ userId: user.id }, invId).catch((e) => {
    if (e instanceof AppError) notFound();
    throw e;
  });
  if (inv.ownerId !== id) notFound();
  const draft = DraftContentSchema.safeParse(inv.draftContent);
  const c = draft.success ? draft.data : null;
  const canReveal = access.permissions.has("users.view_pii");
  const canEdit = access.permissions.has("invitations.edit") && inv.status !== "ARCHIVED";
  const canGuests = access.permissions.has("invitations.guests") && inv.status !== "ARCHIVED";

  return (
    <div>
      <Link
        href={`/admin/users/${id}`}
        className="text-sm text-ink-soft underline-offset-4 hover:underline"
      >
        ← {inv.owner.name || inv.owner.email}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{inv.title}</h1>
        <Badge variant={inv.status === "PUBLISHED" ? "default" : "secondary"}>
          {inv.disabledAt ? "Taken down" : inv.status.toLowerCase()}
        </Badge>
      </div>
      {canEdit && (
        <a
          href={`/dashboard/invitations/${inv.id}/edit`}
          className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Edit in editor
        </a>
      )}
      {canGuests && (
        <a
          href={`/dashboard/invitations/${inv.id}/guests`}
          className="mt-3 ml-2 inline-flex h-9 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium"
        >
          Manage guests
        </a>
      )}
      <p className="mt-2 text-sm text-muted-foreground">
        {canEdit ? "Edits go to the owner's draft and are logged." : "View only."}{" "}
        {inv.status === "PUBLISHED" && (
          <a href={`/i/${inv.slug}`} target="_blank" rel="noreferrer" className="underline">
            Open live site
          </a>
        )}
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Link", `/i/${inv.slug}`],
          ["Template", inv.templateSlug],
          [
            "Published",
            inv.publishedAt
              ? `v${inv.publishedVersion} · ${fmt.format(new Date(inv.publishedAt))}`
              : "Never",
          ],
          ["Draft saved", fmt.format(new Date(inv.draftUpdatedAt))],
          ["Opens", String(inv.openCount)],
          ["Taken down", inv.disabledAt ? (inv.disabledReason ?? "Yes") : "No"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-surface p-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="mt-1 truncate font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {c && (
        <>
          <h2 className="mt-10 text-lg font-semibold">Draft</h2>
          <div className="mt-3 rounded-xl border border-line bg-surface p-5 text-sm">
            <p>
              <span className="text-muted-foreground">Couple:</span> {c.couple.bride.firstName}{" "}
              {c.couple.bride.lastName} &amp; {c.couple.groom.firstName} {c.couple.groom.lastName}
            </p>
            <p>
              <span className="text-muted-foreground">Wedding:</span> {c.weddingDate || "—"}
              {c.city ? ` · ${c.city}` : ""}
            </p>
            {c.messages.welcome && (
              <p className="mt-2 text-ink-soft italic">“{c.messages.welcome}”</p>
            )}
            <h3 className="mt-4 font-medium">Events</h3>
            <ul className="mt-1 list-inside list-disc">
              {c.events.map((e) => (
                <li key={e.id}>
                  {e.name || "Untitled"} · {e.date || "no date"} {e.startTime} ·{" "}
                  {e.venue.name || "no venue"}
                </li>
              ))}
            </ul>
            <details className="mt-4">
              <summary className="cursor-pointer text-muted-foreground">All draft data</summary>
              <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
                {JSON.stringify({ content: inv.draftContent, design: inv.draftDesign }, null, 2)}
              </pre>
            </details>
          </div>
        </>
      )}

      <h2 className="mt-10 text-lg font-semibold">Guests ({inv.guests.length})</h2>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface text-sm">
        {inv.guests.map((g) => (
          <li
            key={g.id}
            className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="flex-1 font-medium">{g.displayName}</span>
            <span className="text-ink-soft">
              {g.hasPhone ? (
                <RevealPhone guestId={g.id} masked={g.phone ?? ""} canReveal={canReveal} />
              ) : (
                "No phone"
              )}
            </span>
            <span className="text-muted-foreground sm:w-48 sm:text-right">
              {g.status.toLowerCase().replace("_", " ")} · {g.openCount} opens
            </span>
          </li>
        ))}
        {!inv.guests.length && <li className="px-5 py-3 text-muted-foreground">No guests.</li>}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">Media ({inv.mediaAssets.length})</h2>
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {inv.mediaAssets
          .filter((m) => m.kind === "IMAGE")
          .map((m) => (
            // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails
            <img
              key={m.id}
              src={m.url}
              alt=""
              className="aspect-square w-full rounded-md object-cover"
            />
          ))}
      </ul>
    </div>
  );
}
