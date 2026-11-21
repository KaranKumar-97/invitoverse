"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MediaRef } from "@/lib/invitation/schema";
import { cn } from "@/lib/utils";
import { Reveal } from "../motion/Reveal";
import { KitImage } from "./KitImage";

const LightboxView = dynamic(() => import("./LightboxView"), { ssr: false });

/**
 * Photo grid with lightbox. Templates control the look via `variant` and class names;
 * the kit owns behaviour (lazy images, keyboard-accessible buttons, lightbox).
 */
export function Gallery({
  images,
  variant = "masonry",
  className,
  itemClassName,
  imageClassName,
}: {
  images: MediaRef[];
  variant?: "masonry" | "grid" | "editorial";
  className?: string;
  itemClassName?: string;
  imageClassName?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;

  const layout =
    variant === "masonry"
      ? "columns-2 gap-3 sm:gap-4 md:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4"
      : variant === "editorial"
        ? "grid grid-cols-2 gap-3 sm:gap-5 [&>*:nth-child(3n+1)]:col-span-2"
        : "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4";

  return (
    <>
      <div className={cn(layout, className)}>
        {images.map((img, i) => (
          <Reveal
            key={img.assetId}
            y={18}
            delay={Math.min((i % 6) * 0.06, 0.4)}
            className="break-inside-avoid"
          >
            <button
              type="button"
              onClick={() => setOpen(i)}
              className={cn("group block w-full overflow-hidden", itemClassName)}
              aria-label={
                img.alt ? `View photo: ${img.alt}` : `View photo ${i + 1} of ${images.length}`
              }
            >
              <KitImage
                media={img}
                sizes="(min-width: 768px) 33vw, 50vw"
                className={cn(
                  "h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]",
                  variant !== "masonry" && "aspect-[4/5] h-full",
                  imageClassName,
                )}
              />
            </button>
          </Reveal>
        ))}
      </div>
      {open !== null && <LightboxView images={images} index={open} onClose={() => setOpen(null)} />}
    </>
  );
}
