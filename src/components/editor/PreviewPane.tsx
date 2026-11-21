"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ExternalLink, Monitor, RotateCcw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { readPreviewMessage, wrap, type EditorToPreview } from "@/lib/preview/messages";
import { cn } from "@/lib/utils";

export type PreviewHandle = { post: (msg: EditorToPreview) => void; reload: () => void };

const DEVICES = {
  mobile: { w: 390, h: 844, label: "Phone", icon: Smartphone },
  desktop: { w: 1280, h: 800, label: "Desktop", icon: Monitor },
} as const;
type Device = keyof typeof DEVICES;

/**
 * Live preview: the real template rendered in an iframe at a true device size, scaled to fit.
 * The editor pushes drafts via postMessage; on (re)load the iframe says "ready" and gets the latest.
 */
export const PreviewPane = forwardRef<
  PreviewHandle,
  { invitationId: string; getLatest: () => EditorToPreview; className?: string; compact?: boolean }
>(function PreviewPane({ invitationId, getLatest, className, compact }, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<Device>("mobile");
  const [scale, setScale] = useState(0.6);
  const [reloadKey, setReloadKey] = useState(0);
  const [ready, setReady] = useState(false);

  const post = useCallback((msg: EditorToPreview) => {
    frame.current?.contentWindow?.postMessage(wrap(msg), window.location.origin);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      post,
      reload: () => {
        setReady(false);
        setReloadKey((k) => k + 1);
      },
    }),
    [post],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = readPreviewMessage(e, frame.current);
      if (msg?.type === "preview:ready") {
        setReady(true);
        post(getLatest());
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post, getLatest]);

  // Scale the device frame to fit the available space.
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const d = DEVICES[device];
    const fit = () => {
      const pad = 24;
      const s = Math.min((el.clientWidth - pad) / d.w, (el.clientHeight - pad) / d.h, 1);
      setScale(Math.max(0.2, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device]);

  const d = DEVICES[device];

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex items-center gap-1 px-3 py-2">
        {!compact &&
          (Object.keys(DEVICES) as Device[]).map((k) => {
            const Icon = DEVICES[k].icon;
            return (
              <Tooltip key={k}>
                <TooltipTrigger asChild>
                  <Button
                    variant={device === k ? "secondary" : "ghost"}
                    size="icon-sm"
                    aria-pressed={device === k}
                    aria-label={`${DEVICES[k].label} preview`}
                    onClick={() => setDevice(k)}
                    className={cn(device === k && "shadow-card")}
                  >
                    <Icon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{DEVICES[k].label}</TooltipContent>
              </Tooltip>
            );
          })}
        <span className="ml-2 text-xs text-ink-soft">
          {ready ? "Live preview" : "Loading preview…"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Replay opening"
                onClick={() => post({ type: "preview:replayIntro" })}
              >
                <RotateCcw />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Replay opening</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={`/preview/${invitationId}`}
                  target="_blank"
                  rel="noopener"
                  aria-label="Open preview in a new tab"
                >
                  <ExternalLink />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 overflow-hidden bg-white shadow-[0_30px_80px_-30px_rgba(23,19,15,0.45)]"
          style={{
            width: d.w,
            height: d.h,
            transform: `translate(-50%, -50%) scale(${compact ? 1 : scale})`,
            borderRadius: device === "mobile" ? 36 : 12,
            outline: "8px solid #17130f",
            ...(compact
              ? {
                  width: "100%",
                  height: "100%",
                  transform: "translate(-50%, -50%)",
                  borderRadius: 0,
                  outline: "none",
                }
              : {}),
          }}
        >
          <iframe
            key={reloadKey}
            ref={frame}
            src={`/preview/${invitationId}`}
            title="Invitation preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
});
