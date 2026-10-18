"use server";

import { updateTag } from "next/cache";
import { serverApi } from "@/api/server";
import type {
  CreateFocusActivityDTO,
  CreateFocusRecordDTO,
  FocusActivityResponseDTO,
  FocusRecordResponseDTO,
  UpdateFocusActivityDTO,
  UpdateFocusActivityOrderDTO,
  UpdateFocusRecordDTO,
} from "@/types/focus";
import { type ActionState, getErrorMessage } from "./types";

/**
 * Cria uma nova atividade de foco
 */
export async function createFocusActivityAction(
  dto: CreateFocusActivityDTO,
): Promise<ActionState<FocusActivityResponseDTO>> {
  const { data, error } = await serverApi.POST("/focus-activities", {
    body: dto,
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao criar atividade de foco."),
    };
  }

  updateTag("focus-activities");
  return { success: true, data: data as FocusActivityResponseDTO };
}

/**
 * Atualiza uma atividade de foco
 */
export async function updateFocusActivityAction(
  activityId: string,
  dto: UpdateFocusActivityDTO,
): Promise<ActionState<FocusActivityResponseDTO>> {
  const { data, error } = await serverApi.PUT(
    "/focus-activities/{activityId}",
    {
      params: { path: { activityId } },
      body: dto,
    },
  );

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao atualizar atividade de foco."),
    };
  }

  updateTag("focus-activities");
  return { success: true, data: data as FocusActivityResponseDTO };
}

/**
 * Exclui uma atividade de foco
 */
export async function deleteFocusActivityAction(
  activityId: string,
  deleteHistory = false,
): Promise<ActionState<void>> {
  const { error } = await serverApi.DELETE("/focus-activities/{activityId}", {
    params: {
      path: { activityId },
      query: { deleteHistory },
    },
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao excluir atividade de foco."),
    };
  }

  updateTag("focus-activities");
  updateTag("focus-records");
  return { success: true };
}

/**
 * Reordena as atividades de foco
 */
export async function reorderFocusActivitiesAction(
  updates: UpdateFocusActivityOrderDTO[],
): Promise<ActionState<void>> {
  const { error } = await serverApi.PUT("/focus-activities/reorder", {
    body: updates,
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao reordenar atividades."),
    };
  }

  updateTag("focus-activities");
  return { success: true };
}

/**
 * Registra uma sessão de foco concluída
 */
export async function createFocusRecordAction(
  dto: CreateFocusRecordDTO,
): Promise<ActionState<FocusRecordResponseDTO>> {
  const { data, error } = await serverApi.POST("/focus-records", {
    body: dto,
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao salvar registro de foco."),
    };
  }

  updateTag("focus-records");
  updateTag("inventory");
  updateTag("user");
  updateTag("transactions");
  return { success: true, data: data as FocusRecordResponseDTO };
}

/**
 * Atualiza um registro de foco existente
 */
export async function updateFocusRecordAction(
  recordId: string,
  dto: UpdateFocusRecordDTO,
): Promise<ActionState<FocusRecordResponseDTO>> {
  const { data, error } = await serverApi.PUT("/focus-records/{recordId}", {
    params: { path: { recordId } },
    body: dto,
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao atualizar registro de foco."),
    };
  }

  updateTag("focus-records");
  return { success: true, data: data as FocusRecordResponseDTO };
}

/**
 * Exclui um registro de foco
 */
export async function deleteFocusRecordAction(
  recordId: string,
): Promise<ActionState<void>> {
  const { error } = await serverApi.DELETE("/focus-records/{recordId}", {
    params: { path: { recordId } },
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao excluir registro de foco."),
    };
  }

  updateTag("focus-records");
  return { success: true };
}

import {
  returnItemToBackpack as inventoryReturnItemToBackpack,
  sendItemToFocus as inventorySendItemToFocus,
} from "./inventoryActions";

// Wrappers para retrocompatibilidade com componentes que importavam do focusActions
export async function returnItemToBackpack(itemId: string) {
  return inventoryReturnItemToBackpack(itemId);
}

export async function returnItemToBackpackAction(itemId: string) {
  return inventoryReturnItemToBackpack(itemId);
}

export async function sendItemToFocus(itemId: string) {
  return inventorySendItemToFocus(itemId);
}

export async function sendItemToFocusAction(itemId: string) {
  return inventorySendItemToFocus(itemId);
}

// Aliases padronizados sem o sufixo "Action"
export async function createFocusActivity(payload: CreateFocusActivityDTO) {
  return createFocusActivityAction(payload);
}

export async function updateFocusActivity(
  activityId: string,
  payload: UpdateFocusActivityDTO,
) {
  return updateFocusActivityAction(activityId, payload);
}

export async function deleteFocusActivity(activityId: string) {
  return deleteFocusActivityAction(activityId);
}

export async function reorderFocusActivities(
  updates: UpdateFocusActivityOrderDTO[],
) {
  return reorderFocusActivitiesAction(updates);
}

export async function createFocusRecord(payload: CreateFocusRecordDTO) {
  return createFocusRecordAction(payload);
}

export async function updateFocusRecord(
  recordId: string,
  payload: UpdateFocusRecordDTO,
) {
  return updateFocusRecordAction(recordId, payload);
}

export async function deleteFocusRecord(recordId: string) {
  return deleteFocusRecordAction(recordId);
}
