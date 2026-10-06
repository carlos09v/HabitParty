"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import serverApi from "@/api/server";
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

export async function createTask(
  boardColumnId: string,
  payload: CreateTaskDTO,
): Promise<ActionState<TaskResponseDTO>> {
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

  updateTag("tasks");
  return { success: true, data: data as TaskResponseDTO };
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskDTO,
): Promise<ActionState<TaskResponseDTO>> {
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

  updateTag("tasks");
  return { success: true, data };
}

export async function deleteTask(taskId: string): Promise<ActionState> {
  const { data, error } = await serverApi.DELETE("/tasks/{taskId}", {
    params: { path: { taskId } },
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao excluir tarefa."),
    };
  }

  updateTag("tasks");
  return { success: true, data };
}

export async function completeTask(taskId: string): Promise<ActionState> {
  return changeTaskStatus(taskId, "COMPLETED");
}

export async function changeTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
): Promise<ActionState> {
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

  updateTag("tasks");
  return { success: true, data };
}

export async function moveTasks(
  updates: UpdateTaskOrderDTO[],
): Promise<ActionState> {
  const { data, error } = await serverApi.PUT("/tasks/move", {
    body: updates,
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao reordenar tarefas."),
    };
  }

  updateTag("tasks");
  return { success: true, data };
}
