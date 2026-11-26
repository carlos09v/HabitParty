import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { InventoryLiveStatusBadge } from "@/components/inventory/InventoryLiveStatusBadge";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { ItemRow } from "@/components/ui/ItemRow";
import type { InventoryCardProps } from "@/types/inventory";
import {
  executeInventoryItemAction,
  getInventoryItemActionMeta,
  resolveInventoryItemLoadingState,
} from "@/utils/inventoryHelpers";

function useInventoryItemCardPresentation(
  {
    item,
    isGamified = true,
    isReorderDisabled = false,
    onOpenFocus,
    onUse,
    onSendToFocus,
    onOpenMysteryBox,
    onContextMenu,
    isUsing = false,
    isSendingToFocus = false,
    isReturning = false,
  }: InventoryCardProps,
  variant: "card" | "row",
) {
  const t = useTranslations("inventory.card");

  const meta = useMemo(
    () =>
      getInventoryItemActionMeta(item, {
        openInFocus: t("openInFocus"),
        completeCoupon: t("completeCoupon"),
        openBox: isGamified ? t("openBox") : t("openBoxProductivity"),
        sendToFocus: t("sendToFocus"),
        use: t("use"),
      }),
    [item, isGamified, t],
  );

  const { isPrimaryLoading } = resolveInventoryItemLoadingState(meta, {
    isUsing,
    isSendingToFocus,
    isReturning,
  });

  const handleAction = useCallback(() => {
    executeInventoryItemAction(item, {
      onOpenFocus: (itemId) => onOpenFocus?.(itemId),
      onOpenMysteryBox,
      onSendToFocus,
      onUse,
    });
  }, [item, onOpenFocus, onOpenMysteryBox, onSendToFocus, onUse]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      onContextMenu?.(e, item);
    },
    [onContextMenu, item],
  );

  const dragData = useMemo(
    () => ({ type: "InventoryItem" as const, item }),
    [item],
  );

  const stackIds = useMemo(
    () => (item.itemIds?.length ? item.itemIds : [item.id]),
    [item.itemIds, item.id],
  );

  const reward = item.reward;
  const isActivelyInFocus = meta.isInFocus && !meta.isDepletedCoupon;

  const statusBadgeSlot = useMemo(
    () =>
      isActivelyInFocus ? (
        <InventoryLiveStatusBadge itemIds={stackIds} variant={variant} />
      ) : undefined,
    [isActivelyInFocus, stackIds, variant],
  );

  return {
    id: item.id,
    title: reward.title,
    description: reward.description,
    iconName: reward.icon,
    type: reward.type,
    packageLevel: reward.packageLevel,
    category: reward.category,
    baseDurationMinutes: reward.baseDurationMinutes,
    remainingSeconds: item.remainingSeconds,
    quantity: item.quantity,
    isGamified,
    showMysteryPriceFooter: false,
    inUse: isActivelyInFocus,
    isActiveFocusSession: isActivelyInFocus,
    isActionLoading: isPrimaryLoading,
    isDragDisabled: isReorderDisabled,
    actionLabel: meta.actionLabel,
    onAction: handleAction,
    onContextMenu: handleContextMenu,
    dragData,
    lootItems: reward.lootItems,
    statusBadgeSlot,
  };
}

export const InventoryCard = memo(function InventoryCard(
  props: InventoryCardProps,
) {
  const sharedItemProps = useInventoryItemCardPresentation(props, "card");
  return <GamifiedItemCard {...sharedItemProps} />;
});

export const InventoryItemRow = memo(function InventoryItemRow(
  props: InventoryCardProps,
) {
  const sharedItemProps = useInventoryItemCardPresentation(props, "row");
  return <ItemRow {...sharedItemProps} />;
});
