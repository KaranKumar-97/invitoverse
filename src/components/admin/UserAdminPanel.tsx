"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteUserAccountAction,
  grantTemplateAccessAction,
  renameUserAction,
  revokeAccessAction,
} from "@/app/admin/users/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Result = { ok: boolean; error?: { message: string } };
const selectClass =
  "h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, success: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        after?.();
        router.refresh();
      } else toast.error(res.error?.message ?? "Something went wrong.");
    });
  return { run, pending };
}

/** Rename and delete controls for a user (users.edit / users.delete). */
export function UserAccountControls({
  userId,
  email,
  name,
  canEdit,
  canDelete,
}: {
  userId: string;
  email: string;
  name: string | null;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const id = useId();
  const router = useRouter();
  const { run, pending } = useRun();
  const [dialog, setDialog] = useState<null | "rename" | "delete">(null);
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  if (!canEdit && !canDelete) return null;
  return (
    <>
      {canEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setValue(name ?? "");
            setDialog("rename");
          }}
        >
          Rename
        </Button>
      )}
      {canDelete && (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive"
          onClick={() => {
            setValue("");
            setReason("");
            setDialog("delete");
          }}
        >
          Delete account
        </Button>
      )}
      <AlertDialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog === "delete" ? "Delete this account?" : "Rename user"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "delete"
                ? "They're signed out and can't sign in again. Every invitation is archived and taken down. The account is erased for good after 30 days."
                : email}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-v`}>
                {dialog === "delete" ? `Type ${email} to confirm` : "Name"}
              </Label>
              <Input
                id={`${id}-v`}
                value={value}
                maxLength={dialog === "delete" ? 254 : 80}
                autoComplete="off"
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            {dialog === "delete" && (
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-r`}>Reason</Label>
                <Input id={`${id}-r`} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                pending ||
                (dialog === "delete"
                  ? value.trim().toLowerCase() !== email.toLowerCase() || reason.trim().length < 3
                  : false)
              }
              onClick={(e) => {
                e.preventDefault();
                if (dialog === "delete")
                  run(
                    () => deleteUserAccountAction({ userId, confirmEmail: value, reason }),
                    "Account deleted",
                    () => {
                      setDialog(null);
                      router.push("/admin/users");
                    },
                  );
                else
                  run(
                    () => renameUserAction({ userId, name: value }),
                    "Name saved",
                    () => setDialog(null),
                  );
              }}
            >
              {dialog === "delete" ? "Delete account" : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Grant a template (optionally until a date) and revoke grants (users.entitlements). */
export function AccessGrants({
  userId,
  templates,
  grants,
  canEdit,
}: {
  userId: string;
  templates: Array<{ slug: string; name: string }>;
  grants: Array<{ id: string; label: string }>;
  canEdit: boolean;
}) {
  const id = useId();
  const { run, pending } = useRun();
  const [slug, setSlug] = useState(templates[0]?.slug ?? "");
  const [until, setUntil] = useState("");
  return (
    <div>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
        {grants.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <span>{g.label}</span>
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  run(() => revokeAccessAction({ userId, entitlementId: g.id }), "Access removed")
                }
              >
                Remove
              </Button>
            )}
          </li>
        ))}
        {!grants.length && (
          <li className="px-5 py-3 text-muted-foreground">
            None (every template is free during beta).
          </li>
        )}
      </ul>
      {canEdit && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                grantTemplateAccessAction({ userId, templateSlug: slug, expiresAt: until || null }),
              "Access granted",
              () => setUntil(""),
            );
          }}
        >
          <div className="space-y-1">
            <Label htmlFor={`${id}-t`} className="text-xs">
              Template
            </Label>
            <select
              id={`${id}-t`}
              className={selectClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${id}-u`} className="text-xs">
              Until (optional)
            </Label>
            <Input
              id={`${id}-u`}
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="h-9"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={pending || !slug}>
            Grant access
          </Button>
        </form>
      )}
    </div>
  );
}
