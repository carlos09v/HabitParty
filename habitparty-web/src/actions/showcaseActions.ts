"use server";

import { getTranslations } from "next-intl/server";
import { invalidateShowcaseDomainTags } from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { getServerAuthToken, serverApi } from "@/api/server";
import { getUnseenAchievements } from "@/services/showcaseService";
import type {
  AchievementItemResponseDTO,
  ProfileHighlightResponseDTO,
  UpdateProfileHighlightsRequestDTO,
  UpdateShowcaseProfileRequestDTO,
} from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";

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

    const { data, error } = await serverApi.PUT("/showcase/highlights", {
      body: payload,
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateHighlightsError")),
      };
    }

    invalidateShowcaseDomainTags(false);
    return {
      success: true,
      data: data as ProfileHighlightResponseDTO[],
    };
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

    const { data, error } = await serverApi.PATCH("/showcase/profile", {
      body: payload,
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateProfileError")),
      };
    }

    invalidateShowcaseDomainTags(true);
    return {
      success: true,
      data: data as unknown as UserResponseDTO,
    };
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
 * Marca todas as conquistas recém-desbloqueadas como vistas no servidor.
 * Não invalida a tag `showcase` por padrão para evitar re-renderização imediata da página `/profile` no mount.
 */
export async function markAchievementsSeenAction(): Promise<ActionState<void>> {
  try {
    const token = await getServerAuthToken();
    if (!token) {
      return { success: true, data: undefined };
    }

    await serverApi.POST("/showcase/achievements/seen");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to mark achievements seen" };
  }
}
