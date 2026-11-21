import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { LOCAL_MEDIA_PREFIX } from "@/lib/invitation/urls";
import type { MediaKind } from "@/lib/media";
import { imageSize } from "./image-size";
import type { InspectedMedia, MediaStorage } from "./types";

/**
 * Development-only storage: files live in `.data/uploads` and are served by
 * `/api/v1/media/local/[...key]`. Uploads are authorised by a short-lived HMAC token,
 * mirroring Cloudinary's signed direct uploads. Never enabled in production.
 */
export const LOCAL_ROOT = resolve(process.cwd(), ".data", "uploads");
const KEY_RE = /^invitoverse\/[a-z0-9]+\/[a-z0-9]+\/[a-z0-9]{12}\.[a-z0-9]{2,5}$/;

export type LocalUploadClaims = {
  key: string;
  kind: MediaKind;
  mimeType: string;
  maxBytes: number;
  exp: number;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is required for local uploads");
  return s;
}

export function signLocalToken(claims: LocalUploadClaims): string {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(`local-upload.${body}`).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyLocalToken(token: string, now = Date.now()): LocalUploadClaims | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(`local-upload.${body}`).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString()) as LocalUploadClaims;
    if (!KEY_RE.test(claims.key) || claims.exp < now) return null;
    return claims;
  } catch {
    return null;
  }
}

export function isValidLocalKey(key: string) {
  return KEY_RE.test(key);
}

export function localPath(key: string): string {
  if (!KEY_RE.test(key)) throw new Error("Invalid key");
  const p = resolve(LOCAL_ROOT, key);
  if (!p.startsWith(LOCAL_ROOT + "/")) throw new Error("Invalid key");
  return p;
}

export async function writeLocalFile(key: string, data: Uint8Array) {
  const p = localPath(key);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, data, { flag: "wx" }); // never overwrite
}

export function localStorage(): MediaStorage {
  return {
    provider: "LOCAL",

    async createUploadTicket({ key, kind, mimeType, maxBytes }) {
      const token = signLocalToken({
        key,
        kind,
        mimeType,
        maxBytes,
        exp: Date.now() + 15 * 60 * 1000,
      });
      return { provider: "LOCAL", uploadUrl: "/api/v1/media/local-upload", fields: { token }, key };
    },

    async inspect(key, kind): Promise<InspectedMedia | null> {
      let size: number;
      try {
        size = (await stat(localPath(key))).size;
      } catch {
        return null;
      }
      let width: number | null = null;
      let height: number | null = null;
      if (kind === "IMAGE") {
        const head = await readFile(localPath(key));
        const dims = imageSize(head.subarray(0, Math.min(head.length, 256 * 1024)));
        width = dims?.width ?? null;
        height = dims?.height ?? null;
      }
      const ext = key.split(".").pop()!;
      const mime: Record<string, string> = {
        jpg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        avif: "image/avif",
        mp4: "video/mp4",
        mov: "video/quicktime",
        webm: "video/webm",
        mp3: "audio/mpeg",
        m4a: "audio/mp4",
        aac: "audio/aac",
      };
      return {
        bytes: size,
        mimeType: mime[ext] ?? "application/octet-stream",
        url: LOCAL_MEDIA_PREFIX + key,
        posterUrl: null,
        width,
        height,
        durationSec: null,
      };
    },

    async remove(key) {
      await rm(localPath(key), { force: true });
    },
  };
}

export const LOCAL_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
};
