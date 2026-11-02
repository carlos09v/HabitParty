"use server";

import { updateTag } from "next/cache";
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

    invalidateFocusTags({ activities: true });
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

    invalidateFocusTags({ activities: true });
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

    invalidateFocusTags({ activities: true, records: true });
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

    invalidateFocusTags({ activities: true });
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

    invalidateFocusTags({ records: true, rewardsAndInventory: true });
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

    invalidateFocusTags({ records: true });
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
): Promise<ActionState<void>> {
  const t = await getTranslations("focus.actions");
  try {
    const { error } = await serverApi.DELETE("/focus-records/{recordId}", {
      params: { path: { recordId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteRecordFailed")),
      };
    }

    invalidateFocusTags({ records: true, rewardsAndInventory: true });
    return { success: true };
  } catch (err) {
    console.error("[FocusAction:DeleteRecord]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}
