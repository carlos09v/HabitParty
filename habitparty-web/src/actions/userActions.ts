"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
import type {
  UpdateUserDTO,
  UpdateUserPasswordDTO,
  UserResponseDTO,
} from "@/types/user";

export type { UpdateUserDTO, UpdateUserPasswordDTO, UserResponseDTO };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Atualiza os dados de perfil do usuário (Nome, Data de Nascimento, Gênero)
 */
export async function updateUserProfileAction(
  payload: UpdateUserDTO,
): Promise<ActionState<UserResponseDTO>> {
  try {
    const { data, error } = await serverApi.PUT("/users", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(
          error,
          "Falha ao atualizar o perfil. Verifique os dados.",
        ),
      };
    }

    updateTag("user");
    return { success: true, data: data as UserResponseDTO };
  } catch (err) {
    console.error("[UserAction:UpdateProfile]", err);
    return {
      success: false,
      error: "Erro de comunicação ao atualizar perfil.",
    };
  }
}

/**
 * Faz upload de nova foto de perfil (multipart/form-data)
 */
export async function updateUserProfilePhotoAction(
  formData: FormData,
): Promise<ActionState<void>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("habitparty_token")?.value;

    const res = await fetch(`${API_BASE_URL}/users/photo`, {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      let errorMsg = "Não foi possível enviar a foto. Tente novamente.";
      try {
        const json = await res.json();
        if (json?.message) errorMsg = json.message;
      } catch {
        // ignora erro de parse
      }
      return { success: false, error: errorMsg };
    }

    updateTag("user");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UserAction:UpdatePhoto]", err);
    return {
      success: false,
      error: "Erro de rede ao enviar foto de perfil.",
    };
  }
}

/**
 * Atualiza a senha da conta
 */
export async function updateUserPasswordAction(
  payload: UpdateUserPasswordDTO,
): Promise<ActionState<void>> {
  try {
    const { error } = await serverApi.PATCH("/users/password", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(
          error,
          "Falha ao alterar senha. Verifique a senha atual.",
        ),
      };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UserAction:UpdatePassword]", err);
    return {
      success: false,
      error: "Erro ao comunicar com o servidor para troca de senha.",
    };
  }
}

/**
 * Exclui a conta do usuário conectado
 */
export async function deleteUserAccountAction(): Promise<ActionState<void>> {
  try {
    const { error } = await serverApi.DELETE("/users/me");

    if (error) {
      return {
        success: false,
        error: getErrorMessage(
          error,
          "Não foi possível excluir a conta. Tente novamente.",
        ),
      };
    }

    const cookieStore = await cookies();
    cookieStore.delete("habitparty_token");
    cookieStore.delete("habitparty_refresh_token");
  } catch (err) {
    console.error("[UserAction:DeleteAccount]", err);
    return {
      success: false,
      error: "Erro de comunicação ao excluir conta.",
    };
  }

  redirect("/signIn");
}
