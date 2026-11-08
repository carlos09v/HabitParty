"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import type { ThemeMode } from "@/types/ui";

interface ThemeInitializerProps {
  theme?: ThemeMode;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function readCookieTheme(): ThemeMode | undefined {
  if (typeof document === "undefined") return undefined;
  const cookieMatch = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
  return cookieMatch?.[1] as ThemeMode | undefined;
}

export function ThemeInitializer({ theme }: ThemeInitializerProps = {}) {
  const initialized = useRef(false);

  if (!initialized.current) {
    if (typeof document !== "undefined") {
      const cookieTheme = readCookieTheme();
      const isHtmlLight = document.documentElement.classList.contains("light");
      const initialClientTheme: ThemeMode =
        cookieTheme ?? (isHtmlLight ? "light" : "dark");
      useUIStore.setState({ theme: initialClientTheme });
    } else if (theme) {
      useUIStore.setState({ theme });
    }
    initialized.current = true;
  }

  useIsomorphicLayoutEffect(() => {
    if (typeof document !== "undefined") {
      const cookieTheme = readCookieTheme();
      const isHtmlLight = document.documentElement.classList.contains("light");
      const currentTheme: ThemeMode =
        cookieTheme ?? (isHtmlLight ? "light" : "dark");

      if (!document.documentElement.classList.contains(currentTheme)) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(currentTheme);
      }

      if (useUIStore.getState().theme !== currentTheme) {
        useUIStore.setState({ theme: currentTheme });
      }
    }
  });

  return null;
}
