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
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Crosshair, GripVertical, Trash2 } from "lucide-react";
import { useRef, useState, useId } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MediaRef } from "@/lib/invitation/schema";
import type { MediaAssetDTO, MediaRole } from "@/lib/media";
import { cn } from "@/lib/utils";
import {
  deleteMediaAction,
  restoreMediaAction,
} from "@/app/(editor)/dashboard/invitations/[id]/edit/actions";
import { Dropzone } from "./Dropzone";
import { UploadQueue } from "./UploadQueue";
import { useUploader } from "./useUploader";

const isSample = (r: MediaRef) => r.assetId.startsWith("demo-");

export function toRef(dto: MediaAssetDTO): MediaRef {
  return {
    assetId: dto.id,
    url: dto.url,
    width: dto.width ?? 1200,
    height: dto.height ?? 1200,
    alt: "",
  };
}

/** Sortable photo grid for one content array (couple, family or gallery). */
export function PhotoSection({
  invitationId,
  role,
  value,
  max,
  onChange,
  onBytesChange,
}: {
  invitationId: string;
  role: MediaRole;
  value: MediaRef[];
  max: number;
  onChange: (next: MediaRef[], opts?: { added?: boolean }) => void;
  onBytesChange?: (delta: number) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const latestValue = useLatest(value);
  const uploader = useUploader({
    invitationId,
    role,
    onUploaded: (dto) => {
      // Use the freshest list: several uploads can finish within the same render.
      const next = [...latestValue.current, toRef(dto)].slice(0, Math.max(max, 1));
      latestValue.current = next;
      onChange(next, { added: true });
      onBytesChange?.(dto.bytes ?? 0);
    },
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Stable id: dnd-kit's auto-generated ids differ between server and client renders.
  const dndId = useId();

  const remaining =
    max -
    value.length -
    uploader.items.filter((i) => i.status !== "error" && i.status !== "done").length;
  const samples = value.filter(isSample).length;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = value.findIndex((r) => r.assetId === active.id);
    const to = value.findIndex((r) => r.assetId === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(value, from, to));
  };

  const remove = async (index: number) => {
    const ref = value[index];
    onChange(value.filter((_, i) => i !== index));
    if (isSample(ref)) {
      toast("Sample photo removed", {
        action: {
          label: "Undo",
          onClick: () => onChange(insertAt(latestValue.current, index, ref)),
        },
      });
      return;
    }
    const res = await deleteMediaAction({ id: ref.assetId });
    if (!res.ok) return void toast.error(res.error.message);
    toast("Photo removed", {
      action: {
        label: "Undo",
        onClick: async () => {
          const restored = await restoreMediaAction({ id: ref.assetId });
          if (restored.ok) onChange(insertAt(latestValue.current, index, ref));
          else toast.error(restored.error.message);
        },
      },
    });
  };

  return (
    <div className="space-y-3">
      {samples > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-xs text-ink-soft">
          <span>
            Showing {samples} sample photo{samples > 1 ? "s" : ""} from the design.
          </span>
          <button
            type="button"
            className="font-medium text-maroon hover:underline"
            onClick={() => onChange(value.filter((r) => !isSample(r)))}
          >
            Remove samples
          </button>
        </div>
      )}
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={value.map((r) => r.assetId)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {value.map((ref, i) => (
              <Thumb
                key={ref.assetId}
                item={ref}
                onEdit={() => setEditing(i)}
                onRemove={() => void remove(i)}
              />
            ))}
            {remaining > 0 && (
              <li>
                <Dropzone
                  compact
                  accept={uploader.accept}
                  multiple={remaining > 1}
                  label="Add photos"
                  hint=""
                  onFiles={(files) => uploader.add(files.slice(0, remaining))}
                />
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
      <p className="text-xs text-muted-foreground">
        {value.length}/{max} · JPG, PNG, WebP or HEIC up to 15 MB. Drag to reorder.
      </p>
      <UploadQueue items={uploader.items} onRetry={uploader.retry} onDismiss={uploader.dismiss} />
      {editing !== null && value[editing] && (
        <EditPhotoDialog
          item={value[editing]}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            onChange(value.map((r, i) => (i === editing ? next : r)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Thumb({
  item,
  onEdit,
  onRemove,
}: {
  item: MediaRef;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.assetId });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md bg-muted",
        isDragging && "z-10 shadow-float",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={item.alt}
        className="h-full w-full object-cover"
        style={
          item.focal
            ? { objectPosition: `${item.focal.x * 100}% ${item.focal.y * 100}%` }
            : undefined
        }
        loading="lazy"
        draggable={false}
      />
      {isSample(item) && (
        <span className="absolute top-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
          Sample
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Reorder photo"
          className="grid size-8 cursor-grab touch-none place-items-center rounded text-white"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="flex">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit photo details"
            className="grid size-8 place-items-center rounded text-white hover:bg-white/15"
          >
            <Crosshair className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove photo"
            className="grid size-8 place-items-center rounded text-white hover:bg-white/15"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

function EditPhotoDialog({
  item,
  onClose,
  onSave,
}: {
  item: MediaRef;
  onClose: () => void;
  onSave: (next: MediaRef) => void;
}) {
  const [alt, setAlt] = useState(item.alt);
  const [focal, setFocal] = useState(item.focal ?? { x: 0.5, y: 0.5 });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Photo details</DialogTitle>
          <DialogDescription>
            Tap the most important part of the photo — crops keep it in view.
          </DialogDescription>
        </DialogHeader>
        <button
          type="button"
          className="relative block w-full cursor-crosshair overflow-hidden rounded-md"
          aria-label="Set focal point"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setFocal({
              x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
              y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
            });
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt=""
            className="max-h-[50vh] w-full object-contain"
            draggable={false}
          />
          <span
            aria-hidden="true"
            className="absolute size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.4)]"
            style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
          />
        </button>
        <div className="space-y-1.5">
          <Label htmlFor="photo-alt">Description (for screen readers)</Label>
          <Input
            id="photo-alt"
            value={alt}
            maxLength={200}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Priya and Rahul at Lodhi Garden"
            className="h-11"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSave({ ...item, alt: alt.trim(), focal })}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function insertAt<T>(xs: T[], i: number, x: T) {
  const next = [...xs];
  next.splice(Math.min(i, next.length), 0, x);
  return next;
}

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
