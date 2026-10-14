"use client";

import { Plus } from "lucide-react";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useUserStore } from "@/store/userStore";
import type { AddRewardCardProps, RewardCardProps } from "@/types/reward";
import { cn } from "@/utils";

export function RewardCard({
  reward,
  onBuy,
  onContextMenu,
  isCompact: propIsCompact,
}: RewardCardProps) {
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;

  const user = useUserStore((state) => state.user);
  const canAfford =
    typeof user?.currentCoins === "number"
      ? user.currentCoins >= reward.price
      : true;

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
      actionLabel="Comprar"
      onAction={() => onBuy?.(reward)}
      onContextMenu={(e) => onContextMenu?.(e, reward)}
      dragData={{ type: "Reward", reward }}
    />
  );
}

export function AddRewardCard({
  onClick,
  viewMode = "card",
}: AddRewardCardProps) {
  const { isCompact } = useCompactMode();

  if (viewMode === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Adicionar nova recompensa"
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed transition-all cursor-pointer",
          "border-white/20 bg-card/40 text-xs font-semibold text-neutral-300",
          "hover:border-gold hover:text-gold hover:bg-card/60 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-gold",
        )}
      >
        <Plus size={15} aria-hidden="true" />
        <span>Adicionar Produto</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar nova recompensa"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed transition-all cursor-pointer group gap-2.5",
        isCompact ? "p-3 min-h-36" : "p-4 min-h-42",
        "border-primary/50 bg-white/5 hover:bg-white/10 hover:border-gold text-neutral-300 hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold",
      )}
    >
      <div className="p-2.5 rounded-xl bg-white/10 group-hover:bg-gold/20 text-primary-light group-hover:text-gold transition-colors">
        <Plus size={isCompact ? 16 : 20} aria-hidden="true" />
      </div>
      <span className="text-xs font-semibold">Adicionar Produto</span>
    </button>
  );
}
