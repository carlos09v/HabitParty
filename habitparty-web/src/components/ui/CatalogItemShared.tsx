"use client";

import { HelpCircle, Loader2, MoreVertical, Pin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";
import type { MysteryPopoverBridge } from "@/hooks/useMysteryBoxItemPopover";
import {
  cn,
  openContextMenuFromButton,
  STOP_DRAG_PROPAGATION_PROPS,
} from "@/utils";

type CatalogUtilityVariant = "card" | "row";

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
            mysteryPopover.toggle();
          }}
          onDoubleClick={(e) => e.stopPropagation()}
          aria-expanded={mysteryPopover.isOpen}
          aria-label={tierDetailsLabel}
          title={tierDetailsLabel}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-gold hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
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
