"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";

import { getErrorMessage } from "./types";

type CreateChecklistItemDTO = components["schemas"]["CreateChecklistItemDTO"];
type ChecklistItemResponseDTO =
  components["schemas"]["ChecklistItemResponseDTO"];

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Adiciona um novo item de checklist vinculado a uma tarefa
 */
export async function addChecklistItemAction(
  taskId: string,
  payload: CreateChecklistItemDTO,
): Promise<ActionResponse<ChecklistItemResponseDTO>> {
  try {
    const { data, error } = await serverApi.POST("/tasks/{taskId}/checklists", {
      params: { path: { taskId } },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao adicionar item ao checklist."),
      };
    }

    updateTag("tasks");

    return { success: true, data: data as ChecklistItemResponseDTO };
  } catch (err) {
    console.error("[ChecklistAction:Add]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Atualiza o texto de um item de checklist
 */
export async function updateChecklistItemAction(
  itemId: string,
  payload: CreateChecklistItemDTO,
): Promise<ActionResponse<ChecklistItemResponseDTO>> {
  try {
    const { data, error } = await serverApi.PUT("/tasks/checklists/{itemId}", {
      params: { path: { itemId } },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao atualizar item do checklist."),
      };
    }

    updateTag("tasks");

    return { success: true, data: data as ChecklistItemResponseDTO };
  } catch (err) {
    console.error("[ChecklistAction:Update]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Alterna (toggle) a conclusão do checkbox de um item de checklist
 */
export async function toggleChecklistItemAction(
  itemId: string,
): Promise<ActionResponse<ChecklistItemResponseDTO>> {
  try {
    const { data, error } = await serverApi.PATCH(
      "/tasks/checklists/{itemId}/toggle",
      {
        params: { path: { itemId } },
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao marcar item do checklist."),
      };
    }

    updateTag("tasks");

    return { success: true, data: data as ChecklistItemResponseDTO };
  } catch (err) {
    console.error("[ChecklistAction:Toggle]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Remove um item do checklist
 */
export async function deleteChecklistItemAction(
  itemId: string,
): Promise<ActionResponse<void>> {
  try {
    const { error } = await serverApi.DELETE("/tasks/checklists/{itemId}", {
      params: { path: { itemId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao excluir item do checklist."),
      };
    }

    updateTag("tasks");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[ChecklistAction:Delete]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}
