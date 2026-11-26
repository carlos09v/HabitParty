import type {
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import { Backpack, Package, SearchX, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type MouseEvent, useCallback, useMemo } from "react";
import {
  InventoryCard,
  InventoryItemRow,
} from "@/components/inventory/InventoryCard";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { CatalogGridListShell } from "@/components/ui/CatalogGridListShell";
import type { InventoryItem } from "@/types/inventory";
import type { ViewMode } from "@/types/ui";

interface InventoryCatalogViewProps {
  filteredItems: InventoryItem[];
  totalItemsCount: number;
  viewMode: ViewMode;
  isGamified: boolean;
  isReorderDisabled?: boolean;
  usingItemIds?: Set<string>;
  sendingItemIds?: Set<string>;
  returningItemIds?: Set<string>;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  onUse: (item: InventoryItem) => void;
  onSendToFocus: (item: InventoryItem) => void;
  onOpenMysteryBox: (item: InventoryItem) => void;
  onContextMenu: (e: MouseEvent, item: InventoryItem) => void;
  onClearFilters: () => void;
}

export function InventoryCatalogView({
  filteredItems,
  totalItemsCount,
  viewMode,
  isGamified,
  isReorderDisabled = false,
  usingItemIds,
  sendingItemIds,
  returningItemIds,
  sensors,
  onDragEnd,
  onUse,
  onSendToFocus,
  onOpenMysteryBox,
  onContextMenu,
  onClearFilters,
}: InventoryCatalogViewProps) {
  const t = useTranslations("inventory.container");
  const router = useRouter();

  const handleOpenFocus = useCallback(
    (itemId: string) => {
      router.push(`/focus?from=inventory&itemId=${itemId}`);
    },
    [router],
  );

  const itemIds = useMemo(
    () => filteredItems.map((i) => i.id),
    [filteredItems],
  );

  if (filteredItems.length === 0) {
    const isInventoryEmpty = totalItemsCount === 0;
    return (
      <div className="flex flex-col gap-2.5 w-full pb-8">
        <CatalogEmptyState
          icon={isInventoryEmpty ? (isGamified ? Backpack : Package) : SearchX}
          title={
            isInventoryEmpty
              ? isGamified
                ? t("emptyState.emptyTitleGamified")
                : t("emptyState.emptyTitleProductivity")
              : t("emptyState.noResultsTitle")
          }
          description={
            isInventoryEmpty
              ? isGamified
                ? t("emptyState.emptyDescriptionGamified")
                : t("emptyState.emptyDescriptionProductivity")
              : t("emptyState.noResultsDescription")
          }
          action={
            isInventoryEmpty ? (
              <Link
                href="/rewards"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-bold text-xs hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer"
              >
                <Store size={15} />
                <span>{t("emptyState.exploreStore")}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-primary/40 bg-surface/80 text-xs font-semibold text-gold hover:border-gold hover:bg-gold/10 transition-colors cursor-pointer"
              >
                <span>{t("emptyState.clearFilters")}</span>
              </button>
            )
          }
        />
      </div>
    );
  }

  const effectiveDragDisabled = isReorderDisabled || filteredItems.length <= 1;

  return (
    <CatalogGridListShell
      dndContextId="inventory-dnd-context"
      itemIds={itemIds}
      viewMode={viewMode}
      headerMode="inventory"
      listAriaLabel={t("listAriaLabel")}
      disableDnd={effectiveDragDisabled}
      sensors={sensors}
      onDragEnd={onDragEnd}
    >
      {filteredItems.map((item) => {
        const stableKey = item.stackKey ?? item.id;
        const isUsing = Boolean(usingItemIds?.has(stableKey));
        const isSendingToFocus = Boolean(sendingItemIds?.has(stableKey));
        const isReturning = Boolean(returningItemIds?.has(stableKey));
        const sharedProps = {
          item,
          isGamified,
          isReorderDisabled: effectiveDragDisabled,
          onOpenFocus: handleOpenFocus,
          onUse,
          onSendToFocus,
          onOpenMysteryBox,
          onContextMenu,
          isUsing,
          isSendingToFocus,
          isReturning,
        };

        return viewMode !== "list" ? (
          <InventoryCard key={stableKey} {...sharedProps} />
        ) : (
          <InventoryItemRow key={stableKey} {...sharedProps} />
        );
      })}
    </CatalogGridListShell>
  );
}
