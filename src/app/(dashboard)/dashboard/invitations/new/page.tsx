import type { Metadata } from "next";
import { requireUserOrRedirect } from "@/server/auth/session";
import { listAvailableTemplates } from "@/server/services/templates";
import { CreateWizard } from "./CreateWizard";

export const metadata: Metadata = { title: "Create invitation" };

export default async function NewInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  await requireUserOrRedirect(
    `/dashboard/invitations/new${template ? `?template=${encodeURIComponent(template)}` : ""}`,
  );
  const templates = await listAvailableTemplates();
  const initial = templates.find((t) => t.slug === template)?.slug ?? null;
  return (
    <CreateWizard
      templates={templates}
      initialTemplate={initial}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
    />
  );
}
