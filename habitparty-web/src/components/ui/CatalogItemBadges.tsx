"use client";

import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { cn, formatCoins } from "@/utils";
import {
  formatBackpackItemRemainingTime,
  formatFocusMinutes,
} from "@/utils/focusFormatters";

interface CatalogItemDurationBadgeProps {
  remainingSeconds?: number | null;
  baseDurationMinutes?: number | null;
  isCompact?: boolean;
  variant?: "pill" | "inline";
  className?: string;
}

/**
 * Badge unificado de duração (cupom fechado) ou tempo restante (item da Mochila/Foco),
 * compartilhado entre GamifiedItemCard e ItemRow.
 */
export function CatalogItemDurationBadge({
  remainingSeconds,
  baseDurationMinutes,
  isCompact = false,
  variant = "pill",
  className,
}: CatalogItemDurationBadgeProps) {
  const t = useTranslations("ui.itemCatalog");
  const locale = useLocale() as AppLocale;

  if (remainingSeconds !== undefined && remainingSeconds !== null) {
    const isDepleted = remainingSeconds <= 1;
    if (variant === "inline") {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 truncate font-semibold",
            isDepleted
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-gold",
            isCompact ? "text-label-m" : "text-label-g",
            className,
          )}
        >
          <Clock
            size={isCompact ? 11 : 12}
            className="shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">
            {formatBackpackItemRemainingTime(remainingSeconds, locale)}
          </span>
        </span>
      );
    }

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-bold tracking-tight leading-none",
          isCompact ? "text-tiny" : "text-label-g",
          isDepleted
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
            : "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:bg-gold/15 dark:border-gold/40 dark:text-gold dark:shadow-glow-gold-xs",
          className,
        )}
      >
        <Clock
          size={isCompact ? 10 : 12}
          className="shrink-0"
          aria-hidden="true"
        />
        <span className="truncate">
          {formatBackpackItemRemainingTime(remainingSeconds, locale)}
        </span>
      </span>
    );
  }

  if (baseDurationMinutes) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-extrabold tracking-tight leading-none bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300",
          isCompact ? "text-tiny" : "text-label-g",
          className,
        )}
        title={t("durationTitle", { minutes: baseDurationMinutes })}
      >
        <Clock
          size={isCompact ? 10 : 12}
          className="text-emerald-700 dark:text-emerald-400 shrink-0"
          aria-hidden="true"
        />
        <span className="truncate">
          {formatFocusMinutes(baseDurationMinutes)}
        </span>
      </span>
    );
  }

  return null;
}

interface CatalogItemPricePillProps {
  price: number;
  size?: "sm" | "md";
  canAfford?: boolean;
  className?: string;
}

/**
 * Pílula unificada de preço em Moedas/Créditos compartilhada entre GamifiedItemCard e ItemRow.
 */
export function CatalogItemPricePill({
  price,
  size = "md",
  canAfford = true,
  className,
}: CatalogItemPricePillProps) {
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border transition-colors",
        size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1",
        !canAfford
          ? "bg-surface/80 border-neutral-700/80 text-neutral-300 dark:bg-white/5 dark:border-white/10 dark:text-neutral-300"
          : isGamified
            ? "bg-amber-500/10 border-amber-500/25 text-neutral-50 dark:bg-gold/10 dark:border-gold/25 dark:text-neutral-100"
            : "bg-sky-500/10 border-sky-500/25 text-sky-900 dark:bg-sky-500/15 dark:border-sky-400/30 dark:text-sky-100",
        className,
      )}
    >
      <CoinIcon size={size === "sm" ? 14 : 15} withGlow={canAfford} />
      <span className="text-xs font-extrabold tabular-nums">
        {formatCoins(price, { locale })}
      </span>
    </div>
  );
}
