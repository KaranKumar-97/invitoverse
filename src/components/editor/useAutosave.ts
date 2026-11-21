"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/lib/action-result";

export type SaveStatus = "saved" | "pending" | "saving" | "offline" | "error" | "conflict";

type Payload = { content?: unknown; design?: unknown };
type SaveFn = (
  input: { id: string; draftUpdatedAt: string } & Payload,
) => Promise<ActionResult<{ draftUpdatedAt: string }>>;

const DEBOUNCE_MS = 1000;
const RETRY_MS = [2000, 5000, 10000, 20000, 30000];

/**
 * Debounced, serialised autosave with optimistic concurrency.
 * - Saves 1s after the last change; never two saves in flight.
 * - Network failures retry with backoff ("offline"); a stale timestamp stops saving ("conflict").
 */
export function useAutosave({
  id,
  initialUpdatedAt,
  save,
  getContent,
  getDesign,
}: {
  id: string;
  initialUpdatedAt: string;
  save: SaveFn;
  getContent: () => unknown;
  getDesign: () => unknown;
}) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const updatedAt = useRef(initialUpdatedAt);
  const dirty = useRef({ content: false, design: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const attempt = useRef(0);
  const stopped = useRef(false);

  const flush = useCallback(async (): Promise<void> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (stopped.current) return;
    if (inFlight.current) {
      await inFlight.current;
      if (dirty.current.content || dirty.current.design) return flush();
      return;
    }
    if (!dirty.current.content && !dirty.current.design) return;

    const payload: Payload = {};
    if (dirty.current.content) payload.content = getContent();
    if (dirty.current.design) payload.design = getDesign();
    dirty.current = { content: false, design: false };
    setStatus("saving");

    const run = (async () => {
      try {
        const res = await save({ id, draftUpdatedAt: updatedAt.current, ...payload });
        if (res.ok) {
          updatedAt.current = res.data.draftUpdatedAt;
          attempt.current = 0;
          setSavedAt(Date.now());
          setMessage(null);
          const more = dirty.current.content || dirty.current.design;
          setStatus(more ? "pending" : "saved");
          if (more) timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
          return;
        }
        if (res.error.code === "CONFLICT") {
          stopped.current = true;
          setStatus("conflict");
          return;
        }
        // Validation and other server errors: keep the changes, surface the message, retry later.
        if (payload.content !== undefined) dirty.current.content = true;
        if (payload.design !== undefined) dirty.current.design = true;
        setMessage(res.error.message);
        setStatus("error");
        if (res.error.code === "UNAUTHENTICATED" || res.error.code === "NOT_FOUND")
          stopped.current = true;
      } catch {
        // Network / server unreachable: retry with backoff.
        if (payload.content !== undefined) dirty.current.content = true;
        if (payload.design !== undefined) dirty.current.design = true;
        setStatus("offline");
        const delay = RETRY_MS[Math.min(attempt.current, RETRY_MS.length - 1)];
        attempt.current += 1;
        timer.current = setTimeout(() => void flush(), delay);
      }
    })();
    inFlight.current = run;
    await run;
    inFlight.current = null;
  }, [id, save, getContent, getDesign]);

  const markDirty = useCallback(
    (kind: "content" | "design") => {
      if (stopped.current) return;
      dirty.current[kind] = true;
      setStatus((s) => (s === "saving" ? s : "pending"));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  /** For operations that change draftUpdatedAt elsewhere (e.g. switching template). */
  const setUpdatedAt = useCallback((iso: string) => {
    updatedAt.current = iso;
  }, []);

  // Warn before leaving with unsaved changes; try to flush when the tab is hidden.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current.content || dirty.current.design || inFlight.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  return {
    status,
    savedAt,
    message,
    markDirty,
    flush,
    setUpdatedAt,
    getUpdatedAt: () => updatedAt.current,
  };
}
