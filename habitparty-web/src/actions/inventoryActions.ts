"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import { type ActionState, getErrorMessage } from "./types";

type UpdateInventoryOrderDTO = components["schemas"]["UpdateInventoryOrderDTO"];

function invalidateInventoryTags(
  includeFocus = false,
  includeUserAndTransactions = false,
) {
  updateTag("inventory");
  if (includeFocus) {
    updateTag("focus");
  }
  if (includeUserAndTransactions) {
    updateTag("user");
    updateTag("transactions");
  }
}

export async function reorderInventory(
  updates: UpdateInventoryOrderDTO[],
): Promise<ActionState> {
  try {
    const { error } = await serverApi.PUT("/inventory/reorder", {
      body: updates,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao reordenar inventário."),
      };
    }

    invalidateInventoryTags();
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:Reorder]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function consumeInventoryItem(
  itemId: string,
): Promise<ActionState> {
  try {
    const { error } = await serverApi.POST("/inventory/{itemId}/consume", {
      params: { path: { itemId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao consumir item."),
      };
    }

    invalidateInventoryTags(false, true);
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:Consume]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function discardInventoryItem(
  itemId: string,
): Promise<ActionState> {
  try {
    const { error } = await serverApi.DELETE("/inventory/{itemId}/discard", {
      params: { path: { itemId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao descartar item."),
      };
    }

    invalidateInventoryTags();
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:Discard]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function sendItemToFocus(
  itemId: string,
): Promise<ActionState<void>> {
  try {
    const { error } = await serverApi.PATCH(
      "/inventory/{itemId}/send-to-focus",
      {
        params: { path: { itemId } },
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao enviar item para o Foco."),
      };
    }

    invalidateInventoryTags(true);
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:SendToFocus]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function returnItemToBackpack(
  itemId: string,
): Promise<ActionState<void>> {
  try {
    const { error } = await serverApi.PATCH(
      "/inventory/{itemId}/return-to-backpack",
      {
        params: { path: { itemId } },
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao devolver item para a mochila."),
      };
    }

    invalidateInventoryTags(true);
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:ReturnToBackpack]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export interface MysteryBoxOpenResult {
  inventoryItemId?: string;
  rewardId?: string;
  rewardName?: string;
  rewardIcon?: string;
  rewardPrice?: number;
  rewardType?: string;
  rewardPackageLevel?: string;
  status?: string;
  remainingMinutes?: number;
  remainingSeconds?: number;
}

export async function openMysteryBox(
  itemId: string,
): Promise<ActionState<MysteryBoxOpenResult>> {
  try {
    const { data, error } = await serverApi.POST(
      // @ts-expect-error newly added backend endpoint until openapi schema regenerated
      "/inventory/{itemId}/open",
      {
        params: { path: { itemId } },
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao abrir caixa misteriosa."),
      };
    }

    invalidateInventoryTags(true, true);
    return { success: true, data: data as MysteryBoxOpenResult };
  } catch (err) {
    console.error("[InventoryAction:OpenMysteryBox]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}
