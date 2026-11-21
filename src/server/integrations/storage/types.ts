import type { MediaKind, UploadTicket } from "@/lib/media";

export type InspectedMedia = {
  bytes: number;
  mimeType: string;
  url: string;
  posterUrl: string | null;
  width: number | null;
  height: number | null;
  durationSec: number | null;
};

/** Storage abstraction so Cloudinary can be swapped for S3 later (docs/02-architecture.md §1). */
export interface MediaStorage {
  provider: "CLOUDINARY" | "LOCAL";
  createUploadTicket(input: {
    key: string;
    kind: MediaKind;
    mimeType: string;
    maxBytes: number;
  }): Promise<UploadTicket>;
  /** Reads the stored object's real metadata (never trust the browser). Null if missing. */
  inspect(key: string, kind: MediaKind): Promise<InspectedMedia | null>;
  remove(key: string, kind: MediaKind): Promise<void>;
}
