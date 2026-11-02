"use client";

import { Coins } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { DEFAULT_ECONOMY_BARS } from "@/constants/dashboard";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { EconomyBarData, EconomyWidgetProps } from "@/types/dashboard";
import { cn, formatCoins } from "@/utils";

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayBars =
    bars.length === 4 ? bars : (DEFAULT_ECONOMY_BARS as EconomyBarData[]);

  const activeHoveredBar =
    hoveredIndex !== null ? displayBars[hoveredIndex] : null;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header com Saldo Dinâmico e Link para o Extrato */}
      <div className="flex items-center justify-between w-full">
        <h4 className="text-subtitle-s font-bold text-neutral-100">
          {t("title")}
        </h4>

        <Link
          href="/history"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gold/15 border border-gold/30 hover:bg-gold/25 hover:border-gold/50 transition-all cursor-pointer group shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          title={
            isGamified ? t("walletTitleGamified") : t("walletTitleProductivity")
          }
        >
          <span className="text-label-g text-neutral-300 group-hover:text-neutral-100 transition-colors">
            {t("walletLabel")}
          </span>
          <div className="flex items-center gap-1">
            <Coins
              size={14}
              className="text-gold group-hover:scale-110 transition-transform"
              aria-hidden="true"
            />
            <span className="text-body-s font-bold text-gold">
              {formatCoins(currentBalance, { locale })}
            </span>
          </div>
        </Link>
      </div>

      {/* Área do Gráfico de Barras Dinâmico com Ganhos e Gastos */}
      <div
        className={cn(
          "rounded-lg border border-primary/30 bg-primary-dark/20 flex flex-col",
          isCompact ? "p-2.5 gap-2" : "p-3 gap-3",
        )}
      >
        {/* Cabeçalho do Gráfico com Balanço Dinâmico */}
        <div className="flex items-center justify-between text-label-g text-neutral-400">
          <span>{t("earningsAndSpent")}</span>
          <span className="font-semibold text-xs transition-colors">
            {activeHoveredBar ? (
              <span className="flex items-center gap-1.5">
                <span className="text-gold">
                  +{formatCoins(activeHoveredBar.gold, { locale })}
                </span>
                <span className="text-neutral-500">/</span>
                <span className="text-rose-400">
                  -{formatCoins(activeHoveredBar.spent ?? 0, { locale })}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="text-gold">
                  +{formatCoins(weeklyEarnings, { locale })}
                </span>
                <span className="text-neutral-500">/</span>
                <span className="text-rose-400">
                  -{formatCoins(weeklySpent, { locale })}
                </span>
              </span>
            )}
          </span>
        </div>

        {/* Barras do gráfico com barras duplas (Ganhos vs Gastos) e tooltip flutuante */}
        <div
          className={cn(
            "w-full flex items-end justify-between gap-2 sm:gap-3 px-2 border-b border-white/10 relative",
            isCompact ? "h-14" : "h-16",
          )}
          role="img"
          aria-label={t("chartAriaLabel")}
        >
          {displayBars.map((bar, index) => {
            const isHovered = hoveredIndex === index;
            const fullLabel = bar.periodLabel
              ? `${bar.label} (${bar.periodLabel})`
              : bar.label;
            const netGold = bar.gold - (bar.spent ?? 0);
            const barSummary = t("barSummaryAria", {
              label: fullLabel,
              earned: formatCoins(bar.gold, { locale }),
              spent: formatCoins(bar.spent ?? 0, { locale }),
            });

            return (
              <button
                type="button"
                key={bar.label}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar relative cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                title={barSummary}
                aria-label={barSummary}
              >
                {/* Balãozinho flutuante detalhado no hover */}
                {isHovered && (
                  <div className="tooltip-dark absolute -top-20 px-2.5 py-1.5 rounded-lg border border-white/15 text-neutral-100 shadow-xl pointer-events-none whitespace-nowrap z-30 transition-all transform -translate-y-1 backdrop-blur-md flex flex-col gap-0.5 text-tiny">
                    <span className="font-bold text-neutral-300 border-b border-white/10 pb-0.5">
                      {fullLabel}
                    </span>
                    <div className="flex items-center justify-between gap-3 text-gold font-semibold">
                      <span>{t("inflows")}</span>
                      <span className="flex items-center gap-1">
                        +{formatCoins(bar.gold, { locale })}
                        <CoinIcon size={11} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-rose-400 font-semibold">
                      <span>{t("outflows")}</span>
                      <span className="flex items-center gap-1">
                        -{formatCoins(bar.spent ?? 0, { locale })}
                        <CoinIcon size={11} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-200 font-bold pt-0.5 border-t border-white/10">
                      <span>{t("netBalance")}</span>
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          netGold >= 0 ? "text-emerald-400" : "text-rose-400",
                        )}
                      >
                        {netGold >= 0 ? "+" : ""}
                        {formatCoins(netGold, { locale })}
                        <CoinIcon size={11} />
                      </span>
                    </div>
                  </div>
                )}

                {/* Par de Barras Verticais Lado a Lado: Ganhos (Dourado) e Gastos (Rose) */}
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Barra de Ganhos */}
                  <div
                    className={cn(
                      "w-2 sm:w-2.5 rounded-t transition-all duration-300 ease-out origin-bottom",
                      bar.isHighlight
                        ? "bg-gold shadow-glow-gold-xs"
                        : "bg-gold/80",
                      isHovered &&
                        "brightness-125 scale-y-[1.05] bg-gold shadow-glow-gold-sm",
                    )}
                    style={{ height: `${bar.heightPercent}%` }}
                  />

                  {/* Barra de Gastos */}
                  <div
                    className={cn(
                      "w-2 sm:w-2.5 rounded-t transition-all duration-300 ease-out origin-bottom",
                      bar.isHighlight
                        ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.3)]"
                        : "bg-rose-400/80",
                      isHovered && "brightness-125 scale-y-[1.05] bg-rose-400",
                    )}
                    style={{ height: `${bar.spentHeightPercent ?? 6}%` }}
                  />
                </div>

                <span
                  className={cn(
                    "text-tiny leading-none transition-colors",
                    bar.isHighlight || isHovered
                      ? "text-gold font-bold"
                      : "text-neutral-400 font-medium group-hover/bar:text-neutral-200",
                  )}
                >
                  {bar.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legenda Informativa */}
        <div className="flex items-center justify-center gap-4 pt-0.5 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-xs bg-gold" aria-hidden="true" />
            <span>{t("legendEarnings")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-xs bg-rose-400"
              aria-hidden="true"
            />
            <span>{t("legendSpent")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
