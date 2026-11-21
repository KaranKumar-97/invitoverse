"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_LIMITS, contactFieldErrors } from "@/lib/contact-rules";
import { track } from "@/lib/analytics";

type Errors = Partial<Record<"name" | "reply" | "message" | "_", string>>;

/** Contact form (docs/09 §3.10): inline validation, honeypot, time-to-submit, inline success. */
export function ContactForm() {
  const startedAt = useRef<number>(0);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Errors>({});

  const onFocus = () => {
    if (!startedAt.current) startedAt.current = Date.now();
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      reply: String(form.get("reply") ?? ""),
      message: String(form.get("message") ?? ""),
      website: String(form.get("website") ?? ""),
      elapsedMs: startedAt.current ? Date.now() - startedAt.current : 0,
    };
    const fieldErrors = contactFieldErrors(input);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setState("sending");
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string; fieldErrors?: Record<string, string[]> };
        } | null;
        const fe = body?.error?.fieldErrors ?? {};
        setErrors({
          name: fe.name?.[0],
          reply: fe.reply?.[0],
          message: fe.message?.[0],
          _: body?.error?.message ?? "Something went wrong. Please try again.",
        });
        setState("idle");
        return;
      }
      track("contact_submit");
      setState("sent");
    } catch {
      setErrors({ _: "You seem to be offline. Please try again." });
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-xl bg-surface p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto size-10 text-[#2f7a4f]" />
        <p className="mt-4 font-display text-2xl font-semibold">Thank you — message received.</p>
        <p className="mt-2 text-ink-soft">We usually reply within a day.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocus={onFocus}
      noValidate
      className="relative space-y-5 rounded-xl bg-surface p-6 shadow-card sm:p-8"
    >
      <Field id="contact-name" label="Your name" error={errors.name}>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          maxLength={CONTACT_LIMITS.name}
          className="h-11"
          aria-invalid={!!errors.name || undefined}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
        />
      </Field>
      <Field id="contact-reply" label="Email or phone" error={errors.reply}>
        <Input
          id="contact-reply"
          name="reply"
          autoComplete="email"
          maxLength={CONTACT_LIMITS.reply}
          className="h-11"
          aria-invalid={!!errors.reply || undefined}
          aria-describedby={errors.reply ? "contact-reply-error" : undefined}
        />
      </Field>
      <Field id="contact-message" label="How can we help?" error={errors.message}>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={CONTACT_LIMITS.message}
          aria-invalid={!!errors.message || undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
      </Field>
      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {errors._ && (
        <p role="alert" className="text-sm text-destructive">
          {errors._}
        </p>
      )}
      <Button
        type="submit"
        disabled={state === "sending"}
        className="h-12 w-full rounded-full text-base"
      >
        {state === "sending" ? <Loader2 className="size-4 animate-spin" /> : null}
        {state === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
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
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
