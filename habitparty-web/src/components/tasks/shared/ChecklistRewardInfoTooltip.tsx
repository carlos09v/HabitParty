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
