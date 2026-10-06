import { serverApi } from "@/api/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RewardsContainer } from "@/components/reward/RewardsContainer";
import type {
  PackageLevel,
  Reward,
  RewardCategory,
  RewardResponseDTO,
  RewardType,
} from "@/types/reward";
import { getCompactMode } from "@/utils/cookies";

function mapRewardDtoToReward(dto: RewardResponseDTO): Reward {
  const typeMap: Record<string, RewardType> = {
    SINGLE_USE: "SingleUse",
    TIME_BASED: "TimeBased",
    MISTERY_BOX: "MysteryBox",
  };

  const categoryMap: Record<string, RewardCategory> = {
    NONE: "Nenhum",
    ENTERTAINMENT: "Entretenimento",
    WELLNESS: "Bem-estar",
    SHOPPING: "Compras",
    DEVELOPMENT: "Desenvolvimento",
    LUCK: "Sorte",
    HOBBIES: "Hobbies",
  };

  const packageMap: Record<string, PackageLevel> = {
    NONE: "Nenhum",
    BASIC: "Básico",
    PREMIUM: "Premium",
    EPIC: "Épico",
    LEGENDARY: "Lendário",
  };

  return {
    id: dto.id || "",
    title: dto.name || "",
    description: dto.description || "",
    type: dto.type ? typeMap[dto.type] || "SingleUse" : "SingleUse",
    category: dto.category ? categoryMap[dto.category] || "Nenhum" : "Nenhum",
    packageLevel: dto.packageLevel
      ? packageMap[dto.packageLevel] || "Nenhum"
      : undefined,
    price: dto.price || 0,
    baseDurationMinutes: dto.baseDurationMinutes,
    icon: dto.icon || (dto.type === "MISTERY_BOX" ? "mystery_box" : "gamepad"),
    iconName:
      dto.icon || (dto.type === "MISTERY_BOX" ? "mystery_box" : "gamepad"),
  };
}

export default async function RewardsPage() {
  const isCompact = await getCompactMode();

  const { data: rewardsData } = await serverApi.GET("/rewards", {
    next: { tags: ["rewards"] },
  });

  const initialRewards = rewardsData
    ? rewardsData.map(mapRewardDtoToReward)
    : [];

  return (
    <PageWrapper isCompact={isCompact}>
      <RewardsContainer isCompact={isCompact} initialRewards={initialRewards} />
    </PageWrapper>
  );
}
