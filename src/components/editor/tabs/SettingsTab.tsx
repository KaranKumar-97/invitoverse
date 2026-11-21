"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Archive, Check, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks";
import { slugify, slugProblem, SLUG_PROBLEM_MESSAGES } from "@/lib/slug";
import { cn } from "@/lib/utils";
import {
  archiveInvitationAction,
  checkSlugAction,
} from "@/app/(dashboard)/dashboard/invitations/actions";
import { changeSlugAction } from "@/app/(editor)/dashboard/invitations/[id]/edit/actions";
import { EditorCard, Field, inputClass } from "../fields";

export function SettingsTab({
  id,
  title,
  slug,
  status,
  appUrl,
  onTitleChange,
  onSlugChange,
  beforeLeave,
}: {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  appUrl: string;
  onTitleChange: (t: string) => Promise<boolean>;
  onSlugChange: (s: string) => void;
  beforeLeave: () => Promise<void>;
}) {
  const router = useRouter();
  const [titleDraft, setTitleDraft] = useState(title);
  const [slugDraft, setSlugDraft] = useState(slug);
  const [check, setCheck] = useState<{
    slug: string;
    available: boolean;
    reason: string | null;
  } | null>(null);
  const [pending, start] = useTransition();
  const debounced = useDebouncedValue(slugDraft, 400);
  const problem = slugDraft !== slug ? slugProblem(slugDraft) : null;

  useEffect(() => setTitleDraft(title), [title]);
  useEffect(() => {
    if (debounced === slug || slugProblem(debounced)) return;
    let live = true;
    checkSlugAction({ slug: debounced, excludeId: id }).then(
      (r) => live && r.ok && setCheck(r.data),
    );
    return () => {
      live = false;
    };
  }, [debounced, slug, id]);

  const changed = slugDraft !== slug;
  const ok = changed && !problem && check?.slug === slugDraft && check.available;

  return (
    <div className="space-y-5">
      <EditorCard title="General">
        <Field
          label="Invitation name"
          htmlFor="title"
          hint="Only you see this — it's how the invitation appears in your dashboard."
        >
          <Input
            id="title"
            value={titleDraft}
            maxLength={120}
            className={inputClass}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={async () => {
              if (
                titleDraft.trim() &&
                titleDraft !== title &&
                !(await onTitleChange(titleDraft.trim()))
              )
                setTitleDraft(title);
            }}
          />
        </Field>
      </EditorCard>

      <EditorCard title="Invitation link">
        <Field
          label="Link"
          htmlFor="slug"
          warning={
            problem
              ? SLUG_PROBLEM_MESSAGES[problem]
              : changed && check?.slug === slugDraft && !check.available
                ? check.reason
                : null
          }
          hint={
            status === "PUBLISHED"
              ? "Changing the link breaks links you've already shared."
              : `${new URL(appUrl).host}/i/${slugDraft || "…"}`
          }
        >
          <div className="flex gap-2">
            <Input
              id="slug"
              value={slugDraft}
              maxLength={48}
              spellCheck={false}
              className={inputClass}
              onChange={(e) =>
                setSlugDraft(
                  slugify(e.target.value.replace(/\s/g, "-")) +
                    (e.target.value.endsWith("-") ? "-" : ""),
                )
              }
            />
            <Button
              type="button"
              className="h-11 shrink-0 rounded-md"
              disabled={!ok || pending}
              onClick={() =>
                start(async () => {
                  const res = await changeSlugAction({ id, slug: slugDraft });
                  if (res.ok) {
                    onSlugChange(res.data.slug);
                    toast.success("Link updated");
                  } else toast.error(res.error.message);
                })
              }
            >
              {pending ? <Loader2 className="animate-spin" /> : ok ? <Check /> : null} Save link
            </Button>
          </div>
        </Field>
      </EditorCard>

      <EditorCard title="Danger zone" className="border border-destructive/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Archive invitation</p>
            <p className="text-sm text-muted-foreground">
              Hides it from your list
              {status === "PUBLISHED" ? " and stops guests from opening it" : ""}. You can restore
              it later.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className={cn("rounded-full text-destructive")}>
                <Archive /> Archive
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this invitation?</AlertDialogTitle>
                <AlertDialogDescription>
                  You&apos;ll find it under Archived in your invitations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    start(async () => {
                      await beforeLeave();
                      const res = await archiveInvitationAction({ id });
                      if (res.ok) {
                        toast.success("Invitation archived");
                        router.push("/dashboard/invitations?tab=archived");
                      } else toast.error(res.error.message);
                    })
                  }
                >
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </EditorCard>
    </div>
  );
}
