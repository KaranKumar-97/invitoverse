"use client";

/* eslint-disable @next/next/no-img-element -- admin thumbnails of template art */
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  confirmArtUploadAction,
  resetArtAction,
  signArtUploadAction,
} from "@/app/admin/assets/templates/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Licence = "OWNED" | "LICENSED" | "ROYALTY_FREE" | "UNLICENSED";
type Slot = {
  key: string;
  file: string;
  width: number;
  height: number;
  video: boolean;
  original: string;
  replacement: { url: string; width: number | null; height: number | null; licence: string } | null;
};
type Template = { slug: string; name: string; slots: Slot[] };

const LICENCES: Array<[Licence, string]> = [
  ["OWNED", "Owned"],
  ["LICENSED", "Licensed"],
  ["ROYALTY_FREE", "Royalty-free"],
  ["UNLICENSED", "Unlicensed"],
];

export function TemplateArtManager({
  templates,
  canEdit,
}: {
  templates: Template[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(templates[0]?.slug ?? "");
  const t = templates.find((x) => x.slug === open);
  return (
    <div className="mt-6">
      <nav aria-label="Templates" className="flex flex-wrap gap-2">
        {templates.map((x) => (
          <button
            key={x.slug}
            type="button"
            aria-pressed={x.slug === open}
            onClick={() => setOpen(x.slug)}
            className={`rounded-full border px-3 py-1 text-sm ${x.slug === open ? "border-transparent bg-primary text-primary-foreground" : "border-line bg-surface text-ink-soft"}`}
          >
            {x.name}
            <span className="ml-1 text-xs opacity-70">
              {x.slots.filter((s) => s.replacement).length}/{x.slots.length}
            </span>
          </button>
        ))}
      </nav>
      {t && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.slots.map((s) => (
            <ArtCard
              key={`${t.slug}/${s.file}:${s.replacement?.url ?? ""}`}
              slug={t.slug}
              slot={s}
              canEdit={canEdit}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ArtCard({ slug, slot: s, canEdit }: { slug: string; slot: Slot; canEdit: boolean }) {
  const id = useId();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [licence, setLicence] = useState<Licence>("OWNED");
  const current = s.replacement?.url ?? s.original;

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const signed = await signArtUploadAction({
        slug,
        file: s.file,
        mimeType: file.type,
        bytes: file.size,
      });
      if (!signed.ok) return void toast.error(signed.error.message);
      const form = new FormData();
      for (const [k, v] of Object.entries(signed.data.fields)) form.append(k, v);
      form.append("file", file);
      const up = await fetch(signed.data.uploadUrl, { method: "POST", body: form });
      if (!up.ok) return void toast.error("Upload failed. Please try again.");
      const res = await confirmArtUploadAction({
        slug,
        file: s.file,
        key: signed.data.key,
        licence,
      });
      if (!res.ok) return void toast.error(res.error.message);
      toast.success("Art replaced");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid aspect-[4/3] place-items-center bg-muted">
        {s.video ? (
          <video src={current} muted playsInline className="max-h-full max-w-full" />
        ) : (
          <img
            src={current}
            alt=""
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-mono text-sm">{s.file}</p>
          {s.replacement ? <Badge>Replaced</Badge> : <Badge variant="outline">Original</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {s.key}
          {s.width ? ` · ${s.width}×${s.height}` : ""}
          {s.replacement ? ` · ${s.replacement.licence.toLowerCase().replace("_", "-")}` : ""}
        </p>
        {canEdit && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor={`${id}-lic`} className="sr-only">
              Licence for the new file
            </label>
            <select
              id={`${id}-lic`}
              value={licence}
              onChange={(e) => setLicence(e.target.value as Licence)}
              className="h-8 rounded-md border border-line bg-surface px-2 text-xs"
            >
              {LICENCES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <label
              className={`inline-flex h-8 cursor-pointer items-center rounded-md border border-line px-3 text-xs font-medium ${busy ? "opacity-50" : ""}`}
            >
              {busy ? "Uploading…" : "Replace"}
              <input
                type="file"
                className="sr-only"
                disabled={busy}
                accept={s.video ? "video/mp4" : "image/webp,image/jpeg,image/png"}
                aria-label={`Replace ${s.file}`}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void upload(f);
                }}
              />
            </label>
            {s.replacement && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await resetArtAction({ slug, file: s.file });
                    if (res.ok) {
                      toast.success("Original restored");
                      router.refresh();
                    } else toast.error(res.error.message);
                  })
                }
              >
                Reset to original
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
