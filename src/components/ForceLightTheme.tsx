"use client";

import { useLayoutEffect } from "react";
import { applyTheme, resolvedTheme } from "@/lib/theme";

/**
 * Invitation pages (live, demo, editor preview) always render light — templates have their own
 * palettes. theme-init.js handles full page loads; this covers client-side navigation.
 */
export function ForceLightTheme() {
  useLayoutEffect(() => {
    applyTheme("light");
    return () => applyTheme(resolvedTheme());
  }, []);
  return null;
}
