import { cacheLife, cacheTag } from "next/cache";
import { getServerAuthToken, serverApi } from "@/api/server";
import type {
  AchievementItemResponseDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";
import type {
  PublicUserShowcaseData,
  UserRetrospectiveData,
} from "@/types/social";

async function fetchMyShowcaseCached(): Promise<UserShowcaseResponseDTO> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("showcase", "user");

  const { data, error } = await serverApi.GET("/showcase/me");
  if (error || !data) {
    throw new Error("SHOWCASE_FETCH_FAILED");
  }

  return data as UserShowcaseResponseDTO;
}

export interface MyShowcaseResult {
  data: UserShowcaseResponseDTO | null;
  error: boolean;
  unauthorized: boolean;
}

/**
 * Carrega todos os dados da vitrine do usuário autenticado sem cachear falhas HTTP,
 * permitindo diferenciar erro real de sessão expirada na página `/profile`.
 */
export async function getMyShowcaseWithStatus(): Promise<MyShowcaseResult> {
  const token = await getServerAuthToken();
  if (!token) {
    return { data: null, error: false, unauthorized: true };
  }

  try {
    const data = await fetchMyShowcaseCached();
    return { data, error: false, unauthorized: false };
  } catch (err) {
    console.error("[ShowcaseService:getMyShowcaseWithStatus]", err);
    return { data: null, error: true, unauthorized: false };
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

    const { data, error } = await serverApi.GET(
      "/showcase/achievements/unseen",
      {
        cache: "no-store",
      },
    );

    if (error || !data) {
      return [];
    }

    return data as AchievementItemResponseDTO[];
  } catch {
    return [];
  }
}

async function fetchMyRetrospectiveCached(
  year?: number,
): Promise<UserRetrospectiveData> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("retrospective", "showcase");

  const { data, error } = await serverApi.GET("/showcase/me/retrospective", {
    params: year ? { query: { year } } : {},
  });

  if (error || !data) {
    throw new Error("MY_RETROSPECTIVE_FETCH_FAILED");
  }

  return data as UserRetrospectiveData;
}

export async function getMyRetrospective(
  year?: number,
): Promise<UserRetrospectiveData | null> {
  const token = await getServerAuthToken();
  if (!token) {
    return null;
  }

  try {
    return await fetchMyRetrospectiveCached(year);
  } catch (err) {
    console.error("[ShowcaseService:getMyRetrospective]", err);
    return null;
  }
}

type CachedPublicShowcaseResult =
  | { status: "ok"; data: PublicUserShowcaseData }
  | { status: "not_found" };

export type PublicUserShowcaseStatusResult =
  | CachedPublicShowcaseResult
  | { status: "unauthorized" }
  | { status: "error" };

async function fetchPublicUserShowcaseCached(
  username: string,
): Promise<CachedPublicShowcaseResult> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("social", "showcase");

  const { data, error, response } = await serverApi.GET(
    "/showcase/users/{username}",
    {
      params: { path: { username } },
    },
  );

  if (response?.status === 404) {
    return { status: "not_found" };
  }

  if (error || !data) {
    throw new Error("PUBLIC_SHOWCASE_FETCH_FAILED");
  }

  return { status: "ok", data: data as PublicUserShowcaseData };
}

/**
 * Carrega a vitrine pública diferenciando 404 real de falhas transitórias 5xx/rede
 * (erros transitórios nunca são cacheados no cache privado).
 */
export async function getPublicUserShowcaseWithStatus(
  username: string,
): Promise<PublicUserShowcaseStatusResult> {
  const token = await getServerAuthToken();
  if (!token) {
    return { status: "unauthorized" };
  }
  if (!username) {
    return { status: "not_found" };
  }

  try {
    return await fetchPublicUserShowcaseCached(username);
  } catch (err) {
    console.error("[ShowcaseService:getPublicUserShowcaseWithStatus]", err);
    return { status: "error" };
  }
}
