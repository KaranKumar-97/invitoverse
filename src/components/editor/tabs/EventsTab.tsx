"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { customAlphabet } from "nanoid";
import { ChevronDown, ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState, useId } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventIcon } from "@/invitation-kit/events/EventIcon";
import { formatLongDate, formatTimeRange } from "@/lib/invitation/dates";
import {
  EVENT_ICONS,
  type DraftContent,
  type DraftEvent,
  type SectionKey,
} from "@/lib/invitation/schema";
import { isAllowedMapsUrl } from "@/lib/invitation/urls";
import { cn } from "@/lib/utils";
import { EditorCard, Field, inputClass, selectClass, textareaClass } from "../fields";
import { EVENT_ICON_LABELS, EVENT_PRESETS } from "../suggestions";

const eventId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);
const MAX_EVENTS = 15;

export function newEvent(partial: Partial<DraftEvent> = {}): DraftEvent {
  return {
    id: `evt_${eventId()}`,
    name: "",
    icon: "generic",
    date: "",
    startTime: "",
    endTime: "",
    venue: { name: "", address: "", mapsUrl: "" },
    description: "",
    dressCode: "",
    ...partial,
  };
}

type Props = {
  form: UseFormReturn<DraftContent>;
  onPreviewFocus: (s: SectionKey) => void;
  guestCounts?: Record<string, number>;
};

export function EventsTab({ form, onPreviewFocus, guestCounts = {} }: Props) {
  const { control } = form;
  const { fields, append, remove, insert, move } = useFieldArray({
    control,
    name: "events",
    keyName: "fieldKey",
  });
  const [open, setOpen] = useState<string | null>(fields.length === 1 ? fields[0].id : null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Stable id: dnd-kit's auto-generated ids differ between server and client renders.
  const dndId = useId();

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.fieldKey === active.id);
    const to = fields.findIndex((f) => f.fieldKey === over.id);
    if (from >= 0 && to >= 0) move(from, to);
  };

  const add = (preset?: (typeof EVENT_PRESETS)[number]) => {
    const e = newEvent(preset ? { name: preset.name, icon: preset.icon } : {});
    append(e);
    setOpen(e.id);
  };

  const del = (index: number) => {
    const removed = form.getValues(`events.${index}`);
    remove(index);
    toast(`Deleted “${removed.name || "event"}”`, {
      action: { label: "Undo", onClick: () => insert(index, removed) },
    });
  };

  return (
    <div className="space-y-5" onFocusCapture={() => onPreviewFocus("events")}>
      <EditorCard
        title="Events"
        description="Every function guests are invited to. Drag to reorder — the invitation shows them by date."
      >
        {fields.length === 0 && (
          <p className="rounded-md bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
            No events yet. Add your first one below.
          </p>
        )}
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.fieldKey)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="space-y-3">
              {fields.map((f, index) => (
                <EventCard
                  key={f.fieldKey}
                  invitedGuests={guestCounts[f.id] ?? 0}
                  sortId={f.fieldKey}
                  index={index}
                  form={form}
                  open={open === f.id}
                  onToggle={() => setOpen(open === f.id ? null : f.id)}
                  onDelete={() => del(index)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        {fields.length < MAX_EVENTS ? (
          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-sm font-medium">Add an event</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => add(p)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm hover:border-ink"
                >
                  <EventIcon icon={p.icon} className="size-3.5" /> {p.name}
                </button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => add()}
              >
                <Plus /> Custom
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You&apos;ve reached the maximum of {MAX_EVENTS} events.
          </p>
        )}
      </EditorCard>
    </div>
  );
}

function EventCard({
  sortId,
  index,
  form,
  open,
  invitedGuests,
  onToggle,
  onDelete,
}: {
  invitedGuests: number;
  sortId: string;
  index: number;
  form: UseFormReturn<DraftContent>;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { register, control } = form;
  const ev = useWatch({ control, name: `events.${index}` }) as DraftEvent | undefined;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortId });
  if (!ev) return null;
  const p = `events.${index}` as const;
  const mapsWarning =
    ev.venue.mapsUrl && !isAllowedMapsUrl(ev.venue.mapsUrl)
      ? "Paste a Google Maps link (maps.app.goo.gl/… or google.com/maps/…)"
      : null;
  const missing = [
    !ev.name.trim() && "name",
    !ev.date && "date",
    !ev.startTime && "start time",
    !ev.venue.name.trim() && "venue",
  ].filter(Boolean) as string[];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-md border border-line bg-surface",
        isDragging && "relative z-10 shadow-float",
      )}
    >
      <div className="flex items-center gap-2 p-2 pr-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${ev.name || "event"}`}
          className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-maroon-soft text-maroon">
            <EventIcon icon={ev.icon} className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{ev.name || "Untitled event"}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {ev.date ? formatLongDate(ev.date) : "No date"}
              {ev.startTime ? ` · ${formatTimeRange(ev.startTime, ev.endTime || undefined)}` : ""}
              {ev.venue.name ? ` · ${ev.venue.name}` : ""}
            </span>
          </span>
          {missing.length > 0 && (
            <span className="hidden shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning sm:inline">
              Incomplete
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-line p-4">
          {missing.length > 0 && (
            <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
              Add a {missing.join(", ")} before publishing.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <Field label="Event name" htmlFor={`${p}-name`}>
              <Input
                id={`${p}-name`}
                maxLength={60}
                className={inputClass}
                {...register(`${p}.name`)}
              />
            </Field>
            <Field label="Icon" htmlFor={`${p}-icon`}>
              <select id={`${p}-icon`} className={selectClass} {...register(`${p}.icon`)}>
                {EVENT_ICONS.map((i) => (
                  <option key={i} value={i}>
                    {EVENT_ICON_LABELS[i]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <Field label="Date" htmlFor={`${p}-date`}>
                <Input
                  id={`${p}-date`}
                  type="date"
                  className={inputClass}
                  {...register(`${p}.date`)}
                />
              </Field>
            </div>
            <Field label="Starts" htmlFor={`${p}-start`}>
              <Input
                id={`${p}-start`}
                type="time"
                className={inputClass}
                {...register(`${p}.startTime`)}
              />
            </Field>
            <Field label="Ends" htmlFor={`${p}-end`} hint="Optional">
              <Input
                id={`${p}-end`}
                type="time"
                className={inputClass}
                {...register(`${p}.endTime`)}
              />
            </Field>
          </div>
          <Field label="Venue" htmlFor={`${p}-venue`}>
            <Input
              id={`${p}-venue`}
              maxLength={120}
              placeholder="The Lawns, Taj Palace"
              className={inputClass}
              {...register(`${p}.venue.name`)}
            />
          </Field>
          <Field label="Address" htmlFor={`${p}-address`}>
            <textarea
              id={`${p}-address`}
              rows={2}
              maxLength={300}
              className={textareaClass}
              {...register(`${p}.venue.address`)}
            />
          </Field>
          <Field
            label="Google Maps link"
            htmlFor={`${p}-maps`}
            warning={mapsWarning}
            hint="In Google Maps, tap Share → Copy link, then paste it here."
          >
            <div className="flex gap-2">
              <Input
                id={`${p}-maps`}
                type="url"
                inputMode="url"
                maxLength={500}
                placeholder="https://maps.app.goo.gl/…"
                className={inputClass}
                aria-invalid={Boolean(mapsWarning)}
                {...register(`${p}.venue.mapsUrl`)}
              />
              {ev.venue.mapsUrl && !mapsWarning && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 shrink-0"
                  asChild
                >
                  <a
                    href={ev.venue.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open map link"
                  >
                    <ExternalLink />
                  </a>
                </Button>
              )}
            </div>
          </Field>
          <Field label="Description" htmlFor={`${p}-desc`} hint="Optional">
            <textarea
              id={`${p}-desc`}
              rows={2}
              maxLength={500}
              className={textareaClass}
              {...register(`${p}.description`)}
            />
          </Field>
          <Field label="Dress code" htmlFor={`${p}-dress`} hint="Optional">
            <Input
              id={`${p}-dress`}
              maxLength={80}
              placeholder="Shades of yellow"
              className={inputClass}
              {...register(`${p}.dressCode`)}
            />
          </Field>
          <div className="flex items-center justify-end gap-3 border-t border-line pt-3">
            {invitedGuests > 0 && (
              <span className="mr-auto text-xs text-warning">
                {invitedGuests} guest{invitedGuests === 1 ? " is" : "s are"} specifically invited to
                this event
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 /> Delete event
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
