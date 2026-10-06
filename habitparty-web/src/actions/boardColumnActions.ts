"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";

type CreateBoardColumnDTO = components["schemas"]["CreateBoardColumnDTO"];
type UpdateBoardColumnDTO = components["schemas"]["UpdateBoardColumnDTO"];
type UpdateBoardColumnOrderDTO =
  components["schemas"]["UpdateBoardColumnOrderDTO"];
type BoardColumnResponseDTO = components["schemas"]["BoardColumnResponseDTO"];

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Cria uma nova coluna no Kanban
 */
export async function createBoardColumnAction(
  payload: CreateBoardColumnDTO,
): Promise<ActionResponse<BoardColumnResponseDTO>> {
  try {
    const { data, error } = await serverApi.POST("/board_columns", {
      body: payload,
    });

    if (error) {
      const backendMessage = (error as any)?.message;
      return {
        success: false,
        error: backendMessage || "Falha ao criar coluna.",
      };
    }

    updateTag("board_columns");
    updateTag("workspaces");

    return { success: true, data: data as BoardColumnResponseDTO };
  } catch (err) {
    console.error("[BoardColumnAction:Create]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Atualiza os dados de uma coluna existente
 */
export async function updateBoardColumnAction(
  boardColumnId: string,
  payload: UpdateBoardColumnDTO,
): Promise<ActionResponse<BoardColumnResponseDTO>> {
  try {
    const { data, error } = await serverApi.PUT(
      "/board_columns/{boardColumnId}",
      {
        params: { path: { boardColumnId } },
        body: payload,
      },
    );

    if (error) {
      const backendMessage = (error as any)?.message;
      return {
        success: false,
        error: backendMessage || "Falha ao atualizar coluna.",
      };
    }

    updateTag("board_columns");
    updateTag("workspaces");

    return { success: true, data: data as BoardColumnResponseDTO };
  } catch (err) {
    console.error("[BoardColumnAction:Update]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Exclui uma coluna do Kanban
 */
export async function deleteBoardColumnAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    const { error } = await serverApi.DELETE("/board_columns/{id}", {
      params: { path: { id } },
    });

    if (error) {
      const backendMessage = (error as any)?.message;
      return {
        success: false,
        error: backendMessage || "Falha ao excluir coluna.",
      };
    }

    updateTag("board_columns");
    updateTag("workspaces");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[BoardColumnAction:Delete]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

/**
 * Reordena colunas do Kanban
 */
export async function updateBoardColumnOrderAction(
  workspaceId: string,
  payload: UpdateBoardColumnOrderDTO[],
): Promise<ActionResponse<void>> {
  try {
    const { error } = await serverApi.PUT(
      "/board_columns/workspace/{workspaceId}/reorder",
      {
        params: { path: { workspaceId } },
        body: payload,
      },
    );

    if (error) {
      const backendMessage = (error as any)?.message;
      return {
        success: false,
        error: backendMessage || "Falha ao reordenar colunas.",
      };
    }

    updateTag("board_columns");
    updateTag("workspaces");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[BoardColumnAction:Order]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}
