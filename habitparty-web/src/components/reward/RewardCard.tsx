"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { ItemRow } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { RewardCardProps, RewardGroupContext } from "@/types/reward";
import { toCategoryMessageKey } from "@/utils/rewardMapper";

function useRewardItemPresentation({
  reward,
  groupId,
  displayTitle,
  variants,
  unitQuantity = 1,
  canAfford = true,
  currentCoins,
  onSelectVariant,
  onUnitQuantityChange,
  onBuy,
  onEdit,
  onContextMenu,
}: Pick<
  RewardCardProps,
  | "reward"
  | "groupId"
  | "displayTitle"
  | "variants"
  | "unitQuantity"
  | "canAfford"
  | "currentCoins"
  | "onSelectVariant"
  | "onUnitQuantityChange"
  | "onBuy"
  | "onEdit"
  | "onContextMenu"
>) {
  const t = useTranslations("rewards.container");
  const { isGamified } = useExperienceMode();

  const isDebt = toCategoryMessageKey(reward.category) === "DEBT";
  const safeQuantity = isDebt ? Math.max(1, unitQuantity) : 1;
  const effectivePrice = reward.price * safeQuantity;
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
    onBuy?.(reward, safeQuantity);
  }, [onBuy, reward, safeQuantity]);

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

  const handleUnitQuantityChange = useCallback(
    (nextQuantity: number) => {
      onUnitQuantityChange?.(reward.id, nextQuantity);
    },
    [onUnitQuantityChange, reward.id],
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

  return {
    isDebt,
    safeQuantity,
    effectivePrice,
    effectiveCanAfford,
    handleBuy,
    handleDoubleClick: onEdit ? handleDoubleClick : undefined,
    handleContextMenu,
    handleSelectVariant: onSelectVariant ? handleSelectVariant : undefined,
    handleUnitQuantityChange:
      isDebt && onUnitQuantityChange ? handleUnitQuantityChange : undefined,
    dragData,
    actionLabel,
    insufficientBalanceTitle,
  };
}

export const RewardCard = memo(function RewardCard({
  reward,
  groupId,
  displayTitle,
  hasGroupDescription,
  variants,
  activeVariantId,
  onSelectVariant,
  unitQuantity = 1,
  onUnitQuantityChange,
  maxUnitQuantity = 50,
  onBuy,
  onEdit,
  onContextMenu,
  canAfford = true,
  currentCoins,
  isDeleteChecking = false,
  isRedeeming = false,
}: RewardCardProps) {
  const {
    isDebt,
    safeQuantity,
    effectivePrice,
    effectiveCanAfford,
    handleBuy,
    handleDoubleClick,
    handleContextMenu,
    handleSelectVariant,
    handleUnitQuantityChange,
    dragData,
    actionLabel,
  } = useRewardItemPresentation({
    reward,
    groupId,
    displayTitle,
    variants,
    unitQuantity,
    canAfford,
    currentCoins,
    onSelectVariant,
    onUnitQuantityChange,
    onBuy,
    onEdit,
    onContextMenu,
  });

  return (
    <GamifiedItemCard
      id={reward.id}
      sortableId={groupId ?? reward.id}
      title={displayTitle || reward.title}
      description={reward.description}
      hasGroupDescription={hasGroupDescription}
      iconName={reward.icon}
      type={reward.type}
      packageLevel={reward.packageLevel}
      category={reward.category}
      baseDurationMinutes={reward.baseDurationMinutes}
      price={effectivePrice}
      unitPrice={isDebt && safeQuantity > 1 ? reward.price : undefined}
      unitQuantity={safeQuantity}
      onUnitQuantityChange={handleUnitQuantityChange}
      maxUnitQuantity={maxUnitQuantity}
      variants={variants}
      activeVariantId={activeVariantId}
      onSelectVariant={handleSelectVariant}
      currentCoins={currentCoins}
      canAfford={effectiveCanAfford}
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
  groupId,
  displayTitle,
  variants,
  activeVariantId,
  onSelectVariant,
  unitQuantity = 1,
  onUnitQuantityChange,
  maxUnitQuantity = 50,
  onBuy,
  onEdit,
  onContextMenu,
  canAfford = true,
  currentCoins,
  isDeleteChecking = false,
  isRedeeming = false,
}: RewardCardProps) {
  const {
    safeQuantity,
    effectivePrice,
    effectiveCanAfford,
    handleBuy,
    handleDoubleClick,
    handleContextMenu,
    handleSelectVariant,
    handleUnitQuantityChange,
    dragData,
    actionLabel,
    insufficientBalanceTitle,
  } = useRewardItemPresentation({
    reward,
    groupId,
    displayTitle,
    variants,
    unitQuantity,
    canAfford,
    currentCoins,
    onSelectVariant,
    onUnitQuantityChange,
    onBuy,
    onEdit,
    onContextMenu,
  });

  return (
    <ItemRow
      id={reward.id}
      sortableId={groupId ?? reward.id}
      title={displayTitle || reward.title}
      description={reward.description}
      type={reward.type}
      packageLevel={reward.packageLevel}
      category={reward.category}
      iconName={reward.icon}
      baseDurationMinutes={reward.baseDurationMinutes}
      price={effectivePrice}
      unitQuantity={safeQuantity}
      onUnitQuantityChange={handleUnitQuantityChange}
      maxUnitQuantity={maxUnitQuantity}
      variants={variants}
      activeVariantId={activeVariantId}
      onSelectVariant={handleSelectVariant}
      disabled={!effectiveCanAfford}
      disabledTitle={!effectiveCanAfford ? insufficientBalanceTitle : undefined}
      actionLabel={actionLabel}
      onAction={handleBuy}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      isDeleteChecking={isDeleteChecking}
      isActionLoading={isRedeeming}
      dragData={dragData}
      lootItems={reward.lootItems}
    />
  );
});
