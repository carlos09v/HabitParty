"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import type { ThemeMode } from "@/types/ui";

interface ThemeInitializerProps {
  theme?: ThemeMode;
}

export function ThemeInitializer({ theme }: ThemeInitializerProps = {}) {
  const initialized = useRef(false);

  if (!initialized.current) {
    if (typeof document !== "undefined") {
      const isHtmlLight = document.documentElement.classList.contains("light");
      useUIStore.setState({ theme: isHtmlLight ? "light" : "dark" });
    } else if (theme) {
      useUIStore.setState({ theme });
    }
    initialized.current = true;
  }

  useEffect(() => {
    if (typeof document !== "undefined") {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
      const cookieTheme = cookieMatch?.[1] as ThemeMode | undefined;
      if (cookieTheme) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(cookieTheme);
      }
      const isHtmlLight = document.documentElement.classList.contains("light");
      const currentTheme: ThemeMode = isHtmlLight ? "light" : "dark";
      if (useUIStore.getState().theme !== currentTheme) {
        useUIStore.setState({ theme: currentTheme });
      }
    }
  }, []);

  return null;
}
