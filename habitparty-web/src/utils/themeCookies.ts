import {
  DEFAULT_THEME_ID,
  getThemePolarity,
  isValidThemeId,
  LIGHT_THEME_ID,
  resolveAllowedTheme,
} from "@/constants/themes";
import type { ThemeId } from "@/types/ui";

export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const PREFERENCE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: PREFERENCE_COOKIE_MAX_AGE,
  sameSite: "lax" as const,
};

interface CookieStoreWriter {
  set: (
    name: string,
    value: string,
    options?: typeof PREFERENCE_COOKIE_OPTIONS,
  ) => unknown;
  delete?: (name: string) => unknown;
}

/**
 * Grava os cookies padronizados de tema (`theme`, `sitePolarity`, `lastDarkTheme`/`lastLightTheme`)
 * respeitando a elegibilidade Premium do usuário.
 */
export function writeThemePreferenceCookies(
  cookieStore: CookieStoreWriter,
  candidateTheme: string | null | undefined,
  options: {
    isPremium: boolean;
    /** Quando verdadeiro, preenche também o cookie da polaridade oposta com o tema padrão (ideal no login). */
    resetOppositePolarity?: boolean;
  },
): ThemeId | null {
  if (!candidateTheme || !isValidThemeId(candidateTheme)) {
    return null;
  }

  const resolvedTheme = resolveAllowedTheme(candidateTheme, options.isPremium);
  const polarity = getThemePolarity(resolvedTheme);

  cookieStore.set("theme", resolvedTheme, PREFERENCE_COOKIE_OPTIONS);
  cookieStore.set("sitePolarity", polarity, PREFERENCE_COOKIE_OPTIONS);

  if (options.resetOppositePolarity) {
    cookieStore.set(
      "lastDarkTheme",
      polarity === "dark" ? resolvedTheme : DEFAULT_THEME_ID,
      PREFERENCE_COOKIE_OPTIONS,
    );
    cookieStore.set(
      "lastLightTheme",
      polarity === "light" ? resolvedTheme : LIGHT_THEME_ID,
      PREFERENCE_COOKIE_OPTIONS,
    );
  } else {
    cookieStore.set(
      polarity === "dark" ? "lastDarkTheme" : "lastLightTheme",
      resolvedTheme,
      PREFERENCE_COOKIE_OPTIONS,
    );
  }

  return resolvedTheme;
}

/**
 * Remove os cookies específicos de tema customizado (mantendo `sitePolarity` se já definido).
 */
export function clearCustomThemeCookies(
  cookieStore: Required<Pick<CookieStoreWriter, "delete">>,
) {
  cookieStore.delete("theme");
  cookieStore.delete("lastDarkTheme");
  cookieStore.delete("lastLightTheme");
}
