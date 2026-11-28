import type { Metadata } from "next";
import { TemplatesManager } from "@/components/admin/TemplatesManager";
import { requireAdminPage } from "@/server/auth/admin";
import { listTemplatesAdmin } from "@/server/services/admin-templates";

export const metadata: Metadata = { title: "Templates" };

/** Template catalogue: show/hide, order, New badge, price, retire (docs/19 §4.1). */
export default async function AdminTemplatesPage() {
  const { user, access } = await requireAdminPage("templates.view");
  const rows = await listTemplatesAdmin({ userId: user.id });
  const can = {
    visibility: access.permissions.has("templates.visibility"),
    price: access.permissions.has("templates.price"),
    retire: access.permissions.has("templates.retire"),
  };
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Templates</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Hidden and retired templates disappear from the designs page and the template picker.
        Invitations already using them keep working. Prices are stored now and charged once payments
        are switched on.
      </p>
      {!can.visibility && !can.price && !can.retire && (
        <p className="mt-4 rounded-lg border border-line bg-surface px-4 py-2 text-sm">
          View only.
        </p>
      )}
      <TemplatesManager rows={rows} can={can} />
    </div>
  );
}
