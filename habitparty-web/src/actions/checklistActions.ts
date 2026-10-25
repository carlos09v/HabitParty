"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import { type ActionState, getErrorMessage } from "./types";

type CreateChecklistItemDTO = components["schemas"]["CreateChecklistItemDTO"];
type ChecklistItemResponseDTO =
  components["schemas"]["ChecklistItemResponseDTO"];

function invalidateChecklistTags() {
  updateTag("tasks");
  updateTag("dashboard-tasks");
  updateTag("kanban");
}

/**
 * Adiciona um novo item de checklist vinculado a uma tarefa
 */
export async function addChecklistItem(
  taskId: string,
  payload: CreateChecklistItemDTO,
): Promise<ActionState<ChecklistItemResponseDTO>> {
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

    invalidateChecklistTags();

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
export async function updateChecklistItem(
  itemId: string,
  payload: CreateChecklistItemDTO,
): Promise<ActionState<ChecklistItemResponseDTO>> {
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

    invalidateChecklistTags();

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
export async function toggleChecklistItem(
  itemId: string,
): Promise<ActionState<ChecklistItemResponseDTO>> {
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

    invalidateChecklistTags();

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
export async function deleteChecklistItem(
  itemId: string,
): Promise<ActionState<void>> {
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

    invalidateChecklistTags();

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[ChecklistAction:Delete]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Clona todos os itens válidos de um checklist para uma nova tarefa em ordem sequencial,
 * invalidando o cache de tarefas apenas uma vez ao final.
 */
export async function cloneTaskChecklistItems(
  newTaskId: string,
  items?: { name?: string }[],
): Promise<ChecklistItemResponseDTO[]> {
  if (!items || items.length === 0) return [];
  const validItems = items.filter((item) => Boolean(item.name?.trim()));
  if (validItems.length === 0) return [];

  const createdItems: ChecklistItemResponseDTO[] = [];
  for (const item of validItems) {
    try {
      const { data } = await serverApi.POST("/tasks/{taskId}/checklists", {
        params: { path: { taskId: newTaskId } },
        body: { name: item.name as string },
      });
      if (data) {
        createdItems.push(data as ChecklistItemResponseDTO);
      }
    } catch (err) {
      console.error("[ChecklistAction:Clone]", err);
    }
  }

  invalidateChecklistTags();

  return createdItems;
}
