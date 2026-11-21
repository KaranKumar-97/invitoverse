import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppError } from "@/lib/action-result";
import { PreviewClient } from "@/components/preview/PreviewClient";
import { requireUserOrRedirect } from "@/server/auth/session";
import { getInvitationForEditor } from "@/server/services/invitations";
import { isTemplateSlug } from "@/templates/registry";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Owner-only draft render, loaded in the editor's iframe (or a new tab). */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserOrRedirect(`/preview/${id}`);
  const inv = await getInvitationForEditor({ userId: user.id }, id).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  if (!isTemplateSlug(inv.templateSlug)) notFound();
  if (inv.status === "ARCHIVED") redirect("/dashboard/invitations?tab=archived");
  return (
    <PreviewClient
      templateSlug={inv.templateSlug}
      invitationKey={`preview:${inv.id}`}
      initialContent={inv.content}
      initialDesign={inv.design}
    />
  );
}
