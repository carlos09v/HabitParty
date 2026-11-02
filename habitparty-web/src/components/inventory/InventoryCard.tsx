"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import type { InventoryCardProps } from "@/types/inventory";
import {
  executeInventoryItemAction,
  getInventoryItemActionMeta,
} from "@/utils/inventoryHelpers";

export const InventoryCard = memo(function InventoryCard({
  item,
  onUse,
  onSendToFocus,
  onOpenMysteryBox,
  onContextMenu,
  isCompact = false,
}: InventoryCardProps) {
  const router = useRouter();
  const t = useTranslations("inventory.card");
  const reward = item.reward;

  const { isInFocus, actionLabel, secondaryActionLabel } =
    getInventoryItemActionMeta(item, {
      openInFocus: t("openInFocus"),
      openBox: t("openBox"),
      sendToFocus: t("sendToFocus"),
      use: t("use"),
    });

  const handleAction = () => {
    executeInventoryItemAction(item, {
      onOpenFocus: () => router.push("/focus"),
      onOpenMysteryBox,
      onSendToFocus,
      onUse,
    });
  };

  const handleSecondaryAction =
    secondaryActionLabel && onUse ? () => onUse(item) : undefined;

  return (
    <GamifiedItemCard
      id={item.id}
      title={reward.title}
      description={reward.description}
      iconName={reward.icon || reward.iconName}
      type={reward.type}
      packageLevel={reward.packageLevel}
      category={reward.category}
      baseDurationMinutes={reward.baseDurationMinutes}
      remainingSeconds={item.remainingSeconds}
      isCompact={isCompact}
      quantity={item.quantity}
      inUse={isInFocus}
      isActiveFocusSession={isInFocus}
      actionLabel={actionLabel}
      onAction={handleAction}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryAction={handleSecondaryAction}
      onContextMenu={(e) => onContextMenu?.(e, item)}
      dragData={{ type: "InventoryItem", item }}
    />
  );
});
