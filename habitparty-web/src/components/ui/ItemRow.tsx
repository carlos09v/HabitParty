import { Backpack, GripVertical, Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, type default as React, type ReactNode } from "react";
import {
  CatalogItemDurationBadge,
  CatalogItemPricePill,
  CatalogItemVariantChips,
} from "@/components/ui/CatalogItemBadges";
import {
  CatalogPinnedBadge,
  CatalogPrimaryActionButton,
  CatalogStatusBadge,
  CatalogUtilityActions,
  calculateMissingBalance,
  formatMissingBalanceHint,
  getCatalogItemIconBoxClass,
} from "@/components/ui/CatalogItemShared";
import {
  type CatalogItemRenderContext,
  CatalogItemWrapper,
} from "@/components/ui/CatalogItemWrapper";
import { useCatalogItemInteraction } from "@/hooks/useCatalogItemInteraction";
import type { AppLocale } from "@/i18n/config";
import type { CatalogItemVariant, MysteryBoxLootItem } from "@/types/reward";
import { cn } from "@/utils";
import { resolveCatalogTypePresentation } from "@/utils/catalogItemVisuals";
import { CATALOG_ROW_GRID_CLASS } from "@/utils/catalogLayout";

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
  ownedQuantity?: number;
  price?: number;
  currentCoins?: number;
  showMysteryPriceFooter?: boolean;
  isGamified?: boolean;
  variants?: CatalogItemVariant[];
  activeVariantId?: string;
  onSelectVariant?: (variantId: string) => void;
  canAfford?: boolean;
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
  statusBadgeSlot?: ReactNode;
}

interface ItemRowContentProps extends ItemRowProps {
  context: CatalogItemRenderContext;
}

function ItemRowContent({
  id,
  title,
  description,
  baseDurationMinutes,
  remainingSeconds,
  quantity,
  ownedQuantity,
  price,
  currentCoins,
  isGamified = true,
  variants,
  activeVariantId,
  onSelectVariant,
  canAfford: canAffordProp,
  disabled = false,
  disabledTitle,
  actionLabel,
  onAction,
  onDoubleClick,
  onContextMenu,
  inUse = false,
  isDeleteChecking = false,
  isActionLoading = false,
  statusBadgeSlot,
  context,
}: ItemRowContentProps) {
  const t = useTranslations("ui.itemCatalog");
  const locale = useLocale() as AppLocale;
  const { visuals, sortable, isDragDisabled, mysteryPopover } = context;
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

  const canAfford = canAffordProp ?? !disabled;
  const isDebtCategory = visuals.isDebt;
  const { TypeIcon, typeLabel } = resolveCatalogTypePresentation(
    { isMystery, typeKey, typeMeta },
    isGamified,
    t,
  );

  const missingCoins =
    typeof price === "number" &&
    price > 0 &&
    typeof currentCoins === "number" &&
    !canAfford &&
    currentCoins < price
      ? calculateMissingBalance(price, currentCoins)
      : 0;

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
        "flex flex-col gap-2.5 p-3 sm:p-3.5 md:py-2.5",
        CATALOG_ROW_GRID_CLASS,
        onDoubleClick && "cursor-pointer",
        isDeleteChecking && "opacity-75 pointer-events-none cursor-wait",
        isDragging && "transition-none! opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* Coluna 1: Grip (ou Pin fixo apenas para Dívida) + Ícone + [Qtd] + Título/Descrição */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="w-4 flex items-center justify-center shrink-0">
            {isDebtCategory ? (
              <CatalogPinnedBadge variant="row" />
            ) : isDragDisabled ? (
              <span className="w-4 h-4 shrink-0" aria-hidden="true" />
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
              getCatalogItemIconBoxClass(typeKey, packageIconTheme),
            )}
          >
            <RewardIcon
              size={19}
              className={
                isMystery ? "text-amber-700 dark:text-amber-400" : undefined
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
            <div className="flex items-center gap-1.5 min-w-0">
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
              {typeof ownedQuantity === "number" && ownedQuantity > 0 && (
                <span
                  className="inline-flex items-center gap-1 font-semibold rounded-md border border-sky-500/35 bg-sky-500/12 text-sky-700 dark:border-info/35 dark:bg-info/15 dark:text-info text-[10px] px-1.5 py-0.5 leading-none shrink-0 whitespace-nowrap tabular-nums"
                  title={
                    isGamified
                      ? t("ownedInBackpackTooltip", { count: ownedQuantity })
                      : t("ownedInInventoryTooltip", { count: ownedQuantity })
                  }
                >
                  <Backpack size={10} className="shrink-0" aria-hidden="true" />
                  <span>{ownedQuantity}x</span>
                </span>
              )}
            </div>
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
              canAfford={canAfford}
              isGamified={isGamified}
              variant={isDebtCategory ? "debt" : "default"}
            />
          </div>
        )}
      </div>

      {/* Container de Metadados */}
      <div className="flex items-center gap-1.5 flex-wrap pl-0 min-[380px]:pl-6 md:pl-0 md:contents">
        {/* Coluna 2: Badge de Status + Tipo */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <CatalogStatusBadge
            variant="row"
            statusBadgeSlot={statusBadgeSlot}
            inUse={inUse}
          />
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
              {TypeIcon && (
                <TypeIcon size={11} className="shrink-0" aria-hidden="true" />
              )}
              <span>{typeLabel}</span>
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

      {/* Coluna 5: Preço (Desktop) + Hint de moedas faltantes + Botão de Ação */}
      <div
        className={cn(
          "flex flex-col items-end justify-center gap-0.5 pt-1 md:pt-0 border-t md:border-t-0 shrink-0",
          isDebtCategory
            ? "border-rose-500/20 dark:border-rose-400/15"
            : "border-neutral-700 dark:border-white/5",
        )}
      >
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-1.5 sm:gap-2 w-full">
          {typeof price === "number" && (
            <div className="hidden md:flex">
              <CatalogItemPricePill
                price={price}
                size="md"
                canAfford={canAfford}
                isGamified={isGamified}
                variant={isDebtCategory ? "debt" : "default"}
              />
            </div>
          )}

          <CatalogPrimaryActionButton
            variant="row"
            actionLabel={actionLabel}
            title={title}
            price={price}
            disabledTitle={disabledTitle}
            canAfford={canAfford}
            inUse={inUse}
            isFocusNavigate={isFocusNavigate}
            isDebtCategory={isDebtCategory}
            isGamified={isGamified}
            isActionLoading={isActionLoading}
            onAction={onAction}
          />

          <CatalogUtilityActions
            variant="row"
            mysteryPopover={mysteryPopover}
            isGamified={isGamified}
            isDeleteChecking={isDeleteChecking}
            onContextMenu={onContextMenu}
          />
        </div>

        {missingCoins > 0 && (
          <span className="text-[10px] font-medium text-neutral-400 tabular-nums pr-1">
            {formatMissingBalanceHint(missingCoins, isGamified, locale, t)}
          </span>
        )}
      </div>

      {mysteryPopover?.portalNode}
    </li>
  );
}

/**
 * Linha de lista reordenável e memoizada para Vitrine (Rewards) e Mochila (Inventory).
 */
export const ItemRow = memo(function ItemRow(props: ItemRowProps) {
  return (
    <CatalogItemWrapper
      id={props.id}
      sortableId={props.sortableId}
      type={props.type}
      iconName={props.iconName}
      packageLevel={props.packageLevel}
      category={props.category}
      price={props.price}
      showMysteryPriceFooter={props.showMysteryPriceFooter}
      isGamified={props.isGamified}
      isActiveFocusSession={props.isActiveFocusSession}
      isDragDisabled={props.isDragDisabled}
      dragData={props.dragData}
      lootItems={props.lootItems}
      render={(context) => <ItemRowContent {...props} context={context} />}
    />
  );
});

export {
  ItemRowHeader,
  type ItemRowHeaderProps,
} from "./ItemRowHeader";
