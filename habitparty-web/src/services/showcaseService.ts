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

/**
 * Carrega todos os dados da vitrine do usuário autenticado (estatísticas vitalícias,
 * 4 slots de destaque e catálogo de conquistas com progresso em tempo real).
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

    const { data, error } = await serverApi.GET("/showcase/me");
    if (error || !data) {
      return null;
    }

    return data as UserShowcaseResponseDTO;
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

export async function getMyRetrospective(
  year?: number,
): Promise<UserRetrospectiveData | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("retrospective", "showcase");

  try {
    const token = await getServerAuthToken();
    if (!token) {
      return null;
    }

    const { data, error } = await serverApi.GET("/showcase/me/retrospective", {
      params: year ? { query: { year } } : {},
    });

    if (error || !data) {
      return null;
    }

    return data as UserRetrospectiveData;
  } catch {
    return null;
  }
}

export async function getPublicUserShowcase(
  username: string,
): Promise<PublicUserShowcaseData | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("social", "showcase");

  try {
    const token = await getServerAuthToken();
    if (!token || !username) {
      return null;
    }

    const { data, error } = await serverApi.GET("/showcase/users/{username}", {
      params: { path: { username: decodeURIComponent(username) } },
    });

    if (error || !data) {
      return null;
    }

    return data as PublicUserShowcaseData;
  } catch {
    return null;
  }
}

export async function getPublicUserRetrospective(
  username: string,
  year?: number,
): Promise<UserRetrospectiveData | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("social", "retrospective");

  try {
    const token = await getServerAuthToken();
    if (!token || !username) {
      return null;
    }

    const { data, error } = await serverApi.GET(
      "/showcase/users/{username}/retrospective",
      {
        params: {
          path: { username: decodeURIComponent(username) },
          ...(year ? { query: { year } } : {}),
        },
      },
    );

    if (error || !data) {
      return null;
    }

    return data as UserRetrospectiveData;
  } catch {
    return null;
  }
}
