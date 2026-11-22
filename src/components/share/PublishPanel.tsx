"use client";

import Link from "next/link";
import { AlertTriangle, Check, CircleAlert, Loader2, Send, Undo2, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ChecklistItem, ChecklistTab } from "@/lib/invitation/checklist";
import { cn } from "@/lib/utils";
import type { PublishState } from "@/server/services/publishing";
import {
  changeSlugAction,
  getPublishStateAction,
  publishInvitationAction,
  unpublishInvitationAction,
} from "@/app/(editor)/dashboard/invitations/[id]/edit/actions";
import { LinkPicker, useSlugCheck } from "./LinkPicker";
import { SharePanel } from "./SharePanel";

/**
 * Checklist → Your link (first publish only) → Publish / Publish changes → share tools → Unpublish.
 * Used in the editor's publish dialog and on the standalone Share page.
 */
export function PublishPanel({
  invitationId,
  appUrl,
  coupleTitle,
  initialState,
  beforeLoad,
  onFix,
  onStateChange,
}: {
  invitationId: string;
  appUrl: string;
  coupleTitle: string;
  initialState?: PublishState;
  beforeLoad?: () => Promise<void>;
  onFix?: (tab: ChecklistTab) => void;
  onStateChange?: (s: PublishState) => void;
}) {
  const [state, setState] = useState<PublishState | null>(initialState ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const savedSlug = state?.slug ?? "";
  const [slugDraft, setSlugDraft] = useState(savedSlug);
  const slugStatus = useSlugCheck(slugDraft, savedSlug, invitationId);
  useEffect(() => setSlugDraft(savedSlug), [savedSlug]);

  const refresh = useCallback(async () => {
    await beforeLoad?.();
    const res = await getPublishStateAction({ id: invitationId });
    if (res.ok) {
      setState(res.data);
      onStateChange?.(res.data);
    } else setError(res.error.message);
  }, [beforeLoad, invitationId, onStateChange]);

  useEffect(() => {
    if (!initialState) void refresh();
  }, [initialState, refresh]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!state) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Saving and checking your invitation…
      </p>
    );
  }

  const required = state.checklist.filter((i) => i.severity === "required");
  const recommended = state.checklist.filter((i) => i.severity === "recommended");
  const published = state.status === "PUBLISHED";

  const publish = () =>
    start(async () => {
      await beforeLoad?.();
      if (!published && slugStatus.changed) {
        const moved = await changeSlugAction({ id: invitationId, slug: slugDraft });
        if (!moved.ok) return void toast.error(moved.error.message);
      }
      const res = await publishInvitationAction({ id: invitationId });
      if (!res.ok) {
        toast.error(res.error.message);
        return void (await refresh());
      }
      toast.success(published ? "Changes published" : "Your invitation is live 🎉");
      await refresh();
    });

  const unpublish = () =>
    start(async () => {
      const res = await unpublishInvitationAction({ id: invitationId });
      if (!res.ok) return void toast.error(res.error.message);
      toast.success("Invitation unpublished");
      await refresh();
    });

  return (
    <div className="space-y-6">
      {published && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 font-medium text-success">
              <span className="size-1.5 rounded-full bg-current" /> Live
            </span>
            <span className="text-muted-foreground">
              Version {state.publishedVersion}
              {state.publishedAt
                ? ` · ${new Date(state.publishedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
                : ""}
            </span>
          </div>
          {state.hasUnpublishedChanges && (
            <p className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> You have edits guests can&apos;t
              see yet. Publish changes to update the live invitation.
            </p>
          )}
          <SharePanel
            appUrl={appUrl}
            slug={state.slug}
            coupleTitle={coupleTitle}
            publishedVersion={state.publishedVersion}
          />
          <Link
            href={`/dashboard/invitations/${invitationId}/guests`}
            className="flex items-center gap-3 rounded-md border border-line p-3 text-sm hover:border-ink-soft"
          >
            <UsersRound className="size-5 text-maroon" />
            <span className="flex-1">
              <span className="block font-medium">Send personal invites</span>
              <span className="block text-xs text-muted-foreground">
                A link with each guest&apos;s name — and only their events.
              </span>
            </span>
          </Link>
        </div>
      )}

      <section aria-labelledby="checklist-title" className="space-y-2">
        <h2 id="checklist-title" className="text-sm font-semibold">
          {published ? "Checklist" : "Before you publish"}
        </h2>
        <ul className="divide-y divide-line rounded-md border border-line">
          {[...required, ...recommended].map((item) => (
            <ChecklistRow key={item.key} item={item} invitationId={invitationId} onFix={onFix} />
          ))}
        </ul>
      </section>

      {!published && (
        <LinkPicker appUrl={appUrl} value={slugDraft} onChange={setSlugDraft} status={slugStatus} />
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {published ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={pending}
              >
                <Undo2 /> Unpublish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unpublish this invitation?</AlertDialogTitle>
                <AlertDialogDescription>
                  Guests opening the link will see “This invitation isn&apos;t available”. You can
                  publish again any time — the link stays the same.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive bg-none text-white shadow-none hover:bg-destructive/90"
                  onClick={unpublish}
                >
                  Unpublish
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span />
        )}
        {(!published || state.hasUnpublishedChanges) && (
          <Button
            type="button"
            className="h-11 rounded-full px-6"
            disabled={!state.canPublish || pending || (!published && !slugStatus.ok)}
            onClick={publish}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Send />}{" "}
            {published ? "Publish changes" : "Publish invitation"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ChecklistRow({
  item,
  invitationId,
  onFix,
}: {
  item: ChecklistItem;
  invitationId: string;
  onFix?: (t: ChecklistTab) => void;
}) {
  const icon = item.ok ? (
    <Check className="size-4 text-success" />
  ) : item.severity === "required" ? (
    <CircleAlert className="size-4 text-destructive" />
  ) : (
    <AlertTriangle className="size-4 text-warning" />
  );
  return (
    <li className="flex items-start gap-3 px-3 py-2.5">
      <span className="mt-0.5" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className={cn(item.ok && "text-ink-soft")}>{item.label}</span>
        {!item.ok && (
          <span className="sr-only">
            {item.severity === "required" ? " (required)" : " (recommended)"}
          </span>
        )}
        {!item.ok && item.detail && (
          <span className="block text-xs text-muted-foreground">{item.detail}</span>
        )}
      </span>
      {!item.ok &&
        (onFix ? (
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-maroon hover:underline"
            onClick={() => onFix(item.fix)}
          >
            Fix
          </button>
        ) : (
          <Link
            href={`/dashboard/invitations/${invitationId}/edit?tab=${item.fix}`}
            className="shrink-0 text-xs font-medium text-maroon hover:underline"
          >
            Fix
          </Link>
        ))}
    </li>
  );
}
