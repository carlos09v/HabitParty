import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RewardsContainer } from "@/components/reward/RewardsContainer";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getRewardsData } from "@/services/rewardService";
import { getCurrentUser } from "@/services/userService";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rewards.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RewardsPage() {
  const [{ rewards: initialRewards }, user] = await Promise.all([
    getRewardsData(),
    getCurrentUser(),
  ]);

  return (
    <ScopedIntlProvider scope="rewards">
      <PageWrapper>
        <RewardsContainer
          initialRewards={initialRewards}
          initialCoins={user?.currentCoins ?? 0}
          initialIsPremium={Boolean(user?.isPremium)}
          initialExperienceMode={user?.experienceMode ?? "PRODUCTIVITY"}
        />
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
