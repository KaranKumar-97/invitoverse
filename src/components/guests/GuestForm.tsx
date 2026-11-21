"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type GuestEventOption = { id: string; name: string; when: string };
export type GuestFormValues = {
  displayName: string;
  greeting: string;
  personalNote: string;
  notes: string;
  phone: string;
  eventAccess: "ALL" | "SELECTED";
  eventIds: string[];
};

export const EMPTY_GUEST: GuestFormValues = {
  displayName: "",
  greeting: "",
  personalNote: "",
  notes: "",
  phone: "",
  eventAccess: "ALL",
  eventIds: [],
};

const area =
  "min-h-20 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Event access picker shared by the guest sheet and bulk add. */
export function EventAccessField({
  events,
  access,
  ids,
  onChange,
  idPrefix,
}: {
  events: GuestEventOption[];
  access: "ALL" | "SELECTED";
  ids: string[];
  onChange: (access: "ALL" | "SELECTED", ids: string[]) => void;
  idPrefix: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Invited to</legend>
      <div className="flex gap-2">
        {(["ALL", "SELECTED"] as const).map((v) => (
          <label
            key={v}
            className={cn(
              "flex flex-1 cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm",
              access === v ? "border-maroon bg-maroon-soft/40" : "border-line",
            )}
          >
            <input
              type="radio"
              name={`${idPrefix}-access`}
              checked={access === v}
              onChange={() => onChange(v, ids)}
              className="accent-[var(--maroon)]"
            />
            {v === "ALL" ? "All events" : "Selected events"}
          </label>
        ))}
      </div>
      {access === "SELECTED" && (
        <ul className="space-y-1.5 rounded-md border border-line p-2">
          {events.length === 0 && (
            <li className="p-2 text-sm text-muted-foreground">Add events in the editor first.</li>
          )}
          {events.map((e) => (
            <li key={e.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={ids.includes(e.id)}
                  onChange={(ev) =>
                    onChange(
                      access,
                      ev.target.checked ? [...ids, e.id] : ids.filter((x) => x !== e.id),
                    )
                  }
                  className="size-4 accent-[var(--maroon)]"
                />
                <span className="text-sm">
                  <span className="font-medium">{e.name}</span>
                  <span className="block text-xs text-muted-foreground">{e.when}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export function GuestSheet({
  open,
  onOpenChange,
  initial,
  events,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: GuestFormValues;
  events: GuestEventOption[];
  editing: boolean;
  onSubmit: (v: GuestFormValues) => Promise<string | null>;
}) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<GuestFormValues>) => setV((x) => ({ ...x, ...patch }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-line">
          <SheetTitle>{editing ? "Edit guest" : "Add guest"}</SheetTitle>
          <SheetDescription>Each guest gets their own private link.</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!v.displayName.trim()) return setError("Enter a name.");
            if (v.eventAccess === "SELECTED" && v.eventIds.length === 0)
              return setError("Choose at least one event.");
            setBusy(true);
            setError(await onSubmit(v));
            setBusy(false);
          }}
        >
          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="g-name">Name on the invitation</Label>
              <Input
                id="g-name"
                value={v.displayName}
                maxLength={80}
                placeholder="Sharma Family"
                onChange={(e) => set({ displayName: e.target.value })}
                className="h-11"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-greeting">Greeting</Label>
              <Input
                id="g-greeting"
                value={v.greeting}
                maxLength={120}
                placeholder={`Dear ${v.displayName || "Sharma ji and family"},`}
                onChange={(e) => set({ greeting: e.target.value })}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Shown at the top of their invitation.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-note">Personal note</Label>
              <textarea
                id="g-note"
                value={v.personalNote}
                maxLength={500}
                rows={3}
                onChange={(e) => set({ personalNote: e.target.value })}
                className={area}
                placeholder="Your blessings mean the world to us."
              />
              <p className="text-xs text-muted-foreground">Optional. Only this guest sees it.</p>
            </div>
            <EventAccessField
              events={events}
              access={v.eventAccess}
              ids={v.eventIds}
              onChange={(a, ids) => set({ eventAccess: a, eventIds: ids })}
              idPrefix="sheet"
            />
            <div className="space-y-1.5">
              <Label htmlFor="g-phone">WhatsApp number</Label>
              <Input
                id="g-phone"
                value={v.phone}
                maxLength={20}
                inputMode="tel"
                placeholder="+91 98765 43210"
                onChange={(e) => set({ phone: e.target.value })}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Opens WhatsApp straight to their chat. Never shown to guests.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-notes">Private notes</Label>
              <textarea
                id="g-notes"
                value={v.notes}
                maxLength={500}
                rows={2}
                onChange={(e) => set({ notes: e.target.value })}
                className={area}
                placeholder="Bride's side · college friends"
              />
              <p className="text-xs text-muted-foreground">Only you see this.</p>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter className="mt-auto border-t border-line">
            <Button type="submit" className="h-11 rounded-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} {editing ? "Save guest" : "Add guest"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
