"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/lib/hooks";
import { slugify, slugProblem, SLUG_PROBLEM_MESSAGES } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { checkSlugAction } from "@/app/(dashboard)/dashboard/invitations/actions";

type Check = { slug: string; available: boolean; reason: string | null; suggestions: string[] };

/**
 * Live availability for a link the owner is choosing. `saved` is the invitation's current
 * link — always fine to keep, so it is never sent for checking.
 */
export function useSlugCheck(draft: string, saved: string, invitationId: string) {
  const [check, setCheck] = useState<Check | null>(null);
  const debounced = useDebouncedValue(draft, 400);
  const changed = draft !== saved;
  const problem = changed ? slugProblem(draft) : null;

  useEffect(() => {
    if (debounced === saved || slugProblem(debounced)) return;
    let live = true;
    checkSlugAction({ slug: debounced, excludeId: invitationId }).then(
      (r) => live && r.ok && setCheck(r.data),
    );
    return () => {
      live = false;
    };
  }, [debounced, saved, invitationId]);

  const checking = changed && !problem && (debounced !== draft || check?.slug !== draft);
  const ok = !changed || (!problem && !checking && check?.slug === draft && check.available);
  return { changed, problem, checking, ok, check: check?.slug === draft ? check : null };
}

/** "Your link" — the last step before a first publish. */
export function LinkPicker({
  appUrl,
  value,
  onChange,
  status,
}: {
  appUrl: string;
  value: string;
  onChange: (slug: string) => void;
  status: ReturnType<typeof useSlugCheck>;
}) {
  const { changed, problem, checking, ok, check } = status;
  const message = !changed
    ? "Suggested from your names — edit it if you like."
    : problem
      ? SLUG_PROBLEM_MESSAGES[problem]
      : checking
        ? "Checking availability…"
        : ok
          ? "This link is available."
          : (check?.reason ?? "");

  return (
    <section aria-labelledby="link-title" className="space-y-2">
      <div>
        <h2 id="link-title" className="text-sm font-semibold">
          Your link
        </h2>
        <p className="text-xs text-muted-foreground">
          The address you&apos;ll share. Choose it now — changing it after publishing breaks links
          you&apos;ve sent.
        </p>
      </div>
      <Label htmlFor="publish-slug" className="sr-only">
        Invitation link
      </Label>
      <div className="flex items-center overflow-hidden rounded-md border border-input bg-surface focus-within:ring-2 focus-within:ring-ring">
        <span className="hidden shrink-0 border-r border-line bg-muted px-3 py-2.5 text-sm text-muted-foreground sm:block">
          {new URL(appUrl).host}/i/
        </span>
        <input
          id="publish-slug"
          value={value}
          onChange={(e) =>
            onChange(
              slugify(e.target.value.replace(/\s/g, "-")) +
                (e.target.value.endsWith("-") ? "-" : ""),
            )
          }
          maxLength={48}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="publish-slug-status"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
        />
        <span className="px-3" aria-hidden="true">
          {checking ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : ok ? (
            <Check className="size-4 text-success" />
          ) : (
            <X className="size-4 text-destructive" />
          )}
        </span>
      </div>
      <p
        id="publish-slug-status"
        aria-live="polite"
        className={cn(
          "text-sm",
          ok ? "text-success" : checking ? "text-muted-foreground" : "text-destructive",
        )}
      >
        {message}
      </p>
      {!ok && !checking && check && check.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {check.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="rounded-md bg-muted px-3 py-2 text-sm break-all">
        <span className="text-muted-foreground">Guests will open </span>
        <span className="font-medium">
          {appUrl.replace(/\/$/, "")}/i/{value || "…"}
        </span>
      </p>
    </section>
  );
}
