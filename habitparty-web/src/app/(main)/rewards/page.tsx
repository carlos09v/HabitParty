import { serverApi } from "@/api/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RewardsContainer } from "@/components/reward/RewardsContainer";
import { getCompactMode } from "@/utils/cookies";
import { mapRewardDtoToReward } from "@/utils/rewardMapper";

export default async function RewardsPage() {
  const isCompact = await getCompactMode();

  const { data: rewardsData } = await serverApi.GET("/rewards", {
    next: { tags: ["rewards"] },
  });

  const initialRewards = rewardsData
    ? rewardsData
        .map(mapRewardDtoToReward)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    : [];

  return (
    <PageWrapper isCompact={isCompact}>
      <RewardsContainer isCompact={isCompact} initialRewards={initialRewards} />
    </PageWrapper>
  );
}
