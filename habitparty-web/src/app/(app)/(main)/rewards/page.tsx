import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RewardsContainer } from "@/components/reward/RewardsContainer";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getRewardsData } from "@/services/rewardService";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rewards.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RewardsPage() {
  const { rewards: initialRewards } = await getRewardsData();

  return (
    <ScopedIntlProvider scope="rewards">
      <PageWrapper>
        <RewardsContainer initialRewards={initialRewards} />
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
