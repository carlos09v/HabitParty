import { Crown, HelpCircle, Loader2, MoreVertical, Pin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { MouseEvent, ReactNode } from "react";
import type { MysteryPopoverBridge } from "@/hooks/useMysteryBoxItemPopover";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { RewardTypeMessageKey } from "@/types/reward";
import {
  cn,
  formatCoins,
  openContextMenuFromButton,
  STOP_DRAG_PROPAGATION_PROPS,
} from "@/utils";
import { resolveCatalogActionTooltip } from "@/utils/catalogItemVisuals";

type CatalogUtilityVariant = "card" | "row";

/**
 * Resolve o estado Premium do usuário a partir da store hidratada com fallback para o valor SSR inicial.
 */
export function useResolvedIsPremium(initialIsPremium: boolean): boolean {
  return useUserStore((s) =>
    s.user !== null ? Boolean(s.user.isPremium) : initialIsPremium,
  );
}

interface CatalogCapacityPillProps {
  current: number;
  max: number;
  isPremium: boolean;
  isWarning?: boolean;
  title: string;
}

/**
 * Pílula compartilhada de capacidade/cota exibida na barra de filtros da Loja e da Mochila.
 */
export function CatalogCapacityPill({
  current,
  max,
  isPremium,
  isWarning = false,
  title,
}: CatalogCapacityPillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium tabular-nums",
        isWarning
          ? "border-amber-500/45 bg-amber-500/12 text-amber-800 dark:text-amber-300"
          : "border-neutral-700 bg-surface dark:border-white/15 dark:bg-surface/60 text-neutral-300",
      )}
      title={title}
    >
      {isPremium && (
        <Crown
          size={12}
          className="text-gold fill-gold/20"
          aria-hidden="true"
        />
      )}
      <span>
        {current}/{max}
      </span>
    </div>
  );
}

/**
 * Calcula o valor faltante (com mínimo de 0.01) para atingir o preço de um item da vitrine.
 */
export function calculateMissingBalance(
  price: number,
  currentCoins: number,
): number {
  return Math.max(
    0.01,
    Math.round((price - Math.max(0, currentCoins)) * 100) / 100,
  );
}

type MissingBalanceTranslator = (
  key: "missingCoinsHint" | "missingCreditsHint",
  values: { missing: string },
) => string;

/**
 * Formata o aviso de saldo faltante respeitando o modo de experiência (Moedas vs Créditos) e locale.
 */
export function formatMissingBalanceHint(
  missingCoins: number,
  isGamified: boolean,
  locale: AppLocale,
  t: MissingBalanceTranslator,
): string {
  return t(isGamified ? "missingCoinsHint" : "missingCreditsHint", {
    missing: formatCoins(missingCoins, { locale }),
  });
}

/**
 * Resolve as classes de cor da caixa de ícone quando o item não possui tema de raridade próprio.
 */
export function getCatalogItemIconBoxClass(
  typeKey: RewardTypeMessageKey,
  packageIconTheme?: string,
): string {
  if (packageIconTheme) return packageIconTheme;
  return typeKey === "TimeBased"
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 group-hover:border-emerald-500/40 dark:bg-white/10 dark:border-white/15 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40"
    : "bg-primary/10 text-primary border-primary/20 group-hover:border-primary/40 dark:bg-white/10 dark:border-white/15 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40";
}

interface CatalogStatusBadgeProps {
  variant: CatalogUtilityVariant;
  statusBadgeSlot?: ReactNode;
  inUse: boolean;
}

/**
 * Renderiza o slot de status ao vivo ou o badge padrão "No Foco" compartilhado entre card e linha.
 */
export function CatalogStatusBadge({
  variant,
  statusBadgeSlot,
  inUse,
}: CatalogStatusBadgeProps) {
  const t = useTranslations("ui.itemCatalog");
  if (statusBadgeSlot) {
    return <>{statusBadgeSlot}</>;
  }
  if (!inUse) {
    return null;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-md border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 leading-none shrink-0",
        variant === "row"
          ? "text-label-m gap-1.5 px-2 py-0.5 truncate"
          : "text-tiny gap-1 px-1.5 py-0.5 whitespace-nowrap",
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
      {t("inFocus")}
    </span>
  );
}

interface CatalogPrimaryActionButtonProps {
  variant: CatalogUtilityVariant;
  actionLabel: string;
  title: string;
  price?: number;
  disabledTitle?: string;
  canAfford: boolean;
  inUse: boolean;
  isFocusNavigate: boolean;
  isDebtCategory: boolean;
  isGamified: boolean;
  isActionLoading: boolean;
  onAction?: () => void;
}

/**
 * Botão de ação principal compartilhado entre `GamifiedItemCard` e `ItemRow`.
 */
export function CatalogPrimaryActionButton({
  variant,
  actionLabel,
  title,
  price,
  disabledTitle,
  canAfford,
  inUse,
  isFocusNavigate,
  isDebtCategory,
  isGamified,
  isActionLoading,
  onAction,
}: CatalogPrimaryActionButtonProps) {
  const t = useTranslations("ui.itemCatalog");
  const locale = useLocale() as AppLocale;
  const isPrimaryDisabled =
    !canAfford || (inUse && !isFocusNavigate) || isActionLoading;

  return (
    <button
      type="button"
      {...STOP_DRAG_PROPAGATION_PROPS}
      onClick={onAction}
      onDoubleClick={(e) => e.stopPropagation()}
      disabled={isPrimaryDisabled}
      aria-busy={isActionLoading}
      aria-label={`${actionLabel} ${title}`}
      title={resolveCatalogActionTooltip({
        isFocusNavigate,
        inUse,
        canAfford,
        isGamified,
        actionLabel,
        title,
        price,
        disabledTitle,
        locale,
        t,
      })}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-semibold dark:font-bold transition-[transform,background-color,border-color,color,opacity] duration-150 shadow-xs shrink-0 pointer-coarse:min-h-9 text-xs",
        variant === "row"
          ? "rounded-md px-3 py-1.5 sm:py-1"
          : "rounded-lg px-3 py-1",
        !isActionLoading && (isFocusNavigate || (canAfford && !inUse))
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
  );
}

const UTILITY_VARIANT_STYLE: Record<
  CatalogUtilityVariant,
  {
    buttonSize: string;
    helpIconSize: number;
    actionIconSize: number;
    pinClassName: string;
  }
> = {
  card: {
    buttonSize: "min-w-7 min-h-7 pointer-coarse:min-w-8 pointer-coarse:min-h-8",
    helpIconSize: 14,
    actionIconSize: 15,
    pinClassName:
      "inline-flex items-center justify-center min-w-5 min-h-7 text-rose-700/85 dark:text-rose-400/80",
  },
  row: {
    buttonSize:
      "shrink-0 w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9 border border-transparent",
    helpIconSize: 15,
    actionIconSize: 16,
    pinClassName:
      "inline-flex items-center justify-center text-rose-700/85 dark:text-rose-400/80",
  },
};

export function CatalogPinnedBadge({
  variant,
  size = 13,
}: {
  variant: CatalogUtilityVariant;
  size?: number;
}) {
  const t = useTranslations("ui.itemCatalog");
  return (
    <span
      className={UTILITY_VARIANT_STYLE[variant].pinClassName}
      title={t("pinnedDebtTitle")}
    >
      <Pin size={size} aria-hidden="true" />
    </span>
  );
}

interface CatalogUtilityActionsProps {
  variant: CatalogUtilityVariant;
  showPin?: boolean;
  mysteryPopover?: MysteryPopoverBridge;
  isGamified: boolean;
  isDeleteChecking?: boolean;
  onContextMenu?: (e: MouseEvent) => void;
}

/**
 * Controles utilitários compartilhados (Pin de dívida no card, detalhes da caixa misteriosa,
 * indicador de checagem de exclusão e botão de menu de contexto) para `GamifiedItemCard` e `ItemRow`.
 */
export function CatalogUtilityActions({
  variant,
  showPin = false,
  mysteryPopover,
  isGamified,
  isDeleteChecking = false,
  onContextMenu,
}: CatalogUtilityActionsProps) {
  const t = useTranslations("ui.itemCatalog");
  const sizing = UTILITY_VARIANT_STYLE[variant];
  const tierDetailsLabel = isGamified
    ? t("tierDetailsAria")
    : t("tierDetailsAriaProductivity");

  return (
    <>
      {showPin && <CatalogPinnedBadge variant={variant} />}

      {mysteryPopover && (
        <button
          type="button"
          {...STOP_DRAG_PROPAGATION_PROPS}
          onClick={(e) => {
            e.stopPropagation();
            mysteryPopover.togglePinned();
          }}
          onDoubleClick={(e) => e.stopPropagation()}
          aria-expanded={mysteryPopover.isOpen}
          aria-controls={
            mysteryPopover.isOpen ? mysteryPopover.popoverId : undefined
          }
          aria-label={tierDetailsLabel}
          title={tierDetailsLabel}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-gold hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            mysteryPopover.isPinned && "text-gold bg-white/10",
            sizing.buttonSize,
          )}
        >
          <HelpCircle size={sizing.helpIconSize} aria-hidden="true" />
        </button>
      )}

      {isDeleteChecking ? (
        <output
          className={cn(
            "inline-flex items-center justify-center text-gold",
            sizing.buttonSize,
          )}
          title={t("checkingDeleteAria")}
          aria-label={t("checkingDeleteAria")}
        >
          <Loader2
            size={sizing.actionIconSize}
            className="animate-spin"
            aria-hidden="true"
          />
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
            className={cn(
              "inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              sizing.buttonSize,
            )}
          >
            <MoreVertical size={sizing.actionIconSize} aria-hidden="true" />
          </button>
        )
      )}
    </>
  );
}
