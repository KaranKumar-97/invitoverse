"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { revealGuestContactAction, setUserSuspendedAction } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";

/** Suspend / restore an account (users.edit). */
export function SuspendButton({ userId, suspended }: { userId: string; suspended: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      className={suspended ? "" : "text-destructive"}
      disabled={pending}
      onClick={() => {
        const reason = suspended ? undefined : prompt("Reason for suspending this account?");
        if (!suspended && !reason?.trim()) return;
        start(async () => {
          const res = await setUserSuspendedAction({
            userId,
            suspended: !suspended,
            reason: reason ?? undefined,
          });
          if (res.ok) {
            toast.success(suspended ? "Account restored" : "Account suspended");
            router.refresh();
          } else toast.error(res.error.message);
        });
      }}
    >
      {suspended ? "Restore account" : "Suspend account"}
    </Button>
  );
}

/** Shows a masked phone; reveals the real one on demand (users.view_pii, audited). */
export function RevealPhone({
  guestId,
  masked,
  canReveal,
}: {
  guestId: string;
  masked: string;
  canReveal: boolean;
}) {
  const [phone, setPhone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (phone) return <span className="font-mono">{phone}</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono">{masked}</span>
      {canReveal && (
        <button
          type="button"
          disabled={pending}
          className="text-xs underline underline-offset-4"
          onClick={() =>
            start(async () => {
              const res = await revealGuestContactAction({ guestId });
              if (res.ok) setPhone(res.data.phone ?? "—");
              else toast.error(res.error.message);
            })
          }
        >
          Reveal
        </button>
      )}
    </span>
  );
}
