"use client";

import { useUserStore } from "@/store/userStore";
import type { UserResponseDTO } from "@/types/user";

/**
 * Retorna o usuário da store global apenas quando corresponde ao mesmo `id` do usuário SSR,
 * evitando flash de dados de outra conta durante troca de sessão.
 */
export function useResolvedUser(initialUser: UserResponseDTO): UserResponseDTO;
export function useResolvedUser(
  initialUser?: UserResponseDTO | null,
): UserResponseDTO | null;
export function useResolvedUser(
  initialUser?: UserResponseDTO | null,
): UserResponseDTO | null {
  const storeUser = useUserStore((s) => s.user);
  if (!initialUser) {
    return storeUser;
  }
  return storeUser && storeUser.id === initialUser.id ? storeUser : initialUser;
}
