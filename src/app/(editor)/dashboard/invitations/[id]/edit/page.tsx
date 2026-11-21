import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppError } from "@/lib/action-result";
import { Editor } from "@/components/editor/Editor";
import { parseEditorTab } from "@/components/editor/tab-keys";
import { requireUserOrRedirect } from "@/server/auth/session";
import { getInvitationForEditor } from "@/server/services/invitations";
import { getStorageUsage } from "@/server/services/media";
import { listGuests } from "@/server/services/guests";
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
  const [inv, templates] = await Promise.all([
    getInvitationForEditor({ userId: user.id }, id).catch((e) => {
      if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
      throw e;
    }),
    listAvailableTemplates(),
  ]);
  if (inv.status === "ARCHIVED") redirect("/dashboard/invitations?tab=archived");
  const [usage, guests] = await Promise.all([
    getStorageUsage({ userId: user.id }, inv.id),
    listGuests({ userId: user.id }, inv.id),
  ]);
  const guestCounts: Record<string, number> = {};
  for (const g of guests)
    if (g.eventAccess === "SELECTED")
      for (const e of g.eventIds) guestCounts[e] = (guestCounts[e] ?? 0) + 1;
  return (
    <Editor
      key={inv.id}
      initial={inv}
      templates={templates}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
      initialTab={parseEditorTab(tab)}
      initialUsedBytes={usage.usedBytes}
      guestCounts={guestCounts}
    />
  );
}
