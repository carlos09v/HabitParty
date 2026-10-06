"use server";

import { updateTag } from "next/cache";
import type { components } from "@/api/schema";
import serverApi from "@/api/server";
import type { ActionState } from "./types";

type CreateRewardDTO = components["schemas"]["CreateRewardDTO"];
type UpdateRewardDTO = components["schemas"]["UpdateRewardDTO"];
type UpdateRewardOrderDTO = components["schemas"]["UpdateRewardOrderDTO"];

export async function createReward(
  payload: CreateRewardDTO,
): Promise<ActionState> {
  const { data, error } = await serverApi.POST("/rewards", {
    body: payload,
  });

  if (error) {
    const backendMessage = (error as any)?.message;
    return {
      success: false,
      error: backendMessage || "Falha ao criar recompensa.",
    };
  }

  updateTag("rewards");
  return { success: true, data };
}

export async function updateReward(
  rewardId: string,
  payload: UpdateRewardDTO,
): Promise<ActionState> {
  const { data, error } = await serverApi.PUT("/rewards/{rewardId}", {
    params: { path: { rewardId } },
    body: payload,
  });

  if (error) {
    const backendMessage = (error as any)?.message;
    return {
      success: false,
      error: backendMessage || "Falha ao atualizar recompensa.",
    };
  }

  updateTag("rewards");
  return { success: true, data };
}

export async function deleteReward(rewardId: string): Promise<ActionState> {
  const { data, error } = await serverApi.DELETE("/rewards/{id}", {
    params: { path: { id: rewardId } },
  });

  if (error) {
    const backendMessage = (error as any)?.message;
    return {
      success: false,
      error: backendMessage || "Falha ao excluir recompensa.",
    };
  }

  updateTag("rewards");
  return { success: true, data };
}

export async function reorderRewards(
  updates: UpdateRewardOrderDTO[],
): Promise<ActionState> {
  const { data, error } = await serverApi.PUT("/rewards/reorder", {
    body: updates,
  });

  if (error) {
    const backendMessage = (error as any)?.message;
    return {
      success: false,
      error: backendMessage || "Falha ao reordenar recompensas.",
    };
  }

  updateTag("rewards");
  return { success: true, data };
}
