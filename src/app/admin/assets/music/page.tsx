import type { Metadata } from "next";
import { MusicManager } from "@/components/admin/MusicManager";
import { requireAdminPage } from "@/server/auth/admin";
import { listTracksAdmin } from "@/server/services/admin-music";

export const metadata: Metadata = { title: "Music" };

/** Songs for every template: add, edit, order, hide, retire, template defaults (docs/19 §4.6). */
export default async function AdminMusicPage() {
  const { user, access } = await requireAdminPage("assets.view");
  const data = await listTracksAdmin({ userId: user.id });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Music</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Songs couples can pick for any template. Hidden and retired songs keep playing on
        invitations that already use them. Mark each song&apos;s licence so unlicensed ones are easy
        to replace before launch.
      </p>
      <MusicManager data={data} canEdit={access.permissions.has("assets.music")} />
    </div>
  );
}
