import { serverApi } from "@/api/server";
import type { UserResponseDTO } from "@/types/user";

/**
 * Carrega os dados do usuário autenticado com tag de cache para invalidação via Server Actions.
 */
export async function getCurrentUser(): Promise<UserResponseDTO | null> {
  const { data: user, error } = await serverApi.GET("/users/me", {
    next: { tags: ["user"] },
  });

  if (error || !user) {
    return null;
  }

  return user;
}
