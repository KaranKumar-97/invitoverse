/**
 * Guided-editor step logic. Pure: unit-tested in tests/unit/editor-steps.test.ts.
 *
 * Steps are "soft": Continue never blocks. A step is done once the owner has been on it and the
 * publish checklist has no required problem for it; the Publish step still blocks publishing.
 */
import type { ChecklistItem } from "@/lib/invitation/checklist";
import { EDITOR_STEPS, type EditorStep } from "./tab-keys";

export type StepState = "todo" | "done" | "attention";

/** Required checklist problems per step. The link problem belongs to Publish, where it's chosen. */
export function stepIssues(items: ChecklistItem[]): Record<EditorStep, number> {
  const out: Record<EditorStep, number> = {
    details: 0,
    events: 0,
    media: 0,
    design: 0,
    publish: 0,
  };
  for (const i of items) {
    if (i.ok || i.severity !== "required") continue;
    out[i.fix === "settings" ? "publish" : i.fix] += 1;
  }
  return out;
}

export function stepState(
  step: EditorStep,
  visited: ReadonlySet<EditorStep>,
  issues: Record<EditorStep, number>,
): StepState {
  if (!visited.has(step)) return "todo";
  return issues[step] > 0 ? "attention" : "done";
}

/** Where a returning owner lands: the first step not yet done; Publish once everything is. */
export function startStep(
  visited: ReadonlySet<EditorStep>,
  issues: Record<EditorStep, number>,
): EditorStep {
  return EDITOR_STEPS.find((s) => stepState(s, visited, issues) !== "done") ?? "publish";
}

export function adjacentStep(step: EditorStep, dir: 1 | -1): EditorStep | null {
  return EDITOR_STEPS[EDITOR_STEPS.indexOf(step) + dir] ?? null;
}

/** Visited steps are remembered per invitation in localStorage (UI state only). */
const visitedKey = (id: string) => `vs:steps-visited:${id}`;

export function loadVisited(id: string): Set<EditorStep> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(visitedKey(id)) ?? "[]");
    return new Set(
      Array.isArray(raw) ? EDITOR_STEPS.filter((s) => (raw as unknown[]).includes(s)) : [],
    );
  } catch {
    return new Set();
  }
}

export function saveVisited(id: string, visited: ReadonlySet<EditorStep>) {
  try {
    localStorage.setItem(visitedKey(id), JSON.stringify([...visited]));
  } catch {
    /* private mode — the flow still works, it just restarts at the first step */
  }
}
