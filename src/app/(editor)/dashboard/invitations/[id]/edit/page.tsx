import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppError } from "@/lib/action-result";
import { Editor } from "@/components/editor/Editor";
import { parseEditorTab } from "@/components/editor/tab-keys";
import { requireUserOrRedirect } from "@/server/auth/session";
import { actingForInvitation, ownerLabel } from "@/server/services/admin-acting";
import { getInvitationForEditor } from "@/server/services/invitations";
import { getStorageUsage } from "@/server/services/media";
import { listGuests } from "@/server/services/guests";
import { getMusicLibrary } from "@/server/services/music";
import { listAvailableTemplates } from "@/server/services/templates";

export const metadata: Metadata = { title: "Edit invitation", robots: { index: false } };

export default async function EditInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const user = await requireUserOrRedirect(`/dashboard/invitations/${id}/edit`);
  // Owners edit as themselves; admins with invitations.edit edit as the owner (docs/19 §4.2).
  const acting = await actingForInvitation({ userId: user.id }, id).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const ctx = acting.ctx;
  const [inv, templates] = await Promise.all([
    getInvitationForEditor(ctx, id).catch((e) => {
      if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
      throw e;
    }),
    listAvailableTemplates(),
  ]);
  if (inv.status === "ARCHIVED") redirect("/dashboard/invitations?tab=archived");
  const [usage, guests, owner, musicLibrary] = await Promise.all([
    getStorageUsage(ctx, inv.id),
    listGuests(ctx, inv.id),
    acting.asAdmin ? ownerLabel(ctx.userId) : null,
    getMusicLibrary(),
  ]);
  const guestCounts: Record<string, number> = {};
  for (const g of guests)
    if (g.eventAccess === "SELECTED")
      for (const e of g.eventIds) guestCounts[e] = (guestCounts[e] ?? 0) + 1;
  const editor = (
    <Editor
      key={inv.id}
      initial={inv}
      templates={templates}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
      initialTab={parseEditorTab(tab)}
      initialUsedBytes={usage.usedBytes}
      guestCounts={guestCounts}
      musicLibrary={musicLibrary}
    />
  );
  if (!acting.asAdmin) return editor;
  return (
    <>
      {/* Fixed warning colours on purpose: the bar must look the same in light and dark. */}
      <div
        role="status"
        className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-amber-300 px-4 py-1.5 text-center text-sm font-medium text-amber-950"
      >
        Editing {owner}&apos;s invitation as an admin. Changes are saved to their draft and logged.
        <a href={`/admin/users/${ctx.userId}/invitations/${inv.id}`} className="underline">
          Exit
        </a>
      </div>
      {editor}
    </>
  );
}
