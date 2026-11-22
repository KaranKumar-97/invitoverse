"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  Send,
  Settings,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PublishPanel } from "@/components/share/PublishPanel";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { useMediaQuery } from "@/lib/hooks";
import { buildChecklist } from "@/lib/invitation/checklist";
import { sampleKeyForPath } from "@/lib/invitation/preview";
import type { DesignConfig, DraftContent, SectionKey } from "@/lib/invitation/schema";
import type { EditorToPreview } from "@/lib/preview/messages";
import { cn } from "@/lib/utils";
import type { EditorInvitation } from "@/server/services/invitations";
import type { TemplateOption } from "@/server/services/templates";
import { templateManifests, type TemplateSlug } from "@/templates/registry";
import {
  saveDraftAction,
  switchTemplateAction,
  updateTitleAction,
} from "@/app/(editor)/dashboard/invitations/[id]/edit/actions";
import { PreviewPane, type PreviewHandle } from "./PreviewPane";
import { SaveIndicator } from "./SaveIndicator";
import { adjacentStep, loadVisited, saveVisited, startStep, stepIssues, stepState } from "./steps";
import { EDITOR_STEPS, isEditorStep, type EditorStep, type EditorTab } from "./tab-keys";
import { DesignTab } from "./tabs/DesignTab";
import { DetailsTab } from "./tabs/DetailsTab";
import { EditorCard } from "./fields";
import { EventsTab } from "./tabs/EventsTab";
import { MediaTab } from "./tabs/MediaTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { useAutosave } from "./useAutosave";

const STEP_LABELS: Record<EditorStep, string> = {
  details: "Details",
  events: "Events",
  media: "Photos & music",
  design: "Design",
  publish: "Publish",
};

const SAMPLE_LABELS: Record<string, string> = {
  couple: "names",
  families: "families",
  wedding: "wedding details",
  messages: "messages",
  events: "events",
  media: "photos & music",
};

export function Editor({
  initial,
  templates,
  appUrl,
  initialTab,
  initialUsedBytes,
  guestCounts = {},
}: {
  initial: EditorInvitation;
  templates: TemplateOption[];
  appUrl: string;
  /** `null` → open the first unfinished step. */
  initialTab: EditorTab | null;
  initialUsedBytes: number;
  /** SELECTED guests per event id — warns before deleting an event people are invited to. */
  guestCounts?: Record<string, number>;
}) {
  const form = useForm<DraftContent>({ defaultValues: initial.content });
  const [design, setDesign] = useState<DesignConfig>(initial.design);
  const designRef = useRef(design);
  designRef.current = design;
  const [templateSlug, setTemplateSlug] = useState(initial.templateSlug);
  const manifest =
    templateManifests[templateSlug as TemplateSlug] ?? Object.values(templateManifests)[0];
  const [usedBytes, setUsedBytes] = useState(initialUsedBytes);
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [tab, setTab] = useState<EditorTab>(initialTab ?? "details");
  const [visited, setVisited] = useState<ReadonlySet<EditorStep>>(() => new Set());
  const [switching, setSwitching] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [sampleDismissed, setSampleDismissed] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState(initial.status);
  const [unpublishedChanges, setUnpublishedChanges] = useState(initial.hasUnpublishedChanges);
  useEffect(() => setHydrated(true), []);
  const wide = useMediaQuery("(min-width: 1280px)");
  const phone = !useMediaQuery("(min-width: 640px)");

  const deskPreview = useRef<PreviewHandle>(null);
  const sheetPreview = useRef<PreviewHandle>(null);
  const lastSection = useRef<SectionKey | null>(null);
  const stepNav = useRef<HTMLElement>(null);
  const queued = useRef(false);

  const getContent = useCallback(() => form.getValues(), [form]);
  const getDesign = useCallback(() => designRef.current, []);
  const autosave = useAutosave({
    id: initial.id,
    initialUpdatedAt: initial.draftUpdatedAt,
    save: saveDraftAction,
    getContent,
    getDesign,
  });
  const { markDirty, flush, setUpdatedAt } = autosave;
  useEffect(() => {
    if (autosave.savedAt && status === "PUBLISHED") setUnpublishedChanges(true);
  }, [autosave.savedAt, status]);

  const getLatest = useCallback(
    (): EditorToPreview => ({
      type: "draft:update",
      content: form.getValues(),
      design: designRef.current,
    }),
    [form],
  );
  const post = useCallback((msg: EditorToPreview) => {
    deskPreview.current?.post(msg);
    sheetPreview.current?.post(msg);
  }, []);
  // Coalesce bursts of changes (e.g. field-array ops) into one message per task — no frame wait.
  const pushPreview = useCallback(() => {
    if (queued.current) return;
    queued.current = true;
    queueMicrotask(() => {
      queued.current = false;
      post(getLatest());
    });
  }, [post, getLatest]);

  const updateDesign = useCallback(
    (next: DesignConfig) => {
      designRef.current = next;
      setDesign(next);
      pushPreview();
      markDirty("design");
    },
    [pushPreview, markDirty],
  );

  /** When the first photo/video arrives, make sure its section is switched on. */
  const ensureSectionVisible = useCallback(
    (key: SectionKey) => {
      const cur = designRef.current;
      const hit = cur.sections.find((s) => s.key === key);
      if (hit?.visible) return;
      const sections = hit
        ? cur.sections.map((s) => (s.key === key ? { ...s, visible: true } : s))
        : [...cur.sections.slice(0, -1), { key, visible: true }, ...cur.sections.slice(-1)];
      updateDesign({ ...cur, sections });
    },
    [updateDesign],
  );

  // Every change: clear the matching "sample" marker, update the preview instantly, schedule a save.
  useEffect(() => {
    const sub = form.watch((_value, { name }) => {
      if (name && name !== "sample") {
        const key = sampleKeyForPath(name);
        const sample = form.getValues("sample") ?? [];
        if (key && sample.includes(key))
          form.setValue(
            "sample",
            sample.filter((k) => k !== key),
          );
      }
      pushPreview();
      markDirty("content");
    });
    return () => sub.unsubscribe();
  }, [form, pushPreview, markDirty]);

  useEffect(() => {
    try {
      setSampleDismissed(localStorage.getItem(`vs:sample-dismissed:${initial.id}`) === "1");
    } catch {
      setSampleDismissed(false);
    }
  }, [initial.id]);

  const onPreviewFocus = useCallback(
    (section: SectionKey) => {
      if (lastSection.current === section) return;
      lastSection.current = section;
      post({ type: "preview:scrollTo", section });
    },
    [post],
  );

  const changeTab = (t: EditorTab) => {
    if (t !== tab) void flush();
    setTab(t);
    lastSection.current = null;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url);
    document.getElementById("editor-form")?.scrollTo({ top: 0 });
  };

  // ── Guided steps (soft: Continue never blocks; Publish does) ──
  const savedAt = autosave.savedAt;
  const issues = useMemo(
    () =>
      stepIssues(
        buildChecklist({ content: form.getValues(), design, slug, templateAvailable: true }),
      ),
    // Re-checked after each save, design change and step change — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, design, slug, savedAt, tab],
  );
  const step = isEditorStep(tab) ? tab : null;
  const prevStep = step ? adjacentStep(step, -1) : null;
  const nextStep = step ? adjacentStep(step, 1) : null;

  // Returning owners land on the first unfinished step unless the URL names one.
  useEffect(() => {
    const seen = loadVisited(initial.id);
    setVisited(seen);
    if (!initialTab) changeTab(startStep(seen, issues));
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the current step in view in the phone's scrolling strip.
  useEffect(() => {
    stepNav.current
      ?.querySelector("[aria-current]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);

  useEffect(() => {
    if (!hydrated || !step) return;
    setVisited((prev) => {
      if (prev.has(step)) return prev;
      const next = new Set(prev).add(step);
      saveVisited(initial.id, next);
      return next;
    });
  }, [step, hydrated, initial.id]);

  const onSwitch = async (next: string) => {
    setSwitching(true);
    try {
      await flush();
      const res = await switchTemplateAction({ id: initial.id, templateSlug: next });
      if (!res.ok) return void toast.error(res.error.message);
      setTemplateSlug(res.data.templateSlug);
      setDesign(res.data.design);
      designRef.current = res.data.design;
      setUpdatedAt(res.data.draftUpdatedAt);
      deskPreview.current?.reload();
      sheetPreview.current?.reload();
      toast.success("Design changed");
    } finally {
      setSwitching(false);
    }
  };

  const onTitleChange = async (t: string) => {
    const res = await updateTitleAction({ id: initial.id, title: t });
    if (res.ok) {
      setTitle(res.data.title);
      toast.success("Name updated");
      return true;
    }
    toast.error(res.error.message);
    return false;
  };

  const sample = form.watch("sample") ?? [];
  const showSample =
    !sampleDismissed && sample.length > 0 && (tab === "details" || tab === "events");

  const publishLabel =
    status !== "PUBLISHED" ? "Publish" : unpublishedChanges ? "Publish changes" : "Share";
  const publishButton = (
    <Button className="h-10 rounded-full px-5" onClick={() => changeTab("publish")}>
      <Send /> {publishLabel}
    </Button>
  );
  const names = form.getValues("couple");
  const [n1, n2] =
    names.order === "GROOM_FIRST"
      ? [names.groom.firstName, names.bride.firstName]
      : [names.bride.firstName, names.groom.firstName];
  const shareTitle = `${n1 || "Bride"} & ${n2 || "Groom"}`;

  return (
    <div className="flex h-dvh flex-col bg-canvas" data-ready={hydrated || undefined}>
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-canvas px-2 sm:px-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href="/dashboard/invitations"
            aria-label="Back to invitations"
            onClick={() => {
              void flush();
            }}
          >
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
          <StatusPill
            status={initial.status}
            unpublishedChanges={initial.hasUnpublishedChanges}
            className="hidden sm:inline-flex"
          />
          <span className="hidden sm:inline">
            <SaveIndicator
              status={autosave.status}
              savedAt={autosave.savedAt}
              message={autosave.message}
            />
          </span>
        </div>
        <span className="sm:hidden">
          <SaveIndicator
            status={autosave.status}
            savedAt={autosave.savedAt}
            message={autosave.message}
          />
        </span>
        <Button
          variant="outline"
          className="hidden h-10 rounded-full sm:inline-flex xl:hidden"
          onClick={() => setMobilePreview(true)}
        >
          <Eye /> Preview
        </Button>
        <ThemeToggle className="hidden md:inline-flex" />
        <span className="hidden sm:inline-flex">{publishButton}</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:grid xl:grid-cols-[13rem_minmax(0,1fr)_minmax(400px,44%)]">
        {/* Tabs */}
        <nav
          ref={stepNav}
          aria-label="Editor steps"
          className="shrink-0 border-b border-line xl:border-r xl:border-b-0 xl:p-3"
        >
          <ul className="flex gap-1 overflow-x-auto px-2 py-2 xl:flex-col xl:overflow-visible xl:p-0">
            {EDITOR_STEPS.map((key, i) => {
              const state = stepState(key, visited, issues);
              return (
                <li key={key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => changeTab(key)}
                    aria-current={tab === key ? "step" : undefined}
                    // `relative` keeps the sr-only status inside the scrolling strip.
                    className={cn(
                      "relative flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors xl:h-10 xl:w-full xl:rounded-md",
                      tab === key
                        ? "bg-primary text-primary-foreground xl:bg-surface xl:text-ink xl:shadow-card"
                        : "text-ink-soft hover:bg-muted hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                        tab === key ? "border-current" : "border-line",
                        state === "done" && tab !== key && "border-success text-success",
                      )}
                    >
                      {state === "done" ? <Check className="size-3" /> : i + 1}
                    </span>
                    {STEP_LABELS[key]}
                    {state === "attention" && (
                      <span className="size-1.5 rounded-full bg-destructive" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {state === "done"
                        ? " (done)"
                        : state === "attention"
                          ? " (needs attention)"
                          : ""}
                    </span>
                  </button>
                </li>
              );
            })}
            <li className="shrink-0 xl:mt-2 xl:border-t xl:border-line xl:pt-2">
              <button
                type="button"
                onClick={() => changeTab("settings")}
                aria-current={tab === "settings" ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors xl:h-10 xl:w-full xl:rounded-md",
                  tab === "settings"
                    ? "bg-primary text-primary-foreground xl:bg-surface xl:text-ink xl:shadow-card"
                    : "text-ink-soft hover:bg-muted hover:text-ink",
                )}
              >
                <Settings className="size-4" aria-hidden="true" /> Settings
              </button>
            </li>
            <li className="shrink-0">
              <Link
                href={`/dashboard/invitations/${initial.id}/guests`}
                onClick={() => void flush()}
                className="flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink xl:h-10 xl:w-full xl:rounded-md"
              >
                <UsersRound className="size-4" aria-hidden="true" /> Guests{" "}
                <ArrowUpRight
                  className="ml-auto size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Form */}
        <main
          id="editor-form"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-28 sm:px-6 sm:pb-8 xl:px-8"
        >
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto max-w-2xl space-y-5"
            noValidate
          >
            {step && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Step {EDITOR_STEPS.indexOf(step) + 1} of {EDITOR_STEPS.length}
                </p>
                <div className="mt-2 flex gap-1.5" aria-hidden="true">
                  {EDITOR_STEPS.map((s, i) => (
                    <span
                      key={s}
                      className={cn(
                        "h-1.5 flex-1 rounded-full",
                        i <= EDITOR_STEPS.indexOf(step) ? "bg-primary" : "bg-muted",
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
            {showSample && (
              <div className="flex items-start gap-3 rounded-lg border border-gold/40 bg-[#fbf3e4] p-4 text-sm dark:bg-[#2a2016]">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                <p className="flex-1">
                  We&apos;ve added sample {sample.map((s) => SAMPLE_LABELS[s]).join(", ")} so you
                  can see the design — replace them with yours.
                </p>
                <button
                  type="button"
                  aria-label="Dismiss"
                  className="text-muted-foreground hover:text-ink"
                  onClick={() => {
                    setSampleDismissed(true);
                    try {
                      localStorage.setItem(`vs:sample-dismissed:${initial.id}`, "1");
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            {tab === "details" && <DetailsTab form={form} onPreviewFocus={onPreviewFocus} />}
            {tab === "events" && (
              <EventsTab form={form} onPreviewFocus={onPreviewFocus} guestCounts={guestCounts} />
            )}
            {tab === "media" && (
              <MediaTab
                form={form}
                invitationId={initial.id}
                manifest={manifest}
                usedBytes={usedBytes}
                onBytesChange={(d) => setUsedBytes((b) => Math.max(0, b + d))}
                onPreviewFocus={onPreviewFocus}
                ensureSectionVisible={ensureSectionVisible}
              />
            )}
            {tab === "design" && (
              <DesignTab
                invitationId={initial.id}
                templateSlug={templateSlug}
                templates={templates}
                switching={switching}
                onSwitch={onSwitch}
                manifest={manifest}
                design={design}
                onDesignChange={updateDesign}
                onBytesChange={(d) => setUsedBytes((b) => Math.max(0, b + d))}
              />
            )}
            {tab === "settings" && (
              <SettingsTab
                id={initial.id}
                title={title}
                slug={slug}
                status={status}
                appUrl={appUrl}
                onTitleChange={onTitleChange}
                onSlugChange={setSlug}
                beforeLeave={flush}
              />
            )}
            {tab === "publish" && (
              <EditorCard
                title={status === "PUBLISHED" ? "Share your invitation" : "Publish your invitation"}
                description={
                  status === "PUBLISHED"
                    ? "Guests see the published version. Edits stay private until you publish them."
                    : "Last step: check everything, choose your link and go live."
                }
              >
                <PublishPanel
                  invitationId={initial.id}
                  appUrl={appUrl}
                  coupleTitle={shareTitle}
                  beforeLoad={flush}
                  onFix={changeTab}
                  onStateChange={(st) => {
                    setStatus(st.status);
                    setSlug(st.slug);
                    setUnpublishedChanges(st.hasUnpublishedChanges);
                  }}
                />
              </EditorCard>
            )}
            {step && (
              <div className="hidden items-center justify-between gap-3 pt-2 sm:flex">
                {prevStep ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full"
                    onClick={() => changeTab(prevStep)}
                  >
                    <ArrowLeft /> Back
                  </Button>
                ) : (
                  <span />
                )}
                {nextStep && (
                  <Button
                    type="button"
                    className="h-11 rounded-full px-8"
                    onClick={() => changeTab(nextStep)}
                  >
                    Continue to {STEP_LABELS[nextStep]} <ArrowRight />
                  </Button>
                )}
              </div>
            )}
          </form>
        </main>

        {/* Live preview (wide screens) */}
        {wide && (
          <aside
            aria-label="Live preview"
            className="hidden min-h-0 border-l border-line bg-[#efe9df] xl:block dark:bg-[#0c0a09]"
          >
            <PreviewPane ref={deskPreview} invitationId={initial.id} getLatest={getLatest} />
          </aside>
        )}
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-canvas/95 p-3 backdrop-blur sm:hidden">
        {prevStep && (
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            aria-label={`Back to ${STEP_LABELS[prevStep]}`}
            onClick={() => changeTab(prevStep)}
          >
            <ArrowLeft />
          </Button>
        )}
        <Button
          variant="outline"
          className="h-11 flex-1 rounded-full"
          onClick={() => setMobilePreview(true)}
        >
          <Eye /> Preview
        </Button>
        {nextStep ? (
          <Button className="h-11 flex-1 rounded-full" onClick={() => changeTab(nextStep)}>
            Continue <ArrowRight />
          </Button>
        ) : (
          tab === "settings" && (
            <Button className="h-11 flex-1 rounded-full" onClick={() => changeTab("publish")}>
              <Send /> {publishLabel}
            </Button>
          )
        )}
      </div>

      <Sheet open={mobilePreview && !wide} onOpenChange={setMobilePreview}>
        <SheetContent
          side="right"
          className="w-full max-w-none gap-0 bg-[#efe9df] p-0 sm:max-w-md dark:bg-[#0c0a09]"
        >
          <SheetHeader className="border-b border-line bg-canvas px-4 py-3">
            <SheetTitle>Preview</SheetTitle>
          </SheetHeader>
          {mobilePreview && !wide && (
            <PreviewPane
              ref={sheetPreview}
              invitationId={initial.id}
              getLatest={getLatest}
              compact={phone}
              className="flex-1"
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={autosave.status === "conflict"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This invitation changed somewhere else</AlertDialogTitle>
            <AlertDialogDescription>
              It was edited in another tab or device, so we paused saving here to avoid overwriting
              those changes. Reload to continue with the latest version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.location.reload()}>Reload</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
