"use client";

import { Sparkles } from "lucide-react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { DraftContent, SectionKey } from "@/lib/invitation/schema";
import {
  EditorCard,
  Field,
  inputClass,
  selectClass,
  Segmented,
  StringListField,
  textareaClass,
} from "../fields";
import { INVOCATIONS, MESSAGE_SUGGESTIONS, TIMEZONES } from "../suggestions";

type Props = { form: UseFormReturn<DraftContent>; onPreviewFocus: (s: SectionKey) => void };

export function DetailsTab({ form, onPreviewFocus }: Props) {
  const { register, control, setValue } = form;
  const [order, bride, groom, invocation, welcome, invitation, closing] = useWatch({
    control,
    name: [
      "couple.order",
      "couple.bride.firstName",
      "couple.groom.firstName",
      "invocation",
      "messages.welcome",
      "messages.invitation",
      "messages.closing",
    ],
  });
  const invocationPreset = INVOCATIONS.some((i) => i.value === invocation)
    ? invocation
    : "__custom";
  const set = (name: Parameters<typeof setValue>[0], value: string) =>
    setValue(name, value as never, { shouldDirty: true });

  const people = (["bride", "groom"] as const).map((who) => (
    <div key={who} className="space-y-4 rounded-md border border-line p-4">
      <p className="text-eyebrow text-muted-foreground">{who === "bride" ? "Bride" : "Groom"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          htmlFor={`${who}-first`}
          warning={!(who === "bride" ? bride : groom)?.trim() ? "Needed before publishing" : null}
        >
          <Input
            id={`${who}-first`}
            maxLength={40}
            className={inputClass}
            {...register(`couple.${who}.firstName`)}
          />
        </Field>
        <Field label="Last name" htmlFor={`${who}-last`} hint="Optional">
          <Input
            id={`${who}-last`}
            maxLength={40}
            className={inputClass}
            {...register(`couple.${who}.lastName`)}
          />
        </Field>
      </div>
      <Field label="Short bio" htmlFor={`${who}-bio`} hint="Optional · shown in the couple section">
        <textarea
          id={`${who}-bio`}
          maxLength={200}
          rows={2}
          className={textareaClass}
          {...register(`couple.${who}.shortBio`)}
        />
      </Field>
    </div>
  ));

  return (
    <div className="space-y-5">
      <EditorCard title="The couple" previewSection="hero" onPreviewFocus={onPreviewFocus}>
        {order === "GROOM_FIRST" ? [people[1], people[0]] : people}
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Name order</p>
            <Segmented
              label="Name order"
              value={order}
              onChange={(v) => setValue("couple.order", v, { shouldDirty: true })}
              options={[
                { value: "BRIDE_FIRST", label: `${bride || "Bride"} & ${groom || "Groom"}` },
                { value: "GROOM_FIRST", label: `${groom || "Groom"} & ${bride || "Bride"}` },
              ]}
            />
          </div>
          <div className="w-32">
            <Field label="Monogram" htmlFor="monogram" hint="Defaults to initials">
              <Input
                id="monogram"
                maxLength={4}
                placeholder="Auto"
                className={inputClass}
                {...register("couple.monogram")}
              />
            </Field>
          </div>
        </div>
      </EditorCard>

      <EditorCard title="The wedding" previewSection="hero" onPreviewFocus={onPreviewFocus}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Wedding date"
            htmlFor="weddingDate"
            hint="Shown on the cover. Event dates are set in Events."
          >
            <Input
              id="weddingDate"
              type="date"
              className={inputClass}
              {...register("weddingDate")}
            />
          </Field>
          <Field
            label="Time zone"
            htmlFor="timezone"
            hint="Used for the countdown and calendar invites"
          >
            <select id="timezone" className={selectClass} {...register("timezone")}>
              {TIMEZONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City" htmlFor="city" hint="e.g. Udaipur, Rajasthan">
            <Input id="city" maxLength={80} className={inputClass} {...register("city")} />
          </Field>
          <Field label="Hashtag" htmlFor="hashtag" hint="Optional">
            <Input
              id="hashtag"
              maxLength={40}
              placeholder="#PriyaWedsRahul"
              className={inputClass}
              {...register("hashtag")}
            />
          </Field>
        </div>
        <Field
          label="Invocation"
          htmlFor="invocation-preset"
          hint="A blessing shown above your names"
        >
          <select
            id="invocation-preset"
            className={selectClass}
            value={invocationPreset}
            onChange={(e) =>
              set("invocation", e.target.value === "__custom" ? invocation || " " : e.target.value)
            }
          >
            {INVOCATIONS.map((i) => (
              <option key={i.label} value={i.value}>
                {i.label}
              </option>
            ))}
            <option value="__custom">Custom…</option>
          </select>
        </Field>
        {invocationPreset === "__custom" && (
          <Field label="Custom invocation" htmlFor="invocation">
            <Input
              id="invocation"
              maxLength={120}
              className={inputClass}
              {...register("invocation")}
            />
          </Field>
        )}
      </EditorCard>

      <EditorCard
        title="Families"
        description="Parents and grandparents, as you'd like them printed."
        previewSection="families"
        onPreviewFocus={onPreviewFocus}
      >
        {(["bride", "groom"] as const).map((side) => (
          <div key={side} className="space-y-4 rounded-md border border-line p-4">
            <p className="text-eyebrow text-muted-foreground">
              {side === "bride" ? "Bride's family" : "Groom's family"}
            </p>
            <Field
              label="Label"
              htmlFor={`fam-${side}-label`}
              hint={side === "bride" ? "e.g. Daughter of" : "e.g. Son of"}
            >
              <Input
                id={`fam-${side}-label`}
                maxLength={40}
                className={inputClass}
                {...register(`families.${side}.label`)}
              />
            </Field>
            <StringListField
              control={control}
              name={`families.${side}.lines`}
              label="Parents"
              max={4}
              placeholder="Mrs. Sunita & Mr. Anil Sharma"
              addLabel="Add line"
            />
            <StringListField
              control={control}
              name={`families.${side}.grandparents`}
              label="Grandparents"
              max={4}
              placeholder="Late Smt. Kamla Devi & Shri Om Prakash"
              addLabel="Add grandparents"
            />
          </div>
        ))}
      </EditorCard>

      <EditorCard title="Messages" onPreviewFocus={onPreviewFocus} previewSection="greeting">
        <MessageField
          id="welcome"
          label="Welcome message"
          max={400}
          rows={3}
          value={welcome}
          onPick={(v) => set("messages.welcome", v)}
          suggestions={MESSAGE_SUGGESTIONS.welcome}
          register={register("messages.welcome")}
          onFocus={() => onPreviewFocus("greeting")}
        />
        <MessageField
          id="invitation"
          label="Invitation message"
          max={1500}
          rows={5}
          value={invitation}
          onPick={(v) => set("messages.invitation", v)}
          suggestions={MESSAGE_SUGGESTIONS.invitation}
          register={register("messages.invitation")}
          onFocus={() => onPreviewFocus("message")}
          hint="A poem or a longer note. Line breaks are kept."
        />
        <MessageField
          id="closing"
          label="Closing line"
          max={200}
          rows={2}
          value={closing}
          onPick={(v) => set("messages.closing", v)}
          suggestions={MESSAGE_SUGGESTIONS.closing}
          register={register("messages.closing")}
          onFocus={() => onPreviewFocus("footer")}
        />
      </EditorCard>
    </div>
  );
}

function MessageField({
  id,
  label,
  max,
  rows,
  value,
  suggestions,
  onPick,
  register,
  onFocus,
  hint,
}: {
  id: string;
  label: string;
  max: number;
  rows: number;
  value: string | undefined;
  suggestions: readonly string[];
  onPick: (v: string) => void;
  register: ReturnType<UseFormReturn<DraftContent>["register"]>;
  onFocus: () => void;
  hint?: string;
}) {
  return (
    <div onFocusCapture={(e) => (e.stopPropagation(), onFocus())}>
      <Field label={label} htmlFor={id} counter={{ value: value?.length ?? 0, max }} hint={hint}>
        <textarea id={id} rows={rows} maxLength={max} className={textareaClass} {...register} />
      </Field>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="mt-1 -ml-2 text-maroon">
            <Sparkles /> Suggestions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-w-[min(92vw,28rem)]">
          {suggestions.map((s) => (
            <DropdownMenuItem key={s} onSelect={() => onPick(s)} className="py-2 whitespace-normal">
              {s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
