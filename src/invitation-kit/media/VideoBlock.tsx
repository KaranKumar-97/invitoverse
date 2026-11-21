"use client";

import type { VideoRef } from "@/lib/invitation/schema";
import { cn } from "@/lib/utils";

/** Fired when a guest plays a film so background music steps aside. */
export const MEDIA_PLAY_EVENT = "vs:media-play";

export function VideoBlock({ video, className }: { video: VideoRef; className?: string }) {
  const onPlay = () => window.dispatchEvent(new CustomEvent(MEDIA_PLAY_EVENT));
  if (video.type === "YOUTUBE") {
    return (
      <iframe
        className={cn("aspect-video w-full", className)}
        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
        title="Wedding film"
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
        onFocus={onPlay}
      />
    );
  }
  return (
    <video
      className={cn("aspect-video w-full bg-black", className)}
      controls
      playsInline
      preload={video.posterUrl ? "none" : "metadata"}
      poster={video.posterUrl}
      src={video.url}
      onPlay={onPlay}
    />
  );
}
