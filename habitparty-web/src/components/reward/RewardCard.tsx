"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { ItemRow } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AddRewardCardProps, RewardCardProps } from "@/types/reward";
import { cn } from "@/utils";

export const RewardCard = memo(function RewardCard({
  reward,
  onBuy,
  onEdit,
  onContextMenu,
  isCompact = false,
  canAfford = true,
}: RewardCardProps) {
  const t = useTranslations("rewards.card");
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
      canAfford={canAfford}
      actionLabel={isGamified ? t("buy") : t("buyProductivity")}
      onAction={handleBuy}
      onDoubleClick={onEdit ? handleDoubleClick : undefined}
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
}: RewardCardProps) {
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
      disabledTitle={
        !canAfford
          ? isGamified
            ? t("insufficientCoinsShort")
            : t("insufficientCreditsShort")
          : undefined
      }
      actionLabel={isGamified ? t("buy") : t("buyProductivity")}
      onAction={handleBuy}
      onDoubleClick={onEdit ? handleDoubleClick : undefined}
      onContextMenu={handleContextMenu}
      isCompact={isCompact}
      dragData={dragData}
    />
  );
});

export const AddRewardCard = memo(function AddRewardCard({
  onClick,
  viewMode = "card",
  isCompact = false,
}: AddRewardCardProps) {
  const t = useTranslations("rewards.card");
  const { isGamified } = useExperienceMode();
  const addLabel = isGamified ? t("addProduct") : t("addProductProductivity");

  if (viewMode === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={t("addRewardAria")}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed transition-colors cursor-pointer",
          "border-neutral-600 bg-card/80 text-xs font-semibold text-neutral-200",
          "hover:border-primary hover:text-primary hover:bg-card hover:shadow-xs dark:border-white/20 dark:bg-card/40 dark:text-neutral-300 dark:hover:border-gold dark:hover:text-gold dark:hover:bg-card/60 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-gold",
        )}
      >
        <Plus size={15} aria-hidden="true" />
        <span>{addLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("addRewardAria")}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed transition-colors cursor-pointer group gap-2",
        isCompact ? "p-2.5 min-h-28" : "p-3.5 min-h-32",
        "border-primary/40 bg-primary/[0.04] hover:bg-primary/10 hover:border-primary text-neutral-200 hover:text-primary dark:border-primary/50 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-gold dark:text-neutral-300 dark:hover:text-gold focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-gold",
      )}
    >
      <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 text-primary group-hover:text-primary-dark dark:bg-white/10 dark:group-hover:bg-gold/20 dark:text-primary-light dark:group-hover:text-gold transition-colors">
        <Plus size={isCompact ? 15 : 18} aria-hidden="true" />
      </div>
      <span className="text-xs font-semibold">{addLabel}</span>
    </button>
  );
});
