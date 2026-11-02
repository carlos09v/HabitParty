import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RewardsContainer } from "@/components/reward/RewardsContainer";
import { getRewardsData } from "@/services/rewardService";
import { getCompactMode } from "@/utils/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rewards.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RewardsPage() {
  const isCompact = await getCompactMode();
  const { rewards: initialRewards } = await getRewardsData();

  return (
    <PageWrapper isCompact={isCompact}>
      <RewardsContainer isCompact={isCompact} initialRewards={initialRewards} />
    </PageWrapper>
  );
}
