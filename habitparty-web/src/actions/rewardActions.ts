"use server";

import { updateTag } from "next/cache";

import { getTranslations } from "next-intl/server";
import { serverApi } from "@/api/server";
import type {
  CreateRewardDTO,
  RewardResponseDTO,
  UpdateRewardDTO,
  UpdateRewardGroupDTO,
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

export async function createRewardsBatch(
  payloads: CreateRewardDTO[],
): Promise<
  ActionState<{ created: RewardResponseDTO[]; partialError?: string }>
> {
  const t = await getTranslations("rewards.actions");
  if (payloads.length === 0) {
    return { success: false, error: t("createFailed") };
  }

  const created: RewardResponseDTO[] = [];
  let partialError: string | undefined;

  try {
    // Criação sequencial no servidor garante orderIndex previsível em um único round-trip
    for (const payload of payloads) {
      const { data, error } = await serverApi.POST("/rewards", {
        body: payload,
      });

      if (error || !data) {
        partialError = getErrorMessage(error, t("createFailed"));
        break;
      }

      created.push(data);
    }
  } catch (err) {
    console.error("[RewardAction:CreateBatch]", err);
    partialError = t("communicationError");
  }

  if (created.length > 0) {
    invalidateRewardDomainTags();
    return {
      success: true,
      data: { created, partialError },
    };
  }

  return {
    success: false,
    error: partialError || t("createFailed"),
  };
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

export async function checkRewardHasHistory(
  rewardId: string,
): Promise<ActionState<boolean>> {
  const t = await getTranslations("rewards.actions");
  try {
    const { data, error } = await serverApi.GET(
      "/rewards/{rewardId}/has-history",
      {
        params: { path: { rewardId } },
        cache: "no-store",
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("checkRewardHistoryFailed")),
      };
    }

    return { success: true, data: Boolean(data?.hasHistory) };
  } catch (err) {
    console.error("[RewardAction:CheckHasHistory]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function deleteReward(
  rewardId: string,
  deleteHistory = false,
): Promise<ActionState> {
  const t = await getTranslations("rewards.actions");
  try {
    const { error } = await serverApi.DELETE("/rewards/{id}", {
      params: { path: { id: rewardId }, query: { deleteHistory } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteFailed")),
      };
    }

    invalidateRewardDomainTags();
    if (deleteHistory) {
      updateTag("transactions");
      updateTag("retrospective");
      updateTag("showcase");
    }
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
      params: {
        path: { rewardId },
      },
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

export async function saveRewardGroup(
  payload: UpdateRewardGroupDTO,
): Promise<ActionState<RewardResponseDTO[]>> {
  const t = await getTranslations("rewards.actions");
  try {
    const { data, error } = await serverApi.PUT("/rewards/group", {
      body: payload,
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateFailed")),
      };
    }

    invalidateRewardDomainTags();
    return { success: true, data };
  } catch (err) {
    console.error("[RewardAction:SaveGroup]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function checkRewardGroupHasHistory(
  rewardIds: string[],
): Promise<ActionState<boolean>> {
  const t = await getTranslations("rewards.actions");
  try {
    const { data, error } = await serverApi.GET("/rewards/group/has-history", {
      params: { query: { ids: rewardIds.join(",") } },
      cache: "no-store",
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("checkRewardHistoryFailed")),
      };
    }

    return { success: true, data: Boolean(data?.hasHistory) };
  } catch (err) {
    console.error("[RewardAction:CheckGroupHasHistory]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

export async function deleteRewardGroup(
  rewardIds: string[],
  deleteHistory = false,
): Promise<ActionState> {
  const t = await getTranslations("rewards.actions");
  try {
    const { error } = await serverApi.DELETE("/rewards/group", {
      params: { query: { ids: rewardIds.join(","), deleteHistory } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteFailed")),
      };
    }

    invalidateRewardDomainTags();
    if (deleteHistory) {
      updateTag("transactions");
      updateTag("retrospective");
      updateTag("showcase");
    }
    return { success: true };
  } catch (err) {
    console.error("[RewardAction:DeleteGroup]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}
