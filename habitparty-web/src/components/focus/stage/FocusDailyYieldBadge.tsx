"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { cn } from "@/utils";
import { getDailyFocusYieldInfo } from "@/utils/focusDailyYield";

interface FocusDailyYieldBadgeProps {
  todayRewardableMinutes?: number;
  size?: "sm" | "md";
  className?: string;
}

const DAILY_YIELD_TIER_STYLES: Record<0 | 25 | 50 | 100, string> = {
  100: "",
  50: "border-amber-500/45 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  25: "border-orange-500/45 bg-orange-500/15 text-orange-700 dark:text-orange-300",
  0: "border-rose-500/45 bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

/**
 * Selo reutilizável de aviso do rendimento diário de foco quando a faixa sai de 100%.
 */
export function FocusDailyYieldBadge({
  todayRewardableMinutes,
  size = "sm",
  className,
}: FocusDailyYieldBadgeProps) {
  const t = useTranslations("focus.hero");
  const { isGamified } = useExperienceMode();

  const dailyYield = useMemo(
    () =>
      typeof todayRewardableMinutes === "number"
        ? getDailyFocusYieldInfo(todayRewardableMinutes)
        : null,
    [todayRewardableMinutes],
  );

  if (!dailyYield || dailyYield.tierPercent >= 100) {
    return null;
  }

  const title = isGamified
    ? t("dailyYieldHeroBadgeTitle", { percent: dailyYield.tierPercent })
    : t("dailyYieldHeroBadgeTitleProductivity", {
        percent: dailyYield.tierPercent,
      });

  const label =
    dailyYield.tierPercent === 0
      ? isGamified
        ? t("dailyYieldZeroBadge")
        : t("dailyYieldZeroBadgeProductivity")
      : isGamified
        ? t("dailyYieldReducedBadge", { percent: dailyYield.tierPercent })
        : t("dailyYieldReducedBadgeProductivity", {
            percent: dailyYield.tierPercent,
          });

  return (
    <div
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold text-center leading-tight",
        size === "md"
          ? "px-3 py-1 text-xs shadow-2xs"
          : "px-2.5 py-0.5 text-[11px] max-w-[240px]",
        DAILY_YIELD_TIER_STYLES[dailyYield.tierPercent],
        className,
      )}
    >
      <span>{label}</span>
    </div>
  );
}
