"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  applyAdminPresetAction,
  addAdminAction,
  setAdminPermissionAction,
  setAdminRoleAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  PERMISSION_MODULES,
  PERMISSION_PRESETS,
  PERMISSIONS,
  type PermissionKey,
} from "@/lib/admin/permissions";

type Admin = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "SUPERADMIN";
  permissions: PermissionKey[];
};

type Result = { ok: boolean; error?: { message: string } };

const selectClass =
  "h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, success?: string, onFail?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        if (success) toast.success(success);
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Something went wrong.");
        onFail?.();
      }
    });
  return { run, pending };
}

/** Add-admin form, then one card per admin with role, presets and permission toggles. */
export function AdminsManager({ admins, selfId }: { admins: Admin[]; selfId: string }) {
  return (
    <div className="mt-8 space-y-6">
      <AddAdmin />
      {admins.map((a) => (
        // Re-mount when the server's permission set changes (e.g. a view turned on with a write).
        <AdminCard
          key={`${a.id}:${a.role}:${a.permissions.join(",")}`}
          admin={a}
          self={a.id === selfId}
        />
      ))}
    </div>
  );
}

function AddAdmin() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SUPERADMIN">("ADMIN");
  const { run, pending } = useRun();
  return (
    <form
      className="rounded-xl border border-line bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addAdminAction({ email, role }), "Admin added", undefined);
        setEmail("");
      }}
    >
      <h2 className="text-lg font-semibold">Add an admin</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        They must have signed in once with this email.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`${id}-email`}>Email</Label>
          <Input
            id={`${id}-email`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-role`}>Role</Label>
          <select
            id={`${id}-role`}
            className={`${selectClass} w-full sm:w-40`}
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
          >
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Superadmin</option>
          </select>
        </div>
        <Button type="submit" disabled={pending || !email} className="h-10">
          Add admin
        </Button>
      </div>
    </form>
  );
}

function AdminCard({ admin, self }: { admin: Admin; self: boolean }) {
  const id = useId();
  const { run, pending } = useRun();
  const [perms, setPerms] = useState(() => new Set(admin.permissions));
  const isSuper = admin.role === "SUPERADMIN";

  const toggle = (key: PermissionKey, allowed: boolean) => {
    const before = new Set(perms);
    const next = new Set(perms);
    if (allowed) next.add(key);
    else next.delete(key);
    setPerms(next);
    run(
      () => setAdminPermissionAction({ userId: admin.id, key, allowed }),
      undefined,
      () => setPerms(before),
    );
  };

  return (
    <section
      aria-labelledby={`${id}-name`}
      className="rounded-xl border border-line bg-surface p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id={`${id}-name`} className="truncate font-semibold">
            {admin.name || admin.email}
            {self && <span className="ml-2 text-sm font-normal text-muted-foreground">(you)</span>}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${id}-role`} className="sr-only">
            Role for {admin.email}
          </Label>
          <select
            id={`${id}-role`}
            className={selectClass}
            value={admin.role}
            disabled={self || pending}
            onChange={(e) => {
              const role = e.target.value as "USER" | "ADMIN" | "SUPERADMIN";
              if (role === "USER" && !confirm(`Remove admin access for ${admin.email}?`)) return;
              run(
                () => setAdminRoleAction({ userId: admin.id, role }),
                role === "USER" ? "Admin removed" : "Role updated",
              );
            }}
          >
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="USER">Remove admin access</option>
          </select>
        </div>
      </div>

      {isSuper ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Superadmins can do everything; toggles don&apos;t apply.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Presets:</span>
            {PERMISSION_PRESETS.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setPerms(new Set(p.keys));
                  run(
                    () => applyAdminPresetAction({ userId: admin.id, presetId: p.id }),
                    `${p.label} applied`,
                  );
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {PERMISSION_MODULES.map((module) => (
              <fieldset key={module}>
                <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {module}
                </legend>
                <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                  {PERMISSIONS.filter((p) => p.module === module).map((p) => {
                    const sw = `${id}-${p.key}`;
                    return (
                      <li key={p.key} className="flex items-start gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <Label htmlFor={sw} className="text-sm font-medium">
                            {p.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                        <Switch
                          id={sw}
                          className="mt-0.5"
                          checked={perms.has(p.key)}
                          disabled={self}
                          onCheckedChange={(v) => toggle(p.key, v)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
