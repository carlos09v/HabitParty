/**
 * Utilitários de inspeção de expiração de JWT e renovação deduplicada de tokens.
 * Compatível com runtime Node.js e Edge (usa apenas APIs padrão Web).
 */

export const ACCESS_COOKIE_NAME = "habitparty_token";
export const REFRESH_COOKIE_NAME = "habitparty_refresh_token";

/**
 * TTL do cookie do access token: 1h59min (60s menor que o TTL de 2h do JWT no backend)
 * para evitar que o navegador envie um JWT já expirado por latência ou clock skew.
 */
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 2 - 60;
export const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface RefreshedTokenPair {
  accessToken: string;
  refreshToken: string | null;
}

const RECENT_REFRESH_TTL_MS = 5_000;
const MAX_RECENT_REFRESH_ENTRIES = 500;

const inFlightRefreshes = new Map<string, Promise<RefreshedTokenPair | null>>();
const recentRefreshes = new Map<
  string,
  { tokens: RefreshedTokenPair; expiresAt: number }
>();

function decodeBase64UrlToUtf8(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLength);
    if (typeof atob === "function") {
      return atob(padded);
    }
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

/**
 * Lê o claim `exp` (segundos Unix) do JWT sem validar assinatura (validação criptográfica
 * permanece responsabilidade do backend). Retorna `null` se o token estiver malformado.
 */
export function readJwtExpirationSeconds(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }
  const decoded = decodeBase64UrlToUtf8(parts[1]);
  if (!decoded) {
    return null;
  }
  try {
    const payload = JSON.parse(decoded) as { exp?: unknown };
    return typeof payload.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp
      : null;
  } catch {
    return null;
  }
}

/**
 * Indica se o JWT já expirou ou expirará dentro de `bufferSeconds`.
 * Tokens malformados (sem claim `exp` legível) são tratados como expirados.
 */
export function isJwtExpiredOrExpiringSoon(
  token: string,
  bufferSeconds = 60,
): boolean {
  const expSeconds = readJwtExpirationSeconds(token);
  if (expSeconds === null) {
    return true;
  }
  const nowSeconds = Date.now() / 1000;
  return expSeconds <= nowSeconds + bufferSeconds;
}

function pruneRecentRefreshes(now: number) {
  for (const [key, entry] of recentRefreshes.entries()) {
    if (entry.expiresAt <= now) {
      recentRefreshes.delete(key);
    }
  }
  while (recentRefreshes.size > MAX_RECENT_REFRESH_ENTRIES) {
    const oldestKey = recentRefreshes.keys().next().value;
    if (oldestKey === undefined) break;
    recentRefreshes.delete(oldestKey);
  }
}

/**
 * Executa `POST /auth/refresh` deduplicando chamadas simultâneas e rajadas curtas (5s)
 * para o mesmo `refreshToken`. Impede que prefetches paralelos da Sidebar ou ações
 * concorrentes falhem após a rotação/revogação imediata do refresh token no backend.
 */
export async function requestDedupedTokenRefresh(
  refreshToken: string,
  apiBaseUrl: string,
): Promise<RefreshedTokenPair | null> {
  if (!refreshToken) {
    return null;
  }

  const now = Date.now();
  const recent = recentRefreshes.get(refreshToken);
  if (recent && recent.expiresAt > now) {
    return recent.tokens;
  }

  const existingPromise = inFlightRefreshes.get(refreshToken);
  if (existingPromise) {
    return existingPromise;
  }

  const refreshPromise = (async (): Promise<RefreshedTokenPair | null> => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (!res.ok) {
        return null;
      }

      const data = (await res.json()) as {
        accessToken?: string;
        token?: string;
        refreshToken?: string;
      };
      const accessToken = data.accessToken || data.token;
      if (!accessToken) {
        return null;
      }

      const pair: RefreshedTokenPair = {
        accessToken,
        refreshToken: data.refreshToken || null,
      };

      const completedAt = Date.now();
      pruneRecentRefreshes(completedAt);
      recentRefreshes.set(refreshToken, {
        tokens: pair,
        expiresAt: completedAt + RECENT_REFRESH_TTL_MS,
      });

      return pair;
    } catch (err) {
      console.error("[AuthRefresh:requestDedupedTokenRefresh]", err);
      return null;
    } finally {
      inFlightRefreshes.delete(refreshToken);
    }
  })();

  inFlightRefreshes.set(refreshToken, refreshPromise);
  return refreshPromise;
}
