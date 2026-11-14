import { cookies, headers } from "next/headers";
import type { AppLocale } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/request";
import type {
  DateFormat,
  ExperienceMode,
  ThemeMode,
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

export async function getThemeMode(): Promise<ThemeMode> {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value;
  return theme === "light" ? "light" : "dark";
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
