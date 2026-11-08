"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { DEFAULT_ECONOMY_BARS } from "@/constants/dashboard";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { EconomyBarData, EconomyWidgetProps } from "@/types/dashboard";
import { formatCoins } from "@/utils";
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
  bars = DEFAULT_ECONOMY_BARS as EconomyBarData[],
  isCompact = false,
}: EconomyWidgetProps) {
  const t = useTranslations("dashboard.sidebarRight.economyWidget");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const storeUser = useUserStore((s) => s.user);
  const currentBalance = storeUser?.currentCoins ?? balance;

  const displayBars =
    bars.length === 4 ? bars : (DEFAULT_ECONOMY_BARS as EconomyBarData[]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header com Saldo Dinâmico e Link para o Extrato */}
      <div className="flex items-center justify-between w-full">
        <h4 className="text-subtitle-s font-bold text-neutral-100">
          {t("title")}
        </h4>

        <Link
          href="/history"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 dark:bg-gold/15 dark:border-gold/30 dark:hover:bg-gold/25 dark:hover:border-gold/50 transition-colors cursor-pointer group shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          title={
            isGamified ? t("walletTitleGamified") : t("walletTitleProductivity")
          }
        >
          <span className="text-label-g text-neutral-300 group-hover:text-neutral-100 transition-colors">
            {t("walletLabel")}
          </span>
          <div className="flex items-center gap-1">
            <CoinIcon
              size={14}
              withGlow
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-body-s font-bold text-amber-700 dark:text-gold">
              {formatCoins(currentBalance, { locale })}
            </span>
          </div>
        </Link>
      </div>

      <EconomyWeeklyChart
        weeklyEarnings={weeklyEarnings}
        weeklySpent={weeklySpent}
        displayBars={displayBars}
        isCompact={isCompact}
      />
    </div>
  );
}
