"use client";

/* eslint-disable @next/next/no-img-element -- small static posters from /public */
import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  moveTemplateAction,
  restoreTemplateAction,
  retireTemplateAction,
  setTemplateNewAction,
  setTemplatePriceAction,
  setTemplateVisibilityAction,
} from "@/app/admin/templates/actions";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Row = {
  slug: string;
  name: string;
  styleLabel: string;
  isActive: boolean;
  retiredAt: string | null;
  isNew: boolean;
  tier: "FREE" | "PREMIUM";
  pricePaise: number | null;
  counts: { draft: number; published: number; archived: number };
};
type Can = { visibility: boolean; price: boolean; retire: boolean };
type Result = { ok: boolean; error?: { message: string } };

const selectClass =
  "h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, success?: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        if (success) toast.success(success);
        router.refresh();
      } else toast.error(res.error?.message ?? "Something went wrong.");
    });
  return { run, pending };
}

export function TemplatesManager({ rows, can }: { rows: Row[]; can: Can }) {
  return (
    <ol className="mt-8 space-y-4">
      {rows.map((r, i) => (
        <TemplateRow
          key={`${r.slug}:${r.isActive}:${r.retiredAt}:${r.isNew}:${r.tier}:${r.pricePaise}`}
          row={r}
          can={can}
          first={i === 0}
          last={i === rows.length - 1}
        />
      ))}
    </ol>
  );
}

function status(r: Row) {
  if (r.retiredAt) return { label: "Retired", variant: "destructive" as const };
  if (!r.isActive) return { label: "Hidden", variant: "secondary" as const };
  return { label: "Live", variant: "default" as const };
}

function TemplateRow({
  row,
  can,
  first,
  last,
}: {
  row: Row;
  can: Can;
  first: boolean;
  last: boolean;
}) {
  const id = useId();
  const { run, pending } = useRun();
  const [tier, setTier] = useState(row.tier);
  const [price, setPrice] = useState(row.pricePaise ? String(row.pricePaise / 100) : "");
  const [retiring, setRetiring] = useState(false);
  const [reason, setReason] = useState("");
  const s = status(row);
  const inUse = row.counts.draft + row.counts.published + row.counts.archived;
  const priceChanged =
    tier !== row.tier || (tier === "PREMIUM" && Number(price) * 100 !== (row.pricePaise ?? 0));

  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex gap-4">
        <img
          src={`/templates/${row.slug}/poster.jpg`}
          alt=""
          width={60}
          height={130}
          className="h-[104px] w-12 shrink-0 rounded-md object-cover sm:h-[130px] sm:w-[60px]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{row.name}</h2>
            <Badge variant={s.variant}>{s.label}</Badge>
            {row.isNew && <Badge variant="outline">New</Badge>}
            {row.tier === "PREMIUM" && row.pricePaise && (
              <Badge variant="outline">₹{(row.pricePaise / 100).toLocaleString("en-IN")}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {row.styleLabel} · <span className="font-mono">{row.slug}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {row.counts.published} published · {row.counts.draft} drafts · {row.counts.archived}{" "}
            archived
          </p>
          <a
            href={`/templates/${row.slug}/preview`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-sm underline underline-offset-4"
          >
            Open demo
          </a>
        </div>
        {can.visibility && (
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${row.name} up`}
              disabled={first || pending}
              onClick={() => run(() => moveTemplateAction({ slug: row.slug, direction: "up" }))}
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${row.name} down`}
              disabled={last || pending}
              onClick={() => run(() => moveTemplateAction({ slug: row.slug, direction: "down" }))}
            >
              <ArrowDown />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4 md:flex-row md:flex-wrap md:items-end">
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-live`}
            aria-label={`Show ${row.name} on the site`}
            checked={row.isActive}
            disabled={!can.visibility || pending || Boolean(row.retiredAt)}
            onCheckedChange={(v) =>
              run(
                () => setTemplateVisibilityAction({ slug: row.slug, isActive: v }),
                v ? "Template shown" : "Template hidden",
              )
            }
          />
          <Label htmlFor={`${id}-live`}>Shown on the site</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-new`}
            aria-label={`New badge for ${row.name}`}
            checked={row.isNew}
            disabled={!can.visibility || pending}
            onCheckedChange={(v) => run(() => setTemplateNewAction({ slug: row.slug, isNew: v }))}
          />
          <Label htmlFor={`${id}-new`}>New badge</Label>
        </div>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                setTemplatePriceAction({
                  slug: row.slug,
                  tier,
                  priceRupees: tier === "FREE" ? null : Number(price),
                }),
              "Price saved",
            );
          }}
        >
          <div className="space-y-1">
            <Label htmlFor={`${id}-tier`} className="text-xs">
              Tier
            </Label>
            <select
              id={`${id}-tier`}
              className={selectClass}
              value={tier}
              disabled={!can.price || pending}
              onChange={(e) => setTier(e.target.value as Row["tier"])}
            >
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          {tier === "PREMIUM" && (
            <div className="space-y-1">
              <Label htmlFor={`${id}-price`} className="text-xs">
                Price (₹)
              </Label>
              <Input
                id={`${id}-price`}
                type="number"
                inputMode="numeric"
                min={1}
                max={100000}
                step={1}
                required
                value={price}
                disabled={!can.price || pending}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 w-28"
              />
            </div>
          )}
          {can.price && (
            <Button type="submit" size="sm" variant="outline" disabled={pending || !priceChanged}>
              Save price
            </Button>
          )}
        </form>

        {can.retire && (
          <div className="md:ml-auto">
            {row.retiredAt ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(() => restoreTemplateAction({ slug: row.slug }), "Template restored")
                }
              >
                Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                disabled={pending}
                onClick={() => setRetiring(true)}
              >
                Retire
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={retiring} onOpenChange={(o) => !o && setRetiring(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retire {row.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the designs page and the template picker. {inUse} invitation
              {inUse === 1 ? "" : "s"} using it keep working. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-reason`}>Reason</Label>
            <Textarea
              id={`${id}-reason`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={reason.trim().length < 3}
              onClick={() =>
                run(() => retireTemplateAction({ slug: row.slug, reason }), "Template retired")
              }
            >
              Retire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
