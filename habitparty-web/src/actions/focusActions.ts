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

function invalidateFocusTags(options?: {
  activities?: boolean;
  records?: boolean;
  rewardsAndInventory?: boolean;
}) {
  if (options?.activities) {
    updateTag("focus-activities");
  }
  if (options?.records) {
    updateTag("focus-records");
  }
  if (options?.rewardsAndInventory) {
    updateTag("inventory");
    updateTag("user");
    updateTag("transactions");
  }
}

/**
 * Cria uma nova atividade de foco
 */
export async function createFocusActivity(
  dto: CreateFocusActivityDTO,
): Promise<ActionState<FocusActivityResponseDTO>> {
  try {
    const { data, error } = await serverApi.POST("/focus-activities", {
      body: dto,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao criar atividade de foco."),
      };
    }

    invalidateFocusTags({ activities: true });
    return { success: true, data: data as FocusActivityResponseDTO };
  } catch (err) {
    console.error("[FocusAction:CreateActivity]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Atualiza uma atividade de foco
 */
export async function updateFocusActivity(
  activityId: string,
  dto: UpdateFocusActivityDTO,
): Promise<ActionState<FocusActivityResponseDTO>> {
  try {
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

    invalidateFocusTags({ activities: true });
    return { success: true, data: data as FocusActivityResponseDTO };
  } catch (err) {
    console.error("[FocusAction:UpdateActivity]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Exclui uma atividade de foco
 */
export async function deleteFocusActivity(
  activityId: string,
  deleteHistory = false,
): Promise<ActionState<void>> {
  try {
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

    invalidateFocusTags({ activities: true, records: true });
    return { success: true };
  } catch (err) {
    console.error("[FocusAction:DeleteActivity]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Reordena as atividades de foco
 */
export async function reorderFocusActivities(
  updates: UpdateFocusActivityOrderDTO[],
): Promise<ActionState<void>> {
  try {
    const { error } = await serverApi.PUT("/focus-activities/reorder", {
      body: updates,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao reordenar atividades."),
      };
    }

    invalidateFocusTags({ activities: true });
    return { success: true };
  } catch (err) {
    console.error("[FocusAction:ReorderActivities]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Registra uma sessão de foco concluída
 */
export async function createFocusRecord(
  dto: CreateFocusRecordDTO,
): Promise<ActionState<FocusRecordResponseDTO>> {
  try {
    const { data, error } = await serverApi.POST("/focus-records", {
      body: dto,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao salvar registro de foco."),
      };
    }

    invalidateFocusTags({ records: true, rewardsAndInventory: true });
    return { success: true, data: data as FocusRecordResponseDTO };
  } catch (err) {
    console.error("[FocusAction:CreateRecord]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Atualiza um registro de foco existente
 */
export async function updateFocusRecord(
  recordId: string,
  dto: UpdateFocusRecordDTO,
): Promise<ActionState<FocusRecordResponseDTO>> {
  try {
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

    invalidateFocusTags({ records: true });
    return { success: true, data: data as FocusRecordResponseDTO };
  } catch (err) {
    console.error("[FocusAction:UpdateRecord]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Exclui um registro de foco
 */
export async function deleteFocusRecord(
  recordId: string,
): Promise<ActionState<void>> {
  try {
    const { error } = await serverApi.DELETE("/focus-records/{recordId}", {
      params: { path: { recordId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao excluir registro de foco."),
      };
    }

    invalidateFocusTags({ records: true, rewardsAndInventory: true });
    return { success: true };
  } catch (err) {
    console.error("[FocusAction:DeleteRecord]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}
