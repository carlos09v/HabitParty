import { cacheLife, cacheTag } from "next/cache";
import { getServerAuthToken } from "@/api/server";
import type {
  AchievementItemResponseDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Carrega todos os dados da vitrine do usuário autenticado (estatísticas vitalícias,
 * 4 slots de destaque e catálogo de 59 conquistas com progresso em tempo real).
 */
export async function getMyShowcase(): Promise<UserShowcaseResponseDTO | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("showcase", "user");

  try {
    const token = await getServerAuthToken();
    if (!token) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/showcase/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as UserShowcaseResponseDTO;
  } catch (err) {
    console.error("[ShowcaseService:getMyShowcase]", err);
    return null;
  }
}

/**
 * Busca conquistas recém-desbloqueadas ainda não visualizadas pelo usuário.
 */
export async function getUnseenAchievements(): Promise<
  AchievementItemResponseDTO[]
> {
  try {
    const token = await getServerAuthToken();
    if (!token) {
      return [];
    }

    const res = await fetch(`${API_BASE_URL}/showcase/achievements/unseen`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as AchievementItemResponseDTO[];
  } catch {
    return [];
  }
}
