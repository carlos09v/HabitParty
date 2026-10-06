"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";

type CreateWorkspaceDTO = components["schemas"]["CreateWorkspaceDTO"];
type UpdateWorkspaceDTO = components["schemas"]["UpdateWorkspaceDTO"];
type WorkspaceResponseDTO = components["schemas"]["WorkspaceResponseDTO"];

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Cria um novo Workspace
 */
export async function createWorkspaceAction(
  payload: CreateWorkspaceDTO,
): Promise<ActionResponse<WorkspaceResponseDTO>> {
  try {
    const { data, error } = await serverApi.POST("/workspaces", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: "Falha ao criar o workspace. Tente novamente.",
      };
    }

    updateTag("workspaces");

    return { success: true, data: data as WorkspaceResponseDTO };
  } catch (err) {
    console.error("[WorkspaceAction:Create]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Atualiza um Workspace existente
 */
export async function updateWorkspaceAction(
  workspaceId: string,
  payload: UpdateWorkspaceDTO,
): Promise<ActionResponse<WorkspaceResponseDTO>> {
  try {
    const { data, error } = await serverApi.PUT("/workspaces/{workspaceId}", {
      params: {
        path: { workspaceId },
      },
      body: payload,
    });

    if (error) {
      return { success: false, error: "Falha ao atualizar o workspace." };
    }

    updateTag("workspaces");
    updateTag(`workspace-${workspaceId}`);

    return { success: true, data: data as WorkspaceResponseDTO };
  } catch (err) {
    console.error("[WorkspaceAction:Update]", err);
    return { success: false, error: "Erro interno de comunicação." };
  }
}

/**
 * Exclui um Workspace
 */
export async function deleteWorkspaceAction(
  id: string,
): Promise<ActionResponse> {
  try {
    const { error } = await serverApi.DELETE("/workspaces/{id}", {
      params: {
        path: { id },
      },
    });

    if (error) {
      return { success: false, error: "Falha ao excluir o workspace." };
    }

    updateTag("workspaces");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[WorkspaceAction:Delete]", err);
    return { success: false, error: "Erro interno de comunicação." };
  }
}
