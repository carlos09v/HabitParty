"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { getDefaultEconomyBars } from "@/constants/dashboard";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import type { EconomyWidgetProps } from "@/types/dashboard";
import { formatCoins } from "@/utils";
import { formatCreditsLeisureEquivalence } from "@/utils/rewardEconomy";
import { EconomyWeeklyChart } from "./EconomyWeeklyChart";

/**
 * Widget de Economia e Histórico Financeiro do Usuário.
 * Client Component (Leaf Node): exibe a carteira dinâmica sincronizada com o userStore
 * e o gráfico de ganhos e gastos semanais interativo com barras duplas e tooltips ricos.
 */
export function EconomyWidget({
  balance = 0,
  weeklyEarnings = 0,
  weeklySpent = 0,
  bars = [],
}: EconomyWidgetProps) {
  const t = useTranslations("dashboard.sidebarRight.economyWidget");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const storeUser = useUserStore((s) => s.user);
  const currentBalance = storeUser?.currentCoins ?? balance;
  const leisureEquivalence =
    !isGamified && currentBalance > 0
      ? formatCreditsLeisureEquivalence(currentBalance)
      : null;

  const fallbackBars = useMemo(() => getDefaultEconomyBars(locale), [locale]);
  const displayBars = bars.length === 4 ? bars : fallbackBars;

  const optimisticTransactions = useOptimisticDashboardStore(
    (s) => s.transactions,
  );

  const { liveWeeklyEarnings, liveWeeklySpent, liveBars } = useMemo(() => {
    if (optimisticTransactions.length === 0) {
      return {
        liveWeeklyEarnings: weeklyEarnings,
        liveWeeklySpent: weeklySpent,
        liveBars: displayBars,
      };
    }

    let extraEarned = 0;
    let extraSpent = 0;

    for (const tx of optimisticTransactions) {
      const gold = tx.goldAmount ?? 0;
      if (
        tx.transactionType === "REWARD_BOUGHT" ||
        tx.transactionType === "DEBT_PAID"
      ) {
        extraSpent += Math.abs(gold !== 0 ? gold : (tx.priceSnapshot ?? 0));
      } else if (tx.transactionType === "BAD_HABIT_PENALTY") {
        if (gold < 0) extraSpent += Math.abs(gold);
      } else if (gold > 0) {
        extraEarned += gold;
      } else if (gold < 0) {
        extraSpent += Math.abs(gold);
      }
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const nextEarnings = round2(weeklyEarnings + extraEarned);
    const nextSpent = round2(weeklySpent + extraSpent);
    const lastIndex = displayBars.length - 1;
    const nextBars = displayBars.map((bar, idx) =>
      idx === lastIndex
        ? {
            ...bar,
            gold: round2(bar.gold + extraEarned),
            spent: round2((bar.spent ?? 0) + extraSpent),
          }
        : bar,
    );

    return {
      liveWeeklyEarnings: nextEarnings,
      liveWeeklySpent: nextSpent,
      liveBars: nextBars,
    };
  }, [optimisticTransactions, weeklyEarnings, weeklySpent, displayBars]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header com Saldo Dinâmico e Link para o Extrato */}
      <div className="flex items-center justify-between w-full gap-2">
        <h4 className="text-subtitle-s font-bold text-neutral-100">
          {t("title")}
        </h4>

        <Link
          href="/history"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 dark:bg-gold/15 dark:border-gold/30 dark:hover:bg-gold/25 dark:hover:border-gold/50 transition-colors cursor-pointer group shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          title={
            isGamified
              ? t("walletTitleGamified")
              : leisureEquivalence
                ? t("walletTitleProductivityWithLeisure", {
                    duration: leisureEquivalence,
                  })
                : t("walletTitleProductivity")
          }
        >
          <span className="text-label-g text-neutral-300 group-hover:text-neutral-100 transition-colors">
            {t("walletLabel")}
          </span>
          <div className="flex items-center gap-1">
            <CoinIcon
              size={14}
              withGlow={isGamified}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-body-s font-bold text-amber-700 dark:text-gold tabular-nums">
              {formatCoins(currentBalance, { locale })}
            </span>
          </div>
        </Link>
      </div>

      {leisureEquivalence && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-sky-500/8 border border-sky-500/25 text-tiny text-sky-700 dark:bg-sky-500/10 dark:border-sky-400/25 dark:text-sky-300">
          <span className="inline-flex items-center gap-1.5 font-medium truncate">
            <Clock size={11} className="shrink-0" aria-hidden="true" />
            <span>{t("leisureEquivalenceLabel")}</span>
          </span>
          <span className="font-bold tabular-nums shrink-0">
            {leisureEquivalence}
          </span>
        </div>
      )}

      <EconomyWeeklyChart
        weeklyEarnings={liveWeeklyEarnings}
        weeklySpent={liveWeeklySpent}
        displayBars={liveBars}
      />
    </div>
  );
}
