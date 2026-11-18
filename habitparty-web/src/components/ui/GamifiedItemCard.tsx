"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, HelpCircle, Loader2, MoreVertical } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, type default as React, useCallback } from "react";
import { createPortal } from "react-dom";
import { MysteryBoxTierPopover } from "@/components/reward/MysteryBoxTierPopover";
import {
  CatalogItemDurationBadge,
  CatalogItemPricePill,
} from "@/components/ui/CatalogItemBadges";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { AppLocale } from "@/i18n/config";
import type { MysteryBoxLootItem } from "@/types/reward";
import {
  cn,
  formatCoins,
  openContextMenuFromButton,
  STOP_DRAG_PROPAGATION_PROPS,
} from "@/utils";
import { resolveCatalogItemVisuals } from "@/utils/catalogItemVisuals";
import { formatFocusMinutes } from "@/utils/focusFormatters";

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
  currentCoins?: number;
  canAfford?: boolean;
  actionLabel: string;
  onAction?: () => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dragData?: Record<string, unknown>;
  inUse?: boolean;
  isActiveFocusSession?: boolean;
  isDeleteChecking?: boolean;
  isActionLoading?: boolean;
  lootItems?: MysteryBoxLootItem[];
}

/**
 * Card unificado e memoizado para itens da Vitrine (Rewards) e da Mochila (Inventory).
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
  currentCoins,
  canAfford = true,
  actionLabel,
  onAction,
  onDoubleClick,
  onContextMenu,
  dragData,
  inUse = false,
  isActiveFocusSession,
  isDeleteChecking = false,
  isActionLoading = false,
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

  const {
    containerRef: tierContainerRef,
    popoverRef: tierPopoverRef,
    isOpen: isTierPopoverOpen,
    open: openTierPopover,
    close: closeTierPopover,
    toggle: toggleTierPopover,
    coords: tierPopoverCoords,
    shouldRenderPortal: shouldRenderTierPortal,
    floatingStyle: tierFloatingStyle,
  } = useFloatingPopover<HTMLElement, HTMLElement, HTMLElement>({
    align: "right",
    estimatedWidth: 288,
    estimatedHeight: 340,
    margin: 12,
    offset: 8,
    zIndex: 80,
    disabled: !isMystery || !mysteryTier || isDragging,
  });

  const setCardRefs = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node);
      tierContainerRef.current = node;
    },
    [setNodeRef, tierContainerRef],
  );

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isPrimaryDisabled =
    !canAfford || (inUse && !isFocusNavigate) || isActionLoading;
  const trimmedDescription = description?.trim() ?? "";

  const showStoreProgress =
    typeof price === "number" && price > 0 && typeof currentCoins === "number";

  const clampedCoins = showStoreProgress ? Math.max(0, currentCoins) : 0;
  const isProgressComplete =
    showStoreProgress && canAfford && clampedCoins >= price;
  const missingCoins =
    showStoreProgress && !isProgressComplete
      ? Math.max(0.01, Math.round((price - clampedCoins) * 100) / 100)
      : 0;
  const progressPercent = showStoreProgress
    ? isProgressComplete
      ? 100
      : clampedCoins <= 0
        ? 0
        : Math.min(99, Math.max(4, Math.round((clampedCoins / price) * 100)))
    : 0;

  const showInlineDurationInType =
    typeKey === "TimeBased" &&
    Boolean(baseDurationMinutes) &&
    remainingSeconds === undefined;

  const isDebtCategory = categoryMessageKey === "DEBT";
  const showSubtleCategory = hasValidCategory && !isDebtCategory;

  return (
    <article
      ref={setCardRefs}
      style={style}
      {...attributes}
      {...listeners}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        listeners?.onKeyDown?.(e);
      }}
      onDoubleClick={(e) => {
        if (isDragging || !onDoubleClick) return;
        e.stopPropagation();
        onDoubleClick(e);
      }}
      onContextMenu={onContextMenu}
      onPointerEnter={
        isMystery
          ? (e) => {
              if (e.pointerType === "mouse") {
                openTierPopover();
              }
            }
          : undefined
      }
      onPointerLeave={
        isMystery
          ? (e) => {
              if (e.pointerType === "mouse") {
                closeTierPopover();
              }
            }
          : undefined
      }
      onFocus={
        isMystery
          ? (e) => {
              if (
                e.target === e.currentTarget &&
                e.currentTarget.matches(":focus-visible")
              ) {
                openTierPopover();
              }
            }
          : undefined
      }
      onBlur={
        isMystery
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                closeTierPopover();
              }
            }
          : undefined
      }
      className={cn(
        "relative flex flex-col rounded-xl bg-card dark:bg-linear-to-b dark:from-surface dark:via-surface dark:to-popover/95 border transition-[border-color,background-color,transform] duration-150 group select-none shadow-xs dark:shadow-sm hover:shadow-card-deep hover:-translate-y-0.5 overflow-hidden",
        inUse
          ? "border-amber-500/45 bg-card dark:border-amber-500/40 dark:bg-amber-500/5"
          : packageGlow ||
              "border-neutral-700 hover:border-amber-500/50 dark:border-white/15 dark:hover:border-gold/50",
        isCompact ? "p-3 gap-2.5" : "p-3.5 gap-3",
        onDoubleClick && "cursor-pointer",
        isDeleteChecking && "opacity-75 pointer-events-none cursor-wait",
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

      {/* ZONA 1: Cabeçalho limpo (Ícone + Título + Ações secundárias + Metadados enxutos) */}
      <header className="flex items-start gap-3 w-full min-w-0">
        <div className="relative shrink-0">
          <div
            className={cn(
              "rounded-xl border flex items-center justify-center transition-[transform,border-color,color,background-color] duration-200 group-hover:scale-105",
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

          {typeof quantity === "number" && (
            <span className="absolute -bottom-1 -right-1.5 px-1.5 py-px rounded-md bg-popover border border-neutral-600 dark:border-gold/45 text-neutral-50 dark:text-gold text-[10px] font-black leading-tight tabular-nums shadow-xs">
              {quantity}x
            </span>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <div className="flex items-start justify-between gap-1.5 w-full min-w-0">
            <h4
              className={cn(
                "font-bold text-neutral-100 truncate min-w-0 flex-1 group-hover:text-primary dark:group-hover:text-gold transition-colors leading-snug pt-0.5",
                isCompact ? "text-xs" : "text-body-s",
              )}
              title={title}
            >
              {title}
            </h4>

            {((isMystery && mysteryTier) ||
              onContextMenu ||
              isDeleteChecking) && (
              <div className="flex items-center gap-0.5 shrink-0 -mr-1 -mt-0.5">
                {isMystery && mysteryTier && (
                  <button
                    type="button"
                    {...STOP_DRAG_PROPAGATION_PROPS}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTierPopover();
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    aria-expanded={isTierPopoverOpen}
                    aria-label={t("tierDetailsAria")}
                    title={t("tierDetailsAria")}
                    className="inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-gold hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer min-w-7 min-h-7 pointer-coarse:min-w-8 pointer-coarse:min-h-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <HelpCircle size={isCompact ? 13 : 14} aria-hidden="true" />
                  </button>
                )}

                {isDeleteChecking ? (
                  <output
                    className="inline-flex items-center justify-center text-gold min-w-7 min-h-7 pointer-coarse:min-w-8 pointer-coarse:min-h-8"
                    title={t("checkingDeleteAria")}
                    aria-label={t("checkingDeleteAria")}
                  >
                    <Loader2
                      size={isCompact ? 14 : 15}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  </output>
                ) : (
                  onContextMenu && (
                    <button
                      type="button"
                      {...STOP_DRAG_PROPAGATION_PROPS}
                      onClick={(e) =>
                        openContextMenuFromButton(e, onContextMenu)
                      }
                      onDoubleClick={(e) => e.stopPropagation()}
                      aria-label={t("moreActionsAria")}
                      title={t("moreActionsAria")}
                      className="inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer min-w-7 min-h-7 pointer-coarse:min-w-8 pointer-coarse:min-h-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <MoreVertical
                        size={isCompact ? 14 : 15}
                        aria-hidden="true"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Sub-linha enxuta: Status Em Foco + Tipo (+ Duração inline) + Raridade/Dívida + Categoria discreta */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {inUse && (
              <span className="inline-flex items-center gap-1 font-bold rounded-md border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 text-tiny px-1.5 py-0.5 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                {t("inFocus")}
              </span>
            )}

            <span
              className={cn(
                "inline-flex items-center gap-1 border font-medium leading-none shrink-0 text-tiny px-1.5 py-0.5 rounded-md",
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
              <span>
                {t(`types.${typeKey}`)}
                {showInlineDurationInType && baseDurationMinutes
                  ? ` · ${formatFocusMinutes(baseDurationMinutes)}`
                  : ""}
              </span>
            </span>

            {hasValidPackage && (
              <span
                className={cn(
                  "font-semibold rounded-md border text-tiny px-1.5 py-0.5 leading-none shrink-0",
                  packageBadgeColor,
                )}
              >
                {t(`packages.${packageMessageKey}`)}
              </span>
            )}

            {isDebtCategory && (
              <span className="font-semibold rounded-md border text-tiny px-1.5 py-0.5 leading-none shrink-0 bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-300">
                {t("categories.DEBT")}
              </span>
            )}

            {showSubtleCategory && (
              <span className="text-tiny text-neutral-400 font-medium truncate">
                · {t(`categories.${categoryMessageKey}`)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ZONA 2: Descrição real do usuário (sem placeholder genérico falso) */}
      {trimmedDescription !== "" && (
        <p
          className={cn(
            "text-neutral-300 leading-relaxed line-clamp-2",
            isCompact ? "text-label-g" : "text-xs",
          )}
        >
          {trimmedDescription}
        </p>
      )}

      {/* ZONA 3: Rodapé (Progresso quando falta saldo + Preço/Status + Ação única) */}
      <footer className="mt-auto flex flex-col gap-2 pt-2.5 border-t border-neutral-700/80 dark:border-white/10 w-full">
        {showStoreProgress && (
          <div className="flex flex-col gap-1 w-full">
            <div
              className={cn(
                "flex items-center justify-between gap-2 text-[10px]",
                isProgressComplete
                  ? "font-semibold text-emerald-700 dark:text-emerald-400"
                  : "font-medium text-neutral-400",
              )}
            >
              <span className="inline-flex items-center gap-1 min-w-0">
                {isProgressComplete && (
                  <Check size={10} className="shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">
                  {isProgressComplete
                    ? t("readyToRedeemHint")
                    : isGamified
                      ? t("missingCoinsHint", {
                          missing: formatCoins(missingCoins, { locale }),
                        })
                      : t("missingCreditsHint", {
                          missing: formatCoins(missingCoins, { locale }),
                        })}
                </span>
              </span>
              <span className="tabular-nums shrink-0">{progressPercent}%</span>
            </div>
            <div
              className="h-1 w-full rounded-full bg-neutral-800/80 dark:bg-white/10 overflow-hidden"
              aria-hidden="true"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width,background-color] duration-300",
                  isProgressComplete
                    ? "bg-emerald-500/80 dark:bg-emerald-400/80"
                    : "bg-amber-500/80 dark:bg-gold/75",
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center min-w-0">
            {typeof price === "number" ? (
              <CatalogItemPricePill price={price} canAfford={canAfford} />
            ) : remainingSeconds !== undefined && remainingSeconds !== null ? (
              <CatalogItemDurationBadge
                remainingSeconds={remainingSeconds}
                isCompact={isCompact}
                variant="pill"
              />
            ) : baseDurationMinutes ? (
              <CatalogItemDurationBadge
                baseDurationMinutes={baseDurationMinutes}
                isCompact={isCompact}
                variant="pill"
              />
            ) : (
              <span className="text-neutral-400 font-medium truncate text-tiny">
                {inUse
                  ? t("statuses.activeSession")
                  : isMystery
                    ? t("statuses.sealedBox")
                    : t("statuses.available")}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onAction}
            onDoubleClick={(e) => e.stopPropagation()}
            disabled={isPrimaryDisabled}
            aria-busy={isActionLoading}
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
              "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold dark:font-bold transition-[transform,background-color,border-color,color,opacity] duration-150 shadow-xs shrink-0 pointer-coarse:min-h-9",
              !isActionLoading && (isFocusNavigate || (canAfford && !inUse))
                ? "bg-gold hover:bg-gold-hover active:bg-gold-pressed text-on-gold border border-gold shadow-glow-gold-xs cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card"
                : "bg-neutral-700/70 dark:bg-white/10 text-neutral-400 border border-neutral-600 dark:border-white/10 cursor-not-allowed opacity-75 dark:opacity-60",
              isCompact ? "px-2.5 py-1 text-label-g" : "px-3.5 py-1.5 text-xs",
            )}
          >
            {isActionLoading && (
              <Loader2 size={12} className="animate-spin shrink-0" />
            )}
            <span>{actionLabel}</span>
          </button>
        </div>
      </footer>

      {/* Popover Informativo com Chances e Drops da Caixa Misteriosa (Portal para evitar clip em PageWrapper) */}
      {shouldRenderTierPortal &&
        isTierPopoverOpen &&
        isMystery &&
        mysteryTier &&
        !isDragging &&
        tierPopoverCoords &&
        createPortal(
          <MysteryBoxTierPopover
            tier={mysteryTier}
            customPrice={price}
            customLootItems={lootItems}
            popoverRef={tierPopoverRef}
            style={tierFloatingStyle}
          />,
          document.body,
        )}
    </article>
  );
});
