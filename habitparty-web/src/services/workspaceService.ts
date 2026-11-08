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
