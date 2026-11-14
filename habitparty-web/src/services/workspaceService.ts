import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import type { WorkspaceResponseDTO } from "@/types/workspace";

/**
 * Busca a lista de workspaces do usuário autenticado.
 * Cacheada de forma privada no Router Cache do navegador por 5 minutos (`catalog`)
 * e deduplicada automaticamente dentro do mesmo ciclo de renderização.
 */
export async function getWorkspaces(): Promise<WorkspaceResponseDTO[]> {
  "use cache: private";
  cacheLife("catalog");
  cacheTag("workspaces");

  const { data, error } = await serverApi.GET("/workspaces");

  if (error || !data) {
    return [];
  }

  return data;
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
