"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatRelative } from "@/lib/format-date";
import { guestInvitationUrl, guestShareText, whatsappShareUrl } from "@/lib/share";
import { cn } from "@/lib/utils";
import type { GuestRow } from "@/server/services/guests";
import {
  addGuestAction,
  bulkAddGuestsAction,
  deleteGuestAction,
  markGuestSharedAction,
  regenerateGuestLinkAction,
  updateGuestAction,
} from "@/app/(dashboard)/dashboard/invitations/[id]/guests/actions";
import {
  EMPTY_GUEST,
  EventAccessField,
  GuestSheet,
  type GuestEventOption,
  type GuestFormValues,
} from "./GuestForm";

type StatusFilter = "ALL" | GuestRow["status"];
const STATUS_LABEL: Record<GuestRow["status"], string> = {
  NOT_SHARED: "Not shared",
  SHARED: "Shared",
  OPENED: "Opened",
};
const STATUS_STYLE: Record<GuestRow["status"], string> = {
  NOT_SHARED: "bg-muted text-ink-soft",
  SHARED: "bg-[#e8eefb] text-[#2b4c9b] dark:bg-[#1b2538] dark:text-[#a9c1f5]",
  OPENED: "bg-success/10 text-success",
};

export function GuestManager({
  invitationId,
  slug,
  published,
  coupleTitle,
  appUrl,
  events,
  initialGuests,
}: {
  invitationId: string;
  slug: string;
  published: boolean;
  coupleTitle: string;
  appUrl: string;
  events: GuestEventOption[];
  initialGuests: GuestRow[];
}) {
  const [guests, setGuests] = useState(initialGuests);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [sheet, setSheet] = useState<{ open: boolean; editing: GuestRow | null; key: number }>({
    open: false,
    editing: null,
    key: 0,
  });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "delete" | "regenerate"; guest: GuestRow } | null>(
    null,
  );
  const [, start] = useTransition();
  const eventName = useMemo(() => new Map(events.map((e) => [e.id, e.name])), [events]);

  const counts = useMemo(
    () => ({
      ALL: guests.length,
      NOT_SHARED: 0,
      SHARED: 0,
      OPENED: 0,
      ...Object.fromEntries(
        (["NOT_SHARED", "SHARED", "OPENED"] as const).map((s) => [
          s,
          guests.filter((g) => g.status === s).length,
        ]),
      ),
    }),
    [guests],
  );
  const visible = guests.filter(
    (g) =>
      (filter === "ALL" || g.status === filter) &&
      (!q.trim() ||
        `${g.displayName} ${g.greeting ?? ""} ${g.notes ?? ""}`
          .toLowerCase()
          .includes(q.trim().toLowerCase())),
  );

  const replace = (row: GuestRow) => setGuests((gs) => gs.map((g) => (g.id === row.id ? row : g)));
  const urlFor = (g: GuestRow) => guestInvitationUrl(appUrl, slug, g.token);

  const markShared = (g: GuestRow) => {
    if (g.status !== "NOT_SHARED") return;
    replace({ ...g, status: "SHARED", sharedAt: new Date().toISOString() });
    void markGuestSharedAction({ id: g.id }).then((r) => r.ok && replace(r.data));
  };

  const copy = async (g: GuestRow) => {
    try {
      await navigator.clipboard.writeText(urlFor(g));
      toast.success(`Link for ${g.displayName} copied`);
      markShared(g);
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy it.");
    }
  };

  const toPayload = (v: GuestFormValues) => ({
    displayName: v.displayName,
    greeting: v.greeting || null,
    personalNote: v.personalNote || null,
    notes: v.notes || null,
    phone: v.phone || null,
    eventAccess: v.eventAccess,
    eventIds: v.eventAccess === "SELECTED" ? v.eventIds : [],
  });

  const submitGuest = async (v: GuestFormValues): Promise<string | null> => {
    const editing = sheet.editing;
    const res = editing
      ? await updateGuestAction({ id: editing.id, ...toPayload(v) })
      : await addGuestAction({ invitationId, ...toPayload(v) });
    if (!res.ok)
      return res.error.fieldErrors
        ? (Object.values(res.error.fieldErrors).flat()[0] ?? res.error.message)
        : res.error.message;
    if (editing) replace(res.data);
    else setGuests((gs) => [...gs, res.data]);
    toast.success(editing ? "Guest updated" : `${res.data.displayName} added`);
    setSheet((s) => ({ ...s, open: false }));
    return null;
  };

  const openSheet = (editing: GuestRow | null) =>
    setSheet((s) => ({ open: true, editing, key: s.key + 1 }));
  const sheetInitial: GuestFormValues = sheet.editing
    ? {
        displayName: sheet.editing.displayName,
        greeting: sheet.editing.greeting ?? "",
        personalNote: sheet.editing.personalNote ?? "",
        notes: sheet.editing.notes ?? "",
        phone: sheet.editing.phone ?? "",
        eventAccess: sheet.editing.eventAccess,
        eventIds: sheet.editing.eventIds,
      }
    : EMPTY_GUEST;

  const runConfirm = () => {
    if (!confirm) return;
    const { kind, guest } = confirm;
    setConfirm(null);
    start(async () => {
      if (kind === "delete") {
        const res = await deleteGuestAction({ id: guest.id });
        if (!res.ok) return void toast.error(res.error.message);
        setGuests((gs) => gs.filter((g) => g.id !== guest.id));
        toast.success(`${guest.displayName} removed`);
      } else {
        const res = await regenerateGuestLinkAction({ id: guest.id });
        if (!res.ok) return void toast.error(res.error.message);
        replace(res.data);
        toast.success("New link created — the old one no longer works");
      }
    });
  };

  const eventsLabel = (g: GuestRow) =>
    g.eventAccess === "ALL"
      ? "All events"
      : g.eventIds
          .map((id) => eventName.get(id))
          .filter(Boolean)
          .join(", ") || "No events";
  const openedLabel = (g: GuestRow) =>
    g.status === "OPENED"
      ? `${g.openCount}× · ${g.lastOpenedAt ? formatRelative(g.lastOpenedAt) : ""}`
      : g.status === "SHARED" && g.sharedAt
        ? `sent ${formatRelative(g.sharedAt)}`
        : "";

  const actions = (g: GuestRow) => (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Copy link for ${g.displayName}`}
        onClick={() => void copy(g)}
      >
        <Copy />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" asChild>
        <a
          href={whatsappShareUrl(guestShareText(g, coupleTitle, urlFor(g)), g.phone ?? undefined)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Send ${g.displayName} their invitation on WhatsApp`}
          onClick={() => markShared(g)}
          className="text-[#1f7a4d]"
        >
          <MessageCircle />
        </a>
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions for ${g.displayName}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => openSheet(g)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/i/${slug}/guest/${g.token}`} target="_blank" rel="noopener">
              <Eye /> View their invitation
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirm({ kind: "regenerate", guest: g })}>
            <RefreshCw /> New link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirm({ kind: "delete", guest: g })}
          >
            <Trash2 /> Remove guest
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-6">
      {!published && (
        <div className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-[#fbf3e4] p-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:bg-[#2a2016]">
          <p>
            Personal links start working once your invitation is published. You can add guests now.
          </p>
          <Button asChild size="sm" className="shrink-0 rounded-full">
            <Link href={`/dashboard/invitations/${invitationId}/share`}>
              <Send /> Publish
            </Link>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter guests by status">
        {(["ALL", "NOT_SHARED", "SHARED", "OPENED"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium",
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-ink-soft shadow-card hover:text-ink",
            )}
          >
            {s === "ALL" ? "All" : STATUS_LABEL[s]}
            <span
              className={cn(
                "text-xs tabular-nums",
                filter === s ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guests"
            aria-label="Search guests"
            className="h-10 w-full rounded-full border border-line bg-surface pr-4 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" className="rounded-full" onClick={() => openSheet(null)}>
            <Plus /> Add guest
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setBulkOpen(true)}
          >
            <UsersRound /> Bulk add
          </Button>
          <Button type="button" variant="ghost" size="icon" asChild disabled={!guests.length}>
            <a
              href={`/api/v1/invitations/${invitationId}/guests.csv`}
              aria-label="Export guests as CSV"
              title="Export CSV"
            >
              <Download />
            </a>
          </Button>
        </div>
      </div>

      {guests.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="size-6" />}
          title="Invite your guests personally"
          description="Add each family or friend to give them a link with their name on it — and, if you like, only the events they're invited to."
          action={
            <Button className="h-11 rounded-full px-6" onClick={() => setBulkOpen(true)}>
              <Plus /> Add guests
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <p className="rounded-lg bg-surface p-8 text-center text-sm text-muted-foreground shadow-card">
          No guests match.
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {visible.map((g) => (
              <li key={g.id} className="rounded-lg bg-surface p-4 shadow-card">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{g.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{eventsLabel(g)}</p>
                  </div>
                  <StatusPill g={g} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{openedLabel(g)}</span>
                  {actions(g)}
                </div>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg bg-surface shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Invited to</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => (
                  <tr key={g.id} className="border-b border-line last:border-0">
                    <td className="max-w-[16rem] px-4 py-3">
                      <p className="truncate font-medium">{g.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {g.greeting || g.notes || " "}
                      </p>
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-3 text-ink-soft">
                      {eventsLabel(g)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill g={g} />
                      <p className="mt-1 text-xs text-muted-foreground">{openedLabel(g)}</p>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end">{actions(g)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <GuestSheet
        key={sheet.key}
        open={sheet.open}
        onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}
        initial={sheetInitial}
        events={events}
        editing={Boolean(sheet.editing)}
        onSubmit={submitGuest}
      />

      <BulkAddDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        events={events}
        onSubmit={async (lines, access, ids) => {
          const res = await bulkAddGuestsAction({
            invitationId,
            lines,
            eventAccess: access,
            eventIds: ids,
          });
          if (!res.ok) return res.error.message;
          setGuests(res.data.guests);
          toast.success(
            `${res.data.created} guest${res.data.created === 1 ? "" : "s"} added${res.data.skipped.length ? ` · ${res.data.skipped.length} skipped` : ""}`,
          );
          setBulkOpen(false);
          return null;
        }}
      />

      <AlertDialog open={Boolean(confirm)} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "delete"
                ? `Remove ${confirm.guest.displayName}?`
                : `New link for ${confirm?.guest.displayName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "delete"
                ? "Their personal link will stop working."
                : "The old link stops working immediately. Send them the new one."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirm}
              className={cn(
                confirm?.kind === "delete" &&
                  "bg-destructive bg-none text-white shadow-none hover:bg-destructive/90",
              )}
            >
              {confirm?.kind === "delete" ? "Remove" : "Create new link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusPill({ g }: { g: GuestRow }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLE[g.status],
      )}
    >
      {g.status === "OPENED" ? (
        <Check className="size-3" />
      ) : g.status === "SHARED" ? (
        <Link2 className="size-3" />
      ) : null}
      {STATUS_LABEL[g.status]}
    </span>
  );
}

function BulkAddDialog({
  open,
  onOpenChange,
  events,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  events: GuestEventOption[];
  onSubmit: (lines: string, access: "ALL" | "SELECTED", ids: string[]) => Promise<string | null>;
}) {
  const [text, setText] = useState("");
  const [access, setAccess] = useState<"ALL" | "SELECTED">("ALL");
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setText("");
          setError(null);
        }
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add many guests</DialogTitle>
          <DialogDescription>
            One guest per line. Add a greeting after a comma if you like.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          aria-label="Guest names, one per line"
          placeholder={"Sharma Family, Dear Sharma ji and family,\nAmit Verma\nNeha & Karan"}
          className="w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <EventAccessField
          events={events}
          access={access}
          ids={ids}
          onChange={(a, x) => (setAccess(a), setIds(x))}
          idPrefix="bulk"
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            className="h-11 rounded-full"
            disabled={!lines.length || busy || (access === "SELECTED" && !ids.length)}
            onClick={async () => {
              setBusy(true);
              setError(await onSubmit(text, access, ids));
              setBusy(false);
            }}
          >
            Add {lines.length || ""} guest{lines.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
