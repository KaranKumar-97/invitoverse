import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireUserOrRedirect } from "@/server/auth/session";
import { signOutAction } from "@/app/(dashboard)/actions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUserOrRedirect("/dashboard/account");
  return (
    <div className="space-y-8">
      <PageHeader title="Account" />
      <section className="max-w-xl rounded-lg bg-surface p-6 shadow-card">
        <dl className="grid gap-4 text-sm sm:grid-cols-[120px_1fr]">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{user.name ?? "—"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium break-all">{user.email}</dd>
        </dl>
        <form action={signOutAction} className="mt-6 border-t border-line pt-6">
          <Button type="submit" variant="outline" className="rounded-full">
            <LogOut /> Sign out
          </Button>
        </form>
      </section>
    </div>
  );
}
