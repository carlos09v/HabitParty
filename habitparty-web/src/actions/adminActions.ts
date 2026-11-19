"use server";

import { getTranslations } from "next-intl/server";
import { invalidateAdminDomainTags } from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
import type { AdminUserDetailDTO } from "@/types/admin";

/**
 * Força a revalidação imediata dos dados do painel administrativo (overview + listagem de usuários).
 */
export async function refreshAdminDataAction(): Promise<ActionState<void>> {
  invalidateAdminDomainTags();
  return { success: true, data: undefined };
}

/**
 * Detalhes e breakdown de armazenamento de um usuário específico (sob demanda ao abrir modal)
 */
export async function getAdminUserDetailAction(
  userId: string,
): Promise<ActionState<AdminUserDetailDTO>> {
  const t = await getTranslations("admin.actions");
  try {
    const { data, error } = await serverApi.GET(
      "/api/v1/admin/users/{userId}",
      {
        params: {
          path: { userId },
        },
        cache: "no-store",
      },
    );

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("userDetailFailed")),
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[AdminAction:getUserDetail]", err);
    return {
      success: false,
      error: t("userDetailConnectionError"),
    };
  }
}

/**
 * Promove ou rebaixa o papel de um usuário (USER ou ADMIN)
 */
export async function updateUserRoleAction(
  userId: string,
  role: "USER" | "ADMIN",
): Promise<ActionState<void>> {
  const t = await getTranslations("admin.actions");
  try {
    const { error } = await serverApi.PATCH(
      "/api/v1/admin/users/{userId}/role",
      {
        params: {
          path: { userId },
        },
        body: { role },
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateRoleFailed")),
      };
    }

    invalidateAdminDomainTags();
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AdminAction:updateRole]", err);
    return {
      success: false,
      error: t("updateRoleConnectionError"),
    };
  }
}
