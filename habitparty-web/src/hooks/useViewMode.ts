"use client";

import { useEffect, useState } from "react";

export type ViewMode = "card" | "list" | "grid";

export function useViewMode(
  key: string,
  defaultMode: ViewMode = "card",
): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`habitparty_view_mode_${key}`);
      if (stored === "card" || stored === "list" || stored === "grid") {
        setViewModeState(stored as ViewMode);
      }
    } catch {
      // localStorage may fail in restricted environments (e.g. incognito)
    }
  }, [key]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(`habitparty_view_mode_${key}`, mode);
    } catch {
      // ignore
    }
  };

  return [viewMode, setViewMode];
}
