import { describe, expect, it } from "vitest";
import type { ChecklistItem } from "@/lib/invitation/checklist";
import { adjacentStep, startStep, stepIssues, stepState } from "@/components/editor/steps";
import { parseEditorTab, type EditorStep } from "@/components/editor/tab-keys";

const item = (
  fix: ChecklistItem["fix"],
  ok: boolean,
  severity: ChecklistItem["severity"] = "required",
) => ({ key: `${fix}-${ok}`, label: fix, ok, severity, fix }) as ChecklistItem;

const none = { details: 0, events: 0, media: 0, design: 0, publish: 0 };

describe("editor steps", () => {
  it("counts only failing required items, and puts the link under Publish", () => {
    expect(
      stepIssues([
        item("events", false),
        item("events", false),
        item("details", true),
        item("media", false, "recommended"),
        item("settings", false),
      ]),
    ).toEqual({ ...none, events: 2, publish: 1 });
  });

  it("marks a step done only once visited and free of required problems", () => {
    const visited = new Set<EditorStep>(["details", "events"]);
    const issues = { ...none, events: 1, media: 0 };
    expect(stepState("details", visited, issues)).toBe("done");
    expect(stepState("events", visited, issues)).toBe("attention");
    expect(stepState("media", visited, issues)).toBe("todo");
  });

  it("starts at the first unfinished step, or Publish when all are done", () => {
    expect(startStep(new Set(), none)).toBe("details");
    expect(startStep(new Set(["details"]), none)).toBe("events");
    expect(startStep(new Set(["details", "events"]), { ...none, details: 1 })).toBe("details");
    expect(startStep(new Set(["details", "events", "media", "design"]), none)).toBe("publish");
  });

  it("moves between neighbouring steps", () => {
    expect(adjacentStep("details", 1)).toBe("events");
    expect(adjacentStep("details", -1)).toBeNull();
    expect(adjacentStep("design", 1)).toBe("publish");
    expect(adjacentStep("publish", 1)).toBeNull();
  });

  it("parses tabs from the URL, returning null when none is named", () => {
    expect(parseEditorTab("publish")).toBe("publish");
    expect(parseEditorTab("settings")).toBe("settings");
    expect(parseEditorTab(undefined)).toBeNull();
    expect(parseEditorTab("nope")).toBeNull();
  });
});
