"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { getServerAuthToken, serverApi } from "@/api/server";
import type { ExperienceMode } from "@/types/ui";
import type {
  UpdateUserDTO,
  UpdateUserPasswordDTO,
  UserResponseDTO,
} from "@/types/user";

export type { UpdateUserDTO, UpdateUserPasswordDTO, UserResponseDTO };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

    updateTag("user");
    return { success: true, data: data as UserResponseDTO };
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
): Promise<ActionState<void>> {
  const t = await getTranslations("settings.userActions");
  try {
    const token = await getServerAuthToken();
    if (!token) {
      return {
        success: false,
        error: t("unauthorizedSession"),
      };
    }

    const res = await fetch(`${API_BASE_URL}/users/photo`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(json, t("uploadPhotoError")),
      };
    }

    updateTag("user");
    return { success: true, data: undefined };
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
    const { error } = await serverApi.PATCH("/users/password", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updatePasswordError")),
      };
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
  } catch (err) {
    console.error("[UserAction:DeleteAccount]", err);
    return {
      success: false,
      error: t("deleteAccountNetworkError"),
    };
  }

  redirect("/signIn");
}
