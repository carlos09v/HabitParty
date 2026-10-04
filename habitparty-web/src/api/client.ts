import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Middleware para injetar automaticamente o token JWT nas requisições autenticadas.
 * Lê o token do localStorage (no cliente) ou cookies se disponível.
 */
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("habitparty_token");
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return request;
  },
  async onResponse({ response }) {
    // Se receber 401 (Não autorizado), pode tratar deslogar ou redirecionar
    if (response.status === 401 && typeof window !== "undefined") {
      // Exemplo: evento customizado ou limpeza de sessão
    }
    return response;
  },
};

/**
 * Cliente HTTP tipado 100% type-safe baseado no OpenAPI / Swagger do backend.
 */
export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
});

api.use(authMiddleware);

export default api;
