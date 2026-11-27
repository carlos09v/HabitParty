import { cookies, headers } from "next/headers";
import createClient, { type Middleware } from "openapi-fetch";
import { cache } from "react";
import type { PaymentConfirmResponse } from "@/actions/paymentActions";
import type {
  AdminOverviewDTO,
  AdminUserDetailDTO,
  AdminUsersPageResponse,
} from "@/types/admin";
import type {
  CheckoutRequestDTO,
  CheckoutResponseDTO,
  FoundersQuotaDTO,
} from "@/types/payment";
import type { RewardResponseDTO, UpdateRewardGroupDTO } from "@/types/reward";
import type {
  AchievementItemResponseDTO,
  ProfileHighlightResponseDTO,
  UpdateProfileHighlightsRequestDTO,
  UpdateShowcaseProfileRequestDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";
import type {
  FriendsOverviewData,
  PublicUserShowcaseData,
  RespondFriendRequestResponse,
  SearchSocialUserItem,
  SendFriendRequestResponse,
  SocialNotificationsFeed,
  UpdatePrivacySettingsPayload,
  UserRetrospectiveData,
} from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { getLocaleMode } from "@/utils/cookies";
import { setAuthCookies } from "./authCookies";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  isJwtExpiredOrExpiringSoon,
  REFRESH_COOKIE_NAME,
  requestDedupedTokenRefresh,
} from "./jwtUtils";
import type { paths } from "./schema";

export type ExtendedApiPaths = Omit<paths, "/users/password"> & {
  "/users/password": {
    patch: {
      requestBody: {
        content: {
          "application/json": {
            currentPassword: string;
            newPassword: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              token?: string;
              refreshToken?: string;
            };
          };
        };
        204: {
          content?: never;
        };
      };
    };
  };
  "/users/theme": {
    patch: {
      requestBody: {
        content: {
          "application/json": {
            theme: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            "application/json": UserResponseDTO;
          };
        };
      };
    };
  };
  "/showcase/me": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": UserShowcaseResponseDTO;
          };
        };
      };
    };
  };
  "/showcase/highlights": {
    put: {
      requestBody: {
        content: {
          "application/json": UpdateProfileHighlightsRequestDTO;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": ProfileHighlightResponseDTO[];
          };
        };
      };
    };
  };
  "/showcase/profile": {
    patch: {
      requestBody: {
        content: {
          "application/json": UpdateShowcaseProfileRequestDTO;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": Record<string, unknown>;
          };
        };
      };
    };
  };
  "/showcase/achievements/unseen": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": AchievementItemResponseDTO[];
          };
        };
      };
    };
  };
  "/showcase/achievements/seen": {
    post: {
      responses: {
        200: {
          content?: never;
        };
        204: {
          content?: never;
        };
      };
    };
  };
  "/showcase/artifacts/seen": {
    post: {
      responses: {
        200: {
          content?: never;
        };
        204: {
          content?: never;
        };
      };
    };
  };
  "/showcase/users/{username}": {
    get: {
      parameters: {
        path: {
          username: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": PublicUserShowcaseData;
          };
        };
      };
    };
  };
  "/showcase/me/retrospective": {
    get: {
      parameters: {
        query?: {
          year?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": UserRetrospectiveData;
          };
        };
      };
    };
  };
  "/showcase/users/{username}/retrospective": {
    get: {
      parameters: {
        path: {
          username: string;
        };
        query?: {
          year?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": UserRetrospectiveData;
          };
        };
      };
    };
  };
  "/users/me/friend-code/regenerate": {
    post: {
      responses: {
        200: {
          content: {
            "application/json": UserResponseDTO;
          };
        };
      };
    };
  };
  "/users/me/privacy": {
    patch: {
      requestBody: {
        content: {
          "application/json": UpdatePrivacySettingsPayload;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": UserResponseDTO;
          };
        };
      };
    };
  };
  "/friends": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": FriendsOverviewData;
          };
        };
      };
    };
  };
  "/friends/search": {
    get: {
      parameters: {
        query: {
          q: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": SearchSocialUserItem[];
          };
        };
      };
    };
  };
  "/friends/requests": {
    post: {
      requestBody: {
        content: {
          "application/json": {
            username?: string;
            friendCode?: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            "application/json": SendFriendRequestResponse;
          };
        };
        201: {
          content: {
            "application/json": SendFriendRequestResponse;
          };
        };
      };
    };
  };
  "/friends/requests/{friendshipId}": {
    patch: {
      parameters: {
        path: {
          friendshipId: string;
        };
      };
      requestBody: {
        content: {
          "application/json": {
            accept: boolean;
          };
        };
      };
      responses: {
        200: {
          content: {
            "application/json": RespondFriendRequestResponse;
          };
        };
      };
    };
  };
  "/friends/{friendshipId}": {
    delete: {
      parameters: {
        path: {
          friendshipId: string;
        };
      };
      responses: {
        204: {
          content?: never;
        };
      };
    };
  };
  "/friends/block/{userId}": {
    post: {
      parameters: {
        path: {
          userId: string;
        };
      };
      responses: {
        204: {
          content?: never;
        };
      };
    };
  };
  "/friends/notifications": {
    get: {
      parameters: {
        query?: {
          limit?: number;
          unseenOnly?: boolean;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": SocialNotificationsFeed;
          };
        };
      };
    };
  };
  "/friends/notifications/seen": {
    post: {
      requestBody?: {
        content: {
          "application/json": {
            notificationId?: string;
          };
        };
      };
      responses: {
        204: {
          content?: never;
        };
      };
    };
  };
  "/api/v1/payments/founders-quota": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": FoundersQuotaDTO;
          };
        };
      };
    };
  };
  "/api/v1/payments/checkout": {
    post: {
      requestBody: {
        content: {
          "application/json": CheckoutRequestDTO;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": CheckoutResponseDTO;
          };
        };
      };
    };
  };
  "/api/v1/payments/portal": {
    post: {
      responses: {
        200: {
          content: {
            "application/json": { portalUrl: string };
          };
        };
      };
    };
  };
  "/api/v1/payments/confirm": {
    post: {
      requestBody: {
        content: {
          "application/json": { sessionId: string };
        };
      };
      responses: {
        200: {
          content: {
            "application/json": PaymentConfirmResponse;
          };
        };
      };
    };
  };
  "/api/v1/admin/overview": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": AdminOverviewDTO;
          };
        };
      };
    };
  };
  "/api/v1/admin/users": {
    get: {
      parameters: {
        query?: {
          search?: string;
          filter?: string;
          page?: number;
          size?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": AdminUsersPageResponse;
          };
        };
      };
    };
  };
  "/api/v1/admin/users/{userId}": {
    get: {
      parameters: {
        path: {
          userId: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": AdminUserDetailDTO;
          };
        };
      };
    };
  };
  "/api/v1/admin/users/{userId}/role": {
    patch: {
      parameters: {
        path: {
          userId: string;
        };
      };
      requestBody: {
        content: {
          "application/json": {
            role: "USER" | "ADMIN";
          };
        };
      };
      responses: {
        200: {
          content: {
            "application/json": UserResponseDTO;
          };
        };
      };
    };
  };
  "/rewards/group": {
    put: {
      requestBody: {
        content: {
          "application/json": UpdateRewardGroupDTO;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": RewardResponseDTO[];
          };
        };
      };
    };
    delete: {
      parameters: {
        query: {
          ids: string;
          deleteHistory?: boolean;
        };
      };
      responses: {
        204: {
          content?: never;
        };
      };
    };
  };
  "/rewards/group/has-history": {
    get: {
      parameters: {
        query: {
          ids: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              hasHistory?: boolean;
            };
          };
        };
      };
    };
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const RETRYABLE_SAFE_STATUSES = new Set([502, 503, 504]);
const SAFE_FETCH_RETRY_DELAYS_MS = [200, 500];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSafeRequestPathname(input: RequestInfo | URL): string {
  try {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    return new URL(rawUrl).pathname;
  } catch {
    return "unknown";
  }
}

/**
 * Wrapper de `fetch` com retry curto exclusivamente para métodos seguros/idempotentes (`GET`/`HEAD`)
 * diante de falhas transitórias de gateway (`502`/`503`/`504`) ou queda de socket (`ECONNRESET`),
 * registrando o status/erro real nos logs do servidor antes de propagar.
 */
const resilientServerFetch: typeof fetch = async (input, init) => {
  const method = (
    init?.method ?? (input instanceof Request ? input.method : "GET")
  ).toUpperCase();
  const isSafeIdempotent = method === "GET" || method === "HEAD";

  if (!isSafeIdempotent) {
    return globalThis.fetch(input, init);
  }

  const totalAttempts = SAFE_FETCH_RETRY_DELAYS_MS.length + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const attemptInput = input instanceof Request ? input.clone() : input;
    try {
      const response = await globalThis.fetch(attemptInput, init);
      if (
        !RETRYABLE_SAFE_STATUSES.has(response.status) ||
        attempt === totalAttempts - 1
      ) {
        if (response.status >= 500) {
          console.error(
            `[serverApi] ${method} ${getSafeRequestPathname(input)} -> HTTP ${response.status}`,
          );
        }
        return response;
      }

      console.warn(
        `[serverApi:retry] ${method} ${getSafeRequestPathname(input)} -> HTTP ${response.status} (tentativa ${attempt + 1}/${totalAttempts})`,
      );
      await response.body?.cancel().catch(() => {});
    } catch (err) {
      lastError = err;
      const isAborted =
        (input instanceof Request && input.signal?.aborted) ||
        Boolean(init?.signal?.aborted);
      if (isAborted || attempt === totalAttempts - 1) {
        console.error(
          `[serverApi] ${method} ${getSafeRequestPathname(input)} erro de rede:`,
          err instanceof Error ? err.message : String(err),
        );
        throw err;
      }
      console.warn(
        `[serverApi:retry] ${method} ${getSafeRequestPathname(input)} erro de rede (tentativa ${attempt + 1}/${totalAttempts}):`,
        err instanceof Error ? err.message : String(err),
      );
    }

    await sleep(SAFE_FETCH_RETRY_DELAYS_MS[attempt] ?? 300);
  }

  throw lastError;
};

/**
 * Erro tipado para respostas HTTP 401 (sessão expirada/revogada) provenientes da API.
 * Usado por serviços com `"use cache: private"` para impedir o cacheamento de falhas de autenticação
 * e permitir redirecionamento seguro para `/signIn?sessionExpired=1`.
 */
export class UnauthorizedApiError extends Error {
  readonly status = 401;

  constructor(message = "API_UNAUTHORIZED") {
    super(message);
    this.name = "UnauthorizedApiError";
  }
}

export function isUnauthorizedApiError(
  err: unknown,
): err is UnauthorizedApiError {
  return (
    err instanceof UnauthorizedApiError ||
    (typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name?: unknown }).name === "UnauthorizedApiError")
  );
}

/**
 * Força a renovação do access token via `/auth/refresh` (deduplicada entre chamadas concorrentes).
 * Em Route Handlers e Server Actions, persiste tanto o access token quanto o refresh token rotacionado.
 */
export async function refreshServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return null;
  }

  const pair = await requestDedupedTokenRefresh(refreshToken, API_BASE_URL);
  if (!pair?.accessToken) {
    return null;
  }

  try {
    if (pair.refreshToken) {
      await setAuthCookies(pair.accessToken, pair.refreshToken);
    } else {
      cookieStore.set(ACCESS_COOKIE_NAME, pair.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
      });
    }
  } catch {
    // Em Server Components de leitura, cookieStore.set não é permitido (o proxy.ts já persiste os cookies)
  }

  return pair.accessToken;
}

/**
 * Obtém ou renova silenciosamente o token JWT nas requisições do lado do servidor.
 * Envolvido por `React.cache()` para garantir que chamadas paralelas em um mesmo
 * ciclo de renderização reutilizem o mesmo token (e nunca disparem múltiplos `/auth/refresh`).
 */
export const getServerAuthToken = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  let token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!token || isJwtExpiredOrExpiringSoon(token, 0)) {
    token = (await refreshServerAccessToken()) ?? undefined;
  }

  return token || null;
});

/**
 * Middleware para injetar automaticamente o token JWT nas requisições do lado do servidor.
 * Lê o token dos cookies usando a API next/headers.
 */
const serverAuthMiddleware: Middleware = {
  async onRequest({ request }) {
    if (!request.headers.has("Authorization")) {
      const token = await getServerAuthToken();
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    try {
      const locale = await getLocaleMode();
      if (!request.headers.has("Accept-Language")) {
        request.headers.set("Accept-Language", locale);
      }

      const incomingHeaders = await headers();
      const cfIp = incomingHeaders.get("cf-connecting-ip");
      const forwardedFor = incomingHeaders.get("x-forwarded-for");
      const realIp = incomingHeaders.get("x-real-ip");

      if (cfIp && !request.headers.has("CF-Connecting-IP")) {
        request.headers.set("CF-Connecting-IP", cfIp);
      }
      if (forwardedFor && !request.headers.has("X-Forwarded-For")) {
        request.headers.set("X-Forwarded-For", forwardedFor);
      }
      if (realIp && !request.headers.has("X-Real-IP")) {
        request.headers.set("X-Real-IP", realIp);
      }
    } catch {
      // Ignora caso headers() seja chamado fora de um contexto de request HTTP
    }

    return request;
  },
};

/**
 * Constrói os cabeçalhos padrão de forwarding (Authorization, Accept-Language e IPs do cliente)
 * para chamadas diretas ao backend em Route Handlers e Server Actions multipart/streaming.
 */
export async function buildServerForwardHeaders(): Promise<Headers> {
  const out = new Headers();
  const token = await getServerAuthToken();
  if (token) {
    out.set("Authorization", `Bearer ${token}`);
  }

  try {
    const locale = await getLocaleMode();
    out.set("Accept-Language", locale);

    const incomingHeaders = await headers();
    const cfIp = incomingHeaders.get("cf-connecting-ip");
    const forwardedFor = incomingHeaders.get("x-forwarded-for");
    const realIp = incomingHeaders.get("x-real-ip");

    if (cfIp) out.set("CF-Connecting-IP", cfIp);
    if (forwardedFor) out.set("X-Forwarded-For", forwardedFor);
    if (realIp) out.set("X-Real-IP", realIp);
  } catch {
    // Ignora fora de contexto HTTP
  }

  return out;
}

export { API_BASE_URL };

/**
 * Cliente HTTP tipado 100% type-safe para uso em Server Components e Server Actions autenticados.
 */
export const serverApi = createClient<ExtendedApiPaths>({
  baseUrl: API_BASE_URL,
  fetch: resilientServerFetch,
});

serverApi.use(serverAuthMiddleware);

/**
 * Cliente HTTP tipado para endpoints públicos sem acesso a `cookies()` ou `headers()`,
 * seguro para uso dentro de escopos `"use cache"` e pré-renderização estática.
 */
export const publicServerApi = createClient<ExtendedApiPaths>({
  baseUrl: API_BASE_URL,
  fetch: resilientServerFetch,
});

export default serverApi;
