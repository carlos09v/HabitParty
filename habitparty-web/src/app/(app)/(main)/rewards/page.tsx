import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RewardsContainer } from "@/components/reward/RewardsContainer";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getRawInventoryItems } from "@/services/inventoryService";
import { getRewardsData } from "@/services/rewardService";
import { getCurrentUser } from "@/services/userService";
import { toRewardTypeMessageKey } from "@/utils/rewardMapper";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rewards.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RewardsPage() {
  const [{ rewards: initialRewards }, rawInventory, user] = await Promise.all([
    getRewardsData(),
    getRawInventoryItems(),
    getCurrentUser(),
  ]);

  const rewardTypeById = new Map(
    initialRewards.map((reward) => [
      reward.id,
      toRewardTypeMessageKey(reward.type),
    ]),
  );

  const initialOwnedCounts: Record<string, number> = {};
  for (const item of rawInventory) {
    if (
      !item.rewardId ||
      (item.status !== "AVAILABLE" && item.status !== "IN_FOCUS")
    ) {
      continue;
    }
    const storeRewardType = rewardTypeById.get(item.rewardId);
    if (
      !storeRewardType ||
      toRewardTypeMessageKey(item.rewardType) !== storeRewardType
    ) {
      continue;
    }
    initialOwnedCounts[item.rewardId] =
      (initialOwnedCounts[item.rewardId] ?? 0) + 1;
  }

  return (
    <ScopedIntlProvider scope="rewards">
      <PageWrapper>
        <RewardsContainer
          initialRewards={initialRewards}
          initialOwnedCounts={initialOwnedCounts}
          initialCoins={user?.currentCoins ?? 0}
          initialIsPremium={Boolean(user?.isPremium)}
          initialExperienceMode={user?.experienceMode ?? "PRODUCTIVITY"}
        />
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
