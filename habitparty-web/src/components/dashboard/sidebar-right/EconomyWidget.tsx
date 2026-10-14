"use client";

import { Coins } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DEFAULT_ECONOMY_BARS } from "@/constants/dashboard";
import { useUserStore } from "@/store/userStore";
import type { EconomyBarData, EconomyWidgetProps } from "@/types/dashboard";
import { cn } from "@/utils";

interface Props extends EconomyWidgetProps {
  isCompact?: boolean;
}

/**
 * Widget de Economia e Histórico Financeiro do Usuário.
 * Client Component (Leaf Node): exibe a carteira dinâmica sincronizada com o userStore
 * e o gráfico de ganhos semanais interativo com hover e tooltips flutuantes.
 */
export function EconomyWidget({
  balance = 0,
  weeklyEarnings = 0,
  bars = DEFAULT_ECONOMY_BARS as EconomyBarData[],
  isCompact = false,
}: Props) {
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
        <h4 className="text-subtitle-s font-bold text-neutral-100">Economia</h4>

        <Link
          href="/history"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gold/15 border border-gold/30 hover:bg-gold/25 hover:border-gold/50 transition-all cursor-pointer group shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          title="Ver extrato completo de transações"
        >
          <span className="text-label-g text-neutral-300 group-hover:text-neutral-100 transition-colors">
            Carteira:
          </span>
          <div className="flex items-center gap-1">
            <Coins
              size={14}
              className="text-gold group-hover:scale-110 transition-transform"
              aria-hidden="true"
            />
            <span className="text-body-s font-bold text-gold">
              {currentBalance}
            </span>
          </div>
        </Link>
      </div>

      {/* Área do Gráfico de Barras Dinâmico com Hover Interativo */}
      <div
        className={cn(
          "rounded-lg border border-primary/30 bg-primary-dark/20 flex flex-col",
          isCompact ? "p-2 gap-2" : "p-3 gap-3",
        )}
      >
        <div className="flex items-center justify-between text-label-g text-neutral-400">
          <span>Ganhos por Semana</span>
          <span
            className={cn(
              "font-medium transition-colors",
              activeHoveredBar ? "text-gold font-bold" : "text-gold",
            )}
          >
            {activeHoveredBar
              ? `+${activeHoveredBar.gold} 🪙 (${activeHoveredBar.periodLabel || activeHoveredBar.label})`
              : `+${weeklyEarnings} 🪙 nessa semana`}
          </span>
        </div>

        {/* Barras do gráfico com cálculo de altura relativo e tooltip flutuante */}
        <div
          className={cn(
            "w-full flex items-end justify-between gap-3 px-2 border-b border-white/10 relative",
            isCompact ? "h-11" : "h-14",
          )}
          role="img"
          aria-label="Gráfico de ganhos semanais em moedas"
        >
          {displayBars.map((bar, index) => {
            const isHovered = hoveredIndex === index;
            const fullLabel = bar.periodLabel
              ? `${bar.label} (${bar.periodLabel})`
              : bar.label;
            return (
              <button
                type="button"
                key={bar.label}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center gap-1 h-full justify-end group/bar relative cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                title={`${fullLabel}: +${bar.gold} moedas`}
                aria-label={`${fullLabel}: +${bar.gold} moedas ganhas`}
              >
                {/* Balãozinho flutuante de tooltip no hover */}
                {isHovered && (
                  <div className="absolute -top-6 px-1.5 py-0.5 rounded-md bg-neutral-900 border border-gold/70 text-gold text-[10px] font-bold shadow-glow-gold-xs pointer-events-none whitespace-nowrap z-30 transition-all transform -translate-y-1">
                    +{bar.gold} 🪙
                  </div>
                )}

                <div
                  className={cn(
                    "w-full rounded-t transition-all duration-300 ease-out origin-bottom",
                    bar.isHighlight
                      ? "bg-gold shadow-glow-gold-xs"
                      : "bg-primary/50",
                    isHovered &&
                      "brightness-125 scale-y-[1.06] shadow-glow-gold-sm bg-gold",
                  )}
                  style={{ height: `${bar.heightPercent}%` }}
                />
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
      </div>
    </div>
  );
}
