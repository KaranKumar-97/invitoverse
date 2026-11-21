/** Editor tab ids — plain module so both the server page and the client editor can use them. */
export const EDITOR_TAB_KEYS = ["details", "events", "media", "design", "settings"] as const;
export type EditorTab = (typeof EDITOR_TAB_KEYS)[number];

export function parseEditorTab(value: string | undefined): EditorTab {
  return (EDITOR_TAB_KEYS as readonly string[]).includes(value ?? "")
    ? (value as EditorTab)
    : "details";
}
