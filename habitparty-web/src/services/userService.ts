import { cacheLife, cacheTag } from "next/cache";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import type { UserResponseDTO } from "@/types/user";

type UserLayoutSummaryResponseDTO =
  components["schemas"]["UserLayoutSummaryResponseDTO"];

/**
 * Carrega os dados do usuário autenticado com cache privado no cliente (30s)
 * e invalidação imediata via `updateTag("user")` nas Server Actions.
 * Nunca armazena dados de `/users/me` na memória compartilhada do servidor.
 */
export async function getCurrentUser(): Promise<UserResponseDTO | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("user");

  const { data: user, error } = await serverApi.GET("/users/me");

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Carrega apenas o último carimbo de conclusão de tarefa para o `AppLayout`,
 * evitando buscar o extrato completo (100 transações) em todas as páginas.
 */
export async function getUserLayoutSummary(): Promise<UserLayoutSummaryResponseDTO | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("transactions");

  const { data, error } = await serverApi.GET("/users/me/layout-summary");
  if (error || !data) {
    return null;
  }

  return data;
}
