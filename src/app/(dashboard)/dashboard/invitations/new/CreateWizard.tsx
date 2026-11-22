"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TemplateOption } from "@/server/services/templates";
import { createInvitationAction } from "../actions";

// The link is chosen last, when publishing (docs/08 §4) — the draft gets a free
// link from the couple's names, so owners fill in events before picking it.
type Step = 0 | 1;
const STEPS = ["Choose design", "The couple"];

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function CreateWizard({
  templates,
  initialTemplate,
}: {
  templates: TemplateOption[];
  initialTemplate: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialTemplate ? 1 : 0);
  const [template, setTemplate] = useState<string | null>(initialTemplate);
  const [bride, setBride] = useState("");
  const [groom, setGroom] = useState("");
  const [order, setOrder] = useState<"BRIDE_FIRST" | "GROOM_FIRST">("BRIDE_FIRST");
  const [date, setDate] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, start] = useTransition();

  const coupleErrors = {
    bride: !bride.trim() ? "Enter the bride's first name" : null,
    groom: !groom.trim() ? "Enter the groom's first name" : null,
    date: !date ? "Choose the wedding date" : null,
  };
  const coupleValid = !coupleErrors.bride && !coupleErrors.groom && !coupleErrors.date;

  const submit = () =>
    start(async () => {
      setTouched(true);
      if (!template || !coupleValid) return;
      const res = await createInvitationAction({
        templateSlug: template,
        brideName: bride,
        groomName: groom,
        order,
        weddingDate: date,
      });
      if (res.ok) {
        toast.success("Invitation created");
        router.push(`/dashboard/invitations/${res.data.id}/edit`);
      } else toast.error(res.error.message);
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
              {selected ? `Designing with ${selected.name}. ` : ""}Next you&apos;ll add your events
              and details in the editor, then choose your link when you publish.
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
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-line bg-canvas/95 p-4 backdrop-blur sm:static sm:mt-6 sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
        {step > 0 ? (
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-full sm:flex-none"
            onClick={() => setStep(0)}
          >
            <ArrowLeft /> Back
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        {step === 0 ? (
          <Button
            className="h-11 flex-1 rounded-full sm:flex-none sm:px-8"
            onClick={() => template && setStep(1)}
            disabled={!template}
          >
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button
            className="h-11 flex-1 rounded-full sm:flex-none sm:px-8"
            onClick={submit}
            disabled={pending}
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
