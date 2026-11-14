"use client";

import { useEffect, useLayoutEffect } from "react";
import {
  DEFAULT_THEME_ID,
  getDefaultThemeForPolarity,
  getThemePolarity,
  isValidThemeId,
  LIGHT_THEME_ID,
  toDefaultPolarityTheme,
} from "@/constants/themes";
import {
  applyThemeToDocument,
  getThemePreferenceCookies,
  useUIStore,
} from "@/store/uiStore";
import type { ThemeMode, ThemePolarity } from "@/types/ui";

interface ThemeInitializerProps {
  theme?: ThemeMode;
  allowCustomThemes?: boolean;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function resolveDomOrCookieState(
  fallbackTheme: ThemeMode | undefined,
  allowCustomThemes: boolean,
) {
  if (typeof document === "undefined") {
    const baseTheme = fallbackTheme ?? DEFAULT_THEME_ID;
    return {
      theme: allowCustomThemes ? baseTheme : toDefaultPolarityTheme(baseTheme),
      lastDarkTheme: undefined,
      lastLightTheme: undefined,
    };
  }

  const {
    theme: cookieTheme,
    sitePolarity,
    lastDarkTheme,
    lastLightTheme,
  } = getThemePreferenceCookies();

  if (!allowCustomThemes) {
    const resolvedPolarity: ThemePolarity =
      sitePolarity ??
      (cookieTheme
        ? getThemePolarity(cookieTheme)
        : document.documentElement.classList.contains("light")
          ? "light"
          : getThemePolarity(fallbackTheme ?? DEFAULT_THEME_ID));

    return {
      theme: getDefaultThemeForPolarity(resolvedPolarity),
      lastDarkTheme: undefined,
      lastLightTheme: undefined,
    };
  }

  if (cookieTheme) {
    return {
      theme: cookieTheme,
      lastDarkTheme: lastDarkTheme ?? undefined,
      lastLightTheme: lastLightTheme ?? undefined,
    };
  }

  const dataTheme = document.documentElement.getAttribute("data-theme");
  if (isValidThemeId(dataTheme)) {
    return {
      theme: dataTheme,
      lastDarkTheme: lastDarkTheme ?? undefined,
      lastLightTheme: lastLightTheme ?? undefined,
    };
  }

  if (sitePolarity) {
    return {
      theme: getDefaultThemeForPolarity(sitePolarity),
      lastDarkTheme: lastDarkTheme ?? undefined,
      lastLightTheme: lastLightTheme ?? undefined,
    };
  }

  return {
    theme: document.documentElement.classList.contains("light")
      ? LIGHT_THEME_ID
      : (fallbackTheme ?? DEFAULT_THEME_ID),
    lastDarkTheme: lastDarkTheme ?? undefined,
    lastLightTheme: lastLightTheme ?? undefined,
  };
}

export function ThemeInitializer({
  theme,
  allowCustomThemes = true,
}: ThemeInitializerProps = {}) {
  useIsomorphicLayoutEffect(() => {
    const resolved = resolveDomOrCookieState(theme, allowCustomThemes);
    applyThemeToDocument(resolved.theme, {
      persistCookie: false,
      updateLastPolarityCookie: false,
      allowCustomThemes,
    });

    const storeState = useUIStore.getState();
    if (
      storeState.theme !== resolved.theme ||
      storeState.allowCustomThemes !== allowCustomThemes ||
      !storeState.hydrated
    ) {
      storeState.hydrateThemeState(
        resolved.theme,
        resolved.lastDarkTheme,
        resolved.lastLightTheme,
        allowCustomThemes,
      );
    }
  }, [theme, allowCustomThemes]);

  return null;
}
