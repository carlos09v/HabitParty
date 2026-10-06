"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Gamepad2, Gift } from "lucide-react";
import { PACKAGE_LEVEL_COLOR, REWARD_TYPE_META } from "@/constants/reward";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { InventoryCardProps } from "@/types/inventory";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn } from "@/utils";

export function InventoryCard({ item, onUse }: InventoryCardProps) {
  const { isCompact } = useCompactMode();
  const reward = item.reward;
  const typeMeta = REWARD_TYPE_META[reward.type as RewardType];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: "InventoryItem", item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex flex-col justify-between rounded-xl bg-surface border border-white/20 hover:border-gold/50 hover:bg-surface-hover transition-all duration-200 group select-none shadow-sm",
        isCompact ? "p-2.5 gap-2 min-h-34" : "p-3.5 gap-3 min-h-39",
        isDragging && "opacity-50 ring-2 ring-gold z-50",
      )}
    >
      <header className="flex items-center justify-between w-full">
        <div
          className={cn(
            "rounded flex items-center justify-center text-primary-light group-hover:text-gold transition-colors shrink-0 bg-white/10 border border-white/10",
            isCompact ? "w-6 h-6" : "w-7 h-7",
          )}
        >
          {reward.iconName === "mystery_box" ? (
            <Gift
              size={isCompact ? 13 : 15}
              className="text-orange-400"
              aria-hidden="true"
            />
          ) : (
            <Gamepad2 size={isCompact ? 13 : 15} aria-hidden="true" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-bold bg-white/10 border border-white/20 text-neutral-100",
              isCompact
                ? "text-tiny px-1.5 py-0.5 rounded"
                : "text-xs px-2 py-0.5 rounded-md",
            )}
          >
            {item.quantity}x
          </span>
          <span
            className={cn(
              "border",
              isCompact
                ? "font-bold text-[10px] px-1.5 py-0.5 rounded"
                : "font-medium text-[10px] leading-tight px-1.5 py-0.5 rounded",
              typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20",
            )}
          >
            {typeMeta?.label || (reward.type as RewardType)}
          </span>
        </div>
      </header>

      <section className="flex flex-col gap-1 w-full min-w-0 mt-1">
        <h4
          className={cn(
            "font-bold text-neutral-100 truncate group-hover:text-gold transition-colors",
            isCompact ? "text-xs" : "text-body-s",
          )}
        >
          {reward.title}
        </h4>
        <p
          className={cn(
            "text-neutral-300 truncate",
            isCompact ? "text-tiny" : "text-label-g",
          )}
        >
          {reward.description}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {(reward.packageLevel as PackageLevel) && (
            <span
              className={cn(
                "font-bold border text-label-m px-1.5 py-0.5",
                isCompact ? "rounded" : "rounded-md",
                PACKAGE_LEVEL_COLOR[reward.packageLevel as PackageLevel] ||
                  "text-neutral-300 bg-white/10 border-white/15",
              )}
            >
              {reward.packageLevel as PackageLevel}
            </span>
          )}
          <span
            className={cn(
              "font-medium bg-white/10 border border-white/10 text-neutral-300 text-label-m px-1.5 py-0.5",
              isCompact ? "rounded" : "rounded-md",
            )}
          >
            {reward.category}
          </span>
        </div>
      </section>

      <footer
        className={cn(
          "flex items-center justify-between border-t border-white/10 w-full gap-3",
          isCompact ? "pt-1.5" : "pt-2",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1.5 text-neutral-300 min-w-0",
            isCompact ? "text-[10px]" : "text-tiny",
          )}
        >
          {(reward.type as RewardType) === "TimeBased" &&
          reward.baseDurationMinutes ? (
            <>
              <Clock
                size={isCompact ? 10 : 12}
                className="text-neutral-400 shrink-0"
                aria-hidden="true"
              />
              <span>{reward.baseDurationMinutes} min</span>
            </>
          ) : (
            <span
              className={
                isCompact
                  ? "text-[10px] text-neutral-400"
                  : "text-tiny text-neutral-400"
              }
            >
              Uso Imediato
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onUse?.(item)}
          aria-label={`Usar ${reward.title}`}
          className={cn(
            "bg-warning-500 hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-300 focus:ring-offset-1 focus:ring-offset-surface active:scale-95 text-neutral-900 font-bold transition-all cursor-pointer shadow-xs",
            isCompact
              ? "px-2.5 py-1 text-tiny rounded"
              : "px-3 py-1 text-label-g rounded-md",
          )}
        >
          Usar
        </button>
      </footer>
    </article>
  );
}
