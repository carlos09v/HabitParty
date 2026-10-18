import { PageWrapper } from "@/components/layout/PageWrapper";
import { RewardsContainer } from "@/components/reward/RewardsContainer";
import { getRewardsData } from "@/services/rewardService";
import { getCompactMode } from "@/utils/cookies";

export default async function RewardsPage() {
  const isCompact = await getCompactMode();
  const { rewards: initialRewards } = await getRewardsData();

  return (
    <PageWrapper isCompact={isCompact}>
      <RewardsContainer isCompact={isCompact} initialRewards={initialRewards} />
    </PageWrapper>
  );
}
