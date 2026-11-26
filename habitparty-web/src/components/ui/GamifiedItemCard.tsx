import { Backpack, Check, Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, type default as React, type ReactNode } from "react";
import {
  CatalogItemDurationBadge,
  CatalogItemPricePill,
  CatalogItemVariantChips,
} from "@/components/ui/CatalogItemBadges";
import {
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
import { formatFocusMinutes } from "@/utils/focusFormatters";

export interface GamifiedItemCardProps {
  id: string;
  sortableId?: string;
  title: string;
  description?: string;
  iconName?: string;
  type: string;
  packageLevel?: string | null;
  category?: string | null;
  baseDurationMinutes?: number | null;
  remainingSeconds?: number | null;
  quantity?: number;
  ownedQuantity?: number;
  price?: number;
  showMysteryPriceFooter?: boolean;
  isGamified?: boolean;
  variants?: CatalogItemVariant[];
  activeVariantId?: string;
  onSelectVariant?: (variantId: string) => void;
  currentCoins?: number;
  canAfford?: boolean;
  disabledTitle?: string;
  actionLabel: string;
  onAction?: () => void;
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

interface GamifiedItemCardContentProps extends GamifiedItemCardProps {
  context: CatalogItemRenderContext;
}

function GamifiedItemCardContent({
  id,
  title,
  description,
  baseDurationMinutes,
  remainingSeconds,
  quantity,
  ownedQuantity,
  price,
  isGamified = true,
  variants,
  activeVariantId,
  onSelectVariant,
  currentCoins,
  canAfford = true,
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
}: GamifiedItemCardContentProps) {
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
    packageGlow,
    packageIconTheme,
    topBarClass,
    isFocusNavigate,
  } = visuals;

  const { setRootRef, dragStyle, isDragging, rootInteractionProps } =
    useCatalogItemInteraction<HTMLElement>({
      sortable,
      mysteryPopover,
      isDragDisabled,
      onDoubleClick,
      onContextMenu,
    });

  const trimmedDescription = description?.trim() ?? "";
  const selectableVariants =
    variants && variants.length > 1 && onSelectVariant
      ? { variants, onSelect: onSelectVariant }
      : null;
  const hasMultipleVariants = Boolean(variants && variants.length > 1);

  const showStoreProgress =
    typeof price === "number" && price > 0 && typeof currentCoins === "number";

  const clampedCoins = showStoreProgress ? Math.max(0, currentCoins) : 0;
  const isProgressComplete =
    showStoreProgress && canAfford && clampedCoins >= price;
  const missingCoins =
    showStoreProgress && !isProgressComplete
      ? calculateMissingBalance(price, clampedCoins)
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
    remainingSeconds === undefined &&
    !hasMultipleVariants;

  const isDebtCategory = visuals.isDebt;
  const showSubtleCategory = hasValidCategory && !isDebtCategory;

  const fallbackDescription =
    !trimmedDescription && !hasMultipleVariants
      ? isDebtCategory
        ? t("fallbackDescriptions.debt")
        : isMystery
          ? isGamified
            ? t("fallbackDescriptions.mystery")
            : t("fallbackDescriptions.mysteryProductivity")
          : typeKey === "TimeBased"
            ? inUse
              ? t("fallbackDescriptions.timeBasedActive")
              : t("fallbackDescriptions.timeBased")
            : t("fallbackDescriptions.singleUse")
      : "";

  const displayDescription = trimmedDescription || fallbackDescription;
  const { TypeIcon, typeLabel } = resolveCatalogTypePresentation(
    { isMystery, typeKey, typeMeta },
    isGamified,
    t,
  );

  return (
    <article
      ref={setRootRef}
      style={dragStyle}
      {...rootInteractionProps}
      className={cn(
        "catalog-subgrid-card relative rounded-xl bg-card dark:bg-linear-to-b dark:from-surface dark:via-surface dark:to-popover/95 border transition-[border-color,background-color,transform] duration-150 group select-none shadow-xs dark:shadow-sm hover:shadow-card-deep hover:-translate-y-0.5 overflow-hidden p-3",
        inUse
          ? "border-amber-500/45 bg-card dark:border-amber-500/40 dark:bg-amber-500/5"
          : isDebtCategory
            ? "border-rose-500/45 hover:border-rose-500/75 bg-rose-500/[0.045] dark:border-rose-500/45 dark:hover:border-rose-400/75 dark:bg-linear-to-b dark:from-rose-950/35 dark:via-surface dark:to-popover/95 dark:shadow-[0_0_14px_rgba(244,63,94,0.12)]"
            : packageGlow ||
              "border-neutral-700 hover:border-amber-500/50 dark:border-white/15 dark:hover:border-gold/50",
        onDoubleClick && "cursor-pointer",
        isDeleteChecking && "opacity-75 pointer-events-none cursor-wait",
        isDragging && "transition-none! opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* ZONA 1: Cabeçalho limpo */}
      <header className="flex items-start gap-2.5 w-full min-w-0">
        {(inUse || isDebtCategory || topBarClass) && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute top-0 inset-x-0 h-1 bg-linear-to-r pointer-events-none",
              inUse
                ? "from-amber-500 to-yellow-500 opacity-95"
                : isDebtCategory
                  ? "from-rose-500/45 via-rose-500 to-rose-400/45 opacity-95"
                  : cn("from-transparent to-transparent", topBarClass),
            )}
          />
        )}
        <div className="relative shrink-0">
          <div
            className={cn(
              "rounded-xl border flex items-center justify-center transition-[transform,border-color,color,background-color] duration-200 group-hover:scale-105 w-9 h-9",
              getCatalogItemIconBoxClass(typeKey, packageIconTheme),
            )}
          >
            <RewardIcon
              size={18}
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
                "font-bold text-neutral-100 truncate min-w-0 flex-1 transition-colors leading-snug pt-0.5 text-body-s",
                isDebtCategory
                  ? "group-hover:text-rose-700 dark:group-hover:text-rose-300"
                  : "group-hover:text-primary dark:group-hover:text-gold",
              )}
              title={title}
            >
              {title}
            </h4>

            {(isDebtCategory ||
              mysteryPopover ||
              onContextMenu ||
              isDeleteChecking) && (
              <div className="flex items-center gap-0.5 shrink-0 -mr-1 -mt-0.5">
                <CatalogUtilityActions
                  variant="card"
                  showPin={isDebtCategory}
                  mysteryPopover={mysteryPopover}
                  isGamified={isGamified}
                  isDeleteChecking={isDeleteChecking}
                  onContextMenu={onContextMenu}
                />
              </div>
            )}
          </div>

          {/* Sub-linha de metadados */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 min-h-5 py-px">
            <CatalogStatusBadge
              variant="card"
              statusBadgeSlot={statusBadgeSlot}
              inUse={inUse}
            />

            {!isDebtCategory && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 border font-medium shrink-0 whitespace-nowrap text-tiny px-1.5 py-0.5 leading-none rounded-md",
                  typeMeta?.color ||
                    "text-neutral-200 bg-white/10 border-white/20",
                )}
              >
                {TypeIcon && (
                  <TypeIcon size={10} className="shrink-0" aria-hidden="true" />
                )}
                <span>
                  {typeLabel}
                  {showInlineDurationInType && baseDurationMinutes
                    ? ` · ${formatFocusMinutes(baseDurationMinutes)}`
                    : ""}
                </span>
              </span>
            )}

            {hasValidPackage && (
              <span
                className={cn(
                  "inline-flex items-center font-semibold rounded-md border text-tiny px-1.5 py-0.5 leading-none shrink-0 whitespace-nowrap",
                  packageBadgeColor,
                )}
              >
                {t(`packages.${packageMessageKey}`)}
              </span>
            )}

            {typeof ownedQuantity === "number" && ownedQuantity > 0 && (
              <span
                className="inline-flex items-center gap-1 font-semibold rounded-md border border-sky-500/35 bg-sky-500/12 text-sky-700 dark:border-info/35 dark:bg-info/15 dark:text-info text-tiny px-1.5 py-0.5 leading-none shrink-0 whitespace-nowrap tabular-nums"
                title={
                  isGamified
                    ? t("ownedInBackpackTooltip", { count: ownedQuantity })
                    : t("ownedInInventoryTooltip", { count: ownedQuantity })
                }
              >
                <Backpack size={10} className="shrink-0" aria-hidden="true" />
                <span>
                  {isGamified
                    ? t("ownedInBackpack", { count: ownedQuantity })
                    : t("ownedInInventory", { count: ownedQuantity })}
                </span>
              </span>
            )}

            {isDebtCategory && (
              <span className="inline-flex items-center gap-1 font-bold rounded-md border text-tiny px-1.5 py-0.5 leading-none shrink-0 whitespace-nowrap bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300">
                <Receipt size={10} className="shrink-0" aria-hidden="true" />
                <span>{t("categories.DEBT")}</span>
              </span>
            )}

            {showSubtleCategory && (
              <span className="text-tiny leading-none text-neutral-400 font-medium min-w-0 truncate">
                · {t(`categories.${categoryMessageKey}`)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ZONA 2: Descrição + Seletor de Pacotes */}
      {displayDescription && selectableVariants ? (
        <div className="catalog-card-content flex flex-col gap-1.5 min-w-0">
          <p
            className={cn(
              "leading-snug line-clamp-2 text-xs",
              trimmedDescription !== ""
                ? "text-neutral-300"
                : "text-neutral-400",
            )}
          >
            {displayDescription}
          </p>
          <CatalogItemVariantChips
            variants={selectableVariants.variants}
            activeVariantId={activeVariantId ?? id}
            onSelectVariant={selectableVariants.onSelect}
            disabled={isActionLoading}
          />
        </div>
      ) : displayDescription ? (
        <p
          className={cn(
            "catalog-card-content leading-snug line-clamp-2 text-xs",
            trimmedDescription !== "" ? "text-neutral-300" : "text-neutral-400",
          )}
        >
          {displayDescription}
        </p>
      ) : selectableVariants ? (
        <CatalogItemVariantChips
          variants={selectableVariants.variants}
          activeVariantId={activeVariantId ?? id}
          onSelectVariant={selectableVariants.onSelect}
          disabled={isActionLoading}
          className="catalog-card-content"
        />
      ) : null}

      {/* ZONA 3: Rodapé */}
      <footer
        className={cn(
          "flex flex-col gap-1.5 pt-2 border-t w-full",
          isDebtCategory
            ? "border-rose-500/20 dark:border-rose-400/15"
            : "border-neutral-700/80 dark:border-white/10",
        )}
      >
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
                    : formatMissingBalanceHint(
                        missingCoins,
                        isGamified,
                        locale,
                        t,
                      )}
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
                    : isDebtCategory
                      ? "bg-rose-500/80 dark:bg-rose-400/80"
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
              <CatalogItemPricePill
                price={price}
                canAfford={canAfford}
                isGamified={isGamified}
                variant={isDebtCategory ? "debt" : "default"}
              />
            ) : remainingSeconds !== undefined && remainingSeconds !== null ? (
              <CatalogItemDurationBadge
                remainingSeconds={remainingSeconds}
                variant="pill"
              />
            ) : baseDurationMinutes ? (
              <CatalogItemDurationBadge
                baseDurationMinutes={baseDurationMinutes}
                variant="pill"
              />
            ) : (
              <span className="text-neutral-400 font-medium truncate text-tiny">
                {inUse
                  ? t("statuses.activeSession")
                  : isMystery
                    ? isGamified
                      ? t("statuses.sealedBox")
                      : t("statuses.sealedBoxProductivity")
                    : t("statuses.available")}
              </span>
            )}
          </div>

          <CatalogPrimaryActionButton
            variant="card"
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
        </div>
      </footer>

      {mysteryPopover?.portalNode}
    </article>
  );
}

/**
 * Card unificado e memoizado para itens da Vitrine (Rewards) e da Mochila (Inventory).
 */
export const GamifiedItemCard = memo(function GamifiedItemCard(
  props: GamifiedItemCardProps,
) {
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
      render={(context) => (
        <GamifiedItemCardContent {...props} context={context} />
      )}
    />
  );
});
