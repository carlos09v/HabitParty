import { cookies } from "next/headers";
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Middleware para injetar automaticamente o token JWT nas requisições do lado do servidor.
 * Lê o token dos cookies usando a API next/headers.
 */
const serverAuthMiddleware: Middleware = {
  async onRequest({ request }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("habitparty_token")?.value;

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
