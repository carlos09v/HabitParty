"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import type { AppLocale, ThemeMode } from "@/types/ui";

interface ThemeInitializerProps {
  theme: ThemeMode;
  locale?: AppLocale;
}

export function ThemeInitializer({
  theme,
  locale = "en",
}: ThemeInitializerProps) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useUIStore.setState({ theme, locale });
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

  useEffect(() => {
    if (useUIStore.getState().locale !== locale) {
      useUIStore.setState({ locale });
    }
  }, [locale]);

  return null;
}
