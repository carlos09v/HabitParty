"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import serverApi from "@/api/server";
import { type ActionState, getErrorMessage } from "./types";

type UpdateInventoryOrderDTO = components["schemas"]["UpdateInventoryOrderDTO"];

export async function reorderInventory(
  updates: UpdateInventoryOrderDTO[],
): Promise<ActionState> {
  const { data, error } = await serverApi.PUT("/inventory/reorder", {
    body: updates,
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao reordenar inventário."),
    };
  }

  updateTag("inventory");
  return { success: true, data };
}

export async function consumeInventoryItem(
  itemId: string,
): Promise<ActionState> {
  const { data, error } = await serverApi.POST("/inventory/{itemId}/consume", {
    params: { path: { itemId } },
  });

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao consumir item."),
    };
  }

  updateTag("inventory");
  updateTag("user");
  updateTag("transactions");
  return { success: true, data };
}

export async function discardInventoryItem(
  itemId: string,
): Promise<ActionState> {
  const { data, error } = await serverApi.DELETE(
    "/inventory/{itemId}/discard",
    {
      params: { path: { itemId } },
    },
  );

  if (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Falha ao descartar item."),
    };
  }

  updateTag("inventory");
  return { success: true, data };
}
