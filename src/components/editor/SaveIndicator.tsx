"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "./useAutosave";

function ago(ts: number | null) {
  if (!ts) return "";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

export function SaveIndicator({
  status,
  savedAt,
  message,
}: {
  status: SaveStatus;
  savedAt: number | null;
  message: string | null;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const map: Record<SaveStatus, { icon: React.ReactNode; text: string; tone: string }> = {
    saved: {
      icon: <Check className="size-3.5" />,
      text: savedAt ? `Saved ${ago(savedAt)}` : "All changes saved",
      tone: "text-muted-foreground",
    },
    pending: {
      icon: <span className="size-1.5 rounded-full bg-warning" />,
      text: "Unsaved changes",
      tone: "text-muted-foreground",
    },
    saving: {
      icon: <Loader2 className="size-3.5 animate-spin" />,
      text: "Saving…",
      tone: "text-muted-foreground",
    },
    offline: {
      icon: <CloudOff className="size-3.5" />,
      text: "Offline — will retry",
      tone: "text-warning",
    },
    error: {
      icon: <AlertTriangle className="size-3.5" />,
      text: message ?? "Couldn't save",
      tone: "text-destructive",
    },
    conflict: {
      icon: <AlertTriangle className="size-3.5" />,
      text: "Changed in another tab",
      tone: "text-destructive",
    },
  };
  const s = map[status];
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-1.5 text-xs whitespace-nowrap", s.tone)}
      title={s.text}
    >
      {s.icon}
      <span className="max-w-[16ch] truncate sm:max-w-[28ch]">{s.text}</span>
    </span>
  );
}
