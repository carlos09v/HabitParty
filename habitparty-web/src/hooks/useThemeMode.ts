"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import type { ThemeMode } from "@/types/ui";

export function useThemeMode() {
  const theme = useUIStore((state) => state.theme);
  const hydrated = useUIStore((state) => state.hydrated);
  const setTheme = useUIStore((state) => state.setTheme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const isHtmlLight = document.documentElement.classList.contains("light");
      const currentDomTheme: ThemeMode = isHtmlLight ? "light" : "dark";
      if (useUIStore.getState().theme !== currentDomTheme) {
        useUIStore.setState({ theme: currentDomTheme });
      }
    }
    setMounted(true);
  }, []);

  const resolvedTheme: ThemeMode = mounted || hydrated ? theme : "dark";

  return {
    theme: resolvedTheme,
    isLight: resolvedTheme === "light",
    isDark: resolvedTheme === "dark",
    setTheme,
    toggleTheme,
    mounted,
  };
}
