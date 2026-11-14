"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_THEME_ID,
  getThemePolarity,
  isValidThemeId,
  LIGHT_THEME_ID,
} from "@/constants/themes";
import { getThemePreferenceCookies, useUIStore } from "@/store/uiStore";
import type { ThemeMode } from "@/types/ui";

export function useThemeMode() {
  const theme = useUIStore((state) => state.theme);
  const lastDarkTheme = useUIStore((state) => state.lastDarkTheme);
  const lastLightTheme = useUIStore((state) => state.lastLightTheme);
  const hydrated = useUIStore((state) => state.hydrated);
  const setTheme = useUIStore((state) => state.setTheme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const state = useUIStore.getState();
    if (!state.hydrated && typeof document !== "undefined") {
      const dataTheme = document.documentElement.getAttribute("data-theme");
      const isHtmlLight = document.documentElement.classList.contains("light");
      const {
        theme: cookieTheme,
        lastDarkTheme: cookieLastDark,
        lastLightTheme: cookieLastLight,
      } = getThemePreferenceCookies();

      const currentDomTheme: ThemeMode = isValidThemeId(dataTheme)
        ? dataTheme
        : (cookieTheme ?? (isHtmlLight ? LIGHT_THEME_ID : DEFAULT_THEME_ID));

      const resolvedLastDark: ThemeMode =
        cookieLastDark ??
        (getThemePolarity(currentDomTheme) === "dark"
          ? currentDomTheme
          : state.lastDarkTheme);
      const resolvedLastLight: ThemeMode =
        cookieLastLight ??
        (getThemePolarity(currentDomTheme) === "light"
          ? currentDomTheme
          : state.lastLightTheme);

      useUIStore.setState({
        theme: currentDomTheme,
        lastDarkTheme: resolvedLastDark,
        lastLightTheme: resolvedLastLight,
        hydrated: true,
      });
    }
    setMounted(true);
  }, []);

  const resolvedTheme: ThemeMode =
    mounted || hydrated ? theme : DEFAULT_THEME_ID;
  const polarity = getThemePolarity(resolvedTheme);

  return {
    theme: resolvedTheme,
    lastDarkTheme,
    lastLightTheme,
    isLight: polarity === "light",
    isDark: polarity === "dark",
    setTheme,
    toggleTheme,
    mounted,
  };
}
