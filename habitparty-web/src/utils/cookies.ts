import { cookies, headers } from "next/headers";
import type { AppLocale } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/request";
import type { DateFormat, ExperienceMode, ThemeMode } from "@/types/ui";
import { detectBrowserDateFormat } from "@/utils/date";

export type { AppLocale, DateFormat, ExperienceMode, ThemeMode };

export function isValidDateFormat(val?: string | null): val is DateFormat {
  return val === "DD/MM/YYYY" || val === "MM/DD/YYYY" || val === "YYYY-MM-DD";
}

export async function getCompactMode() {
  const cookieStore = await cookies();
  return cookieStore.get("compactMode")?.value === "true";
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
