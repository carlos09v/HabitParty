"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { ItemRow } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { RewardCardProps } from "@/types/reward";
import { toCategoryMessageKey } from "@/utils/rewardMapper";

function useRewardItemPresentation({
  reward,
  onBuy,
  onEdit,
  onContextMenu,
}: Pick<RewardCardProps, "reward" | "onBuy" | "onEdit" | "onContextMenu">) {
  const t = useTranslations("rewards.container");
  const { isGamified } = useExperienceMode();

  const handleBuy = useCallback(() => {
    onBuy?.(reward);
  }, [onBuy, reward]);

  const handleDoubleClick = useCallback(() => {
    onEdit?.(reward);
  }, [onEdit, reward]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      onContextMenu?.(e, reward);
    },
    [onContextMenu, reward],
  );

  const dragData = useMemo(
    () => ({ type: "Reward" as const, reward }),
    [reward],
  );

  const isDebt = toCategoryMessageKey(reward.category) === "DEBT";
  const actionLabel = isDebt
    ? t("payDebt")
    : isGamified
      ? t("buy")
      : t("buyProductivity");

  const insufficientBalanceTitle = isGamified
    ? t("insufficientCoinsShort")
    : t("insufficientCreditsShort");

  return {
    handleBuy,
    handleDoubleClick: onEdit ? handleDoubleClick : undefined,
    handleContextMenu,
    dragData,
    actionLabel,
    insufficientBalanceTitle,
  };
}

export const RewardCard = memo(function RewardCard({
  reward,
  onBuy,
  onEdit,
  onContextMenu,
  isCompact = false,
  canAfford = true,
  currentCoins,
  isDeleteChecking = false,
  isRedeeming = false,
}: RewardCardProps) {
  const {
    handleBuy,
    handleDoubleClick,
    handleContextMenu,
    dragData,
    actionLabel,
  } = useRewardItemPresentation({
    reward,
    onBuy,
    onEdit,
    onContextMenu,
  });

  return (
    <GamifiedItemCard
      id={reward.id}
      title={reward.title}
      description={reward.description}
      iconName={reward.icon || reward.iconName}
      type={reward.type}
      packageLevel={reward.packageLevel}
      category={reward.category}
      baseDurationMinutes={reward.baseDurationMinutes}
      isCompact={isCompact}
      price={reward.price}
      currentCoins={currentCoins}
      canAfford={canAfford}
      isDeleteChecking={isDeleteChecking}
      isActionLoading={isRedeeming}
      actionLabel={actionLabel}
      onAction={handleBuy}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      dragData={dragData}
      lootItems={reward.lootItems}
    />
  );
});

export const RewardItemRow = memo(function RewardItemRow({
  reward,
  onBuy,
  onEdit,
  onContextMenu,
  isCompact = false,
  canAfford = true,
  isDeleteChecking = false,
  isRedeeming = false,
}: RewardCardProps) {
  const {
    handleBuy,
    handleDoubleClick,
    handleContextMenu,
    dragData,
    actionLabel,
    insufficientBalanceTitle,
  } = useRewardItemPresentation({
    reward,
    onBuy,
    onEdit,
    onContextMenu,
  });

  return (
    <ItemRow
      id={reward.id}
      title={reward.title}
      description={reward.description}
      type={reward.type}
      packageLevel={reward.packageLevel}
      category={reward.category}
      iconName={reward.icon || reward.iconName}
      baseDurationMinutes={reward.baseDurationMinutes}
      price={reward.price}
      disabled={!canAfford}
      disabledTitle={!canAfford ? insufficientBalanceTitle : undefined}
      actionLabel={actionLabel}
      onAction={handleBuy}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      isCompact={isCompact}
      isDeleteChecking={isDeleteChecking}
      isActionLoading={isRedeeming}
      dragData={dragData}
    />
  );
});
