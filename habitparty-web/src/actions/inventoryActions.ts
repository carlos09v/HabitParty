"use server";

import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
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
    updateTag("focus-activities");
    updateTag("focus-records");
  }
  if (includeUserAndTransactions) {
    updateTag("user");
    updateTag("transactions");
  }
}

export async function reorderInventory(
  updates: UpdateInventoryOrderDTO[],
): Promise<ActionState> {
  const t = await getTranslations("inventory.actions");
  try {
    const { error } = await serverApi.PUT("/inventory/reorder", {
      body: updates,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("reorderFailed")),
      };
    }

    invalidateInventoryTags();
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:Reorder]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function consumeInventoryItem(
  itemId: string,
): Promise<ActionState> {
  const t = await getTranslations("inventory.actions");
  try {
    const { error } = await serverApi.POST("/inventory/{itemId}/consume", {
      params: { path: { itemId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("consumeFailed")),
      };
    }

    invalidateInventoryTags(false, true);
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:Consume]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function discardInventoryItem(
  itemId: string,
): Promise<ActionState> {
  const t = await getTranslations("inventory.actions");
  try {
    const { error } = await serverApi.DELETE("/inventory/{itemId}/discard", {
      params: { path: { itemId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("discardFailed")),
      };
    }

    invalidateInventoryTags();
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:Discard]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function sendItemToFocus(
  itemId: string,
): Promise<ActionState<void>> {
  const t = await getTranslations("inventory.actions");
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
        error: getErrorMessage(error, t("sendToFocusFailed")),
      };
    }

    invalidateInventoryTags(true);
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:SendToFocus]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function returnItemToBackpack(
  itemId: string,
): Promise<ActionState<void>> {
  const t = await getTranslations("inventory.actions");
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
        error: getErrorMessage(error, t("returnToBackpackFailed")),
      };
    }

    invalidateInventoryTags(true);
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:ReturnToBackpack]", err);
    return {
      success: false,
      error: t("communicationError"),
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
  skipImmediateRevalidate = false,
): Promise<ActionState<MysteryBoxOpenResult>> {
  const t = await getTranslations("inventory.actions");
  try {
    const { data, error } = await serverApi.POST("/inventory/{itemId}/open", {
      params: { path: { itemId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("openMysteryBoxFailed")),
      };
    }

    if (!skipImmediateRevalidate) {
      invalidateInventoryTags(true, true);
    }
    return { success: true, data: data as MysteryBoxOpenResult };
  } catch (err) {
    console.error("[InventoryAction:OpenMysteryBox]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function revalidateInventoryAfterRoulette(): Promise<void> {
  invalidateInventoryTags(true, true);
}
