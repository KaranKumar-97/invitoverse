import type { Metadata } from "next";
import { AdminsManager } from "@/components/admin/AdminsManager";
import { requireAdminPage } from "@/server/auth/admin";
import { listAdmins } from "@/server/services/admin-team";

export const metadata: Metadata = { title: "Admins" };

/** Superadmin only: admins, their roles and per-feature permission toggles (docs/19 §4.3). */
export default async function AdminsPage() {
  const { user } = await requireAdminPage("superadmin");
  const admins = await listAdmins({ userId: user.id });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Admins</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Admins can view everything you allow and change only what you switch on. Superadmins can do
        everything. Every change here is recorded in the audit log.
      </p>
      <AdminsManager admins={admins} selfId={user.id} />
    </div>
  );
}
