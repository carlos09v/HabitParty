"use client";

import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { InventoryCardProps } from "@/types/inventory";

export function InventoryCard({
  item,
  onUse,
  isCompact: propIsCompact,
}: InventoryCardProps) {
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;
  const reward = item.reward;

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
      isCompact={isCompact}
      quantity={item.quantity}
      actionLabel="Usar"
      onAction={() => onUse?.(item)}
      dragData={{ type: "InventoryItem", item }}
    />
  );
}
