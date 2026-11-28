"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  changeSiteSlugAction,
  deleteSiteAction,
  publishSiteAction,
  renameSiteAction,
  restoreSiteAction,
  takeDownSiteAction,
  unpublishSiteAction,
} from "@/app/admin/sites/actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Site = {
  id: string;
  slug: string;
  title: string;
  templateSlug: string;
  ownerEmail: string;
  publishedAt: string | null;
  publishedVersion: number;
  openCount: number;
  guests: number;
  disabledReason: string | null;
  state: "live" | "down" | "unpublished";
};
type Can = { publish: boolean; settings: boolean; takedown: boolean; delete: boolean };
type Result = { ok: boolean; error?: { message: string } };
type Kind = "rename" | "slug" | "takedown" | "delete" | "publish";

const STATE = {
  live: { label: "Live", variant: "default" },
  down: { label: "Taken down", variant: "destructive" },
  unpublished: { label: "Unpublished", variant: "secondary" },
} as const;

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export function SitesManager({ sites, can }: { sites: Site[]; can: Can }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<{ kind: Kind; site: Site } | null>(null);
  const [value, setValue] = useState("");
  const id = useId();

  const run = (fn: () => Promise<Result>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        setDialog(null);
        router.refresh();
      } else toast.error(res.error?.message ?? "Something went wrong.");
    });

  const open = (kind: Kind, site: Site) => {
    setValue(kind === "rename" ? site.title : kind === "slug" ? site.slug : "");
    setDialog({ kind, site });
  };

  if (!sites.length) {
    return <p className="mt-8 text-sm text-muted-foreground">No sites match.</p>;
  }

  const d = dialog;
  const copy = {
    rename: { title: "Rename site", label: "Title", button: "Save", hint: "" },
    slug: {
      title: "Change link",
      label: "Link",
      button: "Change link",
      hint: "Links already shared with guests will stop working.",
    },
    takedown: {
      title: "Take this site down?",
      label: "Reason",
      button: "Take down",
      hint: "Guests will see an 'unavailable' page until you restore it.",
    },
    delete: {
      title: "Delete permanently?",
      label: d ? `Type ${d.site.slug} to confirm` : "",
      button: "Delete forever",
      hint: "This removes the invitation, its guest list and links. It can't be undone.",
    },
    publish: {
      title: "Publish the latest draft?",
      label: "",
      button: "Publish",
      hint: "Guests will see whatever is in the owner's current draft, including unpublished edits.",
    },
  } as const;
  const c = d ? copy[d.kind] : null;
  const ready =
    !d ||
    (d.kind === "delete"
      ? value.trim() === d.site.slug
      : d.kind === "takedown"
        ? value.trim().length >= 3
        : d.kind === "publish" || value.trim().length > 0);

  return (
    <>
      <ul className="mt-6 space-y-3">
        {sites.map((s) => (
          <li key={s.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-semibold">{s.title}</h2>
                  <Badge variant={STATE[s.state].variant}>{STATE[s.state].label}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <a
                    href={`/i/${s.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono underline-offset-4 hover:underline"
                  >
                    /i/{s.slug} <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Copy link for ${s.title}`}
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(`${window.location.origin}/i/${s.slug}`)
                        .then(() => toast.success("Link copied"))
                    }
                  >
                    <Copy />
                  </Button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.ownerEmail} · {s.templateSlug} · v{s.publishedVersion}
                  {s.publishedAt ? ` · ${fmt.format(new Date(s.publishedAt))}` : ""}
                </p>
                <p className="text-sm text-ink-soft">
                  {s.openCount} opens · {s.guests} guests
                </p>
                {s.state === "down" && s.disabledReason && (
                  <p className="mt-1 text-sm text-destructive">Reason: {s.disabledReason}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 md:max-w-[22rem] md:justify-end">
                {can.settings && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => open("rename", s)}>
                      Rename
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => open("slug", s)}>
                      Change link
                    </Button>
                  </>
                )}
                {can.publish &&
                  (s.state === "unpublished" ? (
                    <Button size="sm" variant="outline" onClick={() => open("publish", s)}>
                      Publish
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(() => unpublishSiteAction({ id: s.id }), "Site unpublished")
                      }
                    >
                      Unpublish
                    </Button>
                  ))}
                {can.takedown &&
                  s.state !== "unpublished" &&
                  (s.state === "down" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => run(() => restoreSiteAction({ id: s.id }), "Site restored")}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => open("takedown", s)}
                    >
                      Take down
                    </Button>
                  ))}
                {can.delete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => open("delete", s)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog open={Boolean(d)} onOpenChange={(o) => !o && setDialog(null)}>
        <AlertDialogContent>
          {d && c && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{c.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {d.site.title} · /i/{d.site.slug}
                  {c.hint && <span className="mt-1 block">{c.hint}</span>}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {c.label && (
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-v`}>{c.label}</Label>
                  <Input
                    id={`${id}-v`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={!ready || pending}
                  onClick={(e) => {
                    e.preventDefault();
                    const sid = d.site.id;
                    if (d.kind === "rename")
                      run(() => renameSiteAction({ id: sid, title: value }), "Title saved");
                    if (d.kind === "slug")
                      run(() => changeSiteSlugAction({ id: sid, slug: value }), "Link changed");
                    if (d.kind === "takedown")
                      run(() => takeDownSiteAction({ id: sid, reason: value }), "Site taken down");
                    if (d.kind === "delete")
                      run(() => deleteSiteAction({ id: sid, confirmSlug: value }), "Site deleted");
                    if (d.kind === "publish")
                      run(() => publishSiteAction({ id: sid }), "Site published");
                  }}
                >
                  {c.button}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
