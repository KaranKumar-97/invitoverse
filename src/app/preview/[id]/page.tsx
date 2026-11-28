import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppError } from "@/lib/action-result";
import { PreviewClient } from "@/components/preview/PreviewClient";
import { requireUserOrRedirect } from "@/server/auth/session";
import { actingForInvitation } from "@/server/services/admin-acting";
import { getInvitationForEditor } from "@/server/services/invitations";
import { getMusicLibrary } from "@/server/services/music";
import { isTemplateSlug } from "@/templates/registry";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Draft render for the owner (or an admin editing it, docs/19 §4.2), in the editor's iframe. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserOrRedirect(`/preview/${id}`);
  const notFoundOn = (e: unknown): never => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  };
  const acting = await actingForInvitation({ userId: user.id }, id).catch(notFoundOn);
  const inv = await getInvitationForEditor(acting.ctx, id).catch(notFoundOn);
  if (!isTemplateSlug(inv.templateSlug)) notFound();
  if (inv.status === "ARCHIVED") redirect("/dashboard/invitations?tab=archived");
  return (
    <PreviewClient
      templateSlug={inv.templateSlug}
      invitationKey={`preview:${inv.id}`}
      initialContent={inv.content}
      initialDesign={inv.design}
      library={await getMusicLibrary()}
    />
  );
}
