import { serverApi } from "@/api/server";
import type { Reward } from "@/types/reward";
import { mapRewardDtoToReward } from "@/utils/rewardMapper";

export interface RewardsPageData {
  rewards: Reward[];
}

/**
 * Carrega e mapeia a lista de recompensas da vitrine ordenadas por orderIndex.
 */
export async function getRewardsData(): Promise<RewardsPageData> {
  const { data: rewardsData, error } = await serverApi.GET("/rewards", {
    next: { tags: ["rewards"] },
  });

  if (error || !rewardsData) {
    return { rewards: [] };
  }

  const rewards = rewardsData
    .map(mapRewardDtoToReward)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  return { rewards };
}
