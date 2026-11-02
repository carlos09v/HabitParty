import { cookies } from "next/headers";
import type { AppLocale } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/request";
import type { ExperienceMode, ThemeMode } from "@/types/ui";

export type { AppLocale, ExperienceMode, ThemeMode };

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
