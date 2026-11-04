import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import type { UserResponseDTO } from "@/types/user";

/**
 * Carrega os dados do usuário autenticado com cache privado no cliente (30s)
 * e invalidação imediata via `updateTag("user")` nas Server Actions.
 * Nunca armazena dados de `/users/me` na memória compartilhada do servidor.
 */
export async function getCurrentUser(): Promise<UserResponseDTO | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("user");

  const { data: user, error } = await serverApi.GET("/users/me", {
    next: { tags: ["user"] },
  });

  if (error || !user) {
    return null;
  }

  return user;
}
