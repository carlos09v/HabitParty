import { create } from "zustand";
import { updateUserExperienceModeAction } from "@/actions/userActions";
import {
  DEFAULT_THEME_ID,
  getThemePolarity,
  isValidThemeId,
  LIGHT_THEME_ID,
  resolveAllowedTheme,
  resolveAllowedThemeForPolarity,
  toDefaultPolarityTheme,
} from "@/constants/themes";
import { useUserStore } from "@/store/userStore";
import type {
  DateFormat,
  ExperienceMode,
  ThemeMode,
  ThemePolarity,
  TimeFormat,
} from "@/types/ui";
import { detectBrowserDateFormat, detectBrowserTimeFormat } from "@/utils/date";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
let latestThemeSyncSeq = 0;

export function setClientCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: Preferências puramente visuais persistidas localmente sem Server Action roundtrip
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

export function getThemePreferenceCookies(): {
  theme: ThemeMode | null;
  sitePolarity: ThemePolarity | null;
  lastDarkTheme: ThemeMode | null;
  lastLightTheme: ThemeMode | null;
} {
  if (typeof document === "undefined" || !document.cookie) {
    return {
      theme: null,
      sitePolarity: null,
      lastDarkTheme: null,
      lastLightTheme: null,
    };
  }

  let rawTheme: string | null = null;
  let rawSitePolarity: string | null = null;
  let rawLastDark: string | null = null;
  let rawLastLight: string | null = null;

  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex);
    if (
      key !== "theme" &&
      key !== "sitePolarity" &&
      key !== "lastDarkTheme" &&
      key !== "lastLightTheme"
    ) {
      continue;
    }

    const rawValue = trimmed.slice(eqIndex + 1);
    let decoded: string;
    try {
      decoded = decodeURIComponent(rawValue);
    } catch {
      decoded = rawValue;
    }

    if (key === "theme") rawTheme = decoded;
    else if (key === "sitePolarity") rawSitePolarity = decoded;
    else if (key === "lastDarkTheme") rawLastDark = decoded;
    else rawLastLight = decoded;
  }

  const theme = isValidThemeId(rawTheme) ? rawTheme : null;
  const sitePolarity: ThemePolarity | null =
    rawSitePolarity === "light" || rawSitePolarity === "dark"
      ? rawSitePolarity
      : null;
  const lastDarkTheme =
    isValidThemeId(rawLastDark) && getThemePolarity(rawLastDark) === "dark"
      ? rawLastDark
      : null;
  const lastLightTheme =
    isValidThemeId(rawLastLight) && getThemePolarity(rawLastLight) === "light"
      ? rawLastLight
      : null;

  return { theme, sitePolarity, lastDarkTheme, lastLightTheme };
}

export function applyThemeToDocument(
  theme: ThemeMode,
  options?: {
    persistCookie?: boolean;
    updateLastPolarityCookie?: boolean;
    allowCustomThemes?: boolean;
  },
) {
  const allowCustomThemes = options?.allowCustomThemes ?? true;
  const effectiveTheme = allowCustomThemes
    ? theme
    : toDefaultPolarityTheme(theme);
  const polarity = getThemePolarity(effectiveTheme);

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(polarity);
    root.setAttribute("data-theme", effectiveTheme);
  }

  if (!allowCustomThemes) {
    if (options?.persistCookie !== false) {
      setClientCookie("sitePolarity", polarity);
    }
    return;
  }

  if (options?.persistCookie !== false) {
    setClientCookie("theme", effectiveTheme);
    setClientCookie("sitePolarity", polarity);
  }
  if (options?.updateLastPolarityCookie !== false) {
    setClientCookie(
      polarity === "light" ? "lastLightTheme" : "lastDarkTheme",
      effectiveTheme,
    );
  }
}

async function syncThemeToBackend(theme: ThemeMode, seq: number) {
  try {
    const res = await fetch("/api/users/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
      keepalive: true,
    });

    if (!res.ok && (res.status === 400 || res.status === 403)) {
      if (seq !== latestThemeSyncSeq) return;
      if (!useUIStore.getState().allowCustomThemes) return;
      const userState = useUserStore.getState();
      const safeTheme = resolveAllowedTheme(theme, userState.is_Premium);
      if (safeTheme !== theme) {
        const safePolarity = getThemePolarity(safeTheme);
        applyThemeToDocument(safeTheme, {
          persistCookie: true,
          updateLastPolarityCookie: true,
          allowCustomThemes: true,
        });
        useUIStore.setState((prev) => ({
          theme: safeTheme,
          lastDarkTheme:
            safePolarity === "dark" ? safeTheme : prev.lastDarkTheme,
          lastLightTheme:
            safePolarity === "light" ? safeTheme : prev.lastLightTheme,
          hydrated: true,
        }));
        userState.updateUserPartial({ theme: safeTheme });
      }
    }
  } catch {
    // Falha transitória de rede não reverte a preferência visual imediata em cookie
  }
}

function scheduleBackgroundThemeSync(theme: ThemeMode) {
  const userState = useUserStore.getState();
  if (!userState.user) return;
  userState.updateUserPartial({ theme });
  latestThemeSyncSeq += 1;
  void syncThemeToBackend(theme, latestThemeSyncSeq);
}

/**
 * Observação: o idioma NÃO vive neste store. A fonte de verdade é o
 * `useLocale()` do next-intl; a troca é feita por `useLocaleSwitcher`
 * (ver `hooks/useLocaleSwitcher.ts` e `store/localeSwitchStore.ts`).
 */
export interface UIState {
  hydrated: boolean;
  allowCustomThemes: boolean;
  theme: ThemeMode;
  lastDarkTheme: ThemeMode;
  lastLightTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  hydrateThemeState: (
    theme: ThemeMode,
    lastDarkTheme?: ThemeMode,
    lastLightTheme?: ThemeMode,
    allowCustomThemes?: boolean,
  ) => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  hydrated: false,
  allowCustomThemes: true,
  theme: DEFAULT_THEME_ID,
  lastDarkTheme: DEFAULT_THEME_ID,
  lastLightTheme: LIGHT_THEME_ID,
  hydrateThemeState: (
    theme,
    lastDarkTheme,
    lastLightTheme,
    allowCustomThemes,
  ) => {
    const current = get();
    const resolvedAllowCustom = allowCustomThemes ?? current.allowCustomThemes;
    const effectiveTheme = resolvedAllowCustom
      ? theme
      : toDefaultPolarityTheme(theme);

    if (!resolvedAllowCustom) {
      set({
        theme: effectiveTheme,
        allowCustomThemes: false,
        hydrated: true,
      });
      return;
    }

    const polarity = getThemePolarity(effectiveTheme);
    const nextLastDark: ThemeMode =
      lastDarkTheme && getThemePolarity(lastDarkTheme) === "dark"
        ? lastDarkTheme
        : polarity === "dark"
          ? effectiveTheme
          : current.lastDarkTheme;
    const nextLastLight: ThemeMode =
      lastLightTheme && getThemePolarity(lastLightTheme) === "light"
        ? lastLightTheme
        : polarity === "light"
          ? effectiveTheme
          : current.lastLightTheme;
    set({
      theme: effectiveTheme,
      lastDarkTheme: nextLastDark,
      lastLightTheme: nextLastLight,
      allowCustomThemes: true,
      hydrated: true,
    });
  },
  setTheme: (theme) => {
    const { allowCustomThemes } = get();
    if (!allowCustomThemes) {
      const fallbackTheme = toDefaultPolarityTheme(theme);
      applyThemeToDocument(fallbackTheme, {
        persistCookie: true,
        updateLastPolarityCookie: false,
        allowCustomThemes: false,
      });
      set({ theme: fallbackTheme, hydrated: true });
      return;
    }

    const userState = useUserStore.getState();
    const resolvedTheme = userState.user
      ? resolveAllowedTheme(theme, userState.is_Premium)
      : theme;
    const polarity = getThemePolarity(resolvedTheme);

    applyThemeToDocument(resolvedTheme, {
      persistCookie: true,
      updateLastPolarityCookie: true,
      allowCustomThemes: true,
    });

    set((state) => ({
      theme: resolvedTheme,
      lastDarkTheme: polarity === "dark" ? resolvedTheme : state.lastDarkTheme,
      lastLightTheme:
        polarity === "light" ? resolvedTheme : state.lastLightTheme,
      hydrated: true,
    }));

    scheduleBackgroundThemeSync(resolvedTheme);
  },
  toggleTheme: () => {
    const state = get();
    const isCurrentlyLight = getThemePolarity(state.theme) === "light";

    if (!state.allowCustomThemes) {
      const nextTheme = isCurrentlyLight ? DEFAULT_THEME_ID : LIGHT_THEME_ID;
      applyThemeToDocument(nextTheme, {
        persistCookie: true,
        updateLastPolarityCookie: false,
        allowCustomThemes: false,
      });
      set({ theme: nextTheme, hydrated: true });
      return;
    }

    const userState = useUserStore.getState();

    let nextTheme: ThemeMode;
    let nextLastDark = state.lastDarkTheme;
    let nextLastLight = state.lastLightTheme;

    if (isCurrentlyLight) {
      nextLastLight = state.theme;
      setClientCookie("lastLightTheme", nextLastLight);

      const candidateDark =
        getThemePolarity(state.lastDarkTheme) === "dark"
          ? state.lastDarkTheme
          : (getThemePreferenceCookies().lastDarkTheme ?? DEFAULT_THEME_ID);
      nextTheme = userState.user
        ? resolveAllowedThemeForPolarity(
            candidateDark,
            "dark",
            userState.is_Premium,
          )
        : isValidThemeId(candidateDark) &&
            getThemePolarity(candidateDark) === "dark"
          ? candidateDark
          : DEFAULT_THEME_ID;
      nextLastDark = nextTheme;
    } else {
      nextLastDark = state.theme;
      setClientCookie("lastDarkTheme", nextLastDark);

      const candidateLight =
        getThemePolarity(state.lastLightTheme) === "light"
          ? state.lastLightTheme
          : (getThemePreferenceCookies().lastLightTheme ?? LIGHT_THEME_ID);
      nextTheme = userState.user
        ? resolveAllowedThemeForPolarity(
            candidateLight,
            "light",
            userState.is_Premium,
          )
        : isValidThemeId(candidateLight) &&
            getThemePolarity(candidateLight) === "light"
          ? candidateLight
          : LIGHT_THEME_ID;
      nextLastLight = nextTheme;
    }

    applyThemeToDocument(nextTheme, {
      persistCookie: true,
      updateLastPolarityCookie: true,
      allowCustomThemes: true,
    });

    set({
      theme: nextTheme,
      lastDarkTheme: nextLastDark,
      lastLightTheme: nextLastLight,
      hydrated: true,
    });

    scheduleBackgroundThemeSync(nextTheme);
  },
  experienceMode: "PRODUCTIVITY",
  setExperienceMode: (experienceMode) => {
    set({ experienceMode });
    useUserStore.getState().updateUserPartial({ experienceMode });
    updateUserExperienceModeAction(experienceMode);
  },
  dateFormat: detectBrowserDateFormat(),
  setDateFormat: (dateFormat) => {
    set({ dateFormat, hydrated: true });
    setClientCookie("dateFormat", dateFormat);
  },
  timeFormat: detectBrowserTimeFormat(),
  setTimeFormat: (timeFormat) => {
    set({ timeFormat, hydrated: true });
    setClientCookie("timeFormat", timeFormat);
  },
}));
