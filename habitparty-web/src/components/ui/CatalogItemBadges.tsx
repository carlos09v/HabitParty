import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { TIER_CHIP_STYLES } from "@/constants/reward";
import type { AppLocale } from "@/i18n/config";
import type { CatalogItemVariant } from "@/types/reward";
import { cn, formatCoins, STOP_DRAG_PROPAGATION_PROPS } from "@/utils";
import {
  formatBackpackItemRemainingTime,
  formatFocusMinutes,
} from "@/utils/focusFormatters";
import { toPackageMessageKey } from "@/utils/rewardMapper";

interface CatalogItemDurationBadgeProps {
  remainingSeconds?: number | null;
  baseDurationMinutes?: number | null;
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
            "inline-flex items-center gap-1 truncate font-semibold text-label-g",
            isDepleted
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-gold",
            className,
          )}
        >
          <Clock size={12} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {formatBackpackItemRemainingTime(remainingSeconds, locale)}
          </span>
        </span>
      );
    }

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-bold tracking-tight leading-none text-label-g",
          isDepleted
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
            : "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:bg-gold/15 dark:border-gold/40 dark:text-gold dark:shadow-glow-gold-xs",
          className,
        )}
      >
        <Clock size={12} className="shrink-0" aria-hidden="true" />
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
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-extrabold tracking-tight leading-none bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-label-g",
          className,
        )}
        title={t("durationTitle", { minutes: baseDurationMinutes })}
      >
        <Clock
          size={12}
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
  isGamified?: boolean;
  variant?: "default" | "debt";
  className?: string;
}

/**
 * Pílula unificada de preço em Moedas/Créditos compartilhada entre GamifiedItemCard e ItemRow.
 */
export function CatalogItemPricePill({
  price,
  size = "md",
  canAfford = true,
  isGamified = true,
  variant = "default",
  className,
}: CatalogItemPricePillProps) {
  const locale = useLocale() as AppLocale;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border transition-colors shrink-0",
        size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1",
        !canAfford
          ? "bg-surface/80 border-neutral-700/80 text-neutral-300 dark:bg-white/5 dark:border-white/10 dark:text-neutral-300"
          : variant === "debt"
            ? "bg-rose-500/12 border-rose-500/35 text-rose-800 dark:bg-rose-500/15 dark:border-rose-400/35 dark:text-rose-100"
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

interface CatalogItemVariantChipsProps {
  variants: CatalogItemVariant[];
  activeVariantId: string;
  onSelectVariant: (variantId: string) => void;
  variant?: "card" | "row";
  disabled?: boolean;
  className?: string;
}

/**
 * Seletor segmentado em mini-abas (card) ou pílulas compactas (linha)
 * para escolha de pacote/duração em recompensas agrupadas.
 */
export function CatalogItemVariantChips({
  variants,
  activeVariantId,
  onSelectVariant,
  variant = "card",
  disabled = false,
  className,
}: CatalogItemVariantChipsProps) {
  const t = useTranslations("ui.itemCatalog");
  const locale = useLocale() as AppLocale;

  if (variants.length <= 1) return null;

  const isRow = variant === "row";
  const fieldsetClassName = isRow
    ? cn(
        "flex items-center gap-1 flex-wrap border-0 p-0 m-0 min-w-0",
        className,
      )
    : cn(
        "grid gap-1 border-0 p-0 m-0 min-w-0 w-full",
        variants.length <= 4 ? "grid-flow-col auto-cols-fr" : "grid-cols-4",
        className,
      );

  return (
    <fieldset
      className={fieldsetClassName}
      aria-label={t("packageVariantsAria")}
      {...STOP_DRAG_PROPAGATION_PROPS}
    >
      {variants.map((item) => {
        const pkgKey = toPackageMessageKey(item.packageLevel);
        const chipStyle = TIER_CHIP_STYLES[pkgKey] ?? TIER_CHIP_STYLES.NONE;
        const isSelected = activeVariantId === item.id;
        const hasNamedTier = pkgKey !== "NONE";
        const tierLabel = t(`packages.${pkgKey}`);
        const durationText = item.baseDurationMinutes
          ? formatFocusMinutes(item.baseDurationMinutes)
          : null;
        const formattedPrice = formatCoins(item.price, { locale });
        const accessibleLabel = durationText
          ? t("packageOptionWithDurationAria", {
              tier: tierLabel,
              duration: durationText,
              price: formattedPrice,
            })
          : t("packageOptionWithPriceAria", {
              tier: tierLabel,
              price: formattedPrice,
            });

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={accessibleLabel}
            title={accessibleLabel}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onSelectVariant(item.id);
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex items-center gap-1 border font-semibold leading-tight transition-[color,background-color,border-color,box-shadow] cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-1",
              isRow
                ? "px-1.5 py-0.5 rounded-md text-[11px] tabular-nums"
                : "justify-center min-h-6 px-1.5 py-1 rounded-lg text-[10.5px] min-w-0",
              isSelected ? chipStyle.selectedClass : chipStyle.unselectedClass,
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            {hasNamedTier && chipStyle.dotColor && (
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  chipStyle.dotColor,
                )}
                aria-hidden="true"
              />
            )}

            {isRow ? (
              <>
                {hasNamedTier && <span>{tierLabel}</span>}
                {hasNamedTier && durationText && (
                  <span className="opacity-65">·</span>
                )}
                {durationText ? (
                  <span>{durationText}</span>
                ) : (
                  <span className="inline-flex items-center gap-0.5">
                    {hasNamedTier && (
                      <span className="opacity-65 mr-0.5">·</span>
                    )}
                    <CoinIcon size={10} />
                    <span>{formattedPrice}</span>
                  </span>
                )}
              </>
            ) : durationText ? (
              <span className="inline-flex items-center gap-0.5 min-w-0">
                {!(hasNamedTier && chipStyle.dotColor) && (
                  <Clock size={10} className="shrink-0" aria-hidden="true" />
                )}
                <span className="truncate tabular-nums">{durationText}</span>
              </span>
            ) : variants.length <= 2 ? (
              <span className="truncate">{tierLabel}</span>
            ) : (
              <span className="inline-flex items-center gap-0.5 min-w-0 tabular-nums opacity-95">
                <CoinIcon size={10} />
                <span className="truncate">{formattedPrice}</span>
              </span>
            )}
          </button>
        );
      })}
    </fieldset>
  );
}
