"use server";

import { getTranslations } from "next-intl/server";
import { invalidateShowcaseDomainTags } from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { getServerAuthToken } from "@/api/server";
import { getUnseenAchievements } from "@/services/showcaseService";
import type {
  AchievementItemResponseDTO,
  ProfileHighlightResponseDTO,
  UpdateProfileHighlightsRequestDTO,
  UpdateShowcaseProfileRequestDTO,
} from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Atualiza os 4 slots de destaque da vitrine do usuário.
 */
export async function updateMyHighlightsAction(
  payload: UpdateProfileHighlightsRequestDTO,
): Promise<ActionState<ProfileHighlightResponseDTO[]>> {
  const t = await getTranslations("showcase.actions");
  try {
    const token = await getServerAuthToken();
    if (!token) {
      return {
        success: false,
        error: t("unauthorized"),
      };
    }

    const res = await fetch(`${API_BASE_URL}/showcase/highlights`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(json, t("updateHighlightsError")),
      };
    }

    const data = (await res.json()) as ProfileHighlightResponseDTO[];
    invalidateShowcaseDomainTags(false);
    return { success: true, data };
  } catch (err) {
    console.error("[ShowcaseAction:UpdateHighlights]", err);
    return {
      success: false,
      error: t("networkError"),
    };
  }
}

/**
 * Atualiza a Bio e/ou Moldura de Avatar da vitrine do usuário.
 */
export async function updateShowcaseProfileAction(
  payload: UpdateShowcaseProfileRequestDTO,
): Promise<ActionState<UserResponseDTO>> {
  const t = await getTranslations("showcase.actions");
  try {
    const token = await getServerAuthToken();
    if (!token) {
      return {
        success: false,
        error: t("unauthorized"),
      };
    }

    const res = await fetch(`${API_BASE_URL}/showcase/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(json, t("updateProfileError")),
      };
    }

    const data = (await res.json()) as UserResponseDTO;
    invalidateShowcaseDomainTags(true);
    return { success: true, data };
  } catch (err) {
    console.error("[ShowcaseAction:UpdateProfile]", err);
    return {
      success: false,
      error: t("networkError"),
    };
  }
}

/**
 * Busca conquistas desbloqueadas e ainda não visualizadas (chamado em Client Components).
 */
export async function fetchUnseenAchievementsAction(): Promise<
  ActionState<AchievementItemResponseDTO[]>
> {
  const data = await getUnseenAchievements();
  return { success: true, data };
}

/**
 * Marca todas as conquistas recém-desbloqueadas como vistas.
 */
export async function markAchievementsSeenAction(): Promise<ActionState<void>> {
  try {
    const token = await getServerAuthToken();
    if (!token) {
      return { success: true, data: undefined };
    }

    await fetch(`${API_BASE_URL}/showcase/achievements/seen`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    invalidateShowcaseDomainTags(false);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to mark achievements seen" };
  }
}
