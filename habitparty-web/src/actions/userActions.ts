"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  invalidateFocusDomainTags,
  invalidateSessionCacheTags,
  invalidateSocialDomainTags,
  invalidateTaskDomainTags,
} from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { setAuthCookies } from "@/api/authCookies";
import {
  API_BASE_URL,
  buildServerForwardHeaders,
  serverApi,
} from "@/api/server";
import type { ExperienceMode } from "@/types/ui";
import type {
  AccountResetScope,
  UpdateUserDTO,
  UpdateUserPasswordDTO,
  UserResponseDTO,
} from "@/types/user";
import { isValidIanaTimeZone, TIMEZONE_COOKIE } from "@/utils/date";

/**
 * Atualiza os dados de perfil do usuário (Nome, Data de Nascimento, Gênero, Modo de Experiência)
 */
export async function updateUserProfileAction(
  payload: UpdateUserDTO,
): Promise<ActionState<UserResponseDTO>> {
  const t = await getTranslations("settings.userActions");
  try {
    const { data, error } = await serverApi.PUT("/users", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateProfileError")),
      };
    }

    const updatedUser = data as UserResponseDTO;
    if (isValidIanaTimeZone(updatedUser?.timezone)) {
      const cookieStore = await cookies();
      cookieStore.set(TIMEZONE_COOKIE, updatedUser.timezone, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    if (payload.timezone) {
      invalidateTaskDomainTags({
        includeColumnSummaries: true,
        includeUserAndTransactions: true,
      });
      invalidateFocusDomainTags({ records: true });
      updateTag("social");
    } else {
      updateTag("user");
      updateTag("showcase");
      updateTag("social");
      updateTag("retrospective");
    }
    return { success: true, data: updatedUser };
  } catch (err) {
    console.error("[UserAction:UpdateProfile]", err);
    return {
      success: false,
      error: t("updateProfileNetworkError"),
    };
  }
}

/**
 * Atualiza especificamente o Modo de Experiência (GAMIFIED | PRODUCTIVITY) do usuário no banco
 */
export async function updateUserExperienceModeAction(
  experienceMode: ExperienceMode,
): Promise<ActionState<UserResponseDTO>> {
  return updateUserProfileAction({ experienceMode });
}

/**
 * Faz upload de nova foto de perfil (multipart/form-data)
 */
export async function updateUserProfilePhotoAction(
  formData: FormData,
): Promise<ActionState<UserResponseDTO | null>> {
  const t = await getTranslations("settings.userActions");
  try {
    const forwardHeaders = await buildServerForwardHeaders();
    if (!forwardHeaders.has("Authorization")) {
      return {
        success: false,
        error: t("unauthorizedSession"),
      };
    }

    const res = await fetch(`${API_BASE_URL}/users/photo`, {
      method: "PATCH",
      headers: forwardHeaders,
      body: formData,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(json, t("uploadPhotoError")),
      };
    }

    const updatedUser = (await res
      .json()
      .catch(() => null)) as UserResponseDTO | null;
    invalidateSocialDomainTags(true);
    return { success: true, data: updatedUser };
  } catch (err) {
    console.error("[UserAction:UpdatePhoto]", err);
    return {
      success: false,
      error: t("uploadPhotoNetworkError"),
    };
  }
}

/**
 * Atualiza a senha da conta
 */
export async function updateUserPasswordAction(
  payload: UpdateUserPasswordDTO,
): Promise<ActionState<void>> {
  const t = await getTranslations("settings.userActions");
  try {
    const { data, error } = await serverApi.PATCH("/users/password", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updatePasswordError")),
      };
    }

    // Rotaciona os cookies HTTP-only com a nova sessão emitida pelo backend
    // (todas as demais sessões/dispositivos já foram revogados no servidor)
    const rotated = data as
      | { token?: string | null; refreshToken?: string | null }
      | undefined;
    if (rotated?.token && rotated?.refreshToken) {
      await setAuthCookies(rotated.token, rotated.refreshToken);
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UserAction:UpdatePassword]", err);
    return {
      success: false,
      error: t("updatePasswordNetworkError"),
    };
  }
}

/**
 * Redefine métricas ou todo o conteúdo da conta sem excluir o usuário
 */
export async function resetUserAccountAction(
  scope: AccountResetScope,
  deleteHistory = false,
): Promise<ActionState<UserResponseDTO>> {
  const t = await getTranslations("settings.userActions");
  try {
    const { data, error } = await serverApi.POST("/users/me/reset", {
      body: {
        scope,
        deleteHistory: scope === "COMPLETE" ? true : deleteHistory,
      },
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("resetAccountError")),
      };
    }

    if (scope === "COMPLETE") {
      const cookieStore = await cookies();
      cookieStore.delete("activeWorkspaceId");
    }
    invalidateSessionCacheTags();

    return { success: true, data: data as UserResponseDTO };
  } catch (err) {
    console.error("[UserAction:ResetAccount]", err);
    return {
      success: false,
      error: t("resetAccountNetworkError"),
    };
  }
}

/**
 * Exclui a conta do usuário conectado
 */
export async function deleteUserAccountAction(): Promise<ActionState<void>> {
  const t = await getTranslations("settings.userActions");
  try {
    const { error } = await serverApi.DELETE("/users/me");

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteAccountError")),
      };
    }

    const cookieStore = await cookies();
    cookieStore.delete("habitparty_token");
    cookieStore.delete("habitparty_refresh_token");
    cookieStore.delete(TIMEZONE_COOKIE);
    cookieStore.delete("activeWorkspaceId");
    invalidateSessionCacheTags();
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UserAction:DeleteAccount]", err);
    return {
      success: false,
      error: t("deleteAccountNetworkError"),
    };
  }
}
