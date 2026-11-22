"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { ItemRow } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { RewardCardProps, RewardGroupContext } from "@/types/reward";
import { isDebtReward } from "@/utils/rewardGrouping";

function useRewardItemPresentation({
  reward,
  groupId,
  displayTitle,
  variants,
  activeVariantId,
  canAfford = true,
  currentCoins,
  isDeleteChecking = false,
  isRedeeming = false,
  isReorderDisabled,
  onSelectVariant,
  onBuy,
  onEdit,
  onContextMenu,
}: RewardCardProps) {
  const t = useTranslations("rewards.container");
  const { isGamified } = useExperienceMode();

  const isDebt = isDebtReward(reward);
  const effectivePrice = reward.price;
  const effectiveCanAfford =
    typeof currentCoins === "number"
      ? currentCoins >= effectivePrice
      : canAfford;

  const groupContext = useMemo<RewardGroupContext | undefined>(() => {
    if (!variants || variants.length <= 1) return undefined;
    return {
      groupId: groupId ?? reward.id,
      displayTitle: displayTitle || reward.title,
      variants,
    };
  }, [variants, groupId, displayTitle, reward.id, reward.title]);

  const handleBuy = useCallback(() => {
    onBuy?.(reward);
  }, [onBuy, reward]);

  const handleDoubleClick = useCallback(() => {
    onEdit?.(reward, groupContext);
  }, [onEdit, reward, groupContext]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      onContextMenu?.(e, reward, groupContext);
    },
    [onContextMenu, reward, groupContext],
  );

  const handleSelectVariant = useCallback(
    (variantId: string) => {
      onSelectVariant?.(groupId ?? reward.id, variantId);
    },
    [onSelectVariant, groupId, reward.id],
  );

  const dragData = useMemo(
    () => ({ type: "Reward" as const, reward }),
    [reward],
  );

  const actionLabel = isDebt
    ? t("payDebt")
    : isGamified
      ? t("buy")
      : t("buyProductivity");

  const insufficientBalanceTitle = isGamified
    ? t("insufficientCoinsShort")
    : t("insufficientCreditsShort");

  const sharedItemProps = {
    id: reward.id,
    sortableId: groupId ?? reward.id,
    title: displayTitle || reward.title,
    description: reward.description,
    type: reward.type,
    packageLevel: reward.packageLevel,
    category: reward.category,
    iconName: reward.icon,
    baseDurationMinutes: reward.baseDurationMinutes,
    price: effectivePrice,
    variants,
    activeVariantId,
    onSelectVariant: onSelectVariant ? handleSelectVariant : undefined,
    actionLabel,
    onAction: handleBuy,
    onDoubleClick: onEdit ? handleDoubleClick : undefined,
    onContextMenu: handleContextMenu,
    isDeleteChecking,
    isActionLoading: isRedeeming,
    isDragDisabled: isReorderDisabled ?? isDebt,
    dragData,
    lootItems: reward.lootItems,
  };

  return {
    sharedItemProps,
    effectiveCanAfford,
    insufficientBalanceTitle,
  };
}

export const RewardCard = memo(function RewardCard(props: RewardCardProps) {
  const { sharedItemProps, effectiveCanAfford } =
    useRewardItemPresentation(props);

  return (
    <GamifiedItemCard
      {...sharedItemProps}
      currentCoins={props.currentCoins}
      canAfford={effectiveCanAfford}
    />
  );
});

export const RewardItemRow = memo(function RewardItemRow(
  props: RewardCardProps,
) {
  const { sharedItemProps, effectiveCanAfford, insufficientBalanceTitle } =
    useRewardItemPresentation(props);

  return (
    <ItemRow
      {...sharedItemProps}
      disabled={!effectiveCanAfford}
      disabledTitle={!effectiveCanAfford ? insufficientBalanceTitle : undefined}
    />
  );
});
