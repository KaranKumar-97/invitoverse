"use client";

import { ArrowDown, ArrowUp, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  confirmTrackUploadAction,
  moveTrackAction,
  restoreTrackAction,
  retireTrackAction,
  setTemplateDefaultTrackAction,
  setTrackActiveAction,
  signTrackUploadAction,
  updateTrackAction,
} from "@/app/admin/assets/music/actions";
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
import { MEDIA_RULES } from "@/lib/media";

type Licence = "OWNED" | "LICENSED" | "ROYALTY_FREE" | "UNLICENSED";
type Track = {
  id: string;
  title: string;
  artist: string | null;
  mood: string;
  url: string;
  durationSec: number;
  licence: Licence;
  licenceNote: string | null;
  isActive: boolean;
  replacedBy: string | null;
  usedBy: number;
};
type TemplateDefault = {
  slug: string;
  name: string;
  defaultTrackId: string | null;
  manifestDefault: string;
};
type Result = { ok: boolean; error?: { message: string } };

const LICENCES: Array<[Licence, string]> = [
  ["OWNED", "Owned"],
  ["LICENSED", "Licensed"],
  ["ROYALTY_FREE", "Royalty-free"],
  ["UNLICENSED", "Unlicensed"],
];
const selectClass =
  "h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60";
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, success?: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        if (success) toast.success(success);
        after?.();
        router.refresh();
      } else toast.error(res.error?.message ?? "Something went wrong.");
    });
  return { run, pending };
}

export function MusicManager({
  data,
  canEdit,
}: {
  data: { tracks: Track[]; templates: TemplateDefault[] };
  canEdit: boolean;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => audio.current?.pause(), []);
  const toggle = (t: Track) => {
    if (playing === t.id) {
      audio.current?.pause();
      return setPlaying(null);
    }
    audio.current?.pause();
    audio.current = new Audio(t.url);
    audio.current.onended = () => setPlaying(null);
    void audio.current
      .play()
      .then(() => setPlaying(t.id))
      .catch(() => toast.error("Couldn't play this track."));
  };
  const pickable = data.tracks.filter((t) => t.isActive && !t.replacedBy);

  return (
    <div className="mt-8 space-y-8">
      {canEdit && <AddTrack />}
      <section aria-labelledby="tracks-h">
        <h2 id="tracks-h" className="text-lg font-semibold">
          Library ({data.tracks.length})
        </h2>
        <ol className="mt-3 space-y-3">
          {data.tracks.map((t, i) => (
            <TrackRow
              key={`${t.id}:${t.isActive}:${t.replacedBy}:${t.title}:${t.licence}`}
              track={t}
              canEdit={canEdit}
              first={i === 0}
              last={i === data.tracks.length - 1}
              playing={playing === t.id}
              onToggle={() => toggle(t)}
              replacements={pickable.filter((p) => p.id !== t.id)}
            />
          ))}
        </ol>
      </section>
      <TemplateDefaults templates={data.templates} tracks={pickable} canEdit={canEdit} />
    </div>
  );
}

function AddTrack() {
  const id = useId();
  const { run, pending } = useRun();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [mood, setMood] = useState("");
  const [licence, setLicence] = useState<Licence>("UNLICENSED");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const pick = (f: File | null) => {
    setFile(f);
    setDuration(0);
    if (!f) return;
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    const url = URL.createObjectURL(f);
    const a = new Audio(url);
    a.onloadedmetadata = () => {
      setDuration(Number.isFinite(a.duration) ? a.duration : 0);
      URL.revokeObjectURL(url);
    };
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const signed = await signTrackUploadAction({ mimeType: file.type, bytes: file.size });
      if (!signed.ok) return void toast.error(signed.error.message);
      const t = signed.data;
      const form = new FormData();
      for (const [k, v] of Object.entries(t.fields)) form.append(k, v);
      form.append("file", file);
      const up = await fetch(t.uploadUrl, { method: "POST", body: form });
      if (!up.ok) return void toast.error("Upload failed. Please try again.");
      run(
        () =>
          confirmTrackUploadAction({
            key: t.key,
            durationSec: Math.round(duration),
            title,
            artist: artist || null,
            mood,
            licence,
            licenceNote: note || null,
          }),
        "Song added",
        () => {
          formRef.current?.reset();
          setFile(null);
          setTitle("");
          setArtist("");
          setMood("");
          setNote("");
          setLicence("UNLICENSED");
        },
      );
    } finally {
      setUploading(false);
    }
  };

  const busy = pending || uploading;
  return (
    <form
      ref={formRef}
      className="rounded-xl border border-line bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h2 className="text-lg font-semibold">Add a song</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {MEDIA_RULES.AUDIO.label}. Trim it to a 20–60 second clip before uploading.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${id}-file`}>Audio file</Label>
          <Input
            id={`${id}-file`}
            type="file"
            required
            accept={Object.keys(MEDIA_RULES.AUDIO.mimes).join(",")}
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          {duration > 0 && <p className="text-xs text-muted-foreground">{mmss(duration)} long</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-title`}>Title</Label>
          <Input
            id={`${id}-title`}
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-artist`}>Artist (optional)</Label>
          <Input
            id={`${id}-artist`}
            maxLength={80}
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-mood`}>Mood</Label>
          <Input
            id={`${id}-mood`}
            maxLength={60}
            placeholder="Romantic · Bollywood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-licence`}>Licence</Label>
          <select
            id={`${id}-licence`}
            className={`${selectClass} w-full`}
            value={licence}
            onChange={(e) => setLicence(e.target.value as Licence)}
          >
            {LICENCES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${id}-note`}>Licence note (optional)</Label>
          <Input
            id={`${id}-note`}
            maxLength={300}
            placeholder="Where it's from, licence number…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" className="mt-4" disabled={busy || !file || !title.trim()}>
        {uploading ? "Uploading…" : "Add song"}
      </Button>
    </form>
  );
}

function TrackRow({
  track: t,
  canEdit,
  first,
  last,
  playing,
  onToggle,
  replacements,
}: {
  track: Track;
  canEdit: boolean;
  first: boolean;
  last: boolean;
  playing: boolean;
  onToggle: () => void;
  replacements: Track[];
}) {
  const id = useId();
  const { run, pending } = useRun();
  const [dialog, setDialog] = useState<null | "edit" | "retire">(null);
  const [form, setForm] = useState({
    title: t.title,
    artist: t.artist ?? "",
    mood: t.mood,
    licence: t.licence,
    note: t.licenceNote ?? "",
  });
  const [replacement, setReplacement] = useState(replacements[0]?.id ?? "");
  const state = t.replacedBy ? "Retired" : t.isActive ? "Shown" : "Hidden";

  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`}
          onClick={onToggle}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{t.title}</h3>
            <Badge variant={state === "Shown" ? "default" : "secondary"}>{state}</Badge>
            <Badge variant={t.licence === "UNLICENSED" ? "destructive" : "outline"}>
              {LICENCES.find(([v]) => v === t.licence)?.[1]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[t.artist, t.mood, t.durationSec ? mmss(t.durationSec) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-sm text-ink-soft">
            Used by {t.usedBy} invitation{t.usedBy === 1 ? "" : "s"}
            {t.replacedBy ? ` · plays “${t.replacedBy}” instead` : ""}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${t.title} up`}
              disabled={first || pending}
              onClick={() => run(() => moveTrackAction({ id: t.id, direction: "up" }))}
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${t.title} down`}
              disabled={last || pending}
              onClick={() => run(() => moveTrackAction({ id: t.id, direction: "down" }))}
            >
              <ArrowDown />
            </Button>
          </div>
        )}
      </div>
      {canEdit && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`${id}-shown`}
              aria-label={`Show ${t.title} in the picker`}
              checked={t.isActive}
              disabled={pending || Boolean(t.replacedBy)}
              onCheckedChange={(v) =>
                run(
                  () => setTrackActiveAction({ id: t.id, isActive: v }),
                  v ? "Song shown" : "Song hidden",
                )
              }
            />
            <Label htmlFor={`${id}-shown`}>Shown in the picker</Label>
          </div>
          <Button size="sm" variant="outline" onClick={() => setDialog("edit")}>
            Edit details
          </Button>
          {t.replacedBy ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => restoreTrackAction({ id: t.id }), "Song restored")}
            >
              Restore
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={!replacements.length}
              onClick={() => setDialog("retire")}
            >
              Retire
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog === "retire" ? `Retire “${t.title}”?` : `Edit “${t.title}”`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "retire"
                ? `It leaves the picker. The ${t.usedBy} invitation${t.usedBy === 1 ? "" : "s"} using it will play the replacement.`
                : "Changes show in the picker straight away."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialog === "retire" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-rep`}>Replacement</Label>
              <select
                id={`${id}-rep`}
                className={`${selectClass} w-full`}
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              >
                {replacements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid gap-3">
              {(
                [
                  ["title", "Title", 80],
                  ["artist", "Artist", 80],
                  ["mood", "Mood", 60],
                  ["note", "Licence note", 300],
                ] as const
              ).map(([k, label, max]) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={`${id}-${k}`}>{label}</Label>
                  <Input
                    id={`${id}-${k}`}
                    maxLength={max}
                    value={form[k]}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-lic`}>Licence</Label>
                <select
                  id={`${id}-lic`}
                  className={`${selectClass} w-full`}
                  value={form.licence}
                  onChange={(e) => setForm((f) => ({ ...f, licence: e.target.value as Licence }))}
                >
                  {LICENCES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || (dialog === "edit" ? !form.title.trim() : !replacement)}
              onClick={(e) => {
                e.preventDefault();
                if (dialog === "retire")
                  run(
                    () => retireTrackAction({ id: t.id, replacedBy: replacement }),
                    "Song retired",
                    () => setDialog(null),
                  );
                else
                  run(
                    () =>
                      updateTrackAction({
                        id: t.id,
                        title: form.title,
                        artist: form.artist || null,
                        mood: form.mood,
                        licence: form.licence,
                        licenceNote: form.note || null,
                      }),
                    "Details saved",
                    () => setDialog(null),
                  );
              }}
            >
              {dialog === "retire" ? "Retire" : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

function TemplateDefaults({
  templates,
  tracks,
  canEdit,
}: {
  templates: TemplateDefault[];
  tracks: Track[];
  canEdit: boolean;
}) {
  const id = useId();
  const { run, pending } = useRun();
  return (
    <section aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="text-lg font-semibold">
        Default song per template
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        New invitations start with this song; couples can change it.
      </p>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
        {templates.map((t) => (
          <li key={t.slug} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
            <Label htmlFor={`${id}-${t.slug}`} className="flex-1">
              {t.name}
            </Label>
            <select
              id={`${id}-${t.slug}`}
              className={selectClass}
              disabled={!canEdit || pending}
              value={t.defaultTrackId ?? ""}
              onChange={(e) =>
                run(
                  () =>
                    setTemplateDefaultTrackAction({
                      slug: t.slug,
                      trackId: e.target.value || null,
                    }),
                  "Default saved",
                )
              }
            >
              <option value="">
                Built-in (
                {tracks.find((x) => x.id === t.manifestDefault)?.title ?? t.manifestDefault})
              </option>
              {tracks.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}
