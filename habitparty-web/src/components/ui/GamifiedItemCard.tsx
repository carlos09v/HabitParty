"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, type default as React, useState } from "react";
import { MysteryBoxTierPopover } from "@/components/reward/MysteryBoxTierPopover";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { MysteryBoxLootItem } from "@/types/reward";
import { cn, formatCoins } from "@/utils";
import { resolveCatalogItemVisuals } from "@/utils/catalogItemVisuals";
import {
  formatBackpackItemRemainingTime,
  formatFocusMinutes,
} from "@/utils/focusFormatters";

export interface GamifiedItemCardProps {
  id: string;
  title: string;
  description?: string;
  iconName?: string;
  type: string;
  packageLevel?: string | null;
  category?: string | null;
  baseDurationMinutes?: number | null;
  remainingSeconds?: number | null;
  isCompact?: boolean;
  quantity?: number;
  price?: number;
  canAfford?: boolean;
  actionLabel: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dragData?: Record<string, unknown>;
  inUse?: boolean;
  isActiveFocusSession?: boolean;
  lootItems?: MysteryBoxLootItem[];
}

/**
 * Card gamificado unificado e memoizado para itens da Vitrine (Rewards) e da Mochila (Inventory).
 */
export const GamifiedItemCard = memo(function GamifiedItemCard({
  id,
  title,
  description,
  iconName,
  type,
  packageLevel,
  category,
  baseDurationMinutes,
  remainingSeconds,
  isCompact = false,
  quantity,
  price,
  canAfford = true,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onDoubleClick,
  onContextMenu,
  dragData,
  inUse = false,
  isActiveFocusSession,
  lootItems,
}: GamifiedItemCardProps) {
  const t = useTranslations("ui.itemCatalog");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const {
    typeKey,
    typeMeta,
    RewardIcon,
    isMystery,
    mysteryTier,
    hasValidPackage,
    hasValidCategory,
    packageMessageKey,
    categoryMessageKey,
    packageBadgeColor,
    packageGlow,
    packageIconTheme,
    topBarClass,
    isFocusNavigate,
  } = resolveCatalogItemVisuals({
    type,
    iconName,
    packageLevel,
    category,
    isActiveFocusSession,
    includeMysteryTier: true,
  });

  const [isHovered, setIsHovered] = useState(false);
  const [popoverPlacement, setPopoverPlacement] = useState<{
    side: "left" | "right";
    vertical: "top" | "bottom";
  }>({ side: "right", vertical: "top" });

  const handleMysteryEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.top;

    const side = spaceRight < 310 ? "left" : "right";
    const vertical = spaceBelow < 380 && rect.bottom > 380 ? "bottom" : "top";

    setPopoverPlacement({ side, vertical });
    setIsHovered(true);
  };

  const handleMysteryFocus = (e: React.FocusEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.top;

    const side = spaceRight < 310 ? "left" : "right";
    const vertical = spaceBelow < 380 && rect.bottom > 380 ? "bottom" : "top";

    setPopoverPlacement({ side, vertical });
    setIsHovered(true);
  };

  const handleMysteryLeave = () => {
    setIsHovered(false);
  };

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

  const isPrimaryDisabled = !canAfford || (inUse && !isFocusNavigate);

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={(e) => {
        if (isDragging || !onDoubleClick) return;
        e.stopPropagation();
        onDoubleClick(e);
      }}
      onContextMenu={onContextMenu}
      onMouseEnter={isMystery ? handleMysteryEnter : undefined}
      onMouseLeave={isMystery ? handleMysteryLeave : undefined}
      onFocus={isMystery ? handleMysteryFocus : undefined}
      onBlur={isMystery ? handleMysteryLeave : undefined}
      className={cn(
        "relative flex flex-col justify-between rounded-xl bg-card dark:bg-linear-to-b dark:from-surface dark:via-surface dark:to-popover/95 border transition-[border-color,background-color,transform] duration-150 group select-none shadow-xs dark:shadow-sm hover:shadow-card-deep hover:-translate-y-0.5",
        isHovered && isMystery && !isDragging
          ? "overflow-visible z-40"
          : "overflow-hidden",
        inUse
          ? "border-amber-500/45 bg-card dark:border-amber-500/40 dark:bg-amber-500/5"
          : packageGlow ||
              "border-neutral-700 hover:border-amber-500/50 dark:border-white/15 dark:hover:border-gold/50",
        isCompact ? "p-2.5 gap-2" : "p-3.5 gap-2.5",
        onDoubleClick && "cursor-pointer",
        isDragging && "transition-none! opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* Detalhe de Raridade / Status no Topo do Card */}
      {(inUse || topBarClass) && (
        <div
          className={cn(
            "absolute top-0 inset-x-0 h-1 bg-linear-to-r pointer-events-none",
            inUse
              ? "from-amber-500 to-yellow-500 opacity-95"
              : cn("from-transparent to-transparent", topBarClass),
          )}
        />
      )}

      {/* TOPO INTEGRADO: Ícone + Título/Descrição + Badges de Tipo/Quantidade */}
      <div className="flex flex-col gap-2 w-full min-w-0">
        <header className="flex items-start gap-2.5 w-full min-w-0">
          <div
            className={cn(
              "rounded-xl border flex items-center justify-center transition-[transform,border-color,color,background-color] duration-200 shrink-0 group-hover:scale-105",
              packageIconTheme ||
                (typeKey === "TimeBased"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 group-hover:border-emerald-500/40 dark:bg-white/10 dark:border-white/15 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40"
                  : "bg-primary/10 text-primary border-primary/20 group-hover:border-primary/40 dark:bg-white/10 dark:border-white/15 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40"),
              isCompact ? "w-9 h-9" : "w-10 h-10",
            )}
          >
            <RewardIcon
              size={isCompact ? 17 : 20}
              className={
                isMystery ? "text-amber-700 dark:text-amber-400" : undefined
              }
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
              <h4
                className={cn(
                  "font-bold text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors leading-tight",
                  isCompact ? "text-xs" : "text-body-s",
                )}
              >
                {title}
              </h4>

              <div className="flex items-center gap-1 shrink-0">
                {inUse && (
                  <span className="inline-flex items-center gap-1 font-bold rounded border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 text-tiny px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                    {t("inFocus")}
                  </span>
                )}

                {typeof quantity === "number" && (
                  <span
                    className={cn(
                      "font-bold bg-white/10 border border-white/20 text-neutral-100 px-1.5 py-0.5",
                      isCompact
                        ? "text-tiny rounded"
                        : "text-label-g rounded-md",
                    )}
                  >
                    {quantity}x
                  </span>
                )}

                <span
                  className={cn(
                    "inline-flex items-center gap-1 border font-medium leading-none shrink-0 text-tiny px-1.5 py-0.5",
                    isCompact ? "rounded" : "rounded-md",
                    typeMeta?.color ||
                      "text-neutral-200 bg-white/10 border-white/20",
                  )}
                >
                  {typeMeta?.icon && (
                    <typeMeta.icon
                      size={isCompact ? 9 : 10}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span>{t(`types.${typeKey}`)}</span>
                </span>
              </div>
            </div>

            {description && description.trim() !== "" ? (
              <p
                className={cn(
                  "text-neutral-400 truncate leading-tight",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                {description}
              </p>
            ) : (
              <p
                className={cn(
                  "text-neutral-400 italic truncate leading-tight",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                {typeKey === "TimeBased"
                  ? t("fallbackDescriptions.timeBased")
                  : isMystery
                    ? t("fallbackDescriptions.mystery")
                    : t("fallbackDescriptions.singleUse")}
              </p>
            )}
          </div>
        </header>

        {/* LINHA DE BADGES: Duração em Destaque + Raridade + Categoria */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {typeKey === "TimeBased" || remainingSeconds !== undefined ? (
            remainingSeconds !== undefined && remainingSeconds !== null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-bold tracking-tight leading-none",
                  isCompact ? "text-tiny" : "text-label-g",
                  remainingSeconds <= 1
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:bg-gold/15 dark:border-gold/40 dark:text-gold dark:shadow-glow-gold-xs",
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
            ) : baseDurationMinutes ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-extrabold tracking-tight leading-none bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 dark:shadow-[0_0_10px_rgba(16,185,129,0.12)]",
                  isCompact ? "text-tiny" : "text-label-g",
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
            ) : null
          ) : null}

          {hasValidPackage && (
            <span
              className={cn(
                "font-semibold rounded border text-tiny px-1.5 py-0.5 leading-none",
                packageBadgeColor,
              )}
            >
              {t(`packages.${packageMessageKey}`)}
            </span>
          )}
          {hasValidCategory && (
            <span className="font-medium rounded bg-white/8 border border-white/10 text-neutral-300 text-tiny px-1.5 py-0.5 leading-none">
              {t(`categories.${categoryMessageKey}`)}
            </span>
          )}
        </div>
      </div>

      {/* BASE: Preço (na Loja) ou Status + Botões de Ação */}
      <footer className="flex items-center justify-between pt-2.5 border-t border-neutral-700 dark:border-white/10 w-full gap-2">
        <div className="flex items-center min-w-0">
          {typeof price === "number" ? (
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border",
                isGamified
                  ? "bg-amber-500/10 border-amber-500/25 text-neutral-50 dark:bg-gold/10 dark:border-gold/25 dark:text-neutral-100"
                  : "bg-sky-500/10 border-sky-500/25 text-sky-900 dark:bg-sky-500/15 dark:border-sky-400/30 dark:text-sky-100",
              )}
            >
              <CoinIcon size={15} withGlow />
              <span className="text-xs font-extrabold">
                {formatCoins(price, { locale })}
              </span>
            </div>
          ) : !(secondaryActionLabel && onSecondaryAction) ? (
            <span className="text-neutral-400 font-medium truncate text-tiny">
              {inUse
                ? t("statuses.activeSession")
                : isMystery
                  ? t("statuses.sealedBox")
                  : t("statuses.available")}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 shrink-0",
            typeof price !== "number" &&
              secondaryActionLabel &&
              onSecondaryAction &&
              "w-full justify-end",
          )}
        >
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              onDoubleClick={(e) => e.stopPropagation()}
              disabled={inUse}
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
                "rounded-lg font-semibold transition-[transform,background-color,border-color,color,opacity] duration-150 shadow-xs border text-neutral-200",
                inUse
                  ? "bg-white/5 border-white/10 text-neutral-400 cursor-not-allowed opacity-60"
                  : "border-neutral-600 dark:border-primary/40 bg-surface/80 hover:bg-primary/10 hover:border-primary/40 hover:text-primary dark:hover:bg-gold/15 dark:hover:border-gold/60 dark:hover:text-gold active:scale-95 cursor-pointer",
                isCompact ? "px-2.5 py-1 text-label-g" : "px-3 py-1.5 text-xs",
              )}
            >
              {secondaryActionLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onAction}
            onDoubleClick={(e) => e.stopPropagation()}
            disabled={isPrimaryDisabled}
            aria-label={`${actionLabel} ${title}`}
            title={
              isFocusNavigate
                ? t("tooltips.openFocusSession")
                : inUse
                  ? t("tooltips.inUse")
                  : !canAfford
                    ? t("tooltips.insufficientCoins")
                    : price
                      ? t("tooltips.actionForPrice", {
                          action: actionLabel,
                          price: formatCoins(price, { locale }),
                        })
                      : t("tooltips.actionTarget", {
                          action: actionLabel,
                          title,
                        })
            }
            className={cn(
              "rounded-lg font-semibold dark:font-bold transition-[transform,background-color,border-color,color,opacity] duration-150 shadow-xs",
              typeof price !== "number" &&
                secondaryActionLabel &&
                onSecondaryAction &&
                "flex-1 sm:flex-initial text-center",
              isFocusNavigate || (canAfford && !inUse)
                ? "bg-gold hover:bg-gold-hover active:bg-gold-pressed text-on-gold border border-gold shadow-glow-gold-xs cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card"
                : "bg-neutral-700/70 dark:bg-white/10 text-neutral-400 border border-neutral-600 dark:border-white/10 cursor-not-allowed opacity-75 dark:opacity-60",
              isCompact ? "px-2.5 py-1 text-label-g" : "px-3.5 py-1.5 text-xs",
            )}
          >
            {actionLabel}
          </button>
        </div>
      </footer>

      {/* Popover Informativo com Chances e Drops da Caixa Misteriosa */}
      {isHovered && isMystery && mysteryTier && !isDragging && (
        <MysteryBoxTierPopover
          tier={mysteryTier}
          customPrice={price}
          customLootItems={lootItems}
          alignClass={cn(
            "max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:top-full max-sm:mt-2",
            popoverPlacement.vertical === "bottom"
              ? "sm:bottom-0 sm:top-auto"
              : "sm:top-0 sm:bottom-auto",
            popoverPlacement.side === "right"
              ? "sm:left-full sm:right-auto sm:ml-3 sm:translate-x-0"
              : "sm:right-full sm:left-auto sm:mr-3 sm:translate-x-0",
          )}
        />
      )}
    </article>
  );
});
