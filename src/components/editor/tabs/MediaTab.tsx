"use client";

import type { LibraryTrack } from "@/lib/invitation/music-library";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { TemplateManifest } from "@/lib/invitation/manifest";
import type { DraftContent, SectionKey } from "@/lib/invitation/schema";
import { formatBytes, INVITATION_QUOTA } from "@/lib/media";
import { EditorCard } from "../fields";
import { MusicSection } from "../media/MusicSection";
import { PhotoSection } from "../media/PhotoSection";
import { VideoSection } from "../media/VideoSection";

type Props = {
  form: UseFormReturn<DraftContent>;
  invitationId: string;
  manifest: TemplateManifest;
  usedBytes: number;
  onBytesChange: (delta: number) => void;
  onPreviewFocus: (s: SectionKey) => void;
  ensureSectionVisible: (s: SectionKey) => void;
  musicLibrary: readonly LibraryTrack[];
};

export function MediaTab({
  form,
  invitationId,
  manifest,
  usedBytes,
  onBytesChange,
  onPreviewFocus,
  ensureSectionVisible,
  musicLibrary,
}: Props) {
  const media = useWatch({ control: form.control, name: "media" });
  const set = <K extends keyof DraftContent["media"]>(key: K, value: DraftContent["media"][K]) =>
    form.setValue(`media.${key}` as const, value as never, { shouldDirty: true });
  const pct = Math.min(100, (usedBytes / INVITATION_QUOTA.totalBytes) * 100);

  return (
    <div className="space-y-5">
      <EditorCard
        title="Couple photos"
        description="Shown in the couple section. Portrait photos work best."
        previewSection="couple"
        onPreviewFocus={onPreviewFocus}
      >
        <PhotoSection
          invitationId={invitationId}
          role="COUPLE"
          max={Math.min(3, manifest.media.couplePhotos.max || 1)}
          value={media.couplePhotos}
          onBytesChange={onBytesChange}
          onChange={(next, o) => {
            set("couplePhotos", next);
            if (o?.added) ensureSectionVisible("couple");
            onPreviewFocus("couple");
          }}
        />
      </EditorCard>

      <EditorCard
        title="Gallery"
        description="Pre-wedding shoots, candids, family moments."
        previewSection="gallery"
        onPreviewFocus={onPreviewFocus}
      >
        <PhotoSection
          invitationId={invitationId}
          role="GALLERY"
          max={Math.min(30, manifest.media.gallery.max)}
          value={media.gallery}
          onBytesChange={onBytesChange}
          onChange={(next, o) => {
            set("gallery", next);
            if (o?.added) ensureSectionVisible("gallery");
            onPreviewFocus("gallery");
          }}
        />
      </EditorCard>

      <EditorCard
        title="Family photos"
        description="Added to the end of the gallery."
        previewSection="gallery"
        onPreviewFocus={onPreviewFocus}
      >
        <PhotoSection
          invitationId={invitationId}
          role="FAMILY"
          max={10}
          value={media.familyPhotos}
          onBytesChange={onBytesChange}
          onChange={(next, o) => {
            set("familyPhotos", next);
            if (o?.added) ensureSectionVisible("gallery");
            onPreviewFocus("gallery");
          }}
        />
      </EditorCard>

      {manifest.media.video && (
        <EditorCard
          title="Video"
          description="A pre-wedding film or a message from the two of you."
          previewSection="video"
          onPreviewFocus={onPreviewFocus}
        >
          <VideoSection
            invitationId={invitationId}
            value={media.video}
            onBytesChange={onBytesChange}
            onChange={(next, o) => {
              set("video", next);
              if (o?.added) ensureSectionVisible("video");
              onPreviewFocus("video");
            }}
          />
        </EditorCard>
      )}

      {manifest.media.music && (
        <EditorCard title="Background music">
          <MusicSection
            invitationId={invitationId}
            value={media.music}
            onBytesChange={onBytesChange}
            onChange={(next) => set("music", next)}
            library={musicLibrary}
          />
        </EditorCard>
      )}

      <div className="rounded-lg bg-surface p-4 shadow-card">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Storage</span>
          <span className="tabular-nums">
            {formatBytes(usedBytes)} of {formatBytes(INVITATION_QUOTA.totalBytes)}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label="Storage used"
        >
          <div className="h-full rounded-full bg-maroon" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
