"use client";

import { Film, MonitorPlay, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VideoRef } from "@/lib/invitation/schema";
import { MEDIA_RULES, type MediaAssetDTO } from "@/lib/media";
import { deleteMediaAction } from "@/app/(editor)/dashboard/invitations/[id]/edit/actions";
import { Segmented } from "../fields";
import { Dropzone } from "./Dropzone";
import { UploadQueue } from "./UploadQueue";
import { useUploader } from "./useUploader";

export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be")
      return /^[A-Za-z0-9_-]{11}$/.test(u.pathname.slice(1)) ? u.pathname.slice(1) : null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const m = /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/.exec(u.pathname);
      return m ? m[1] : null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function VideoSection({
  invitationId,
  value,
  onChange,
  onBytesChange,
}: {
  invitationId: string;
  value: VideoRef | null;
  onChange: (next: VideoRef | null, opts?: { added?: boolean }) => void;
  onBytesChange?: (delta: number) => void;
}) {
  const [mode, setMode] = useState<"UPLOAD" | "YOUTUBE">(value?.type ?? "UPLOAD");
  const [yt, setYt] = useState(
    value?.type === "YOUTUBE" ? `https://youtu.be/${value.youtubeId}` : "",
  );
  const uploader = useUploader({
    invitationId,
    role: "VIDEO",
    onUploaded: (dto: MediaAssetDTO) => {
      onChange(
        {
          type: "UPLOAD",
          assetId: dto.id,
          url: dto.url,
          ...(dto.posterUrl ? { posterUrl: dto.posterUrl } : {}),
        },
        { added: true },
      );
      onBytesChange?.(dto.bytes ?? 0);
    },
  });

  const remove = async () => {
    if (value?.type === "UPLOAD") {
      const res = await deleteMediaAction({ id: value.assetId });
      if (!res.ok) return void toast.error(res.error.message);
    }
    onChange(null);
    setYt("");
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="overflow-hidden rounded-md border border-line">
          {value.type === "UPLOAD" ? (
            <video
              src={value.url}
              poster={value.posterUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
            />
          ) : (
            <iframe
              className="aspect-video w-full"
              src={`https://www.youtube-nocookie.com/embed/${value.youtubeId}?rel=0`}
              title="Video preview"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="flex items-center justify-between gap-2 p-3 text-sm">
            <span className="inline-flex items-center gap-2 text-ink-soft">
              {value.type === "UPLOAD" ? (
                <Film className="size-4" />
              ) : (
                <MonitorPlay className="size-4" />
              )}
              {value.type === "UPLOAD" ? "Uploaded video" : "YouTube video"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => void remove()}
            >
              <Trash2 /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Segmented
            label="Video source"
            value={mode}
            onChange={setMode}
            options={[
              { value: "UPLOAD", label: "Upload a file" },
              { value: "YOUTUBE", label: "YouTube link" },
            ]}
          />
          {mode === "UPLOAD" ? (
            <Dropzone
              accept={uploader.accept}
              label="Upload your film"
              hint={MEDIA_RULES.VIDEO.label}
              onFiles={(files) => uploader.add(files.slice(0, 1))}
              disabled={uploader.items.some((i) => i.status !== "error")}
            />
          ) : (
            <div className="flex gap-2">
              <Input
                value={yt}
                onChange={(e) => setYt(e.target.value)}
                placeholder="https://youtu.be/…"
                inputMode="url"
                className="h-11"
                aria-label="YouTube link"
              />
              <Button
                type="button"
                className="h-11"
                onClick={() => {
                  const id = parseYouTubeId(yt);
                  if (!id) return void toast.error("That doesn't look like a YouTube link.");
                  onChange({ type: "YOUTUBE", youtubeId: id }, { added: true });
                }}
              >
                Add
              </Button>
            </div>
          )}
        </>
      )}
      <UploadQueue items={uploader.items} onRetry={uploader.retry} onDismiss={uploader.dismiss} />
    </div>
  );
}
