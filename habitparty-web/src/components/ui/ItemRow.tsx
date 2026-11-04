"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, type default as React } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { cn, formatCoins } from "@/utils";
import { resolveCatalogItemVisuals } from "@/utils/catalogItemVisuals";
import {
  formatBackpackItemRemainingTime,
  formatFocusMinutes,
} from "@/utils/focusFormatters";

export interface ItemRowProps {
  id: string;
  title: string;
  description?: string;
  type: string;
  packageLevel?: string | null;
  category?: string | null;
  iconName?: string;
  baseDurationMinutes?: number | null;
  remainingSeconds?: number | null;
  isCompact?: boolean;
  quantity?: number;
  price?: number;
  disabled?: boolean;
  disabledTitle?: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dragData?: Record<string, unknown>;
  inUse?: boolean;
  isActiveFocusSession?: boolean;
}

/**
 * Linha de lista reordenável e memoizada para Vitrine (Rewards) e Mochila (Inventory).
 * Utiliza uma única árvore DOM responsiva (Flex no mobile -> Grid de 5 colunas no desktop md+).
 */
export const ItemRow = memo(function ItemRow({
  id,
  title,
  description,
  type,
  packageLevel,
  category,
  iconName,
  baseDurationMinutes,
  remainingSeconds,
  isCompact = false,
  quantity,
  price,
  disabled = false,
  disabledTitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onContextMenu,
  dragData,
  inUse = false,
  isActiveFocusSession,
}: ItemRowProps) {
  const t = useTranslations("ui.itemCatalog");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const {
    typeKey,
    typeMeta,
    RewardIcon,
    isMystery,
    hasValidPackage,
    hasValidCategory,
    packageMessageKey,
    categoryMessageKey,
    packageBadgeColor,
    packageIconTheme,
    leftAccentClass,
    isFocusNavigate,
  } = resolveCatalogItemVisuals({
    type,
    iconName,
    packageLevel,
    category,
    isActiveFocusSession,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: dragData || { id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isPrimaryDisabled = disabled || (inUse && !isFocusNavigate);

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={onContextMenu}
      className={cn(
        "relative rounded-xl bg-card dark:bg-linear-to-r dark:from-surface dark:via-surface dark:to-popover/95 border transition-[border-color,background-color,box-shadow,transform] duration-150 select-none group overflow-hidden shadow-2xs dark:shadow-none",
        inUse
          ? "border-amber-500/45 bg-card dark:border-amber-500/40 dark:bg-amber-500/5 border-l-4 border-l-amber-500"
          : cn(
              "border-neutral-700 dark:border-white/10 hover:border-gold/50 hover:shadow-card-deep hover:-translate-y-0.5",
              leftAccentClass,
            ),
        "flex flex-col gap-2.5 p-3 sm:p-3.5",
        "md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_auto] md:items-center",
        isCompact ? "md:gap-3 md:px-3 md:py-2" : "md:gap-4 md:px-4 md:py-2.5",
        isDragging && "transition-none! opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* Coluna 1: Grip + Ícone + [Qtd] + Título/Descrição (+ Preço rápido no mobile) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="w-4 flex items-center justify-center shrink-0">
            <GripVertical
              size={isCompact ? 12 : 14}
              className="text-neutral-500 group-hover:text-neutral-300 transition-colors cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            />
          </div>

          <div
            className={cn(
              "rounded-xl border flex items-center justify-center transition-all duration-200 shrink-0 group-hover:scale-105",
              packageIconTheme ||
                (typeKey === "TimeBased"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 group-hover:border-emerald-500/40 dark:bg-white/10 dark:border-white/15 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40"
                  : "bg-primary/10 text-primary border-primary/20 group-hover:border-primary/40 dark:bg-white/10 dark:border-white/15 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40"),
              isCompact ? "w-8.5 h-8.5" : "w-9 h-9 md:w-10 md:h-10",
            )}
          >
            <RewardIcon
              size={isCompact ? 16 : 19}
              className={isMystery ? "text-amber-400" : undefined}
              aria-hidden="true"
            />
          </div>

          {typeof quantity === "number" && (
            <span
              className={cn(
                "font-bold bg-white/10 border border-white/20 text-neutral-100 shrink-0",
                isCompact
                  ? "text-tiny px-1.5 py-0.5 rounded"
                  : "text-xs px-2 py-0.5 rounded-md",
              )}
            >
              {quantity}x
            </span>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <h4
              className={cn(
                "font-bold text-neutral-100 truncate group-hover:text-gold transition-colors leading-tight",
                isCompact ? "text-xs" : "text-body-s",
              )}
            >
              {title}
            </h4>
            {description && (
              <p
                className={cn(
                  "text-neutral-400 truncate mt-0.5 leading-tight",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Preço visível no topo direito apenas no Mobile (< md) */}
        {typeof price === "number" && (
          <div
            className={cn(
              "flex md:hidden items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-lg border",
              isGamified
                ? "bg-amber-500/10 border-amber-500/25 text-neutral-50 dark:bg-gold/10 dark:border-gold/25 dark:text-neutral-100"
                : "bg-sky-500/10 border-sky-500/25 text-sky-900 dark:bg-sky-500/15 dark:border-sky-400/30 dark:text-sky-100",
            )}
          >
            <CoinIcon size={14} withGlow />
            <span className="font-bold text-xs">
              {formatCoins(price, { locale })}
            </span>
          </div>
        )}
      </div>

      {/* Container de Metadados: No Mobile fica em linha única com wrap; no Desktop usa `md:contents` para ocupar as Colunas 2, 3 e 4 do Grid */}
      <div className="flex items-center gap-1.5 flex-wrap pl-6 md:pl-0 md:contents">
        {/* Coluna 2: Badge de Status (Em Foco) + Tipo */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {inUse && (
            <span
              className={cn(
                "text-label-m font-bold border truncate inline-flex items-center gap-1.5 leading-none shrink-0 border-amber-500/40 bg-amber-500/15 text-amber-300",
                isCompact ? "px-1.5 py-0.5 rounded" : "px-2 py-0.5 rounded-md",
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {t("inFocus")}
            </span>
          )}
          <span
            className={cn(
              "text-label-m font-medium border truncate inline-flex items-center gap-1 leading-none shrink-0",
              isCompact ? "px-1.5 py-0.5 rounded" : "px-2 py-0.5 rounded-md",
              typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20",
            )}
          >
            {typeMeta?.icon && (
              <typeMeta.icon
                size={isCompact ? 9 : 11}
                className="shrink-0"
                aria-hidden="true"
              />
            )}
            <span>{t(`types.${typeKey}`)}</span>
          </span>
        </div>

        {/* Coluna 3: Pacote (Raridade) & Categoria */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {hasValidPackage && (
            <span
              className={cn(
                "text-label-m font-semibold border truncate rounded",
                isCompact ? "px-1.5 py-0.5" : "px-2 py-0.5",
                packageBadgeColor,
              )}
            >
              {t(`packages.${packageMessageKey}`)}
            </span>
          )}
          {hasValidCategory && (
            <span
              className={cn(
                "text-label-m font-medium bg-white/10 border border-white/10 text-neutral-300 truncate rounded",
                isCompact ? "px-1.5 py-0.5" : "px-2 py-0.5",
              )}
            >
              {t(`categories.${categoryMessageKey}`)}
            </span>
          )}
        </div>

        {/* Coluna 4: Duração */}
        <div className="flex items-center gap-1.5 text-neutral-300 min-w-0">
          {typeKey === "TimeBased" || remainingSeconds !== undefined ? (
            remainingSeconds !== undefined && remainingSeconds !== null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 truncate font-medium",
                  remainingSeconds <= 1 ? "text-emerald-400" : "text-gold",
                  isCompact ? "text-label-m" : "text-label-g",
                )}
              >
                <Clock
                  size={isCompact ? 11 : 13}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {formatBackpackItemRemainingTime(remainingSeconds, locale)}
                </span>
              </span>
            ) : baseDurationMinutes ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-extrabold bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                <Clock
                  size={isCompact ? 11 : 13}
                  className="text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {formatFocusMinutes(baseDurationMinutes)}
                </span>
              </span>
            ) : (
              <span
                className={cn(
                  "text-neutral-400 truncate",
                  isCompact ? "text-label-m" : "text-label-g",
                )}
              >
                {t("couponDurationFallback")}
              </span>
            )
          ) : (
            <span
              className={cn(
                "text-neutral-400 truncate",
                isCompact ? "text-label-m" : "text-label-g",
              )}
            >
              {t("instantUseDuration")}
            </span>
          )}
        </div>
      </div>

      {/* Coluna 5: Preço (Desktop) & Botões de Ação */}
      <div className="flex items-center justify-end gap-2 md:gap-3.5 pt-1 md:pt-0 border-t border-neutral-700 dark:border-white/5 md:border-t-0 shrink-0">
        {typeof price === "number" && (
          <div
            className={cn(
              "hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border",
              isGamified
                ? "bg-amber-500/10 border-amber-500/25 text-neutral-50 dark:bg-gold/10 dark:border-gold/25 dark:text-neutral-100"
                : "bg-sky-500/10 border-sky-500/25 text-sky-900 dark:bg-sky-500/15 dark:border-sky-400/30 dark:text-sky-100",
            )}
          >
            <CoinIcon size={isCompact ? 15 : 16} withGlow />
            <span
              className={cn("font-bold", isCompact ? "text-xs" : "text-xs")}
            >
              {formatCoins(price, { locale })}
            </span>
          </div>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            disabled={disabled || inUse}
            aria-label={`${secondaryActionLabel} ${title}`}
            title={
              inUse
                ? t("tooltips.inUse")
                : t("tooltips.actionTarget", {
                    action: secondaryActionLabel,
                    title,
                  })
            }
            className={cn(
              "rounded-md font-semibold transition-all shadow-xs border text-neutral-200",
              disabled || inUse
                ? "bg-white/5 border-white/10 text-neutral-400 cursor-not-allowed opacity-60"
                : "border-neutral-600 dark:border-primary/40 bg-surface/80 hover:bg-gold/15 hover:border-gold/60 hover:text-gold active:scale-95 cursor-pointer",
              isCompact ? "px-2 py-0.5 text-label-g" : "px-2.5 py-1 text-xs",
            )}
          >
            {secondaryActionLabel}
          </button>
        )}

        <button
          type="button"
          onClick={onAction}
          disabled={isPrimaryDisabled}
          aria-label={`${actionLabel} ${title}`}
          title={
            isFocusNavigate
              ? t("tooltips.openFocusSession")
              : inUse
                ? t("tooltips.inUse")
                : disabled
                  ? disabledTitle || t("tooltips.insufficientCoins")
                  : t("tooltips.actionTarget", {
                      action: actionLabel,
                      title,
                    })
          }
          className={cn(
            "rounded-md font-semibold dark:font-bold transition-all shadow-xs",
            isFocusNavigate || (!disabled && !inUse)
              ? "bg-gold hover:bg-gold-hover active:bg-gold-pressed text-on-gold border border-gold shadow-glow-gold-xs cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card"
              : "bg-neutral-700/70 dark:bg-white/10 text-neutral-400 border border-neutral-600 dark:border-white/10 cursor-not-allowed opacity-75 dark:opacity-60",
            isCompact
              ? "px-2.5 py-1 text-label-g"
              : "px-3 py-1.5 text-xs sm:py-1",
          )}
        >
          {actionLabel}
        </button>
      </div>
    </li>
  );
});

export {
  ItemRowHeader,
  type ItemRowHeaderProps,
} from "./ItemRowHeader";
