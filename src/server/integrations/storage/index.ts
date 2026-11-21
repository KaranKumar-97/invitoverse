import "server-only";
import { cloudinaryStorage } from "./cloudinary";
import { localStorage } from "./local";
import type { MediaStorage } from "./types";

/**
 * Cloudinary when configured; otherwise local disk storage in development.
 * Set MEDIA_PROVIDER=cloudinary|local to force one.
 */
export function getMediaStorage(): MediaStorage {
  const forced = process.env.MEDIA_PROVIDER;
  const {
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret,
  } = process.env;
  const hasCloudinary = Boolean(cloudName && apiKey && apiSecret);
  if (forced === "cloudinary" || (forced !== "local" && hasCloudinary)) {
    if (!hasCloudinary)
      throw new Error("MEDIA_PROVIDER=cloudinary but Cloudinary credentials are missing");
    return cloudinaryStorage({ cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret! });
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Media uploads need Cloudinary in production (set CLOUDINARY_* env vars).");
  }
  return localStorage();
}

/**
 * Storage for an existing asset's provider (cleanup jobs). Returns null when that provider
 * isn't available here — e.g. LOCAL rows in production — so callers can skip them.
 */
export function storageFor(provider: "CLOUDINARY" | "LOCAL" | "S3"): MediaStorage | null {
  const {
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret,
  } = process.env;
  if (provider === "CLOUDINARY")
    return cloudName && apiKey && apiSecret
      ? cloudinaryStorage({ cloudName, apiKey, apiSecret })
      : null;
  if (provider === "LOCAL") return process.env.NODE_ENV === "production" ? null : localStorage();
  return null;
}

export type { MediaStorage } from "./types";
