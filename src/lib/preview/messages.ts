/**
 * Typed postMessage protocol between the editor and its preview iframe (docs/02-architecture.md §4).
 * Both sides are same-origin; receivers must also check `event.origin` and `event.source`.
 */
import type { DesignConfig, DraftContent, SectionKey } from "@/lib/invitation/schema";

export const PREVIEW_CHANNEL = "vivah-preview/v1";

export type EditorToPreview =
  | { type: "draft:update"; content: DraftContent; design: DesignConfig }
  | { type: "preview:scrollTo"; section: SectionKey }
  | { type: "preview:replayIntro" };

export type PreviewToEditor =
  { type: "preview:ready" } | { type: "preview:error"; message: string };

type Envelope<T> = { channel: typeof PREVIEW_CHANNEL; payload: T };

export function wrap<T>(payload: T): Envelope<T> {
  return { channel: PREVIEW_CHANNEL, payload };
}

function isEnvelope(data: unknown): data is Envelope<{ type: string }> {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { channel?: unknown }).channel === PREVIEW_CHANNEL &&
    typeof (data as { payload?: { type?: unknown } }).payload?.type === "string"
  );
}

const EDITOR_TYPES = new Set(["draft:update", "preview:scrollTo", "preview:replayIntro"]);
const PREVIEW_TYPES = new Set(["preview:ready", "preview:error"]);

export function readEditorMessage(e: MessageEvent): EditorToPreview | null {
  if (e.origin !== window.location.origin || e.source !== window.parent) return null;
  return isEnvelope(e.data) && EDITOR_TYPES.has(e.data.payload.type)
    ? (e.data.payload as EditorToPreview)
    : null;
}

export function readPreviewMessage(
  e: MessageEvent,
  frame: HTMLIFrameElement | null,
): PreviewToEditor | null {
  if (e.origin !== window.location.origin || !frame || e.source !== frame.contentWindow)
    return null;
  return isEnvelope(e.data) && PREVIEW_TYPES.has(e.data.payload.type)
    ? (e.data.payload as PreviewToEditor)
    : null;
}
