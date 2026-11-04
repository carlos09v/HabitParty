"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { serverApi } from "@/api/server";
import {
  type AppLocale,
  isValidLocale,
  LOCALE_COOKIE_NAME,
} from "@/i18n/config";
import type { ExperienceMode } from "@/types/ui";

export async function setCompactModeCookie(compact: boolean) {
  const cookieStore = await cookies();
  cookieStore.set("compactMode", String(compact), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}

export async function setThemeCookie(theme: "light" | "dark") {
  const cookieStore = await cookies();
  cookieStore.set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}

/**
 * Persiste o idioma escolhido.
 *
 * Não chama `revalidatePath` nem exige `router.refresh()` no cliente:
 * setar um cookie dentro de uma Server Action já faz o Next re-renderizar a
 * rota atual (layouts + página) e devolver a nova árvore RSC na MESMA resposta,
 * além de invalidar o Router Cache das demais rotas. Assim a troca de idioma
 * custa uma única ida e volta ao servidor.
 */
export async function setLocaleCookie(locale: AppLocale) {
  const validLocale: AppLocale = isValidLocale(locale) ? locale : "en";
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, validLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}

export async function setFirstStepPreferencesAction(
  usageMode: string,
  workspaceId?: string,
  experienceMode: ExperienceMode = "PRODUCTIVITY",
  compactMode?: boolean,
) {
  const cookieStore = await cookies();
  cookieStore.set("habitparty_usage_mode", usageMode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 ano
    sameSite: "lax",
  });
  if (compactMode !== undefined) {
    cookieStore.set("compactMode", String(compactMode), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  if (workspaceId) {
    cookieStore.set("activeWorkspaceId", workspaceId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      sameSite: "lax",
    });
  }

  try {
    await serverApi.PUT("/users", {
      body: { experienceMode },
    });
    updateTag("user");
  } catch {
    // ignore
  }
}
