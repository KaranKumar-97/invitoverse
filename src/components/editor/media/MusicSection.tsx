"use client";

import { Music2, Pause, Play, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { currentTrackId, MUSIC_LIBRARY } from "@/lib/invitation/music-library";
import type { MusicRef } from "@/lib/invitation/schema";
import { MEDIA_RULES } from "@/lib/media";
import { cn } from "@/lib/utils";
import { deleteMediaAction } from "@/app/(editor)/dashboard/invitations/[id]/edit/actions";
import { Dropzone } from "./Dropzone";
import { UploadQueue } from "./UploadQueue";
import { useUploader } from "./useUploader";

/** Pick a bundled track, upload your own song, or no music. */
export function MusicSection({
  invitationId,
  value,
  onChange,
  onBytesChange,
}: {
  invitationId: string;
  value: MusicRef | null;
  onChange: (next: MusicRef | null) => void;
  onBytesChange?: (delta: number) => void;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const uploader = useUploader({
    invitationId,
    role: "MUSIC",
    onUploaded: (dto) => {
      onChange({ type: "UPLOAD", assetId: dto.id, url: dto.url, title: "Our song", startAtSec: 0 });
      onBytesChange?.(dto.bytes ?? 0);
      setShowUpload(false);
    },
  });

  useEffect(() => () => audio.current?.pause(), []);

  const toggle = (key: string, src: string) => {
    if (playing === key) {
      audio.current?.pause();
      return setPlaying(null);
    }
    audio.current?.pause();
    audio.current = new Audio(src);
    audio.current.onended = () => setPlaying(null);
    audio.current
      .play()
      .then(() => setPlaying(key))
      .catch(() => toast.error("Couldn't play this track."));
  };

  const selectedTrack = value?.type === "LIBRARY" ? currentTrackId(value.trackId) : null;

  const removeUpload = async () => {
    if (value?.type !== "UPLOAD") return;
    const res = await deleteMediaAction({ id: value.assetId });
    if (!res.ok) return void toast.error(res.error.message);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <ul
        className="divide-y divide-line rounded-md border border-line"
        role="radiogroup"
        aria-label="Background music"
      >
        {MUSIC_LIBRARY.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
            <button
              type="button"
              aria-label={playing === t.id ? `Pause ${t.title}` : `Play ${t.title}`}
              onClick={() => toggle(t.id, t.src)}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-ink hover:bg-maroon-soft"
            >
              {playing === t.id ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={selectedTrack === t.id}
              onClick={() => onChange({ type: "LIBRARY", trackId: t.id, startAtSec: 0 })}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.mood}</span>
              </span>
              <span
                className={cn(
                  "size-4 shrink-0 rounded-full border-2",
                  selectedTrack === t.id
                    ? "border-maroon bg-maroon shadow-[inset_0_0_0_2px_white]"
                    : "border-line",
                )}
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
        {value?.type === "UPLOAD" && (
          <li className="flex items-center gap-3 bg-maroon-soft/40 px-3 py-2.5">
            <button
              type="button"
              aria-label={playing === "upload" ? "Pause your song" : "Play your song"}
              onClick={() => toggle("upload", value.url)}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface"
            >
              {playing === "upload" ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <span className="flex-1 text-sm font-medium">
              <Music2 className="mr-1 inline size-4" /> Your uploaded song
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove your song"
              onClick={() => void removeUpload()}
            >
              <Trash2 />
            </Button>
          </li>
        )}
        <li className="flex items-center gap-3 px-3 py-2.5">
          <span className="size-9 shrink-0" />
          <button
            type="button"
            role="radio"
            aria-checked={value === null}
            onClick={() => onChange(null)}
            className="flex flex-1 items-center justify-between text-left text-sm"
          >
            No music
            <span
              className={cn(
                "size-4 rounded-full border-2",
                value === null
                  ? "border-maroon bg-maroon shadow-[inset_0_0_0_2px_white]"
                  : "border-line",
              )}
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
      {value?.type !== "UPLOAD" &&
        (showUpload ? (
          <Dropzone
            accept={uploader.accept}
            label="Upload your own song"
            hint={MEDIA_RULES.AUDIO.label}
            onFiles={(f) => uploader.add(f.slice(0, 1))}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 text-maroon"
            onClick={() => setShowUpload(true)}
          >
            <Upload /> Upload your own song
          </Button>
        ))}
      <UploadQueue items={uploader.items} onRetry={uploader.retry} onDismiss={uploader.dismiss} />
      <p className="text-xs text-muted-foreground">
        Music starts when a guest opens the invitation. Only upload music you have the right to use.
      </p>
    </div>
  );
}
