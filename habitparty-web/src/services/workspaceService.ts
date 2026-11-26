import { cacheLife, cacheTag } from "next/cache";
import {
  getServerAuthToken,
  serverApi,
  UnauthorizedApiError,
} from "@/api/server";
import type { WorkspaceResponseDTO } from "@/types/workspace";

async function fetchWorkspacesCached(): Promise<WorkspaceResponseDTO[]> {
  "use cache: private";
  cacheLife("catalog");
  cacheTag("workspaces");

  const { data, error, response } = await serverApi.GET("/workspaces");

  if (response?.status === 401) {
    throw new UnauthorizedApiError("WORKSPACES_UNAUTHORIZED");
  }

  if (error || !Array.isArray(data)) {
    throw new Error("WORKSPACES_FETCH_FAILED");
  }

  return data;
}

/**
 * Busca a lista de workspaces do usuário autenticado de forma estrita (propaga 401 e falhas
 * de rede/servidor para impedir falso estado vazio em rotas dependentes de ambientes).
 * Nunca armazena falhas transitórias no cache privado.
 */
export async function getWorkspacesStrict(): Promise<WorkspaceResponseDTO[]> {
  const token = await getServerAuthToken();
  if (!token) {
    throw new UnauthorizedApiError("WORKSPACES_MISSING_TOKEN");
  }

  return fetchWorkspacesCached();
}

/**
 * Busca a lista de workspaces do usuário autenticado com fallback suave para `[]` em caso de falha,
 * sem jamais envenenar o cache privado com resultados vazios de erro.
 */
export async function getWorkspaces(): Promise<WorkspaceResponseDTO[]> {
  const token = await getServerAuthToken();
  if (!token) {
    return [];
  }

  try {
    return await fetchWorkspacesCached();
  } catch (err) {
    console.error("[WorkspaceService:getWorkspaces]", err);
    return [];
  }
}

/**
 * Resolve de forma unificada o workspace ativo a partir do ID solicitado (cookie/parâmetro),
 * caindo de volta para o primeiro workspace disponível caso o ID não exista mais.
 */
export function resolveActiveWorkspace(
  workspaces: WorkspaceResponseDTO[],
  requestedWorkspaceId?: string | null,
): {
  activeWorkspace: WorkspaceResponseDTO | null;
  activeWorkspaceId: string | null;
} {
  if (!workspaces || workspaces.length === 0) {
    return { activeWorkspace: null, activeWorkspaceId: null };
  }

  const matched = requestedWorkspaceId
    ? workspaces.find((w) => w.id === requestedWorkspaceId)
    : undefined;
  const activeWorkspace = matched || workspaces[0] || null;

  return {
    activeWorkspace,
    activeWorkspaceId: activeWorkspace?.id || null,
  };
}
