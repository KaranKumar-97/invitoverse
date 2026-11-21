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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Loader2,
  Lock,
  Palette,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState, useId } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { contrastRatio } from "@/lib/color";
import { defaultDesign } from "@/lib/invitation/defaults";
import { findPalette, type TemplateManifest } from "@/lib/invitation/manifest";
import type { DesignConfig, PaletteKey, SectionKey } from "@/lib/invitation/schema";
import { SECTION_LABELS } from "@/lib/invitation/section-labels";
import { cn } from "@/lib/utils";
import type { TemplateOption } from "@/server/services/templates";
import { deleteMediaAction } from "@/app/(editor)/dashboard/invitations/[id]/edit/actions";
import { EditorCard, Segmented } from "../fields";
import { Dropzone } from "../media/Dropzone";
import { UploadQueue } from "../media/UploadQueue";
import { useUploader } from "../media/useUploader";

const LOCKED_VISIBLE: SectionKey[] = ["hero", "events", "footer"];
const PINNED: SectionKey[] = ["hero", "footer"];

const PALETTE_LABELS: Record<PaletteKey, string> = {
  bg: "Background",
  surface: "Cards",
  text: "Text",
  muted: "Secondary text",
  accent: "Accent",
  accentContrast: "Text on accent",
};

type Props = {
  invitationId: string;
  templateSlug: string;
  templates: TemplateOption[];
  switching: boolean;
  onSwitch: (slug: string) => void;
  manifest: TemplateManifest;
  design: DesignConfig;
  onDesignChange: (next: DesignConfig) => void;
  onBytesChange: (delta: number) => void;
};

export function DesignTab(props: Props) {
  const { manifest, design, onDesignChange } = props;
  const set = (patch: Partial<DesignConfig>) => onDesignChange({ ...design, ...patch });
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="space-y-5">
      <TemplateCard {...props} />
      <PaletteCard manifest={manifest} design={design} set={set} />
      <FontsCard manifest={manifest} design={design} set={set} />
      <BackgroundCard {...props} set={set} />
      <SectionsCard manifest={manifest} design={design} set={set} />
      <AnimationCard manifest={manifest} design={design} set={set} />
      {manifest.options.length > 0 && <OptionsCard manifest={manifest} design={design} set={set} />}

      <div className="flex justify-center pb-2">
        <Button
          type="button"
          variant="ghost"
          className="text-ink-soft"
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw /> Reset design to {manifest.name} defaults
        </Button>
      </div>
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the design?</AlertDialogTitle>
            <AlertDialogDescription>
              Colours, fonts, background, sections and animation go back to {manifest.name}&apos;s
              defaults. Your text and photos stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDesignChange(defaultDesign(manifest));
                toast.success("Design reset");
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type CardProps = {
  manifest: TemplateManifest;
  design: DesignConfig;
  set: (p: Partial<DesignConfig>) => void;
};

function TemplateCard({ templateSlug, templates, switching, onSwitch }: Props) {
  const [picker, setPicker] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const current = templates.find((t) => t.slug === templateSlug);
  const target = templates.find((t) => t.slug === confirm);
  return (
    <EditorCard title="Design">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="grid aspect-[16/10] w-full place-items-center rounded-md sm:w-44"
          style={{ background: current?.swatch.bg ?? "#eee" }}
        >
          <span className="font-display text-lg" style={{ color: current?.swatch.accent }}>
            {current?.name ?? templateSlug}
          </span>
        </div>
        <div className="flex-1">
          <p className="font-medium">{current?.name ?? templateSlug}</p>
          <p className="text-sm text-muted-foreground">{current?.styleLabel}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 rounded-full"
            onClick={() => setPicker(true)}
            disabled={switching}
          >
            {switching ? <Loader2 className="animate-spin" /> : <Palette />} Change design
          </Button>
        </div>
      </div>
      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change design</DialogTitle>
            <DialogDescription>
              Your names, events, photos and messages stay. Design settings reset to the new
              design&apos;s defaults.
            </DialogDescription>
          </DialogHeader>
          <ul className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
            {templates.map((t) => (
              <li key={t.slug}>
                <button
                  type="button"
                  disabled={t.slug === templateSlug}
                  onClick={() => {
                    setPicker(false);
                    setConfirm(t.slug);
                  }}
                  className={cn(
                    "w-full overflow-hidden rounded-md border-2 text-left",
                    t.slug === templateSlug
                      ? "border-maroon"
                      : "border-transparent hover:border-line",
                  )}
                >
                  <div
                    className="relative grid aspect-[16/9] place-items-center"
                    style={{ background: t.swatch.bg }}
                  >
                    <span className="font-display text-lg" style={{ color: t.swatch.accent }}>
                      {t.name}
                    </span>
                    {t.slug === templateSlug && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-maroon px-2 py-0.5 text-xs text-canvas">
                        <Check className="size-3" /> Current
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.styleLabel}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      <AlertDialog open={Boolean(confirm)} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {target?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your content is kept. Colours, fonts and design options reset to {target?.name}&apos;s
              defaults.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) onSwitch(confirm);
                setConfirm(null);
              }}
            >
              Switch design
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EditorCard>
  );
}

function PaletteCard({ manifest, design, set }: CardProps) {
  const [custom, setCustom] = useState(Object.keys(design.paletteOverrides).length > 0);
  const base = findPalette(manifest, design.paletteId).colors;
  const colors = { ...base, ...design.paletteOverrides };
  const ratio = contrastRatio(colors.text, colors.bg);
  return (
    <EditorCard title="Colours">
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Palette">
        {manifest.palettes.map((p) => {
          const active =
            design.paletteId === p.id && Object.keys(design.paletteOverrides).length === 0;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => set({ paletteId: p.id, paletteOverrides: {} })}
              className={cn(
                "flex items-center gap-2 rounded-full border-2 py-1.5 pr-3.5 pl-1.5 text-sm",
                active ? "border-maroon" : "border-line hover:border-ink-soft",
              )}
            >
              <span
                className="flex size-7 overflow-hidden rounded-full ring-1 ring-black/10"
                aria-hidden="true"
              >
                <span className="h-full w-1/2" style={{ background: p.colors.bg }} />
                <span className="h-full w-1/2" style={{ background: p.colors.accent }} />
              </span>
              {p.name}
            </button>
          );
        })}
      </div>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 text-maroon"
          onClick={() => setCustom((c) => !c)}
          aria-expanded={custom}
        >
          {custom ? "Hide custom colours" : "Customize colours"}
        </Button>
        {custom && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {manifest.customizablePaletteKeys.map((k) => (
              <label
                key={k}
                className="flex items-center gap-3 rounded-md border border-line p-2.5 text-sm"
              >
                <input
                  type="color"
                  value={colors[k]}
                  onChange={(e) =>
                    set({
                      paletteOverrides: {
                        ...design.paletteOverrides,
                        [k]: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  className="size-9 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label={PALETTE_LABELS[k]}
                />
                <span>
                  <span className="block font-medium">{PALETTE_LABELS[k]}</span>
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    {colors[k]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        {ratio < 4.5 && (
          <p className="mt-3 flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Text may be hard to read on this background (contrast {ratio.toFixed(1)}:1; aim for
            4.5:1).
          </p>
        )}
      </div>
    </EditorCard>
  );
}

function FontsCard({ manifest, design, set }: CardProps) {
  return (
    <EditorCard
      title="Typography"
      description="The live preview shows each pairing in the real fonts."
    >
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Font pairing">
        {manifest.fontPairs.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={design.fontPairId === f.id}
            onClick={() => set({ fontPairId: f.id })}
            className={cn(
              "rounded-md border-2 p-4 text-left",
              design.fontPairId === f.id ? "border-maroon" : "border-line hover:border-ink-soft",
            )}
          >
            <span className="block font-medium">{f.name}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {f.display} · {f.body}
            </span>
          </button>
        ))}
      </div>
    </EditorCard>
  );
}

function BackgroundCard({
  manifest,
  design,
  set,
  invitationId,
  onBytesChange,
}: Props & { set: CardProps["set"] }) {
  const uploader = useUploader({
    invitationId,
    role: "BACKGROUND",
    onUploaded: (dto) => {
      set({ background: { type: "UPLOAD", assetId: dto.id, url: dto.url } });
      onBytesChange(dto.bytes ?? 0);
    },
  });
  const bg = design.background;
  const removeUpload = async () => {
    if (bg.type !== "UPLOAD") return;
    await deleteMediaAction({ id: bg.assetId });
    set({
      background: manifest.backgrounds[0]
        ? { type: "PRESET", presetId: manifest.backgrounds[0].id }
        : { type: "NONE" },
    });
  };
  return (
    <EditorCard title="Background">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Background">
        {manifest.backgrounds.map((b) => {
          const active = bg.type === "PRESET" && bg.presetId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => set({ background: { type: "PRESET", presetId: b.id } })}
              className={cn(
                "rounded-full border-2 px-4 py-1.5 text-sm",
                active ? "border-maroon" : "border-line hover:border-ink-soft",
              )}
            >
              {b.name}
            </button>
          );
        })}
      </div>
      {manifest.allowCustomBackground &&
        (bg.type === "UPLOAD" ? (
          <div className="flex items-center gap-3 rounded-md border border-line p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bg.url} alt="" className="size-14 rounded object-cover" />
            <span className="flex-1 text-sm">Your background photo</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => void removeUpload()}
            >
              <Trash2 /> Remove
            </Button>
          </div>
        ) : (
          <Dropzone
            accept={uploader.accept}
            label="Use your own background photo"
            hint="It's softly tinted with your colours so text stays readable."
            onFiles={(f) => uploader.add(f.slice(0, 1))}
          />
        ))}
      {!manifest.allowCustomBackground && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="size-3.5" /> This design uses textures only.
        </p>
      )}
      <UploadQueue items={uploader.items} onRetry={uploader.retry} onDismiss={uploader.dismiss} />
    </EditorCard>
  );
}

function SectionsCard({ manifest, design, set }: CardProps) {
  const supported = new Set(manifest.supportedSections);
  const known = design.sections.filter((s) => supported.has(s.key));
  const missing = manifest.supportedSections
    .filter((k) => !known.some((s) => s.key === k))
    .map((key) => ({ key, visible: false }));
  const all = [...known, ...missing];
  const middle = all.filter((s) => !PINNED.includes(s.key));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Stable id: dnd-kit's auto-generated ids differ between server and client renders.
  const dndId = useId();
  const commit = (mid: typeof middle) => {
    const hero = all.find((s) => s.key === "hero") ?? { key: "hero" as const, visible: true };
    const footer = all.find((s) => s.key === "footer") ?? { key: "footer" as const, visible: true };
    set({ sections: [{ ...hero, visible: true }, ...mid, { ...footer, visible: true }] });
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = middle.findIndex((s) => s.key === active.id);
    const to = middle.findIndex((s) => s.key === over.id);
    if (from >= 0 && to >= 0) commit(arrayMove(middle, from, to));
  };
  return (
    <EditorCard
      title="Sections"
      description="Show, hide and reorder. Empty sections (e.g. a gallery with no photos) hide themselves."
    >
      <ul className="space-y-1.5">
        <SectionRow k="hero" visible locked pinned />
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={middle.map((s) => s.key)} strategy={verticalListSortingStrategy}>
            {middle.map((s) => (
              <SortableSectionRow
                key={s.key}
                k={s.key}
                visible={s.visible || LOCKED_VISIBLE.includes(s.key)}
                locked={LOCKED_VISIBLE.includes(s.key)}
                onToggle={() =>
                  commit(middle.map((x) => (x.key === s.key ? { ...x, visible: !x.visible } : x)))
                }
              />
            ))}
          </SortableContext>
        </DndContext>
        <SectionRow k="footer" visible locked pinned />
      </ul>
    </EditorCard>
  );
}

function SectionRow({
  k,
  visible,
  locked,
  pinned,
}: {
  k: SectionKey;
  visible: boolean;
  locked?: boolean;
  pinned?: boolean;
}) {
  return (
    <li className="flex h-11 items-center gap-2 rounded-md border border-line bg-muted/40 px-2 text-sm">
      <span className="grid size-8 place-items-center text-muted-foreground">
        {pinned ? <Lock className="size-3.5" /> : null}
      </span>
      <span className="flex-1">{SECTION_LABELS[k]}</span>
      <span className="pr-2 text-xs text-muted-foreground">
        {locked ? "Always shown" : visible ? "Shown" : "Hidden"}
      </span>
    </li>
  );
}

function SortableSectionRow({
  k,
  visible,
  locked,
  onToggle,
}: {
  k: SectionKey;
  visible: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: k });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-2 text-sm",
        isDragging && "relative z-10 shadow-float",
        !visible && "text-muted-foreground",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${SECTION_LABELS[k]}`}
        className="grid size-8 cursor-grab touch-none place-items-center rounded text-muted-foreground hover:bg-muted"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex-1">{SECTION_LABELS[k]}</span>
      {locked ? (
        <span className="pr-2 text-xs text-muted-foreground">Always shown</span>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-pressed={visible}
          aria-label={`${visible ? "Hide" : "Show"} ${SECTION_LABELS[k]}`}
        >
          {visible ? <Eye /> : <EyeOff />} {visible ? "Shown" : "Hidden"}
        </Button>
      )}
    </li>
  );
}

function AnimationCard({ manifest, design, set }: CardProps) {
  const a = design.animation;
  const setA = (p: Partial<DesignConfig["animation"]>) => set({ animation: { ...a, ...p } });
  const rows: Array<{
    key: keyof DesignConfig["animation"];
    label: string;
    hint: string;
    show: boolean;
  }> = [
    {
      key: "envelope",
      label: "Envelope opening",
      hint: "Guests tap to open before seeing the invitation",
      show: true,
    },
    {
      key: "particles",
      label: "Ambient particles",
      hint:
        manifest.animation.particles === "gold-dust" ? "Drifting gold dust" : "Floating details",
      show: Boolean(manifest.animation.particles),
    },
    {
      key: "autoplayMusic",
      label: "Start music on open",
      hint: "Plays after the guest taps Open",
      show: true,
    },
  ];
  return (
    <EditorCard title="Animation">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Intensity</p>
        <Segmented
          label="Animation intensity"
          value={a.intensity}
          onChange={(v) => setA({ intensity: v })}
          options={[
            { value: "SUBTLE", label: "Subtle" },
            { value: "STANDARD", label: "Standard" },
            { value: "DRAMATIC", label: "Dramatic" },
          ]}
        />
      </div>
      {rows
        .filter((r) => r.show)
        .map((r) => (
          <label key={r.key} className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">{r.label}</span>
              <span className="block text-xs text-muted-foreground">{r.hint}</span>
            </span>
            <Switch checked={Boolean(a[r.key])} onCheckedChange={(v) => setA({ [r.key]: v })} />
          </label>
        ))}
      <p className="text-xs text-muted-foreground">
        Guests who prefer reduced motion always get a gentle fade.
      </p>
    </EditorCard>
  );
}

function OptionsCard({ manifest, design, set }: CardProps) {
  const opts = design.templateOptions;
  return (
    <EditorCard title={`${manifest.name} details`}>
      {manifest.options.map((o) =>
        o.type === "boolean" ? (
          <label key={o.key} className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">{o.label}</span>
            <Switch
              checked={opts[o.key] === undefined ? o.default : Boolean(opts[o.key])}
              onCheckedChange={(v) => set({ templateOptions: { ...opts, [o.key]: v } })}
            />
          </label>
        ) : (
          <div key={o.key} className="space-y-1.5">
            <p className="text-sm font-medium">{o.label}</p>
            <Segmented
              label={o.label}
              value={String(opts[o.key] ?? o.default)}
              onChange={(v) => set({ templateOptions: { ...opts, [o.key]: v } })}
              options={o.choices.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
        ),
      )}
    </EditorCard>
  );
}
