import { cacheLife, cacheTag } from "next/cache";
import type { components } from "@/api/schema";
import { getServerAuthToken, serverApi } from "@/api/server";
import type { UserResponseDTO } from "@/types/user";

type UserLayoutSummaryResponseDTO =
  components["schemas"]["UserLayoutSummaryResponseDTO"];

async function fetchCurrentUserCached(): Promise<UserResponseDTO> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("user");

  const { data: user, error } = await serverApi.GET("/users/me");

  if (error || !user) {
    throw new Error("CURRENT_USER_FETCH_FAILED");
  }

  return user;
}

/**
 * Carrega os dados do usuário autenticado com cache privado no cliente (30s)
 * e invalidação imediata via `updateTag("user")` nas Server Actions.
 * Nunca armazena falhas transitórias ou `null` no cache privado.
 */
export async function getCurrentUser(): Promise<UserResponseDTO | null> {
  const token = await getServerAuthToken();
  if (!token) {
    return null;
  }

  try {
    return await fetchCurrentUserCached();
  } catch (err) {
    console.error("[UserService:getCurrentUser]", err);
    return null;
  }
}

async function fetchUserLayoutSummaryCached(): Promise<UserLayoutSummaryResponseDTO> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("transactions");
  cacheTag("focus-records");

  const { data, error } = await serverApi.GET("/users/me/layout-summary");
  if (error || !data) {
    throw new Error("USER_LAYOUT_SUMMARY_FETCH_FAILED");
  }

  return data;
}

/**
 * Carrega apenas o último carimbo de conclusão de tarefa para o `AppLayout`,
 * evitando buscar o extrato completo (100 transações) em todas as páginas.
 * Nunca armazena falhas transitórias no cache privado.
 */
export async function getUserLayoutSummary(): Promise<UserLayoutSummaryResponseDTO | null> {
  const token = await getServerAuthToken();
  if (!token) {
    return null;
  }

  try {
    return await fetchUserLayoutSummaryCached();
  } catch (err) {
    console.error("[UserService:getUserLayoutSummary]", err);
    return null;
  }
}
