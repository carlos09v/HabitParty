"use server";

import { updateTag } from "next/cache";

import { getTranslations } from "next-intl/server";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import { invalidateTaskDomainTags } from "./cacheInvalidation";
import {
  type ChecklistSnapshotItem,
  cloneTaskChecklistItems,
  syncTaskChecklistChanges,
} from "./checklistActions";
import { type ActionState, getErrorMessage } from "./types";

type CreateTaskDTO = components["schemas"]["CreateTaskDTO"];
type UpdateTaskDTO = components["schemas"]["UpdateTaskDTO"];
type UpdateTaskOrderDTO = components["schemas"]["UpdateTaskOrderDTO"];
type TaskResponseDTO = components["schemas"]["TaskResponseDTO"];
type ChecklistItemResponseDTO =
  components["schemas"]["ChecklistItemResponseDTO"];
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
  checklistItems?: { name?: string }[],
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

    let createdTask = data as TaskResponseDTO;
    if (createdTask?.id && checklistItems && checklistItems.length > 0) {
      const clonedChecklist = await cloneTaskChecklistItems(
        createdTask.id,
        checklistItems,
        { skipInvalidation: true },
      );
      if (clonedChecklist.length > 0) {
        createdTask = { ...createdTask, checklist: clonedChecklist };
      }
    }

    invalidateTaskDomainTags({ includeColumnSummaries: true });
    return { success: true, data: createdTask };
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

    invalidateTaskDomainTags({ includeColumnSummaries: true });
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:Update]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export interface SaveTaskWithDetailsInput {
  taskId: string;
  payload: UpdateTaskDTO;
  initialChecklist?: ChecklistSnapshotItem[];
  currentChecklist?: ChecklistSnapshotItem[];
  originalColumnId?: string;
  targetColumnId?: string;
}

export interface SaveTaskWithDetailsResult {
  task: TaskResponseDTO;
  checklist: ChecklistItemResponseDTO[];
  checklistFailedCount: number;
  moveError?: string;
}

/**
 * Executa a atualização da tarefa, sincronização em lote do checklist e eventual
 * mudança de coluna em uma única Server Action, invalidando o cache apenas uma vez.
 */
export async function saveTaskWithDetails(
  input: SaveTaskWithDetailsInput,
): Promise<ActionState<SaveTaskWithDetailsResult>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.PUT("/tasks/{taskId}", {
      params: { path: { taskId: input.taskId } },
      body: input.payload,
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateTaskFailed")),
      };
    }

    const checklistPromise =
      input.initialChecklist !== undefined &&
      input.currentChecklist !== undefined
        ? syncTaskChecklistChanges(
            input.taskId,
            input.initialChecklist,
            input.currentChecklist,
            { skipInvalidation: true },
          )
        : Promise.resolve({
            items: (data.checklist ?? []) as ChecklistItemResponseDTO[],
            failedCount: 0,
          });

    const shouldMoveColumn = Boolean(
      input.originalColumnId &&
        input.targetColumnId &&
        input.targetColumnId !== input.originalColumnId,
    );

    const movePromise: Promise<{ error?: unknown }> = shouldMoveColumn
      ? serverApi.PUT("/tasks/move", {
          body: [
            {
              taskId: input.taskId,
              boardColumnId: input.targetColumnId as string,
              newOrderIndex: 0,
            },
          ],
        })
      : Promise.resolve({ error: undefined });

    const [checklistSync, moveResult] = await Promise.all([
      checklistPromise,
      movePromise,
    ]);

    invalidateTaskDomainTags({ includeColumnSummaries: true });

    return {
      success: true,
      data: {
        task: { ...data, checklist: checklistSync.items },
        checklist: checklistSync.items,
        checklistFailedCount: checklistSync.failedCount,
        moveError: moveResult.error
          ? getErrorMessage(moveResult.error, t("moveTasksFailed"))
          : undefined,
      },
    };
  } catch (err) {
    console.error("[TaskAction:SaveWithDetails]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function checkTaskHasHistory(
  taskId: string,
): Promise<ActionState<boolean>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.GET("/tasks/{taskId}/has-history", {
      params: { path: { taskId } },
      cache: "no-store",
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("checkTaskHistoryFailed")),
      };
    }

    return { success: true, data: Boolean(data?.hasHistory) };
  } catch (err) {
    console.error("[TaskAction:CheckHistory]", err);
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
    updateTag("focus-records");
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

    invalidateTaskDomainTags({
      includeColumnSummaries: true,
      includeUserAndTransactions: true,
    });
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
      includeColumnSummaries: true,
      includeUserAndTransactions: true,
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

/**
 * Invalida o cache de tarefas, colunas, usuário e transações ao cruzar a meia-noite no cliente,
 * permitindo que `router.refresh()` dispare o `DailyResetUseCase` no backend com dados frescos.
 */
export async function triggerMidnightRolloverAction(): Promise<
  ActionState<void>
> {
  invalidateTaskDomainTags({
    includeColumnSummaries: true,
    includeUserAndTransactions: true,
  });
  return { success: true, data: undefined };
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
