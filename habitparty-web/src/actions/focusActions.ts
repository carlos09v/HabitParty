"use server";

import { getTranslations } from "next-intl/server";
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
import { invalidateFocusDomainTags } from "./cacheInvalidation";
import { type ActionState, getErrorMessage } from "./types";

/**
 * Cria uma nova atividade de foco
 */
export async function createFocusActivity(
  dto: CreateFocusActivityDTO,
): Promise<ActionState<FocusActivityResponseDTO>> {
  const t = await getTranslations("focus.actions");
  try {
    const { data, error } = await serverApi.POST("/focus-activities", {
      body: dto,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("createActivityFailed")),
      };
    }

    invalidateFocusDomainTags({ activities: true });
    return { success: true, data: data as FocusActivityResponseDTO };
  } catch (err) {
    console.error("[FocusAction:CreateActivity]", err);
    return {
      success: false,
      error: t("communicationError"),
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
  const t = await getTranslations("focus.actions");
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
        error: getErrorMessage(error, t("updateActivityFailed")),
      };
    }

    invalidateFocusDomainTags({ activities: true });
    return { success: true, data: data as FocusActivityResponseDTO };
  } catch (err) {
    console.error("[FocusAction:UpdateActivity]", err);
    return {
      success: false,
      error: t("communicationError"),
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
  const t = await getTranslations("focus.actions");
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
        error: getErrorMessage(error, t("deleteActivityFailed")),
      };
    }

    invalidateFocusDomainTags({
      activities: true,
      records: true,
      rewardsAndInventory: deleteHistory,
      tasks: deleteHistory,
    });
    return { success: true };
  } catch (err) {
    console.error("[FocusAction:DeleteActivity]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Reordena as atividades de foco
 */
export async function reorderFocusActivities(
  updates: UpdateFocusActivityOrderDTO[],
): Promise<ActionState<void>> {
  const t = await getTranslations("focus.actions");
  try {
    const { error } = await serverApi.PUT("/focus-activities/reorder", {
      body: updates,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("reorderActivitiesFailed")),
      };
    }

    invalidateFocusDomainTags({ activities: true });
    return { success: true };
  } catch (err) {
    console.error("[FocusAction:ReorderActivities]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Registra uma sessão de foco concluída
 */
export async function createFocusRecord(
  dto: CreateFocusRecordDTO,
): Promise<ActionState<FocusRecordResponseDTO>> {
  const t = await getTranslations("focus.actions");
  try {
    const { data, error } = await serverApi.POST("/focus-records", {
      body: dto,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("createRecordFailed")),
      };
    }

    invalidateFocusDomainTags({
      records: true,
      rewardsAndInventory: true,
      tasks: Boolean(dto.taskId),
    });
    return { success: true, data: data as FocusRecordResponseDTO };
  } catch (err) {
    console.error("[FocusAction:CreateRecord]", err);
    return {
      success: false,
      error: t("communicationError"),
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
  const t = await getTranslations("focus.actions");
  try {
    const { data, error } = await serverApi.PUT("/focus-records/{recordId}", {
      params: { path: { recordId } },
      body: dto,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateRecordFailed")),
      };
    }

    invalidateFocusDomainTags({ records: true, tasks: true });
    return { success: true, data: data as FocusRecordResponseDTO };
  } catch (err) {
    console.error("[FocusAction:UpdateRecord]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Exclui um registro de foco
 */
export async function deleteFocusRecord(
  recordId: string,
  deleteHistory = false,
): Promise<ActionState<void>> {
  const t = await getTranslations("focus.actions");
  try {
    const { error } = await serverApi.DELETE("/focus-records/{recordId}", {
      params: { path: { recordId }, query: { deleteHistory } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteRecordFailed")),
      };
    }

    invalidateFocusDomainTags({
      records: true,
      rewardsAndInventory: true,
      tasks: true,
    });
    return { success: true };
  } catch (err) {
    console.error("[FocusAction:DeleteRecord]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export interface TaskFocusRecordsPage {
  records: FocusRecordResponseDTO[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

/**
 * Busca os registros de foco vinculados a uma tarefa específica (paginado)
 */
export async function getTaskFocusRecords(
  taskId: string,
  page = 0,
): Promise<ActionState<TaskFocusRecordsPage>> {
  const t = await getTranslations("focus.actions");
  try {
    const { data, error } = await serverApi.GET(
      "/focus-records/task/{taskId}",
      {
        params: {
          path: { taskId },
          query: { page },
        },
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("communicationError")),
      };
    }

    return {
      success: true,
      data: {
        records: data?.content || [],
        totalPages: data?.totalPages || 0,
        totalElements: data?.totalElements || 0,
        currentPage: data?.number !== undefined ? data.number : page,
      },
    };
  } catch (err) {
    console.error("[FocusAction:GetByTask]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}
