"use client";

import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Loader2, Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, type default as React } from "react";
import {
  CatalogItemDurationBadge,
  CatalogItemPricePill,
  CatalogItemVariantChips,
} from "@/components/ui/CatalogItemBadges";
import {
  CatalogPinnedBadge,
  CatalogUtilityActions,
} from "@/components/ui/CatalogItemShared";
import {
  type CatalogSortableBindings,
  IDLE_SORTABLE_BINDINGS,
  useCatalogItemInteraction,
} from "@/hooks/useCatalogItemInteraction";
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
import { cn } from "@/utils";
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
  isDragDisabled?: boolean;
  lootItems?: MysteryBoxLootItem[];
}

type RowVisuals = ReturnType<typeof resolveCatalogItemVisuals>;

interface ItemRowContentProps extends ItemRowProps {
  visuals: RowVisuals;
  sortable: CatalogSortableBindings;
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
  isDragDisabled = false,
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

  const { setRootRef, dragStyle, isDragging, rootInteractionProps } =
    useCatalogItemInteraction<HTMLLIElement>({
      sortable,
      mysteryPopover,
      isDragDisabled,
      onDoubleClick,
      onContextMenu,
    });

  const isPrimaryDisabled =
    disabled || (inUse && !isFocusNavigate) || isActionLoading;
  const isDebtCategory = visuals.isDebt;

  return (
    <li
      ref={setRootRef}
      style={dragStyle}
      {...rootInteractionProps}
      className={cn(
        "relative rounded-xl bg-card dark:bg-linear-to-r dark:from-surface dark:via-surface dark:to-popover/95 border transition-[border-color,background-color,transform] duration-150 select-none group overflow-hidden shadow-2xs dark:shadow-none",
        inUse
          ? "border-y-amber-500/45 border-r-amber-500/45 bg-card dark:border-y-amber-500/40 dark:border-r-amber-500/40 dark:bg-amber-500/5 border-l-4 border-l-amber-500"
          : isDebtCategory
            ? "border-y-rose-500/40 border-r-rose-500/40 bg-rose-500/[0.04] dark:bg-linear-to-r dark:from-rose-950/30 dark:via-surface dark:to-popover/95 dark:border-y-rose-500/35 dark:border-r-rose-500/35 hover:border-y-rose-500/65 hover:border-r-rose-500/65 hover:shadow-card-deep hover:-translate-y-0.5 border-l-4 border-l-rose-500"
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
      {/* Coluna 1: Grip (ou Pin fixo para Dívida) + Ícone + [Qtd] + Título/Descrição (+ Preço rápido no mobile) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="w-4 flex items-center justify-center shrink-0">
            {isDebtCategory || isDragDisabled ? (
              <CatalogPinnedBadge variant="row" />
            ) : (
              <GripVertical
                size={14}
                className="text-neutral-500 group-hover:text-neutral-300 transition-colors cursor-grab active:cursor-grabbing"
                aria-hidden="true"
              />
            )}
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
                isMystery ? "text-amber-800 dark:text-amber-400" : undefined
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
            <h4
              className={cn(
                "font-bold text-neutral-100 truncate transition-colors leading-tight text-body-s",
                isDebtCategory
                  ? "group-hover:text-rose-700 dark:group-hover:text-rose-300"
                  : "group-hover:text-primary dark:group-hover:text-gold",
              )}
            >
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
              variant={isDebtCategory ? "debt" : "default"}
            />
          </div>
        )}
      </div>

      {/* Container de Metadados: No Mobile fica em linha única com wrap; no Desktop usa `md:contents` para ocupar as Colunas 2, 3 e 4 do Grid */}
      <div className="flex items-center gap-1.5 flex-wrap pl-0 min-[380px]:pl-6 md:pl-0 md:contents">
        {/* Coluna 2: Badge de Status (Em Foco) + Tipo (ou Dívida) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {inUse && (
            <span className="text-label-m font-bold border truncate inline-flex items-center gap-1.5 leading-none shrink-0 border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
              {t("inFocus")}
            </span>
          )}
          {isDebtCategory ? (
            <span className="text-label-m font-bold border truncate inline-flex items-center gap-1 leading-none shrink-0 px-2 py-0.5 rounded-md bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300">
              <Receipt size={11} className="shrink-0" aria-hidden="true" />
              <span>{t("categories.DEBT")}</span>
            </span>
          ) : (
            <span
              className={cn(
                "text-label-m font-medium border truncate inline-flex items-center gap-1 leading-none shrink-0 px-2 py-0.5 rounded-md",
                typeMeta?.color ||
                  "text-neutral-200 bg-white/10 border-white/20",
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
          )}
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
          {hasValidCategory && !isDebtCategory && (
            <span className="text-label-m font-medium border truncate rounded px-2 py-0.5 bg-surface/80 border-neutral-700/80 dark:bg-white/10 dark:border-white/10 text-neutral-300">
              {t(`categories.${categoryMessageKey}`)}
            </span>
          )}
          {isDebtCategory && (
            <span className="hidden md:inline text-neutral-500 text-xs">−</span>
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
          ) : isDebtCategory ? (
            <span className="text-rose-700/85 dark:text-rose-300/85 font-medium truncate text-label-g">
              {t("debtPayoffDuration")}
            </span>
          ) : (
            <span className="text-neutral-400 truncate text-label-g">
              {isMystery ? t("mysteryDrawDuration") : t("instantUseDuration")}
            </span>
          )}
        </div>
      </div>

      {/* Coluna 5: Preço (Desktop) & Botão de Ação */}
      <div
        className={cn(
          "flex flex-wrap sm:flex-nowrap items-center justify-end gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3.5 pt-1 md:pt-0 border-t md:border-t-0 shrink-0",
          isDebtCategory
            ? "border-rose-500/20 dark:border-rose-400/15"
            : "border-neutral-700 dark:border-white/5",
        )}
      >
        {typeof price === "number" && (
          <div className="hidden md:flex">
            <CatalogItemPricePill
              price={price}
              size="md"
              canAfford={!disabled}
              variant={isDebtCategory ? "debt" : "default"}
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
              ? isDebtCategory
                ? "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white border border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.25)] cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 focus-visible:ring-offset-card"
                : "bg-gold hover:bg-gold-hover active:bg-gold-pressed text-on-gold border border-gold shadow-glow-gold-xs cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card"
              : "bg-neutral-700/70 dark:bg-white/10 text-neutral-400 border border-neutral-600 dark:border-white/10 cursor-not-allowed opacity-75 dark:opacity-60",
          )}
        >
          {isActionLoading && (
            <Loader2 size={12} className="animate-spin shrink-0" />
          )}
          <span>{actionLabel}</span>
        </button>

        <CatalogUtilityActions
          variant="row"
          mysteryPopover={mysteryPopover}
          isGamified={isGamified}
          isDeleteChecking={isDeleteChecking}
          onContextMenu={onContextMenu}
        />
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

function ItemRowVariantBranch(
  props: ItemRowProps & {
    isDragDisabled: boolean;
    visuals: RowVisuals;
    sortable: CatalogSortableBindings;
  },
) {
  if (props.visuals.isMystery && props.visuals.mysteryTier) {
    return (
      <MysteryBoxItemRow {...props} mysteryTier={props.visuals.mysteryTier} />
    );
  }

  return <ItemRowContent {...props} />;
}

function SortableItemRowBridge(
  props: ItemRowProps & {
    isDragDisabled: boolean;
    visuals: RowVisuals;
  },
) {
  const sortable = useSortable({
    id: props.sortableId ?? props.id,
    data: props.dragData || { id: props.id },
  });

  return <ItemRowVariantBranch {...props} sortable={sortable} />;
}

/**
 * Linha de lista reordenável e memoizada para Vitrine (Rewards) e Mochila (Inventory).
 * Isola hooks de popover em Caixas Misteriosas e ignora `useSortable` em itens fixados/dívidas.
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

  const isDragDisabled = Boolean(props.isDragDisabled || visuals.isDebt);

  if (isDragDisabled) {
    return (
      <ItemRowVariantBranch
        {...props}
        isDragDisabled={true}
        visuals={visuals}
        sortable={IDLE_SORTABLE_BINDINGS}
      />
    );
  }

  return (
    <SortableItemRowBridge
      {...props}
      isDragDisabled={false}
      visuals={visuals}
    />
  );
});

export {
  ItemRowHeader,
  type ItemRowHeaderProps,
} from "./ItemRowHeader";
