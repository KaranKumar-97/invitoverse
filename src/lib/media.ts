/**
 * Upload rules shared by the browser (pre-checks) and the server (authoritative checks).
 * docs/13-security.md §5, docs/03-database.md §3 limits.
 */
export type MediaKind = "IMAGE" | "VIDEO" | "AUDIO";
export type MediaRole = "COUPLE" | "FAMILY" | "GALLERY" | "BACKGROUND" | "VIDEO" | "MUSIC";

export const MEDIA_RULES: Record<
  MediaKind,
  { mimes: Record<string, string>; maxBytes: number; label: string }
> = {
  IMAGE: {
    mimes: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
      "image/heic": "heic",
      "image/heif": "heif",
    },
    maxBytes: 15 * 1024 * 1024,
    label: "JPG, PNG, WebP, AVIF or HEIC up to 15 MB",
  },
  VIDEO: {
    mimes: { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" },
    maxBytes: 100 * 1024 * 1024,
    label: "MP4, MOV or WebM up to 100 MB",
  },
  AUDIO: {
    mimes: { "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac" },
    maxBytes: 10 * 1024 * 1024,
    label: "MP3, M4A or AAC up to 10 MB",
  },
};

export const ROLE_KIND: Record<MediaRole, MediaKind> = {
  COUPLE: "IMAGE",
  FAMILY: "IMAGE",
  GALLERY: "IMAGE",
  BACKGROUND: "IMAGE",
  VIDEO: "VIDEO",
  MUSIC: "AUDIO",
};

/** Per-invitation caps on live (not deleted) assets — generous enough for replace-and-retry. */
export const INVITATION_QUOTA = {
  images: 60,
  videos: 2,
  audio: 2,
  totalBytes: 300 * 1024 * 1024,
};

export type MediaAssetDTO = {
  id: string;
  kind: MediaKind;
  role: MediaRole | null;
  url: string;
  posterUrl: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  durationSec: number | null;
  mimeType: string | null;
  alt: string;
};

export type UploadTicket = {
  provider: "CLOUDINARY" | "LOCAL";
  /** Where the browser POSTs the multipart form. */
  uploadUrl: string;
  /** Extra form fields to send alongside `file`. */
  fields: Record<string, string>;
  /** Storage key (Cloudinary public_id or local path) to confirm after upload. */
  key: string;
};

export function validateFile(kind: MediaKind, mimeType: string, bytes: number): string | null {
  const rule = MEDIA_RULES[kind];
  if (!rule.mimes[mimeType]) return `Unsupported file type. Use ${rule.label}.`;
  if (bytes <= 0) return "This file is empty.";
  if (bytes > rule.maxBytes) return `This file is too large. Use ${rule.label}.`;
  return null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
