"use server";

import { getTranslations } from "next-intl/server";
import { invalidateAdminDomainTags } from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { getServerAuthToken } from "@/api/server";
import type { AdminUserDetailDTO } from "@/types/admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function getAuthHeader(): Promise<HeadersInit> {
  const token = await getServerAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(err, t("userDetailFailed")),
      };
    }

    const data = (await res.json()) as AdminUserDetailDTO;
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
    const authHeaders = await getAuthHeader();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/admin/users/${userId}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ role }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(err, t("updateRoleFailed")),
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
