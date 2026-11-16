import { cookies, headers } from "next/headers";
import createClient, { type Middleware } from "openapi-fetch";
import { cache } from "react";
import type { PaymentConfirmResponse } from "@/actions/paymentActions";
import type {
  CheckoutRequestDTO,
  CheckoutResponseDTO,
  FoundersQuotaDTO,
} from "@/types/payment";
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
import type { paths } from "./schema";

export type ExtendedApiPaths = paths & {
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
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Obtém ou renova silenciosamente o token JWT nas requisições do lado do servidor.
 * Envolvido por `React.cache()` para garantir que chamadas paralelas em um mesmo
 * ciclo de renderização reutilizem o mesmo token (e nunca disparem múltiplos `/auth/refresh`).
 */
export const getServerAuthToken = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  let token = cookieStore.get("habitparty_token")?.value;

  if (!token) {
    const refreshToken = cookieStore.get("habitparty_refresh_token")?.value;
    if (refreshToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          const newToken = data.accessToken || data.token;
          if (newToken) {
            token = newToken;
            try {
              cookieStore.set("habitparty_token", newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 2,
              });
            } catch {
              // Em Server Components de leitura, cookieStore.set pode não ser permitido
            }
          }
        }
      } catch (err) {
        console.error("[serverAuthMiddleware:SilentRefresh]", err);
      }
    }
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
 * Cliente HTTP tipado 100% type-safe para uso em Server Components e Server Actions autenticados.
 */
export const serverApi = createClient<ExtendedApiPaths>({
  baseUrl: API_BASE_URL,
});

serverApi.use(serverAuthMiddleware);

/**
 * Cliente HTTP tipado para endpoints públicos sem acesso a `cookies()` ou `headers()`,
 * seguro para uso dentro de escopos `"use cache"` e pré-renderização estática.
 */
export const publicServerApi = createClient<ExtendedApiPaths>({
  baseUrl: API_BASE_URL,
});

export default serverApi;
