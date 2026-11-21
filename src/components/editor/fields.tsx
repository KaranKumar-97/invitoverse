"use client";

import { Plus, X } from "lucide-react";
import { useId } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SectionKey } from "@/lib/invitation/schema";
import { cn } from "@/lib/utils";

/** A titled card in the editor form. `previewSection` scrolls the preview when a field inside gets focus. */
export function EditorCard({
  title,
  description,
  previewSection,
  onPreviewFocus,
  children,
  className,
}: {
  title: string;
  description?: string;
  previewSection?: SectionKey;
  onPreviewFocus?: (s: SectionKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-lg bg-surface p-5 shadow-card sm:p-6", className)}
      onFocusCapture={
        previewSection && onPreviewFocus ? () => onPreviewFocus(previewSection) : undefined
      }
    >
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  warning,
  htmlFor,
  counter,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  warning?: string | null;
  htmlFor: string;
  counter?: { value: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {counter && (
          <span
            className={cn(
              "text-xs tabular-nums",
              counter.value > counter.max * 0.9 ? "text-warning" : "text-muted-foreground",
            )}
          >
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {warning ? (
        <p id={`${htmlFor}-warning`} className="text-xs text-warning">
          {warning}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass = "h-11 bg-surface";
export const textareaClass =
  "min-h-24 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
export const selectClass =
  "h-11 w-full rounded-md border border-input bg-surface px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Editable list of short strings (family lines, grandparents). */
export function StringListField<T extends FieldValues>({
  control,
  name,
  label,
  max,
  placeholder,
  addLabel,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  max: number;
  placeholder: string;
  addLabel: string;
}) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const items: string[] = Array.isArray(field.value) ? field.value : [];
        const set = (next: string[]) => field.onChange(next);
        return (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{label}</legend>
            {items.map((v, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  id={i === 0 ? id : undefined}
                  aria-label={`${label} ${i + 1}`}
                  value={v}
                  maxLength={120}
                  placeholder={placeholder}
                  onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))}
                  onBlur={field.onBlur}
                  className={inputClass}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                  onClick={() => set(items.filter((_, j) => j !== i))}
                >
                  <X />
                </Button>
              </div>
            ))}
            {items.length < max && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 text-maroon"
                onClick={() => set([...items, ""])}
              >
                <Plus /> {addLabel}
              </Button>
            )}
          </fieldset>
        );
      }}
    />
  );
}

/** Two-option segmented control. */
export function Segmented<V extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: V;
  options: Array<{ value: V; label: string }>;
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex flex-wrap rounded-full border border-line bg-surface p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-ink-soft hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
