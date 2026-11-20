"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, HelpCircle, Loader2, MoreVertical } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, type default as React, useCallback } from "react";
import {
  CatalogItemDurationBadge,
  CatalogItemPricePill,
  CatalogItemQuantityStepper,
  CatalogItemVariantChips,
} from "@/components/ui/CatalogItemBadges";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import {
  type MysteryPopoverBridge,
  useMysteryBoxItemPopover,
} from "@/hooks/useMysteryBoxItemPopover";
import type { AppLocale } from "@/i18n/config";
import type {
  CatalogItemVariant,
  MysteryBoxLootItem,
  MysteryBoxTier,
} from "@/types/reward";
import {
  cn,
  openContextMenuFromButton,
  STOP_DRAG_PROPAGATION_PROPS,
} from "@/utils";
import {
  resolveCatalogActionTooltip,
  resolveCatalogItemVisuals,
  resolveCatalogTypePresentation,
} from "@/utils/catalogItemVisuals";

export interface ItemRowProps {
  id: string;
  sortableId?: string;
  title: string;
  description?: string;
  type: string;
  packageLevel?: string | null;
  category?: string | null;
  iconName?: string;
  baseDurationMinutes?: number | null;
  remainingSeconds?: number | null;
  quantity?: number;
  price?: number;
  unitQuantity?: number;
  onUnitQuantityChange?: (nextQuantity: number) => void;
  maxUnitQuantity?: number;
  variants?: CatalogItemVariant[];
  activeVariantId?: string;
  onSelectVariant?: (variantId: string) => void;
  disabled?: boolean;
  disabledTitle?: string;
  actionLabel: string;
  onAction: () => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dragData?: Record<string, unknown>;
  inUse?: boolean;
  isActiveFocusSession?: boolean;
  isDeleteChecking?: boolean;
  isActionLoading?: boolean;
  lootItems?: MysteryBoxLootItem[];
}

type RowVisuals = ReturnType<typeof resolveCatalogItemVisuals>;
type RowSortableState = ReturnType<typeof useSortable>;

interface ItemRowContentProps extends ItemRowProps {
  visuals: RowVisuals;
  sortable: RowSortableState;
  mysteryPopover?: MysteryPopoverBridge;
}

function ItemRowContent({
  id,
  title,
  description,
  baseDurationMinutes,
  remainingSeconds,
  quantity,
  price,
  unitQuantity = 1,
  onUnitQuantityChange,
  maxUnitQuantity = 50,
  variants,
  activeVariantId,
  onSelectVariant,
  disabled = false,
  disabledTitle,
  actionLabel,
  onAction,
  onDoubleClick,
  onContextMenu,
  inUse = false,
  isDeleteChecking = false,
  isActionLoading = false,
  visuals,
  sortable,
  mysteryPopover,
}: ItemRowContentProps) {
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
  } = visuals;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const tierContainerRef = mysteryPopover?.tierContainerRef;
  const setRowRefs = useCallback(
    (node: HTMLLIElement | null) => {
      setNodeRef(node);
      if (tierContainerRef) {
        tierContainerRef.current = node;
      }
    },
    [setNodeRef, tierContainerRef],
  );

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isPrimaryDisabled =
    disabled || (inUse && !isFocusNavigate) || isActionLoading;

  return (
    <li
      ref={setRowRefs}
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
        mysteryPopover
          ? (e) => {
              if (e.pointerType === "mouse") {
                mysteryPopover.open();
              }
            }
          : undefined
      }
      onPointerLeave={
        mysteryPopover
          ? (e) => {
              if (e.pointerType === "mouse") {
                mysteryPopover.close();
              }
            }
          : undefined
      }
      onFocus={
        mysteryPopover
          ? (e) => {
              if (
                e.target === e.currentTarget &&
                e.currentTarget.matches(":focus-visible")
              ) {
                mysteryPopover.open();
              }
            }
          : undefined
      }
      onBlur={
        mysteryPopover
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                mysteryPopover.close();
              }
            }
          : undefined
      }
      className={cn(
        "relative rounded-xl bg-card dark:bg-linear-to-r dark:from-surface dark:via-surface dark:to-popover/95 border transition-[border-color,background-color,transform] duration-150 select-none group overflow-hidden shadow-2xs dark:shadow-none",
        inUse
          ? "border-y-amber-500/45 border-r-amber-500/45 bg-card dark:border-y-amber-500/40 dark:border-r-amber-500/40 dark:bg-amber-500/5 border-l-4 border-l-amber-500"
          : cn(
              "border-neutral-700 dark:border-white/10 hover:border-y-gold/50 hover:border-r-gold/50 hover:shadow-card-deep hover:-translate-y-0.5",
              !leftAccentClass && "hover:border-l-gold/50",
              leftAccentClass,
            ),
        "flex flex-col gap-2.5 p-3 sm:p-3.5",
        "md:grid md:grid-cols-[minmax(0,3.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_auto] xl:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.7fr)_minmax(0,1.1fr)_auto] md:items-center",
        "md:gap-2.5 xl:gap-4 md:px-3.5 xl:px-4 md:py-2.5",
        onDoubleClick && "cursor-pointer",
        isDeleteChecking && "opacity-75 pointer-events-none cursor-wait",
        isDragging && "transition-none! opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* Coluna 1: Grip + Ícone + [Qtd] + Título/Descrição (+ Preço rápido no mobile) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="w-4 flex items-center justify-center shrink-0">
            <GripVertical
              size={14}
              className="text-neutral-500 group-hover:text-neutral-300 transition-colors cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            />
          </div>

          <div
            className={cn(
              "rounded-xl border flex items-center justify-center transition-[transform,border-color,color,background-color] duration-200 shrink-0 group-hover:scale-105 w-9 h-9 md:w-10 md:h-10",
              packageIconTheme ||
                (typeKey === "TimeBased"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 group-hover:border-emerald-500/40 dark:bg-white/10 dark:border-white/15 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40"
                  : "bg-primary/10 text-primary border-primary/20 group-hover:border-primary/40 dark:bg-white/10 dark:border-white/15 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40"),
            )}
          >
            <RewardIcon
              size={19}
              className={
                isMystery ? "text-amber-600 dark:text-amber-400" : undefined
              }
              aria-hidden="true"
            />
          </div>

          {typeof quantity === "number" && (
            <span className="font-bold bg-surface border border-neutral-700 dark:bg-white/10 dark:border-white/20 text-neutral-100 shrink-0 tabular-nums text-xs px-2 py-0.5 rounded-md">
              {quantity}x
            </span>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <h4 className="font-bold text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors leading-tight text-body-s">
              {title}
            </h4>
            {description && description.trim() !== "" && (
              <p className="text-neutral-400 truncate mt-0.5 leading-tight text-xs">
                {description}
              </p>
            )}
            {variants && variants.length > 1 && onSelectVariant && (
              <CatalogItemVariantChips
                variants={variants}
                activeVariantId={activeVariantId ?? id}
                onSelectVariant={onSelectVariant}
                variant="row"
                disabled={isActionLoading}
                className="mt-1"
              />
            )}
          </div>
        </div>

        {/* Preço visível no topo direito apenas no Mobile (< md) */}
        {typeof price === "number" && (
          <div className="flex md:hidden shrink-0">
            <CatalogItemPricePill
              price={price}
              size="sm"
              canAfford={!disabled}
            />
          </div>
        )}
      </div>

      {/* Container de Metadados: No Mobile fica em linha única com wrap; no Desktop usa `md:contents` para ocupar as Colunas 2, 3 e 4 do Grid */}
      <div className="flex items-center gap-1.5 flex-wrap pl-0 min-[380px]:pl-6 md:pl-0 md:contents">
        {/* Coluna 2: Badge de Status (Em Foco) + Tipo */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {inUse && (
            <span className="text-label-m font-bold border truncate inline-flex items-center gap-1.5 leading-none shrink-0 border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
              {t("inFocus")}
            </span>
          )}
          <span
            className={cn(
              "text-label-m font-medium border truncate inline-flex items-center gap-1 leading-none shrink-0 px-2 py-0.5 rounded-md",
              typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20",
            )}
          >
            {(() => {
              const { TypeIcon, typeLabel } = resolveCatalogTypePresentation(
                { isMystery, typeKey, typeMeta },
                isGamified,
                t,
              );
              return (
                <>
                  {TypeIcon && (
                    <TypeIcon
                      size={11}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span>{typeLabel}</span>
                </>
              );
            })()}
          </span>
        </div>

        {/* Coluna 3: Pacote (Raridade) & Categoria */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {hasValidPackage && (
            <span
              className={cn(
                "text-label-m font-semibold border truncate rounded px-2 py-0.5",
                packageBadgeColor,
              )}
            >
              {t(`packages.${packageMessageKey}`)}
            </span>
          )}
          {hasValidCategory && (
            <span
              className={cn(
                "text-label-m font-medium border truncate rounded px-2 py-0.5",
                categoryMessageKey === "DEBT"
                  ? "bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-300"
                  : "bg-surface/80 border-neutral-700/80 dark:bg-white/10 dark:border-white/10 text-neutral-300",
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
              <CatalogItemDurationBadge
                remainingSeconds={remainingSeconds}
                variant="inline"
              />
            ) : baseDurationMinutes ? (
              <CatalogItemDurationBadge
                baseDurationMinutes={baseDurationMinutes}
                variant="pill"
              />
            ) : (
              <span className="text-neutral-400 truncate text-label-g">
                {t("couponDurationFallback")}
              </span>
            )
          ) : (
            <span className="text-neutral-400 truncate text-label-g">
              {isMystery ? t("mysteryDrawDuration") : t("instantUseDuration")}
            </span>
          )}
        </div>
      </div>

      {/* Coluna 5: Multiplicador Dívida + Preço (Desktop) & Botão de Ação */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3.5 pt-1 md:pt-0 border-t border-neutral-700 dark:border-white/5 md:border-t-0 shrink-0">
        {categoryMessageKey === "DEBT" && onUnitQuantityChange && (
          <CatalogItemQuantityStepper
            quantity={unitQuantity}
            onChange={onUnitQuantityChange}
            maxQuantity={maxUnitQuantity}
            disabled={isActionLoading}
          />
        )}
        {typeof price === "number" && (
          <div className="hidden md:flex">
            <CatalogItemPricePill
              price={price}
              size="md"
              canAfford={!disabled}
            />
          </div>
        )}

        <button
          type="button"
          onClick={onAction}
          onDoubleClick={(e) => e.stopPropagation()}
          disabled={isPrimaryDisabled}
          aria-busy={isActionLoading}
          aria-label={`${actionLabel} ${title}`}
          title={resolveCatalogActionTooltip({
            isFocusNavigate,
            inUse,
            canAfford: !disabled,
            isGamified,
            actionLabel,
            title,
            price,
            disabledTitle,
            locale,
            t,
          })}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold dark:font-bold transition-[transform,background-color,border-color,color,opacity] duration-150 shadow-xs pointer-coarse:min-h-9 px-3 py-1.5 text-xs sm:py-1",
            !isActionLoading && (isFocusNavigate || (!disabled && !inUse))
              ? "bg-gold hover:bg-gold-hover active:bg-gold-pressed text-on-gold border border-gold shadow-glow-gold-xs cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card"
              : "bg-neutral-700/70 dark:bg-white/10 text-neutral-400 border border-neutral-600 dark:border-white/10 cursor-not-allowed opacity-75 dark:opacity-60",
          )}
        >
          {isActionLoading && (
            <Loader2 size={12} className="animate-spin shrink-0" />
          )}
          <span>{actionLabel}</span>
        </button>

        {mysteryPopover && (
          <button
            type="button"
            {...STOP_DRAG_PROPAGATION_PROPS}
            onClick={(e) => {
              e.stopPropagation();
              mysteryPopover.toggle();
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            aria-expanded={mysteryPopover.isOpen}
            aria-label={
              isGamified
                ? t("tierDetailsAria")
                : t("tierDetailsAriaProductivity")
            }
            title={
              isGamified
                ? t("tierDetailsAria")
                : t("tierDetailsAriaProductivity")
            }
            className="inline-flex items-center justify-center rounded-md border border-transparent text-neutral-400 hover:text-gold hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9"
          >
            <HelpCircle size={15} aria-hidden="true" />
          </button>
        )}

        {isDeleteChecking ? (
          <output
            className="inline-flex items-center justify-center text-gold shrink-0 w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9"
            title={t("checkingDeleteAria")}
            aria-label={t("checkingDeleteAria")}
          >
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          </output>
        ) : (
          onContextMenu && (
            <button
              type="button"
              {...STOP_DRAG_PROPAGATION_PROPS}
              onClick={(e) => openContextMenuFromButton(e, onContextMenu)}
              onDoubleClick={(e) => e.stopPropagation()}
              aria-label={t("moreActionsAria")}
              title={t("moreActionsAria")}
              className="inline-flex items-center justify-center rounded-md border border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9"
            >
              <MoreVertical size={16} aria-hidden="true" />
            </button>
          )
        )}
      </div>

      {mysteryPopover?.portalNode}
    </li>
  );
}

function MysteryBoxItemRow({
  mysteryTier,
  ...props
}: ItemRowContentProps & { mysteryTier: MysteryBoxTier }) {
  const mysteryPopover = useMysteryBoxItemPopover({
    mysteryTier,
    isDragging: props.sortable.isDragging,
    price: props.price,
    lootItems: props.lootItems,
  });

  return <ItemRowContent {...props} mysteryPopover={mysteryPopover} />;
}

/**
 * Linha de lista reordenável e memoizada para Vitrine (Rewards) e Mochila (Inventory).
 * Isola hooks de popover flutuante exclusivamente para Caixas Misteriosas.
 * Utiliza uma única árvore DOM responsiva (Flex no mobile -> Grid de 5 colunas no desktop md+).
 */
export const ItemRow = memo(function ItemRow(props: ItemRowProps) {
  const visuals = resolveCatalogItemVisuals({
    type: props.type,
    iconName: props.iconName,
    packageLevel: props.packageLevel,
    category: props.category,
    isActiveFocusSession: props.isActiveFocusSession,
    includeMysteryTier: true,
  });

  const sortable = useSortable({
    id: props.sortableId ?? props.id,
    data: props.dragData || { id: props.id },
  });

  if (visuals.isMystery && visuals.mysteryTier) {
    return (
      <MysteryBoxItemRow
        {...props}
        visuals={visuals}
        sortable={sortable}
        mysteryTier={visuals.mysteryTier}
      />
    );
  }

  return <ItemRowContent {...props} visuals={visuals} sortable={sortable} />;
});

export {
  ItemRowHeader,
  type ItemRowHeaderProps,
} from "./ItemRowHeader";
