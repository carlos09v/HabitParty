"use client";

import { useRouter } from "next/navigation";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { InventoryCardProps } from "@/types/inventory";
import {
  executeInventoryItemAction,
  getInventoryItemActionMeta,
} from "@/utils/inventoryHelpers";

export function InventoryCard({
  item,
  onUse,
  onSendToFocus,
  onOpenMysteryBox,
  onContextMenu,
  isCompact: propIsCompact,
}: InventoryCardProps) {
  const router = useRouter();
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;
  const reward = item.reward;

  const { isInFocus, actionLabel, secondaryActionLabel } =
    getInventoryItemActionMeta(item);

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
      actionLabel={actionLabel}
      onAction={handleAction}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryAction={handleSecondaryAction}
      onContextMenu={(e) => onContextMenu?.(e, item)}
      dragData={{ type: "InventoryItem", item }}
    />
  );
}
