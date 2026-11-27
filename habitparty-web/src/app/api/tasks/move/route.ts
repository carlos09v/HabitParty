import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { components } from "@/api/schema";
import { refreshServerAccessToken, serverApi } from "@/api/server";

type UpdateTaskOrderDTO = components["schemas"]["UpdateTaskOrderDTO"];

function isValidMoveItem(value: unknown): value is UpdateTaskOrderDTO {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const item = value as Record<string, unknown>;
  if (typeof item.taskId !== "string" || item.taskId.trim().length === 0) {
    return false;
  }
  if (
    item.boardColumnId !== undefined &&
    (typeof item.boardColumnId !== "string" ||
      item.boardColumnId.trim().length === 0)
  ) {
    return false;
  }
  if (
    typeof item.newOrderIndex !== "number" ||
    !Number.isInteger(item.newOrderIndex) ||
    item.newOrderIndex < 0
  ) {
    return false;
  }
  return true;
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (
      typeof record.message === "string" &&
      record.message.trim().length > 0
    ) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim().length > 0) {
      return record.error;
    }
  }
  return fallback;
}

/**
 * Route Handler leve para reordenação e movimentação de cards via Drag-and-Drop.
 * Diferente de uma Server Action com `updateTag`, persiste `PUT /tasks/move` sem
 * disparar re-renderização síncrona completa de `AppLayout` + `TasksPage` a cada arrasto.
 */
export async function PUT(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(payload) ||
    payload.length === 0 ||
    payload.length > 500 ||
    !payload.every(isValidMoveItem)
  ) {
    return NextResponse.json(
      { error: "Invalid task move payload" },
      { status: 400 },
    );
  }

  try {
    let result = await serverApi.PUT("/tasks/move", {
      body: payload,
    });

    if (result.response.status === 401) {
      const refreshedToken = await refreshServerAccessToken();
      if (refreshedToken) {
        result = await serverApi.PUT("/tasks/move", {
          body: payload,
          headers: {
            Authorization: `Bearer ${refreshedToken}`,
          },
        });
      }
    }

    if (result.error || !result.response.ok) {
      const status = result.response.status || 500;
      const message = extractApiErrorMessage(
        result.error,
        "Failed to persist task order",
      );
      if (status >= 500) {
        console.error(`[ApiRoute:TasksMove] PUT /tasks/move -> HTTP ${status}`);
      }
      return NextResponse.json({ error: message }, { status });
    }

    revalidateTag("tasks", { expire: 0 });
    revalidateTag("dashboard-tasks", { expire: 0 });
    revalidateTag("kanban", { expire: 0 });
    revalidateTag("dashboard-columns", { expire: 0 });
    revalidateTag("board_columns", { expire: 0 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ApiRoute:TasksMove]", err);
    return NextResponse.json(
      { error: "Failed to communicate with server" },
      { status: 502 },
    );
  }
}
