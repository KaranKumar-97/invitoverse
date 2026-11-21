import "server-only";
import { createHash } from "node:crypto";
import type { MediaKind } from "@/lib/media";
import type { InspectedMedia, MediaStorage } from "./types";

type Config = { cloudName: string; apiKey: string; apiSecret: string };

/** Cloudinary request signature: sha1 of alphabetically sorted params + secret. */
export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

const resourceType = (kind: MediaKind) => (kind === "IMAGE" ? "image" : "video"); // audio is "video" in Cloudinary

const ALLOWED_FORMATS: Record<MediaKind, string> = {
  IMAGE: "jpg,jpeg,png,webp,avif,heic,heif",
  VIDEO: "mp4,mov,webm",
  AUDIO: "mp3,m4a,aac",
};

export function cloudinaryStorage(cfg: Config): MediaStorage {
  const api = `https://api.cloudinary.com/v1_1/${cfg.cloudName}`;
  const auth = "Basic " + Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString("base64");

  return {
    provider: "CLOUDINARY",

    async createUploadTicket({ key, kind }) {
      const timestamp = Math.floor(Date.now() / 1000);
      // Everything signed is enforced by Cloudinary: the exact public_id and the allowed formats.
      const params = {
        public_id: key,
        timestamp,
        allowed_formats: ALLOWED_FORMATS[kind],
        overwrite: "false",
      };
      const signature = signCloudinaryParams(params, cfg.apiSecret);
      return {
        provider: "CLOUDINARY",
        uploadUrl: `${api}/${resourceType(kind)}/upload`,
        fields: {
          ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
          api_key: cfg.apiKey,
          signature,
        },
        key,
      };
    },

    async inspect(key, kind): Promise<InspectedMedia | null> {
      const res = await fetch(
        `${api}/resources/${resourceType(kind)}/upload/${encodeURIComponent(key).replace(/%2F/g, "/")}`,
        {
          headers: { Authorization: auth },
          cache: "no-store",
        },
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Cloudinary inspect failed: ${res.status}`);
      const r = (await res.json()) as {
        bytes: number;
        format: string;
        secure_url: string;
        width?: number;
        height?: number;
        duration?: number;
        resource_type: string;
      };
      const mime =
        kind === "IMAGE"
          ? `image/${r.format === "jpg" ? "jpeg" : r.format}`
          : kind === "AUDIO"
            ? r.format === "mp3"
              ? "audio/mpeg"
              : "audio/mp4"
            : `video/${r.format === "mov" ? "quicktime" : r.format}`;
      return {
        bytes: r.bytes,
        mimeType: mime,
        url: r.secure_url,
        posterUrl:
          kind === "VIDEO"
            ? r.secure_url.replace("/upload/", "/upload/so_1/").replace(/\.[a-z0-9]+$/i, ".jpg")
            : null,
        width: r.width ?? null,
        height: r.height ?? null,
        durationSec: r.duration ?? null,
      };
    },

    async remove(key, kind) {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = { public_id: key, timestamp, invalidate: "true" };
      const body = new URLSearchParams({
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
        api_key: cfg.apiKey,
        signature: signCloudinaryParams(params, cfg.apiSecret),
      });
      await fetch(`${api}/${resourceType(kind)}/destroy`, { method: "POST", body });
    },
  };
}
