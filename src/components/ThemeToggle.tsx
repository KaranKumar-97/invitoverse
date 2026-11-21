"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, resolvedTheme, storedTheme, THEME_KEY, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Sun/moon switch. Follows the device setting until the visitor picks; the pick is remembered. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(resolvedTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (storedTheme()) return;
      const t = mq.matches ? "dark" : "light";
      applyTheme(t);
      setTheme(t);
    };
    mq.addEventListener("change", onSystem);
    return () => mq.removeEventListener("change", onSystem);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        const root = document.documentElement;
        root.classList.add("theme-transition");
        window.setTimeout(() => root.classList.remove("theme-transition"), 450);
        applyTheme(next);
        setTheme(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          /* private mode: still switches for this page */
        }
      }}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        "theme-toggle relative inline-flex h-8 w-[60px] shrink-0 items-center justify-between rounded-full border border-line bg-surface px-2 text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden className="theme-toggle-knob" />
      <Sun className="relative z-10 size-3.5" />
      <Moon className="relative z-10 size-3.5" />
    </button>
  );
}
