"use server";

import { getTranslations } from "next-intl/server";
import { serverApi } from "@/api/server";
import { getRequestLocale } from "@/i18n/request";
import type {
  CreateFocusActivityDTO,
  CreateFocusRecordDTO,
  FocusActivity,
  FocusActivityDeletionSummaryResponseDTO,
  FocusActivityResponseDTO,
  FocusRecordResponseDTO,
  FocusSummaryData,
  UpdateFocusActivityDTO,
  UpdateFocusActivityOrderDTO,
  UpdateFocusRecordDTO,
} from "@/types/focus";
import {
  type FocusRecordsPageResult,
  mapFocusActivities,
  normalizeFocusRecordsPage,
  normalizeFocusSummary,
} from "@/utils/focusMapper";
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
 * Busca o resumo de impacto econômico (registros, XP e moedas) antes de excluir uma atividade.
 */
export async function getFocusActivityDeletionSummary(
  activityId: string,
): Promise<ActionState<FocusActivityDeletionSummaryResponseDTO>> {
  const t = await getTranslations("focus.actions");
  try {
    const { data, error } = await serverApi.GET(
      "/focus-activities/{activityId}/deletion-summary",
      {
        params: { path: { activityId } },
        cache: "no-store",
      },
    );

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("communicationError")),
      };
    }

    return {
      success: true,
      data: {
        totalRecordsCount: Number(data.totalRecordsCount ?? 0),
        totalXpEarned: Number(data.totalXpEarned ?? 0),
        totalCoinsEarned: Number(data.totalCoinsEarned ?? 0),
      },
    };
  } catch (err) {
    console.error("[FocusAction:GetActivityDeletionSummary]", err);
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

    const hasFullPayload =
      dto.startTime !== undefined ||
      dto.endTime !== undefined ||
      dto.focusActivityId !== undefined ||
      dto.inventoryItemId !== undefined ||
      dto.taskId !== undefined ||
      dto.recordType !== undefined ||
      dto.completedPomos !== undefined ||
      dto.pomoTargetMinutes !== undefined;

    invalidateFocusDomainTags({
      records: true,
      rewardsAndInventory: hasFullPayload,
      tasks: hasFullPayload,
    });
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

    const normalized = normalizeFocusRecordsPage(data, page);
    return {
      success: true,
      data: {
        records: normalized.records,
        totalPages: normalized.totalPages,
        totalElements: normalized.totalElements,
        currentPage: normalized.currentPage,
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

export async function listFocusActivities(): Promise<
  ActionState<FocusActivity[]>
> {
  const t = await getTranslations("focus.actions");

  try {
    const { data, error } = await serverApi.GET("/focus-activities");

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("communicationError")),
      };
    }

    const locale = await getRequestLocale();
    return {
      success: true,
      data: mapFocusActivities(data as FocusActivityResponseDTO[], locale),
    };
  } catch (err) {
    console.error("[FocusAction:ListActivities]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export type FocusRecordsPageData = FocusRecordsPageResult;

/**
 * Busca registros de foco do usuário de forma paginada para "Ver mais" na sidebar.
 */
export async function getFocusRecordsPage(
  page = 0,
  size = 100,
): Promise<ActionState<FocusRecordsPageData>> {
  const t = await getTranslations("focus.actions");
  try {
    const safePage = Math.max(page, 0);
    const safeSize = Math.min(Math.max(size, 1), 100);
    const { data, error } = await serverApi.GET("/focus-records/me", {
      params: {
        query: { page: safePage, size: safeSize },
      },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("communicationError")),
      };
    }

    return {
      success: true,
      data: normalizeFocusRecordsPage(data, safePage),
    };
  } catch (err) {
    console.error("[FocusAction:GetRecordsPage]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Busca registros de foco filtrados por atividade específica (paginação direta no servidor).
 */
export async function getFocusActivityRecordsPage(
  activityId: string,
  page = 0,
): Promise<ActionState<FocusRecordsPageData>> {
  const t = await getTranslations("focus.actions");
  try {
    const safePage = Math.max(page, 0);
    const { data, error } = await serverApi.GET(
      "/focus-records/activity/{activityId}",
      {
        params: {
          path: { activityId },
          query: { page: safePage },
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
      data: normalizeFocusRecordsPage(data, safePage),
    };
  } catch (err) {
    console.error("[FocusAction:GetActivityRecordsPage]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Busca o resumo agregado completo de métricas de foco (global ou filtrado por atividade).
 */
export async function getFocusSummary(
  activityId?: string | null,
): Promise<ActionState<FocusSummaryData>> {
  const t = await getTranslations("focus.actions");
  try {
    const normalizedActivityId = activityId?.trim() || undefined;
    const { data, error } = await serverApi.GET("/focus-records/summary", {
      params: normalizedActivityId
        ? { query: { activityId: normalizedActivityId } }
        : undefined,
    });

    const normalized = normalizeFocusSummary(data);
    if (error || !normalized) {
      return {
        success: false,
        error: getErrorMessage(error, t("communicationError")),
      };
    }

    return {
      success: true,
      data: normalized,
    };
  } catch (err) {
    console.error("[FocusAction:GetSummary]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}
