/**
 * Editor steps and tabs — plain module so both the server page and the client editor can use them.
 * The editor is a guided flow (docs/08 §5): the steps run in order and end with Publish, where the
 * link is chosen. Settings is not a step; it sits beside the flow.
 */
export const EDITOR_STEPS = ["details", "events", "media", "design", "publish"] as const;
export type EditorStep = (typeof EDITOR_STEPS)[number];

export const EDITOR_TAB_KEYS = [...EDITOR_STEPS, "settings"] as const;
export type EditorTab = (typeof EDITOR_TAB_KEYS)[number];

/** `null` when the URL names no tab — the editor then opens the first unfinished step. */
export function parseEditorTab(value: string | undefined): EditorTab | null {
  return (EDITOR_TAB_KEYS as readonly string[]).includes(value ?? "") ? (value as EditorTab) : null;
}

export const isEditorStep = (t: EditorTab): t is EditorStep => t !== "settings";
