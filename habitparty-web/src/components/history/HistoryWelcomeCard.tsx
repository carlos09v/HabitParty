"use client";

import { Coins, History, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { HistoryPageSummary } from "@/types/history";
import type { WelcomeCardStat } from "@/types/ui";
import { formatCoins } from "@/utils/economy";

interface HistoryWelcomeCardProps {
  summary: HistoryPageSummary;
  isCompact?: boolean;
}

export function HistoryWelcomeCard({
  summary,
  isCompact = false,
}: HistoryWelcomeCardProps) {
  const t = useTranslations("history.welcomeCard.stats");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;

  const formattedEarned = formatCoins(summary.goldEarned, { locale });
  const formattedSpent = formatCoins(summary.goldSpent, { locale });

  const stats: WelcomeCardStat[] = [
    {
      label: isGamified
        ? t("coinsOnPageLabel")
        : t("coinsOnPageLabelProductivity"),
      value: isGamified
        ? t("coinsValue", { amount: formattedEarned })
        : t("coinsValueProductivity", { amount: formattedEarned }),
      icon: Coins,
      variant: "gold",
      hint:
        summary.goldSpent > 0
          ? isGamified
            ? t("coinsSpentHint", { amount: formattedSpent })
            : t("coinsSpentHintProductivity", { amount: formattedSpent })
          : isGamified
            ? t("coinsEarnedHint")
            : t("coinsEarnedHintProductivity"),
    },
    {
      label: isGamified ? t("xpOnPageLabel") : t("xpOnPageLabelProductivity"),
      value: isGamified
        ? t("xpValue", { amount: summary.xpEarned })
        : t("xpValueProductivity", { amount: summary.xpEarned }),
      icon: Sparkles,
      variant: "info",
      hint: isGamified ? t("xpEarnedHint") : t("xpEarnedHintProductivity"),
    },
    {
      label: t("totalRecordsLabel"),
      value: `${summary.totalCount} ${summary.totalCount === 1 ? t("transactionSingular") : t("transactionPlural")}`,
      icon: History,
      variant: "primary",
      hint: t("currentFiltersHint"),
    },
  ];

  return <WelcomeCard compact={isCompact} stats={stats} storageKey="history" />;
}
