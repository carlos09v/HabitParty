import { cookies } from "next/headers";
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Obtém ou renova silenciosamente o token JWT nas requisições do lado do servidor.
 */
export async function getServerAuthToken(): Promise<string | null> {
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
}

/**
 * Middleware para injetar automaticamente o token JWT nas requisições do lado do servidor.
 * Lê o token dos cookies usando a API next/headers.
 */
const serverAuthMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = await getServerAuthToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
};

/**
 * Cliente HTTP tipado 100% type-safe para uso em Server Components e Server Actions.
 */
export const serverApi = createClient<paths>({
  baseUrl: API_BASE_URL,
});

serverApi.use(serverAuthMiddleware);

export default serverApi;
