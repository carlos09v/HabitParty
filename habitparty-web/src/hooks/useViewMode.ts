"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import type { ViewMode } from "@/types/ui";

export type { ViewMode };

export function useViewMode(
  key: string,
  defaultMode: ViewMode = "card",
): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`habitparty_view_mode_${key}`);
      if (stored === "list") {
        setViewModeState("list");
      } else if (stored === "card" || stored === "grid") {
        setViewModeState("card");
        if (stored === "grid") {
          localStorage.setItem(`habitparty_view_mode_${key}`, "card");
        }
      }
    } catch {
      // localStorage may fail in restricted environments (e.g. incognito)
    }
  }, [key]);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      const normalized: ViewMode = mode === "list" ? "list" : "card";
      startTransition(() => {
        setViewModeState(normalized);
      });
      try {
        localStorage.setItem(`habitparty_view_mode_${key}`, normalized);
      } catch {
        // ignore
      }
    },
    [key],
  );

  return [viewMode, setViewMode];
}
