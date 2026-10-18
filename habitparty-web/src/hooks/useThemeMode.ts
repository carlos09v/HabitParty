"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import type { ThemeMode } from "@/types/ui";

export function useThemeMode() {
  const theme = useUIStore((state) => state.theme);
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

  return {
    theme: mounted ? theme : ("dark" as ThemeMode),
    isLight: mounted ? theme === "light" : false,
    isDark: mounted ? theme === "dark" : true,
    setTheme,
    toggleTheme,
    mounted,
  };
}
