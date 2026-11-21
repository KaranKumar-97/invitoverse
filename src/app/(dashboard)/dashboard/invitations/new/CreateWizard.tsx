"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/lib/hooks";
import { slugCandidates, slugify, slugProblem, SLUG_PROBLEM_MESSAGES } from "@/lib/slug";
import { cn } from "@/lib/utils";
import type { TemplateOption } from "@/server/services/templates";
import { checkSlugAction, createInvitationAction } from "../actions";

type Step = 0 | 1 | 2;
const STEPS = ["Choose design", "The couple", "Your link"];

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function CreateWizard({
  templates,
  initialTemplate,
  appUrl,
}: {
  templates: TemplateOption[];
  initialTemplate: string | null;
  appUrl: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialTemplate ? 1 : 0);
  const [template, setTemplate] = useState<string | null>(initialTemplate);
  const [bride, setBride] = useState("");
  const [groom, setGroom] = useState("");
  const [order, setOrder] = useState<"BRIDE_FIRST" | "GROOM_FIRST">("BRIDE_FIRST");
  const [date, setDate] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [touched, setTouched] = useState(false);
  const [pending, start] = useTransition();

  const names = useMemo<[string, string]>(
    () => (order === "GROOM_FIRST" ? [groom, bride] : [bride, groom]),
    [order, bride, groom],
  );

  // Suggest a slug from the names until the user edits it.
  useEffect(() => {
    if (!slugTouched) setSlug(slugCandidates(names[0], names[1])[0] ?? "");
  }, [names, slugTouched]);

  const debouncedSlug = useDebouncedValue(slug, 400);
  const [check, setCheck] = useState<{
    slug: string;
    available: boolean;
    reason: string | null;
    suggestions: string[];
  } | null>(null);
  const localProblem = slug ? slugProblem(slug) : "TOO_SHORT";

  useEffect(() => {
    if (step !== 2 || !debouncedSlug || slugProblem(debouncedSlug)) return;
    let cancelled = false;
    checkSlugAction({ slug: debouncedSlug, names, weddingDate: date || undefined }).then((res) => {
      if (!cancelled && res.ok) setCheck(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSlug, step, names, date]);

  const checking = step === 2 && !localProblem && (check?.slug !== slug || debouncedSlug !== slug);
  const slugOk = !localProblem && !checking && check?.slug === slug && check.available;

  const coupleErrors = {
    bride: !bride.trim() ? "Enter the bride's first name" : null,
    groom: !groom.trim() ? "Enter the groom's first name" : null,
    date: !date ? "Choose the wedding date" : null,
  };
  const coupleValid = !coupleErrors.bride && !coupleErrors.groom && !coupleErrors.date;

  const next = () => {
    if (step === 0 && template) setStep(1);
    else if (step === 1) {
      setTouched(true);
      if (coupleValid) setStep(2);
    }
  };

  const submit = () =>
    start(async () => {
      if (!template) return;
      const res = await createInvitationAction({
        templateSlug: template,
        brideName: bride,
        groomName: groom,
        order,
        weddingDate: date,
        slug,
      });
      if (res.ok) {
        toast.success("Invitation created");
        router.push(`/dashboard/invitations/${res.data.id}/edit`);
      } else {
        toast.error(res.error.message);
        if (res.error.code === "CONFLICT")
          setCheck({
            slug,
            available: false,
            reason: "This link was just taken.",
            suggestions: [],
          });
      }
    });

  const selected = templates.find((t) => t.slug === template);

  return (
    <div className="mx-auto max-w-3xl pb-28 sm:pb-0">
      <Link
        href="/dashboard/invitations"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Invitations
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Create invitation
      </h1>

      <ol className="mt-6 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "grid size-7 place-items-center rounded-full text-xs font-semibold",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-maroon text-canvas"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                i === step ? "font-medium text-ink" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-line sm:w-10" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-lg bg-surface p-5 shadow-card sm:p-8">
        {step === 0 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">Choose a design</h2>
            <p className="mt-1 text-ink-soft">
              You can switch designs later without losing your text.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Designs">
              {templates.map((t) => (
                <li key={t.slug}>
                  <div
                    role="radio"
                    aria-checked={template === t.slug}
                    tabIndex={0}
                    onClick={() => setTemplate(t.slug)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      (e.preventDefault(), setTemplate(t.slug))
                    }
                    className={cn(
                      "cursor-pointer overflow-hidden rounded-lg border-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      template === t.slug
                        ? "border-maroon"
                        : "border-transparent hover:border-line",
                    )}
                  >
                    <div
                      className="relative grid aspect-[16/10] place-items-center"
                      style={{ background: t.swatch.bg }}
                    >
                      <span className="font-display text-2xl" style={{ color: t.swatch.accent }}>
                        {t.name}
                      </span>
                      {template === t.slug && (
                        <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-maroon text-canvas">
                          <Check className="size-4" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-surface p-4">
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.styleLabel}</p>
                      </div>
                      <Link
                        href={`/templates/${t.slug}/preview`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-sm font-medium text-maroon hover:underline"
                      >
                        Demo <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">The couple</h2>
            <p className="mt-1 text-ink-soft">
              {selected ? `Designing with ${selected.name}. ` : ""}Everything else can be filled in
              the editor.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                id="bride"
                label="Bride's first name"
                error={touched ? coupleErrors.bride : null}
              >
                <Input
                  id="bride"
                  value={bride}
                  onChange={(e) => setBride(e.target.value)}
                  maxLength={40}
                  autoComplete="off"
                  className="h-11"
                />
              </Field>
              <Field
                id="groom"
                label="Groom's first name"
                error={touched ? coupleErrors.groom : null}
              >
                <Input
                  id="groom"
                  value={groom}
                  onChange={(e) => setGroom(e.target.value)}
                  maxLength={40}
                  autoComplete="off"
                  className="h-11"
                />
              </Field>
            </div>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium">Name order on the invitation</legend>
              <div className="mt-2 inline-flex rounded-full border border-line p-1">
                {(["BRIDE_FIRST", "GROOM_FIRST"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={order === o}
                    onClick={() => setOrder(o)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm",
                      order === o
                        ? "bg-primary text-primary-foreground"
                        : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {o === "BRIDE_FIRST"
                      ? `${bride || "Bride"} & ${groom || "Groom"}`
                      : `${groom || "Groom"} & ${bride || "Bride"}`}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-5 max-w-xs">
              <Field id="date" label="Wedding date" error={touched ? coupleErrors.date : null}>
                <Input
                  id="date"
                  type="date"
                  min={todayIso()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">Your link</h2>
            <p className="mt-1 text-ink-soft">
              This is the address you&apos;ll share. You can change it until you publish.
            </p>
            <div className="mt-6">
              <Label htmlFor="slug">Invitation link</Label>
              <div className="mt-1.5 flex items-center overflow-hidden rounded-md border border-input bg-surface focus-within:ring-2 focus-within:ring-ring">
                <span className="hidden shrink-0 border-r border-line bg-muted px-3 py-2.5 text-sm text-muted-foreground sm:block">
                  {new URL(appUrl).host}/i/
                </span>
                <input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(
                      slugify(e.target.value.replace(/\s/g, "-")) +
                        (e.target.value.endsWith("-") ? "-" : ""),
                    );
                  }}
                  maxLength={48}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="slug-status"
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />
                <span className="px-3" aria-hidden="true">
                  {checking ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : slugOk ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <X className="size-4 text-destructive" />
                  )}
                </span>
              </div>
              <p
                id="slug-status"
                className={cn(
                  "mt-2 text-sm",
                  slugOk
                    ? "text-success"
                    : localProblem || (check && !check.available)
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
                aria-live="polite"
              >
                {localProblem
                  ? SLUG_PROBLEM_MESSAGES[localProblem]
                  : checking
                    ? "Checking availability…"
                    : slugOk
                      ? "This link is available."
                      : (check?.reason ?? "")}
              </p>
              {!slugOk && !checking && check?.suggestions && check.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {check.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSlugTouched(true);
                        setSlug(s);
                      }}
                      className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-6 rounded-md bg-muted px-4 py-3 text-sm break-all">
                <span className="text-muted-foreground">Guests will open </span>
                <span className="font-medium">
                  {appUrl.replace(/\/$/, "")}/i/{slug || "…"}
                </span>
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-line bg-canvas/95 p-4 backdrop-blur sm:static sm:mt-6 sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
        {step > 0 ? (
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-full sm:flex-none"
            onClick={() => setStep((s) => (s - 1) as Step)}
          >
            <ArrowLeft /> Back
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        {step < 2 ? (
          <Button
            className="h-11 flex-1 rounded-full sm:flex-none sm:px-8"
            onClick={next}
            disabled={step === 0 && !template}
          >
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button
            className="h-11 flex-1 rounded-full sm:flex-none sm:px-8"
            onClick={submit}
            disabled={!slugOk || pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            Create invitation
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-destructive" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
