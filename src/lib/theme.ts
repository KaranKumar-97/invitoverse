/** Studio light/dark theme (mirrors public/theme-init.js, which runs before first paint). */
export type Theme = "light" | "dark";
export const THEME_KEY = "vs-theme";

export function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolvedTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}
