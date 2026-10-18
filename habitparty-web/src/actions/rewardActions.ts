"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import { type ActionState, getErrorMessage } from "./types";

type CreateRewardDTO = components["schemas"]["CreateRewardDTO"];
type UpdateRewardDTO = components["schemas"]["UpdateRewardDTO"];
type UpdateRewardOrderDTO = components["schemas"]["UpdateRewardOrderDTO"];
type RewardResponseDTO = components["schemas"]["RewardResponseDTO"];

function invalidateRewardTags(includeUserAndInventory = false) {
  updateTag("rewards");
  if (includeUserAndInventory) {
    updateTag("inventory");
    updateTag("user");
    updateTag("transactions");
  }
}

export async function createReward(
  payload: CreateRewardDTO,
): Promise<ActionState<RewardResponseDTO>> {
  try {
    const { data, error } = await serverApi.POST("/rewards", {
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao criar recompensa."),
      };
    }

    invalidateRewardTags();
    return { success: true, data };
  } catch (err) {
    console.error("[RewardAction:Create]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function updateReward(
  rewardId: string,
  payload: UpdateRewardDTO,
): Promise<ActionState<RewardResponseDTO>> {
  try {
    const { data, error } = await serverApi.PUT("/rewards/{rewardId}", {
      params: { path: { rewardId } },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao atualizar recompensa."),
      };
    }

    invalidateRewardTags();
    return { success: true, data };
  } catch (err) {
    console.error("[RewardAction:Update]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function deleteReward(rewardId: string): Promise<ActionState> {
  try {
    const { error } = await serverApi.DELETE("/rewards/{id}", {
      params: { path: { id: rewardId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao excluir recompensa."),
      };
    }

    invalidateRewardTags();
    return { success: true };
  } catch (err) {
    console.error("[RewardAction:Delete]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function reorderRewards(
  updates: UpdateRewardOrderDTO[],
): Promise<ActionState> {
  try {
    const { error } = await serverApi.PUT("/rewards/reorder", {
      body: updates,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao reordenar recompensas."),
      };
    }

    invalidateRewardTags();
    return { success: true };
  } catch (err) {
    console.error("[RewardAction:Reorder]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}

export async function redeemReward(rewardId: string): Promise<ActionState> {
  try {
    const { error } = await serverApi.POST("/rewards/{rewardId}/redeem", {
      params: { path: { rewardId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Falha ao resgatar recompensa."),
      };
    }

    invalidateRewardTags(true);
    return { success: true };
  } catch (err) {
    console.error("[RewardAction:Redeem]", err);
    return {
      success: false,
      error: "Erro interno de comunicação com o servidor.",
    };
  }
}
