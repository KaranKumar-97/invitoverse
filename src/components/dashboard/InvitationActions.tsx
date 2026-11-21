"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Link2,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  archiveInvitationAction,
  deleteInvitationAction,
  duplicateInvitationAction,
  restoreInvitationAction,
} from "@/app/(dashboard)/dashboard/invitations/actions";

type Item = { id: string; slug: string; title: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" };

export function InvitationActions({ item, className }: { item: Item; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<null | "archive" | "delete">(null);
  const [confirm, setConfirm] = useState("");

  const run = (
    fn: () => Promise<{ ok: boolean; error?: { message: string } }>,
    success: string,
    after?: () => void,
  ) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        after?.();
        router.refresh();
      } else toast.error(res.error?.message ?? "Something went wrong.");
    });

  return (
    <>
      {/* Non-modal so closing the menu never leaves pointer-events locked when a dialog opens from it. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={className}
            aria-label={`Actions for ${item.title}`}
            disabled={pending}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {item.status !== "ARCHIVED" && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invitations/${item.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </DropdownMenuItem>
          )}
          {item.status !== "ARCHIVED" && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invitations/${item.id}/guests`}>
                <UsersRound /> Guests
              </Link>
            </DropdownMenuItem>
          )}
          {item.status !== "ARCHIVED" && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invitations/${item.id}/share`}>
                <Send /> {item.status === "PUBLISHED" ? "Share" : "Publish"}
              </Link>
            </DropdownMenuItem>
          )}
          {item.status === "PUBLISHED" && (
            <DropdownMenuItem
              onSelect={() => {
                void navigator.clipboard
                  .writeText(`${window.location.origin}/i/${item.slug}`)
                  .then(() => toast.success("Link copied"));
              }}
            >
              <Link2 /> Copy link
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() =>
              run(async () => {
                const res = await duplicateInvitationAction({ id: item.id });
                return res;
              }, "Invitation duplicated")
            }
          >
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {item.status === "ARCHIVED" ? (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  run(() => restoreInvitationAction({ id: item.id }), "Invitation restored")
                }
              >
                <ArchiveRestore /> Restore
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
                <Trash2 /> Delete permanently
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onSelect={() => setDialog("archive")}>
              <Archive /> Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialog === "archive"} onOpenChange={(o) => !o && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{item.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {item.status === "PUBLISHED"
                ? "Guests will no longer be able to open this invitation. You can restore it later."
                : "It will move to Archived. You can restore it any time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(() => archiveInvitationAction({ id: item.id }), "Invitation archived")
              }
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialog === "delete"}
        onOpenChange={(o) => {
          if (!o) {
            setDialog(null);
            setConfirm("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{item.title}”, its guest list and links. It can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor={`confirm-${item.id}`}>
              Type <span className="font-mono font-semibold">{item.slug}</span> to confirm
            </Label>
            <Input
              id={`confirm-${item.id}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirm.trim() !== item.slug}
              className="bg-destructive bg-none text-white shadow-none hover:bg-destructive/90"
              onClick={() =>
                run(
                  () => deleteInvitationAction({ id: item.id, confirmSlug: confirm }),
                  "Invitation deleted",
                  () => setConfirm(""),
                )
              }
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
