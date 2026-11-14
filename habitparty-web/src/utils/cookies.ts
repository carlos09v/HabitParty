import { cookies, headers } from "next/headers";
import {
  DEFAULT_THEME_ID,
  getThemePolarity,
  isValidThemeId,
} from "@/constants/themes";
import type { AppLocale } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/request";
import type {
  DateFormat,
  ExperienceMode,
  ThemeMode,
  ThemePolarity,
  TimeFormat,
} from "@/types/ui";
import {
  BROWSER_TIMEZONE_COOKIE,
  DEFAULT_TIMEZONE,
  detectBrowserDateFormat,
  detectBrowserTimeFormat,
  isValidIanaTimeZone,
  TIMEZONE_COOKIE,
} from "@/utils/date";

export type { AppLocale, DateFormat, ExperienceMode, ThemeMode, TimeFormat };
export { BROWSER_TIMEZONE_COOKIE, TIMEZONE_COOKIE };

export function isValidDateFormat(val?: string | null): val is DateFormat {
  return val === "DD/MM/YYYY" || val === "MM/DD/YYYY" || val === "YYYY-MM-DD";
}

export function isValidTimeFormat(val?: string | null): val is TimeFormat {
  return val === "24h" || val === "12h";
}

function decodeCookieValue(raw?: string): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function getOptionalThemeCookie(): Promise<ThemeMode | null> {
  const cookieStore = await cookies();
  const decoded = decodeCookieValue(cookieStore.get("theme")?.value);
  return isValidThemeId(decoded) ? decoded : null;
}

export async function getSitePolarity(): Promise<ThemePolarity> {
  const cookieStore = await cookies();
  const rawPolarity = decodeCookieValue(cookieStore.get("sitePolarity")?.value);
  if (rawPolarity === "light" || rawPolarity === "dark") {
    return rawPolarity;
  }
  const cookieTheme = await getOptionalThemeCookie();
  return cookieTheme ? getThemePolarity(cookieTheme) : "dark";
}

export async function getThemeMode(): Promise<ThemeMode> {
  return (await getOptionalThemeCookie()) ?? DEFAULT_THEME_ID;
}

export async function getLocaleMode(): Promise<AppLocale> {
  return getRequestLocale();
}

export async function getDateFormat(): Promise<DateFormat> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("dateFormat")?.value;
  if (raw) {
    const decoded = decodeURIComponent(raw);
    if (isValidDateFormat(decoded)) {
      return decoded;
    }
  }
  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language");
  const primarySubtag = acceptLang?.split(",")[0]?.split(";")[0]?.trim();
  const locale = await getRequestLocale();
  return detectBrowserDateFormat(primarySubtag, locale);
}

export async function getTimeFormat(): Promise<TimeFormat> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("timeFormat")?.value;
  if (raw) {
    const decoded = decodeURIComponent(raw);
    if (isValidTimeFormat(decoded)) {
      return decoded;
    }
  }
  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language");
  const primarySubtag = acceptLang?.split(",")[0]?.split(";")[0]?.trim();
  const locale = await getRequestLocale();
  return detectBrowserTimeFormat(primarySubtag, locale);
}

export async function getUserTimezoneCookie(): Promise<string> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TIMEZONE_COOKIE)?.value;
  if (raw) {
    try {
      const decoded = decodeURIComponent(raw);
      if (isValidIanaTimeZone(decoded)) {
        return decoded.trim();
      }
    } catch {
      // Fallback para timezone padrão caso cookie esteja malformado
    }
  }
  return DEFAULT_TIMEZONE;
}
