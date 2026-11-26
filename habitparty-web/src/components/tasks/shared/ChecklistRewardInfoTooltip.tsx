"use client";

import { Swords, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  countRewardedChecklistItems,
  DIFFICULTY_REWARDS,
  MAX_REWARDED_SUBTASKS,
} from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { ChecklistItem } from "@/types/task";
import { cn, formatCoins } from "@/utils";

export function getChecklistRewardStats(checklist: ChecklistItem[]) {
  const rewardedCount = countRewardedChecklistItems(checklist);
  return {
    rewardedCount,
    maxRewarded: MAX_REWARDED_SUBTASKS,
    isLimitReached: rewardedCount >= MAX_REWARDED_SUBTASKS,
  };
}

export function useChecklistRewardRowHelpers() {
  const t = useTranslations("tasks.checklistRewards");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();

  const hardReward = DIFFICULTY_REWARDS.HARD;
  const formattedGold = formatCoins(hardReward.gold, { locale });
  const chipLabel = isGamified
    ? `+${formattedGold} 🪙`
    : `+${formattedGold} ${t("chipCreditsSuffix")}`;

  const getRowRewardLabels = (
    itemName: string | undefined,
    isRewarded: boolean,
  ) => {
    const safeName = itemName ?? "";
    return {
      toggleRewardAria: isGamified
        ? isRewarded
          ? t("toggleRemoveAria", { name: safeName })
          : t("toggleAddAria", { name: safeName })
        : isRewarded
          ? t("toggleRemoveAriaProductivity", { name: safeName })
          : t("toggleAddAriaProductivity", { name: safeName }),
      toggleRewardTitle: isGamified
        ? isRewarded
          ? t("toggleRemoveTitle")
          : t("toggleAddTitle", { xp: hardReward.xp, gold: formattedGold })
        : isRewarded
          ? t("toggleRemoveTitleProductivity")
          : t("toggleAddTitleProductivity", {
              xp: hardReward.xp,
              gold: formattedGold,
            }),
      rewardLimitTitle: t("limitReachedTitle", {
        max: MAX_REWARDED_SUBTASKS,
      }),
    };
  };

  const rewardLockedWhileCompletedTitle = t(
    isGamified
      ? "rewardLockedWhileCompletedTitle"
      : "rewardLockedWhileCompletedTitleProductivity",
  );

  const getNewStepToggleLabels = (options?: {
    isLimitReached?: boolean;
    isTaskCompleted?: boolean;
  }) => ({
    ariaLabel: t(
      isGamified ? "addRewardedStepAria" : "addRewardedStepAriaProductivity",
    ),
    title: options?.isTaskCompleted
      ? rewardLockedWhileCompletedTitle
      : options?.isLimitReached
        ? t("limitReachedTitle", { max: MAX_REWARDED_SUBTASKS })
        : t(
            isGamified
              ? "addRewardedStepTitle"
              : "addRewardedStepTitleProductivity",
            { xp: hardReward.xp, gold: formattedGold },
          ),
  });

  return {
    isGamified,
    chipLabel,
    rewardLockedWhileCompletedTitle,
    getRowRewardLabels,
    getNewStepToggleLabels,
  };
}

export function ChecklistRewardCounter({
  rewardedCount,
  className,
}: {
  rewardedCount: number;
  className?: string;
}) {
  const t = useTranslations("tasks.checklistRewards");
  const { isGamified } = useExperienceMode();
  const Icon = isGamified ? Swords : Zap;

  return (
    <span
      title={
        isGamified
          ? t("counterTitle", {
              count: rewardedCount,
              max: MAX_REWARDED_SUBTASKS,
            })
          : t("counterTitleProductivity", {
              count: rewardedCount,
              max: MAX_REWARDED_SUBTASKS,
            })
      }
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-label-s font-semibold transition-colors",
        rewardedCount > 0
          ? "bg-amber-500/12 border-amber-500/40 text-amber-800 dark:bg-gold/15 dark:border-gold/45 dark:text-gold"
          : "bg-surface/70 border-neutral-700 text-neutral-400 dark:bg-white/5 dark:border-white/10",
        className,
      )}
    >
      <Icon size={10} className="shrink-0" aria-hidden="true" />
      <span>
        {rewardedCount}/{MAX_REWARDED_SUBTASKS}
      </span>
    </span>
  );
}

interface ChecklistRewardInfoTooltipProps {
  align?: "left" | "right";
  side?: "top" | "bottom";
  triggerLabel?: string;
}

export function ChecklistRewardInfoTooltip({
  align = "left",
  side = "top",
  triggerLabel,
}: ChecklistRewardInfoTooltipProps) {
  const t = useTranslations("tasks.checklistRewards");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();

  const hardReward = DIFFICULTY_REWARDS.HARD;
  const formattedGold = formatCoins(hardReward.gold, { locale });
  const Icon = isGamified ? Swords : Zap;

  return (
    <InfoTooltip
      align={align}
      side={side}
      size={13}
      triggerLabel={triggerLabel}
      ariaLabel={isGamified ? t("tooltipAria") : t("tooltipAriaProductivity")}
      title={isGamified ? t("tooltipTitle") : t("tooltipTitleProductivity")}
      icon={<Icon size={14} className="text-gold shrink-0" />}
    >
      <ul className="flex flex-col gap-1.5 text-label-g text-neutral-200 leading-relaxed">
        <li>
          <strong className="font-semibold text-neutral-100">
            {t("standardLabel")}
          </strong>{" "}
          {isGamified ? t("standardDesc") : t("standardDescProductivity")}
        </li>
        <li>
          <strong className="font-semibold text-gold">
            {isGamified
              ? t("rewardedLabel", { max: MAX_REWARDED_SUBTASKS })
              : t("rewardedLabelProductivity", { max: MAX_REWARDED_SUBTASKS })}
          </strong>{" "}
          {isGamified
            ? t("rewardedDesc", { xp: hardReward.xp, gold: formattedGold })
            : t("rewardedDescProductivity", {
                xp: hardReward.xp,
                gold: formattedGold,
              })}
        </li>
      </ul>
      <p className="text-tiny text-neutral-300 bg-white/5 rounded-md p-2 border border-white/10 leading-relaxed">
        {isGamified ? t("payoutNote") : t("payoutNoteProductivity")}
      </p>
    </InfoTooltip>
  );
}

interface RewardedStepToggleButtonProps {
  isActive: boolean;
  disabled: boolean;
  ariaLabel: string;
  title: string;
  onClick: () => void;
  size?: "sm" | "md";
}

/**
 * Botão compartilhado para alternar se uma nova etapa do checklist será recompensada
 * (reutilizado em `TaskChecklistSection` no modal e `TaskDetailsChecklist` no popover).
 */
export function RewardedStepToggleButton({
  isActive,
  disabled,
  ariaLabel,
  title,
  onClick,
  size = "md",
}: RewardedStepToggleButtonProps) {
  const { isGamified } = useExperienceMode();
  const RewardIcon = isGamified ? Swords : Zap;
  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        "inline-flex items-center justify-center border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-gold",
        isSmall
          ? "min-h-6 min-w-6 px-1.5 py-0.5 rounded"
          : "min-h-8 min-w-8 px-2.5 rounded-lg",
        isActive
          ? "bg-amber-500/15 border-amber-500/50 text-amber-800 hover:bg-amber-500/25 dark:bg-gold/15 dark:border-gold/55 dark:text-gold dark:hover:bg-gold/25 cursor-pointer"
          : disabled
            ? isSmall
              ? "border-transparent text-neutral-500 opacity-35 cursor-not-allowed"
              : "border-neutral-700/60 text-neutral-500 opacity-45 cursor-not-allowed"
            : isSmall
              ? "border-dashed border-neutral-500/40 text-neutral-400 hover:text-amber-700 hover:border-amber-500/50 hover:bg-gold/10 dark:border-neutral-600 dark:text-neutral-400 dark:hover:text-gold dark:hover:border-gold/50 cursor-pointer"
              : "border-dashed border-neutral-600 text-neutral-300 hover:text-amber-700 hover:border-amber-500/50 hover:bg-gold/10 dark:border-primary/35 dark:text-neutral-400 dark:hover:text-gold dark:hover:border-gold/50 cursor-pointer",
      )}
    >
      <RewardIcon
        size={isSmall ? 12 : 15}
        className="shrink-0"
        aria-hidden="true"
      />
    </button>
  );
}
