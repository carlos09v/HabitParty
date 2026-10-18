"use server";

import { updateTag } from "next/cache";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { getServerAuthToken } from "@/api/server";
import type {
  AdminOverviewDTO,
  AdminUserDetailDTO,
  AdminUsersPageResponse,
} from "@/types/admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function getAuthHeader(): Promise<HeadersInit> {
  const token = await getServerAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtém as métricas gerais do sistema (Resend, Usuários, Banco)
 */
export async function getAdminOverviewAction(): Promise<
  ActionState<AdminOverviewDTO>
> {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      next: { tags: ["admin-overview"], revalidate: 15 },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(
          err,
          "Falha ao carregar visão geral de administrador.",
        ),
      };
    }

    const data = (await res.json()) as AdminOverviewDTO;
    return { success: true, data };
  } catch (err) {
    console.error("[AdminAction:getOverview]", err);
    return {
      success: false,
      error: "Erro de comunicação com o servidor administrativo.",
    };
  }
}

/**
 * Lista usuários paginados com métricas de e-mail e armazenamento
 */
export async function listAdminUsersAction(
  search = "",
  filter = "ALL",
  page = 0,
  size = 15,
): Promise<ActionState<AdminUsersPageResponse>> {
  try {
    const authHeaders = await getAuthHeader();
    const query = new URLSearchParams({
      search: search.trim(),
      filter,
      page: page.toString(),
      size: size.toString(),
    });

    const res = await fetch(
      `${API_BASE_URL}/api/v1/admin/users?${query.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        next: { tags: ["admin-users"] },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(err, "Falha ao buscar lista de usuários."),
      };
    }

    const data = (await res.json()) as AdminUsersPageResponse;
    return { success: true, data };
  } catch (err) {
    console.error("[AdminAction:listUsers]", err);
    return {
      success: false,
      error: "Erro de conexão ao buscar usuários.",
    };
  }
}

/**
 * Detalhes e breakdown de armazenamento de um usuário específico
 */
export async function getAdminUserDetailAction(
  userId: string,
): Promise<ActionState<AdminUserDetailDTO>> {
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
        error: getErrorMessage(err, "Falha ao carregar detalhes do usuário."),
      };
    }

    const data = (await res.json()) as AdminUserDetailDTO;
    return { success: true, data };
  } catch (err) {
    console.error("[AdminAction:getUserDetail]", err);
    return {
      success: false,
      error: "Erro ao obter detalhes do usuário.",
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
        error: getErrorMessage(
          err,
          "Não foi possível alterar a role do usuário.",
        ),
      };
    }

    updateTag("admin-overview");
    updateTag("admin-users");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AdminAction:updateRole]", err);
    return {
      success: false,
      error: "Erro de comunicação ao alterar o cargo do usuário.",
    };
  }
}
