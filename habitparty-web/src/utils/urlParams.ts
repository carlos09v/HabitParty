/**
 * Utilitários leves de manipulação de URL (client-side) e cookie de workspace ativo.
 */

export const ACTIVE_WORKSPACE_COOKIE_NAME = "activeWorkspaceId";
const ONE_YEAR_SECONDS = 31536000;

/**
 * Atualiza parâmetros de query da URL atual via `window.history.replaceState`
 * preservando `window.history.state` (necessário para o App Router do Next.js).
 */
export function replaceUrlSearchParams(
  mutate: (params: URLSearchParams) => void,
): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  mutate(params);
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl === currentUrl) return;
  window.history.replaceState(window.history.state, "", nextUrl);
}

/**
 * Sincroniza o cookie `activeWorkspaceId` no navegador (ou limpa-o quando `null`).
 */
export function setActiveWorkspaceCookie(workspaceId: string | null): void {
  if (typeof document === "undefined") return;
  if (!workspaceId) {
    // biome-ignore lint/suspicious/noDocumentCookie: cookie compartilhado entre client e RSC para workspace ativo
    document.cookie = `${ACTIVE_WORKSPACE_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  // biome-ignore lint/suspicious/noDocumentCookie: cookie compartilhado entre client e RSC para workspace ativo
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE_NAME}=${encodeURIComponent(workspaceId)}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}
