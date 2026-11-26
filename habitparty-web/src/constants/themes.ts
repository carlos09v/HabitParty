import type { ThemeId, ThemePolarity } from "@/types/ui";

export interface ThemeSwatches {
  background: string;
  card: string;
  primary: string;
  gold: string;
  accent: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  polarity: ThemePolarity;
  isPremium: boolean;
  isDefault?: boolean;
  swatches: ThemeSwatches;
}

export const DEFAULT_THEME_ID: ThemeId = "dark";
export const LIGHT_THEME_ID: ThemeId = "light";

export const APP_THEMES: readonly ThemeDefinition[] = [
  {
    id: "dark",
    polarity: "dark",
    isPremium: false,
    isDefault: true,
    swatches: {
      background: "#210459",
      card: "#371D6A",
      primary: "#7C3AED",
      gold: "#EDE539",
      accent: "#ED2BE5",
    },
  },
  {
    id: "light",
    polarity: "light",
    isPremium: false,
    isDefault: true,
    swatches: {
      background: "#F5F5F8",
      card: "#FFFFFF",
      primary: "#6D28D9",
      gold: "#F5B815",
      accent: "#9324D6",
    },
  },
  {
    id: "dark-knight",
    polarity: "dark",
    isPremium: false,
    swatches: {
      background: "#0B0D12",
      card: "#181E2B",
      primary: "#2563EB",
      gold: "#F5C518",
      accent: "#60A5FA",
    },
  },
  {
    id: "solar-parchment",
    polarity: "light",
    isPremium: false,
    swatches: {
      background: "#F5EFE4",
      card: "#FDFBF6",
      primary: "#0D6B63",
      gold: "#F5B815",
      accent: "#92400E",
    },
  },
  {
    id: "cyberpunk-neon",
    polarity: "dark",
    isPremium: true,
    swatches: {
      background: "#090C18",
      card: "#141C34",
      primary: "#0E7490",
      gold: "#FAEB37",
      accent: "#FF2EE6",
    },
  },
  {
    id: "forest-ranger",
    polarity: "dark",
    isPremium: true,
    swatches: {
      background: "#07140F",
      card: "#122E23",
      primary: "#047857",
      gold: "#FBBF24",
      accent: "#34D399",
    },
  },
  {
    id: "royal-gold",
    polarity: "light",
    isPremium: true,
    swatches: {
      background: "#FBF7EC",
      card: "#FFFEFA",
      primary: "#723E00",
      gold: "#EAB308",
      accent: "#881337",
    },
  },
] as const;

export const STANDARD_THEMES: readonly ThemeDefinition[] = APP_THEMES.filter(
  (theme) => !theme.isPremium,
);

export const VIP_THEMES: readonly ThemeDefinition[] = APP_THEMES.filter(
  (theme) => theme.isPremium,
);

const THEME_MAP = new Map<ThemeId, ThemeDefinition>(
  APP_THEMES.map((theme) => [theme.id, theme]),
);

export function isValidThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_MAP.has(value as ThemeId);
}

export function getThemeDefinition(themeId: ThemeId): ThemeDefinition {
  return THEME_MAP.get(themeId) ?? APP_THEMES[0];
}

export function getThemePolarity(themeId: ThemeId): ThemePolarity {
  return getThemeDefinition(themeId).polarity;
}

export function isPremiumTheme(themeId: ThemeId): boolean {
  return getThemeDefinition(themeId).isPremium;
}

export function getDefaultThemeForPolarity(polarity: ThemePolarity): ThemeId {
  return polarity === "light" ? LIGHT_THEME_ID : DEFAULT_THEME_ID;
}

export function toDefaultPolarityTheme(themeId: ThemeId): ThemePolarity {
  return getThemePolarity(themeId) === "light" ? "light" : "dark";
}

export function resolveAllowedTheme(
  candidate: unknown,
  isPremium: boolean,
): ThemeId {
  if (!isValidThemeId(candidate)) {
    return DEFAULT_THEME_ID;
  }
  if (isPremiumTheme(candidate) && !isPremium) {
    return getDefaultThemeForPolarity(getThemePolarity(candidate));
  }
  return candidate;
}

export function resolveAllowedThemeForPolarity(
  candidate: unknown,
  polarity: ThemePolarity,
  isPremium: boolean,
): ThemeId {
  if (!isValidThemeId(candidate) || getThemePolarity(candidate) !== polarity) {
    return getDefaultThemeForPolarity(polarity);
  }
  if (isPremiumTheme(candidate) && !isPremium) {
    return getDefaultThemeForPolarity(polarity);
  }
  return candidate;
}

export interface ResolvedThemeSession {
  theme: ThemeId;
  lastDarkTheme: ThemeId;
  lastLightTheme: ThemeId;
}

function resolveLastThemeForPolarity(params: {
  polarity: ThemePolarity;
  activeTheme: ThemeId;
  cookieCandidate?: unknown;
  userCandidate?: unknown;
  isPremium: boolean;
}): ThemeId {
  if (getThemePolarity(params.activeTheme) === params.polarity) {
    return params.activeTheme;
  }
  if (
    isValidThemeId(params.cookieCandidate) &&
    getThemePolarity(params.cookieCandidate) === params.polarity
  ) {
    return resolveAllowedThemeForPolarity(
      params.cookieCandidate,
      params.polarity,
      params.isPremium,
    );
  }
  return resolveAllowedThemeForPolarity(
    params.userCandidate,
    params.polarity,
    params.isPremium,
  );
}

/**
 * Reconcilia tema ativo e último tema escuro/claro a partir de cookies,
 * perfil persistido e status de assinatura Premium.
 */
export function resolveThemeSessionState(params: {
  cookieTheme?: unknown;
  cookieLastDark?: unknown;
  cookieLastLight?: unknown;
  userTheme?: unknown;
  fallbackTheme?: unknown;
  isPremium: boolean;
}): ResolvedThemeSession {
  const candidateTheme = isValidThemeId(params.cookieTheme)
    ? params.cookieTheme
    : isValidThemeId(params.userTheme)
      ? params.userTheme
      : isValidThemeId(params.fallbackTheme)
        ? params.fallbackTheme
        : DEFAULT_THEME_ID;

  const theme = resolveAllowedTheme(candidateTheme, params.isPremium);

  return {
    theme,
    lastDarkTheme: resolveLastThemeForPolarity({
      polarity: "dark",
      activeTheme: theme,
      cookieCandidate: params.cookieLastDark,
      userCandidate: params.userTheme,
      isPremium: params.isPremium,
    }),
    lastLightTheme: resolveLastThemeForPolarity({
      polarity: "light",
      activeTheme: theme,
      cookieCandidate: params.cookieLastLight,
      userCandidate: params.userTheme,
      isPremium: params.isPremium,
    }),
  };
}
