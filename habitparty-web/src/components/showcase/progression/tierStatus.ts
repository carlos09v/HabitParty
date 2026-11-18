import { cn } from "@/utils";

export type TierStatus = "current" | "unlocked" | "locked";

/**
 * Classifica um degrau da pirâmide em relação à posição atual do usuário.
 */
export function getTierStatus(
  rankOrder: number,
  currentRankOrder: number,
  isCurrent: boolean,
): TierStatus {
  if (isCurrent) return "current";
  if (rankOrder <= currentRankOrder) return "unlocked";
  return "locked";
}

const PYRAMID_ROW_STATUS_CLASSES: Record<TierStatus, string> = {
  current:
    "border-amber-500/70 dark:border-gold bg-amber-500/12 dark:bg-gold/12 shadow-glow-gold-xs",
  unlocked:
    "border-neutral-700/80 dark:border-primary/25 bg-surface/75 hover:border-neutral-500 dark:hover:border-primary/50",
  locked:
    "border-neutral-700/50 dark:border-white/10 bg-surface/35 opacity-85 hover:opacity-100 hover:border-neutral-600 dark:hover:border-white/25",
};

export function getPyramidRowClass(
  status: TierStatus,
  isSelected: boolean,
  activeBorderClass: string,
): string {
  const baseClass =
    status !== "current" && isSelected
      ? cn("bg-primary/10 dark:bg-primary/20 shadow-sm", activeBorderClass)
      : PYRAMID_ROW_STATUS_CLASSES[status];

  return cn(
    "w-[var(--mobile-w)] sm:w-[var(--desktop-w)] rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5",
    baseClass,
    isSelected && "ring-2 ring-amber-500/45 dark:ring-gold/50",
  );
}

export const TIER_TITLE_TEXT_CLASS: Record<TierStatus, string> = {
  current: "text-amber-800 dark:text-gold",
  unlocked: "text-neutral-100",
  locked: "text-neutral-300",
};

export const INSPECTOR_STATUS_BADGE_CLASS: Record<TierStatus, string> = {
  current: "bg-amber-500/15 border-amber-500/45 text-amber-800 dark:text-gold",
  unlocked:
    "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  locked: "bg-neutral-500/15 border-neutral-500/35 text-neutral-300",
};

export const INSPECTOR_STATUS_LABEL_KEY: Record<
  TierStatus,
  "statusCurrent" | "statusUnlocked" | "statusLocked"
> = {
  current: "statusCurrent",
  unlocked: "statusUnlocked",
  locked: "statusLocked",
};
