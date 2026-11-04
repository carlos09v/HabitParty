"use server";

import { getTranslations } from "next-intl/server";
import { serverApi } from "@/api/server";
import type {
  CreateRewardDTO,
  RewardResponseDTO,
  UpdateRewardDTO,
  UpdateRewardOrderDTO,
} from "@/types/reward";
import { invalidateRewardDomainTags } from "./cacheInvalidation";
import { type ActionState, getErrorMessage } from "./types";

export async function createReward(
  payload: CreateRewardDTO,
): Promise<ActionState<RewardResponseDTO>> {
  const t = await getTranslations("rewards.actions");
  try {
    const { data, error } = await serverApi.POST("/rewards", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("createFailed")),
      };
    }

    invalidateRewardDomainTags();
    return { success: true, data };
  } catch (err) {
    console.error("[RewardAction:Create]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function updateReward(
  rewardId: string,
  payload: UpdateRewardDTO,
): Promise<ActionState<RewardResponseDTO>> {
  const t = await getTranslations("rewards.actions");
  try {
    const { data, error } = await serverApi.PUT("/rewards/{rewardId}", {
      params: { path: { rewardId } },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateFailed")),
      };
    }

    invalidateRewardDomainTags();
    return { success: true, data };
  } catch (err) {
    console.error("[RewardAction:Update]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function deleteReward(rewardId: string): Promise<ActionState> {
  const t = await getTranslations("rewards.actions");
  try {
    const { error } = await serverApi.DELETE("/rewards/{id}", {
      params: { path: { id: rewardId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteFailed")),
      };
    }

    invalidateRewardDomainTags();
    return { success: true };
  } catch (err) {
    console.error("[RewardAction:Delete]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function reorderRewards(
  updates: UpdateRewardOrderDTO[],
): Promise<ActionState> {
  const t = await getTranslations("rewards.actions");
  try {
    const { error } = await serverApi.PUT("/rewards/reorder", {
      body: updates,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("reorderFailed")),
      };
    }

    invalidateRewardDomainTags();
    return { success: true };
  } catch (err) {
    console.error("[RewardAction:Reorder]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function redeemReward(rewardId: string): Promise<ActionState> {
  const t = await getTranslations("rewards.actions");
  try {
    const { error } = await serverApi.POST("/rewards/{rewardId}/redeem", {
      params: { path: { rewardId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("redeemFailed")),
      };
    }

    invalidateRewardDomainTags(true);
    return { success: true };
  } catch (err) {
    console.error("[RewardAction:Redeem]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}
