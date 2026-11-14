import { cacheLife, cacheTag } from "next/cache";
import { getServerAuthToken } from "@/api/server";
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/constants/admin";
import type { AdminOverviewDTO, AdminUsersPageResponse } from "@/types/admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Obtém as métricas gerais do sistema (Resend, Usuários, Banco) com cache privado de 30s.
 */
export async function getAdminOverview(): Promise<AdminOverviewDTO | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("admin-overview");

  try {
    const token = await getServerAuthToken();
    if (!token) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/admin/overview`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as AdminOverviewDTO;
  } catch (err) {
    console.error("[AdminService:getAdminOverview]", err);
    return null;
  }
}

export interface GetAdminUsersParams {
  search?: string;
  filter?: string;
  page?: number;
  size?: number;
}

/**
 * Lista usuários paginados com métricas de e-mail e armazenamento via cache privado de 30s.
 */
export async function getAdminUsers({
  search = "",
  filter = "ALL",
  page = 0,
  size = ADMIN_DEFAULT_PAGE_SIZE,
}: GetAdminUsersParams = {}): Promise<AdminUsersPageResponse | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("admin-users");

  try {
    const token = await getServerAuthToken();
    if (!token) {
      return null;
    }

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
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as AdminUsersPageResponse;
  } catch (err) {
    console.error("[AdminService:getAdminUsers]", err);
    return null;
  }
}
