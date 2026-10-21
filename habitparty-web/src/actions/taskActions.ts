"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import { type ActionState, getErrorMessage } from "./types";

type CreateTaskDTO = components["schemas"]["CreateTaskDTO"];
type UpdateTaskDTO = components["schemas"]["UpdateTaskDTO"];
type UpdateTaskOrderDTO = components["schemas"]["UpdateTaskOrderDTO"];
type TaskResponseDTO = components["schemas"]["TaskResponseDTO"];
type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

function invalidateTaskTags(
  options: {
    includeUserAndTransactions?: boolean;
    includeColumnSummaries?: boolean;
  } = {},
) {
  updateTag("tasks");
  updateTag("dashboard-tasks");
  updateTag("kanban");

  if (options.includeColumnSummaries) {
    updateTag("dashboard-columns");
    updateTag("board_columns");
  }

  if (options.includeUserAndTransactions) {
    updateTag("user");
    updateTag("transactions");
  }
}

export async function createTask(
  boardColumnId: string,
  payload: CreateTaskDTO,
): Promise<ActionState<TaskResponseDTO>> {
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
        error: getErrorMessage(error, "Falha ao criar tarefa."),
      };
    }

    invalidateTaskTags({ includeColumnSummaries: true });
    return { success: true, data: data as TaskResponseDTO };
  } catch (err) {
    console.error("[TaskAction:Create]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskDTO,
): Promise<ActionState<TaskResponseDTO>> {
  try {
    const { data, error } = await serverApi.PUT("/tasks/{taskId}", {
      params: { path: { taskId } },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao atualizar tarefa."),
      };
    }

    invalidateTaskTags();
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:Update]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function deleteTask(taskId: string): Promise<ActionState> {
  try {
    const { data, error } = await serverApi.DELETE("/tasks/{taskId}", {
      params: { path: { taskId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao excluir tarefa."),
      };
    }

    invalidateTaskTags({ includeColumnSummaries: true });
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:Delete]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
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
        error: getErrorMessage(
          error,
          "Falha ao registrar pontuação do hábito.",
        ),
      };
    }

    invalidateTaskTags({ includeUserAndTransactions: true });
    return { success: true, data: data as TaskResponseDTO };
  } catch (err) {
    console.error("[TaskAction:RecordHabitScore]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function changeTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
): Promise<ActionState<TaskResponseDTO>> {
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
        error: getErrorMessage(error, "Falha ao alterar status da tarefa."),
      };
    }

    invalidateTaskTags({
      includeUserAndTransactions: true,
      includeColumnSummaries: true,
    });
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:ChangeStatus]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function moveTasks(
  updates: UpdateTaskOrderDTO[],
): Promise<ActionState> {
  try {
    const { data, error } = await serverApi.PUT("/tasks/move", {
      body: updates,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao reordenar tarefas."),
      };
    }

    invalidateTaskTags();
    return { success: true, data };
  } catch (err) {
    console.error("[TaskAction:MoveTasks]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}
