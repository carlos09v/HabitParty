"use server";

import { updateTag } from "next/cache";

import { getTranslations } from "next-intl/server";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import { invalidateTaskDomainTags } from "./cacheInvalidation";
import { type ActionState, getErrorMessage } from "./types";

type CreateTaskDTO = components["schemas"]["CreateTaskDTO"];
type UpdateTaskDTO = components["schemas"]["UpdateTaskDTO"];
type UpdateTaskOrderDTO = components["schemas"]["UpdateTaskOrderDTO"];
type TaskResponseDTO = components["schemas"]["TaskResponseDTO"];
export type TaskSearchWorkspaceCountDTO =
  components["schemas"]["TaskSearchWorkspaceCountDTO"];
type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

export async function createTask(
  boardColumnId: string,
  payload: CreateTaskDTO,
): Promise<ActionState<TaskResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.POST(
      "/tasks/column/{boardColumnId}",
      {
        params: { path: { boardColumnId } },
        body: payload,
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("createTaskFailed")),
      };
    }

    invalidateTaskDomainTags({ includeColumnSummaries: true });
    return { success: true, data: data as TaskResponseDTO };
  } catch (err) {
    console.error("[TaskAction:Create]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskDTO,
): Promise<ActionState<TaskResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.PUT("/tasks/{taskId}", {
      params: { path: { taskId } },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateTaskFailed")),
      };
    }

    invalidateTaskDomainTags();
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:Update]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function deleteTask(
  taskId: string,
  deleteHistory = false,
): Promise<ActionState> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.DELETE("/tasks/{taskId}", {
      params: { path: { taskId }, query: { deleteHistory } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteTaskFailed")),
      };
    }

    invalidateTaskDomainTags({ includeColumnSummaries: true });
    if (deleteHistory) {
      updateTag("transactions");
    }
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:Delete]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function completeTask(
  taskId: string,
): Promise<ActionState<TaskResponseDTO>> {
  return changeTaskStatus(taskId, "COMPLETED");
}

/**
 * Registra a pontuação de um hábito (positivo ou negativo).
 * Chama o endpoint dedicado POST /tasks/{taskId}/score?delta={delta},
 * computando recompensas para delta > 0 ou penalidades para delta < 0
 * e persistindo os contadores de repetição no banco de dados.
 */
export async function recordHabitScore(
  taskId: string,
  delta: number,
): Promise<ActionState<TaskResponseDTO | undefined>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.POST("/tasks/{taskId}/score", {
      params: {
        path: { taskId },
        query: { delta },
      },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("recordHabitScoreFailed")),
      };
    }

    invalidateTaskDomainTags({ includeUserAndTransactions: true });
    return { success: true, data: data as TaskResponseDTO };
  } catch (err) {
    console.error("[TaskAction:RecordHabitScore]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function changeTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
): Promise<ActionState<TaskResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.PATCH("/tasks/{taskId}/status", {
      params: {
        path: { taskId },
        query: { newStatus },
      },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("changeTaskStatusFailed")),
      };
    }

    invalidateTaskDomainTags({
      includeUserAndTransactions: true,
      includeColumnSummaries: true,
    });
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:ChangeStatus]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function moveTasks(
  updates: UpdateTaskOrderDTO[],
): Promise<ActionState> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.PUT("/tasks/move", {
      body: updates,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("moveTasksFailed")),
      };
    }

    invalidateTaskDomainTags({ includeColumnSummaries: true });
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:MoveTasks]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Busca em todos os workspaces do usuário quantas tarefas correspondem ao termo informado (2..100 caracteres).
 */
export async function searchTasksAcrossWorkspacesAction(
  query: string,
): Promise<TaskSearchWorkspaceCountDTO[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return [];
  try {
    const { data, error } = await serverApi.GET("/tasks/search", {
      params: { query: { q: trimmed } },
    });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
