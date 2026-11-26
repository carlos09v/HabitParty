"use client";

import { Backpack, Clock, Gift } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { getDefaultEconomyBars } from "@/constants/dashboard";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import type { AppLocale } from "@/i18n/config";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import type { EconomyWidgetProps } from "@/types/dashboard";
import { cn, formatCoins } from "@/utils";
import { applyOptimisticEconomyDelta } from "@/utils/economy";
import { formatCreditsLeisureEquivalence } from "@/utils/rewardEconomy";
import { EconomyWeeklyChart } from "./EconomyWeeklyChart";

/**
 * Widget de Economia, Histórico Financeiro e Ponte para Recompensas & Mochila.
 * Client Component (Leaf Node): sincronizado com userStore e optimisticDashboardStore,
 * recalculando proporcionalmente todas as 4 barras em tempo real.
 */
export function EconomyWidget({
  balance = 0,
  weeklyEarnings = 0,
  weeklySpent = 0,
  bars = [],
  rewardsBridge,
  timeZone,
}: EconomyWidgetProps) {
  const t = useTranslations("dashboard.sidebarRight.economyWidget");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const storeTimeZone = useUserStore((s) => s.user?.timezone);
  const storeCoins = useUserStore((s) => s.user?.currentCoins);
  const userTimeZone = storeTimeZone ?? timeZone;
  useMidnightRollover(userTimeZone);
  const currentBalance = storeCoins ?? balance;
  const leisureEquivalence =
    !isGamified && currentBalance > 0
      ? formatCreditsLeisureEquivalence(currentBalance)
      : null;

  const fallbackBars = useMemo(() => getDefaultEconomyBars(locale), [locale]);
  const displayBars = bars.length === 4 ? bars : fallbackBars;

  const optimisticTransactions = useOptimisticDashboardStore(
    (s) => s.transactions,
  );

  const {
    bars: liveBars,
    weeklyEarnings: liveWeeklyEarnings,
    weeklySpent: liveWeeklySpent,
  } = useMemo(
    () =>
      applyOptimisticEconomyDelta(
        displayBars,
        weeklyEarnings,
        weeklySpent,
        optimisticTransactions,
      ),
    [displayBars, weeklyEarnings, weeklySpent, optimisticTransactions],
  );

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header com Saldo Dinâmico e Link para o Extrato */}
      <div className="flex items-center justify-between w-full gap-2">
        <h3 className="text-subtitle-s font-bold text-neutral-100">
          {t("title")}
        </h3>

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

      {/* Ponte rápida para Recompensas & Mochila (fecha o ciclo do produto no Dashboard) */}
      {rewardsBridge && (
        <div className="grid grid-cols-2 gap-1.5">
          <Link
            href="/rewards"
            className={cn(
              "flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border transition-colors group",
              rewardsBridge.redeemableCount > 0
                ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/50 dark:bg-emerald-500/10 dark:border-emerald-400/30"
                : "bg-card dark:bg-primary-dark/20 border-neutral-700 dark:border-primary/30 hover:border-amber-500/40 dark:hover:border-gold/40",
            )}
            title={
              rewardsBridge.redeemableCount > 0
                ? t("rewardsBridgeRedeemableTitle", {
                    count: rewardsBridge.redeemableCount,
                  })
                : t("rewardsBridgeStoreTitle")
            }
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Gift
                size={13}
                className={cn(
                  "shrink-0",
                  rewardsBridge.redeemableCount > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-700 dark:text-gold",
                )}
                aria-hidden="true"
              />
              <span className="text-tiny font-semibold text-neutral-200 group-hover:text-neutral-50 truncate">
                {isGamified
                  ? t("rewardsBridgeStoreLabel")
                  : t("rewardsBridgeStoreLabelProductivity")}
              </span>
            </div>
            <span
              className={cn(
                "text-tiny font-bold tabular-nums px-1.5 py-0.5 rounded shrink-0",
                rewardsBridge.redeemableCount > 0
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-surface dark:bg-white/10 text-neutral-400",
              )}
            >
              {rewardsBridge.redeemableCount > 0
                ? rewardsBridge.redeemableCount
                : rewardsBridge.totalRewardsCount}
            </span>
          </Link>

          <Link
            href="/inventory"
            className="flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border bg-card dark:bg-primary-dark/20 border-neutral-700 dark:border-primary/30 hover:border-amber-500/40 dark:hover:border-gold/40 transition-colors group"
            title={t("rewardsBridgeBackpackTitle", {
              count: rewardsBridge.inventoryAvailableCount,
            })}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Backpack
                size={13}
                className="text-primary dark:text-primary-light shrink-0"
                aria-hidden="true"
              />
              <span className="text-tiny font-semibold text-neutral-200 group-hover:text-neutral-50 truncate">
                {isGamified
                  ? t("rewardsBridgeBackpackLabel")
                  : t("rewardsBridgeBackpackLabelProductivity")}
              </span>
            </div>
            <span
              className={cn(
                "text-tiny font-bold tabular-nums px-1.5 py-0.5 rounded shrink-0",
                rewardsBridge.inventoryAvailableCount > 0
                  ? "bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary-light"
                  : "bg-surface dark:bg-white/10 text-neutral-400",
              )}
            >
              {rewardsBridge.inventoryAvailableCount}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
