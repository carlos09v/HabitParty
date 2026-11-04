"use server";

import { getTranslations } from "next-intl/server";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import { invalidateTaskDomainTags } from "./cacheInvalidation";
import { type ActionState, getErrorMessage } from "./types";

type CreateBoardColumnDTO = components["schemas"]["CreateBoardColumnDTO"];
type UpdateBoardColumnDTO = components["schemas"]["UpdateBoardColumnDTO"];
type UpdateBoardColumnOrderDTO =
  components["schemas"]["UpdateBoardColumnOrderDTO"];
type BoardColumnResponseDTO = components["schemas"]["BoardColumnResponseDTO"];

function invalidateBoardColumnTags() {
  invalidateTaskDomainTags({ includeColumnSummaries: true });
}

/**
 * Cria uma nova coluna no Kanban
 */
export async function createBoardColumn(
  payload: CreateBoardColumnDTO,
): Promise<ActionState<BoardColumnResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.POST("/board_columns", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("createColumnFailed")),
      };
    }

    invalidateBoardColumnTags();

    return { success: true, data: data as BoardColumnResponseDTO };
  } catch (err) {
    console.error("[BoardColumnAction:Create]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Atualiza os dados de uma coluna existente
 */
export async function updateBoardColumn(
  boardColumnId: string,
  payload: UpdateBoardColumnDTO,
): Promise<ActionState<BoardColumnResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.PUT(
      "/board_columns/{boardColumnId}",
      {
        params: { path: { boardColumnId } },
        body: payload,
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateColumnFailed")),
      };
    }

    invalidateBoardColumnTags();

    return { success: true, data: data as BoardColumnResponseDTO };
  } catch (err) {
    console.error("[BoardColumnAction:Update]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Exclui uma coluna do Kanban
 */
export async function deleteBoardColumn(
  id: string,
): Promise<ActionState<void>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { error } = await serverApi.DELETE("/board_columns/{id}", {
      params: { path: { id } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteColumnFailed")),
      };
    }

    invalidateBoardColumnTags();

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[BoardColumnAction:Delete]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Reordena colunas do Kanban
 */
export async function updateBoardColumnOrder(
  workspaceId: string,
  payload: UpdateBoardColumnOrderDTO[],
): Promise<ActionState<void>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { error } = await serverApi.PUT(
      "/board_columns/workspace/{workspaceId}/reorder",
      {
        params: { path: { workspaceId } },
        body: payload,
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("reorderColumnsFailed")),
      };
    }

    invalidateBoardColumnTags();

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[BoardColumnAction:Order]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}
