"use client";

import { Coins, History, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useWelcomeCards } from "@/store/welcomeCardsStore";
import type {
  HistoryDirectionFilter,
  HistoryPageSummary,
  HistoryTabId,
} from "@/types/history";
import type { WelcomeCardStat } from "@/types/ui";
import { formatCoins, getCachedNumberFormat } from "@/utils/economy";

interface HistoryWelcomeCardProps {
  summary: HistoryPageSummary;
  currentTab?: HistoryTabId;
  currentDirection?: HistoryDirectionFilter;
}

export function HistoryWelcomeCard({
  summary,
  currentTab = "ALL",
  currentDirection = "ALL",
}: HistoryWelcomeCardProps) {
  const tCard = useTranslations("history.welcomeCard");
  const t = useTranslations("history.welcomeCard.stats");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const { isCardHidden, mounted } = useWelcomeCards();

  const numberFmt = getCachedNumberFormat(locale);
  const formattedEarned = formatCoins(summary.goldEarned, { locale });
  const formattedSpent = formatCoins(summary.goldSpent, { locale });
  const formattedXpEarned = numberFmt.format(summary.xpEarned);
  const formattedXpLost = numberFmt.format(summary.xpLost);
  const formattedTotal = numberFmt.format(summary.totalCount);

  const highlightSpending =
    (currentTab === "SHOPPING" || currentDirection === "OUT") &&
    summary.goldSpent > 0;

  // Quando o card de boas-vindas foi ocultado pelo usuário, evita construir o array `stats`
  // e mantém um cabeçalho <h1> compacto com resumo rápido do período filtrado.
  if (mounted && isCardHidden("history")) {
    return (
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-neutral-50 tracking-tight truncate">
            {isGamified
              ? tCard("compactTitleGamified")
              : tCard("compactTitleProductivity")}
          </h1>
          <p className="text-xs text-neutral-400">
            {isGamified
              ? tCard("compactSubtitleGamified")
              : tCard("compactSubtitleProductivity")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card dark:bg-gold/10 border border-neutral-700 dark:border-gold/30 font-bold text-amber-800 dark:text-gold tabular-nums">
            <Coins size={13} aria-hidden="true" />
            {highlightSpending ? `−${formattedSpent}` : `+${formattedEarned}`}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card dark:bg-sky-500/10 border border-neutral-700 dark:border-sky-400/30 font-bold text-sky-700 dark:text-sky-300 tabular-nums">
            <Sparkles size={13} aria-hidden="true" />+{formattedXpEarned}{" "}
            {isGamified ? "XP" : "pts"}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 font-semibold text-neutral-200 tabular-nums">
            {formattedTotal}{" "}
            {summary.totalCount === 1
              ? t("transactionSingular")
              : t("transactionPlural")}
          </span>
        </div>
      </header>
    );
  }

  const stats: WelcomeCardStat[] = [
    {
      label: highlightSpending
        ? isGamified
          ? t("coinsSpentPrimaryLabel")
          : t("coinsSpentPrimaryLabelProductivity")
        : isGamified
          ? t("coinsInPeriodLabel")
          : t("coinsInPeriodLabelProductivity"),
      value: highlightSpending
        ? isGamified
          ? t("coinsSpentValue", { amount: formattedSpent })
          : t("coinsSpentValueProductivity", { amount: formattedSpent })
        : isGamified
          ? t("coinsValue", { amount: formattedEarned })
          : t("coinsValueProductivity", { amount: formattedEarned }),
      icon: Coins,
      variant: "gold",
      hint: highlightSpending
        ? summary.goldEarned > 0
          ? isGamified
            ? t("coinsEarnedSubHint", { amount: formattedEarned })
            : t("coinsEarnedSubHintProductivity", { amount: formattedEarned })
          : t("currentFiltersHint")
        : summary.goldSpent > 0
          ? isGamified
            ? t("coinsSpentHint", { amount: formattedSpent })
            : t("coinsSpentHintProductivity", { amount: formattedSpent })
          : isGamified
            ? t("coinsEarnedHint")
            : t("coinsEarnedHintProductivity"),
    },
    {
      label: isGamified
        ? t("xpInPeriodLabel")
        : t("xpInPeriodLabelProductivity"),
      value: isGamified
        ? t("xpValue", { amount: formattedXpEarned })
        : t("xpValueProductivity", { amount: formattedXpEarned }),
      icon: Sparkles,
      variant: "info",
      hint:
        summary.xpLost > 0
          ? isGamified
            ? t("xpLostHint", { amount: formattedXpLost })
            : t("xpLostHintProductivity", { amount: formattedXpLost })
          : isGamified
            ? t("xpEarnedHint")
            : t("xpEarnedHintProductivity"),
    },
    {
      label: t("totalRecordsLabel"),
      value: `${formattedTotal} ${summary.totalCount === 1 ? t("transactionSingular") : t("transactionPlural")}`,
      icon: History,
      variant: "primary",
      hint: t("currentFiltersHint"),
    },
  ];

  return <WelcomeCard stats={stats} storageKey="history" />;
}
