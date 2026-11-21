"use client";

import type { MediaRef } from "@/lib/invitation/schema";
import { cn } from "@/lib/utils";

const WIDTHS = [360, 540, 720, 1080, 1440, 2048];

/** Cloudinary delivery URL with format/quality/width transforms (docs/11-design-system.md §5). */
export function cloudinaryUrl(url: string, width: number): string {
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

function srcSetFor(url: string) {
  if (!url.includes("res.cloudinary.com")) return undefined;
  return WIDTHS.map((w) => `${cloudinaryUrl(url, w)} ${w}w`).join(", ");
}

/**
 * Lightweight responsive image for invitation media. Plain <img> keeps templates independent
 * from next/image config; Cloudinary handles resizing.
 */
export function KitImage({
  media,
  sizes = "100vw",
  className,
  priority = false,
  alt,
}: {
  media: Pick<MediaRef, "url" | "width" | "height" | "alt" | "focal">;
  sizes?: string;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.url.includes("res.cloudinary.com") ? cloudinaryUrl(media.url, 1080) : media.url}
      srcSet={srcSetFor(media.url)}
      sizes={sizes}
      width={media.width}
      height={media.height}
      alt={alt ?? media.alt ?? ""}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
      className={cn("object-cover", className)}
      style={
        media.focal
          ? { objectPosition: `${media.focal.x * 100}% ${media.focal.y * 100}%` }
          : undefined
      }
    />
  );
}
