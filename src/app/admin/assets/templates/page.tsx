import type { Metadata } from "next";
import { TemplateArtManager } from "@/components/admin/TemplateArtManager";
import { requireAdminPage } from "@/server/auth/admin";
import { listTemplateArtAdmin } from "@/server/services/admin-art";

export const metadata: Metadata = { title: "Template art" };

/** Replace a template's images and videos from the portal (docs/19 §4.6). */
export default async function AdminTemplateArtPage() {
  const { user, access } = await requireAdminPage("assets.view");
  const templates = await listTemplateArtAdmin({ userId: user.id });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Template art</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Replace a template&apos;s art with your own. Use the same shape as the original, since the
        layouts are built around it. Changes reach live invitations within about five minutes.
        Templates drawn entirely in code (Deepam, Royal Heritage, Minimal Luxury) aren&apos;t
        listed.
      </p>
      <TemplateArtManager
        templates={templates}
        canEdit={access.permissions.has("assets.template_art")}
      />
    </div>
  );
}
