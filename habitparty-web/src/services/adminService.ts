import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/constants/admin";
import type { AdminOverviewDTO, AdminUsersPageResponse } from "@/types/admin";

/**
 * Obtém as métricas gerais do sistema (Resend, Usuários, Banco) com cache privado de 30s.
 */
export async function getAdminOverview(): Promise<AdminOverviewDTO | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("admin-overview");

  try {
    const { data, error } = await serverApi.GET("/api/v1/admin/overview");
    if (error || !data) {
      return null;
    }
    return data;
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
    const { data, error } = await serverApi.GET("/api/v1/admin/users", {
      params: {
        query: {
          search: search.trim(),
          filter,
          page,
          size,
        },
      },
    });
    if (error || !data) {
      return null;
    }
    return data;
  } catch (err) {
    console.error("[AdminService:getAdminUsers]", err);
    return null;
  }
}
