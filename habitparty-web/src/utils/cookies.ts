import { cookies } from "next/headers";
import type { ThemeMode } from "@/types/ui";

export type { ThemeMode };

export async function getCompactMode() {
  const cookieStore = await cookies();
  return cookieStore.get("compactMode")?.value === "true";
}

export async function getThemeMode(): Promise<ThemeMode> {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value;
  return theme === "light" ? "light" : "dark";
}
