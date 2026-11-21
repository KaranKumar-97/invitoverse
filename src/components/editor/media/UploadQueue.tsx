"use client";

import { AlertCircle, Check, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/media";
import type { UploadItem } from "./useUploader";

const LABEL: Record<UploadItem["status"], string> = {
  queued: "Waiting…",
  preparing: "Preparing…",
  uploading: "Uploading",
  confirming: "Finishing…",
  done: "Uploaded",
  error: "Failed",
};

export function UploadQueue({
  items,
  onRetry,
  onDismiss,
}: {
  items: UploadItem[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2" aria-live="polite">
      {items.map((it) => (
        <li key={it.id} className="rounded-md border border-line bg-surface px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            {it.status === "error" ? (
              <AlertCircle className="size-4 shrink-0 text-destructive" />
            ) : it.status === "done" ? (
              <Check className="size-4 shrink-0 text-success" />
            ) : (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1 truncate">{it.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {it.status === "uploading" ? `${Math.round(it.progress * 100)}%` : LABEL[it.status]} ·{" "}
              {formatBytes(it.size)}
            </span>
            {it.status === "error" && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Retry ${it.name}`}
                  onClick={() => onRetry(it.id)}
                >
                  <RotateCcw />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Dismiss ${it.name}`}
                  onClick={() => onDismiss(it.id)}
                >
                  <X />
                </Button>
              </>
            )}
          </div>
          {it.status === "error" ? (
            <p className="mt-1 text-xs text-destructive">{it.error}</p>
          ) : (
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(it.progress * 100)}
              aria-label={`Upload progress for ${it.name}`}
            >
              <div
                className="h-full bg-maroon transition-[width] duration-200"
                style={{
                  width: `${Math.max(it.progress, it.status === "queued" ? 0 : 0.03) * 100}%`,
                }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
