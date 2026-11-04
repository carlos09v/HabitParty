"use server";

import { getTranslations } from "next-intl/server";
import { serverApi } from "@/api/server";
import type {
  MysteryBoxOpenResult,
  UpdateInventoryOrderDTO,
} from "@/types/inventory";
import { invalidateInventoryDomainTags } from "./cacheInvalidation";
import { type ActionState, getErrorMessage } from "./types";

export type { MysteryBoxOpenResult };

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

    invalidateInventoryDomainTags();
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

    invalidateInventoryDomainTags(false, true);
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

    invalidateInventoryDomainTags();
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

    invalidateInventoryDomainTags(true);
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

    invalidateInventoryDomainTags(true);
    return { success: true };
  } catch (err) {
    console.error("[InventoryAction:ReturnToBackpack]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
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
      invalidateInventoryDomainTags(true, true);
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
  invalidateInventoryDomainTags(true, true);
}
