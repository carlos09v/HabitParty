"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import serverApi from "@/api/server";
import type { ActionState } from "./types";

type UpdateInventoryOrderDTO = components["schemas"]["UpdateInventoryOrderDTO"];

export async function reorderInventory(
  updates: UpdateInventoryOrderDTO[],
): Promise<ActionState> {
  const { data, error } = await serverApi.PUT("/inventory/reorder", {
    body: updates,
  });

  if (error) {
    const backendMessage = (error as any)?.message;
    return {
      success: false,
      error: backendMessage || "Falha ao reordenar inventário.",
    };
  }

  updateTag("inventory");
  return { success: true, data };
}
