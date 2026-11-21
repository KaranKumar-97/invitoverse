"use client";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import type { MediaRef } from "@/lib/invitation/schema";

/** Loaded on demand the first time a gallery image is tapped. */
export default function LightboxView({
  images,
  index,
  onClose,
}: {
  images: MediaRef[];
  index: number;
  onClose: () => void;
}) {
  return (
    <Lightbox
      open
      index={index}
      close={onClose}
      slides={images.map((img) => ({
        src: img.url,
        width: img.width,
        height: img.height,
        alt: img.alt,
      }))}
      controller={{ closeOnBackdropClick: true }}
      styles={{ container: { backgroundColor: "rgba(10,8,6,0.94)" } }}
    />
  );
}
