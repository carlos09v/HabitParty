"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import type { ThemeMode } from "@/types/ui";

interface ThemeInitializerProps {
  theme: ThemeMode;
}

export function ThemeInitializer({ theme }: ThemeInitializerProps) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useUIStore.setState({ theme });
    initialized.current = true;
  }

  useEffect(() => {
    if (typeof document !== "undefined") {
      const isHtmlLight = document.documentElement.classList.contains("light");
      const currentTheme: ThemeMode = isHtmlLight ? "light" : "dark";
      if (useUIStore.getState().theme !== currentTheme) {
        useUIStore.setState({ theme: currentTheme });
      }
    }
  }, []);

  return null;
}
