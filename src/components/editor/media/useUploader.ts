"use client";

import { useCallback, useRef, useState } from "react";
import {
  MEDIA_RULES,
  ROLE_KIND,
  validateFile,
  type MediaAssetDTO,
  type MediaRole,
  type UploadTicket,
} from "@/lib/media";
import { confirmMediaUploadAction } from "@/app/(editor)/dashboard/invitations/[id]/edit/actions";

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  progress: number; // 0..1
  status: "queued" | "preparing" | "uploading" | "confirming" | "done" | "error";
  error?: string;
  file: File;
};

const CONCURRENCY = 3;
const DOWNSCALE_MAX_EDGE = 3200;
const DOWNSCALE_OVER_BYTES = 4 * 1024 * 1024;
const EXT_MIME: Record<string, string> = {
  heic: "image/heic",
  heif: "image/heif",
  m4a: "audio/x-m4a",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
};

function mimeOf(file: File) {
  if (file.type) return file.type;
  return EXT_MIME[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
}

/** Shrinks very large JPEG/PNG/WebP photos on the device before upload (saves mobile data). */
async function maybeDownscale(file: File): Promise<File> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    typeof createImageBitmap !== "function"
  )
    return file;
  try {
    const bmp = await createImageBitmap(file);
    const edge = Math.max(bmp.width, bmp.height);
    if (edge <= DOWNSCALE_MAX_EDGE && file.size <= DOWNSCALE_OVER_BYTES) {
      bmp.close();
      return file;
    }
    const scale = Math.min(1, DOWNSCALE_MAX_EDGE / edge);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function xhrUpload(
  ticket: UploadTicket,
  file: File,
  onProgress: (p: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(ticket.fields)) form.append(k, v);
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", ticket.uploadUrl);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = "Upload failed. Please try again.";
      try {
        const body = JSON.parse(xhr.responseText);
        message = body?.error?.message ?? message;
      } catch {
        /* non-JSON */
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection and retry."));
    xhr.send(form);
  });
}

/**
 * Sign → direct upload (with progress) → server confirm. Up to 3 files at once; failures are
 * retryable. Never trusts the browser: the server re-inspects each stored file.
 */
export function useUploader({
  invitationId,
  role,
  onUploaded,
}: {
  invitationId: string;
  role: MediaRole;
  onUploaded: (dto: MediaAssetDTO) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const active = useRef(0);
  const queue = useRef<string[]>([]);
  const byId = useRef(new Map<string, UploadItem>());
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  const patch = useCallback((id: string, p: Partial<UploadItem>) => {
    const cur = byId.current.get(id);
    if (!cur) return;
    const next = { ...cur, ...p };
    byId.current.set(id, next);
    setItems((xs) => xs.map((x) => (x.id === id ? next : x)));
  }, []);

  const pump = useCallback(() => {
    while (active.current < CONCURRENCY && queue.current.length) {
      const id = queue.current.shift()!;
      active.current += 1;
      void (async () => {
        const item = byId.current.get(id);
        try {
          if (!item) return;
          const kind = ROLE_KIND[role];
          patch(id, { status: "preparing", error: undefined, progress: 0 });
          const file = kind === "IMAGE" ? await maybeDownscale(item.file) : item.file;
          const mime = mimeOf(file);
          const problem = validateFile(kind, mime, file.size);
          if (problem) throw new Error(problem);
          const res = await fetch("/api/v1/media/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invitationId, role, mimeType: mime, bytes: file.size }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body?.error?.message ?? "Couldn't start the upload.");
          const ticket = body as UploadTicket;
          patch(id, { status: "uploading" });
          await xhrUpload(ticket, file, (p) => patch(id, { progress: p }));
          patch(id, { status: "confirming", progress: 1 });
          const confirmed = await confirmMediaUploadAction({ invitationId, role, key: ticket.key });
          if (!confirmed.ok) throw new Error(confirmed.error.message);
          patch(id, { status: "done" });
          onUploadedRef.current(confirmed.data);
          setTimeout(() => {
            byId.current.delete(id);
            setItems((xs) => xs.filter((x) => x.id !== id));
          }, 1200);
        } catch (e) {
          patch(id, { status: "error", error: e instanceof Error ? e.message : "Upload failed." });
        } finally {
          active.current -= 1;
          pump();
        }
      })();
    }
  }, [invitationId, role, patch]);

  const add = useCallback(
    (files: File[]) => {
      const kind = ROLE_KIND[role];
      const fresh = files.map<UploadItem>((file) => {
        const problem = validateFile(
          kind,
          mimeOf(file),
          Math.min(file.size, kind === "IMAGE" ? 1 : file.size),
        );
        return {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          progress: 0,
          // Large images may still pass after downscaling, so only type problems fail fast here.
          status: problem && !/too large/.test(problem) ? "error" : "queued",
          error: problem && !/too large/.test(problem) ? problem : undefined,
          file,
        };
      });
      for (const f of fresh) byId.current.set(f.id, f);
      setItems((xs) => [...xs, ...fresh]);
      queue.current.push(...fresh.filter((f) => f.status === "queued").map((f) => f.id));
      pump();
    },
    [role, pump],
  );

  const retry = useCallback(
    (id: string) => {
      patch(id, { status: "queued", error: undefined, progress: 0 });
      queue.current.push(id);
      pump();
    },
    [patch, pump],
  );

  const dismiss = useCallback((id: string) => {
    byId.current.delete(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  return {
    items,
    add,
    retry,
    dismiss,
    accept:
      Object.keys(MEDIA_RULES[ROLE_KIND[role]].mimes).join(",") +
      (ROLE_KIND[role] === "IMAGE" ? ",.heic,.heif" : ""),
  };
}
