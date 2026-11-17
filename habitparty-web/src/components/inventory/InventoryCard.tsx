"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
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
    onUse,
    onSendToFocus,
    onOpenMysteryBox,
    onContextMenu,
    isUsing = false,
    isSendingToFocus = false,
  }: Pick<
    InventoryCardProps,
    | "item"
    | "onUse"
    | "onSendToFocus"
    | "onOpenMysteryBox"
    | "onContextMenu"
    | "isUsing"
    | "isSendingToFocus"
  >,
  translationNamespace: "inventory.card" | "inventory.helpers",
) {
  const router = useRouter();
  const t = useTranslations(translationNamespace);

  const meta = useMemo(
    () =>
      getInventoryItemActionMeta(item, {
        openInFocus: t("openInFocus"),
        openBox: t("openBox"),
        sendToFocus: t("sendToFocus"),
        use: t("use"),
      }),
    [item, t],
  );

  const { isPrimaryLoading, isSecondaryLoading } =
    resolveInventoryItemLoadingState(meta, { isUsing, isSendingToFocus });

  const handleAction = useCallback(() => {
    executeInventoryItemAction(item, {
      onOpenFocus: () => router.push("/focus?from=inventory"),
      onOpenMysteryBox,
      onSendToFocus,
      onUse,
    });
  }, [item, router, onOpenMysteryBox, onSendToFocus, onUse]);

  const handleSecondaryAction = useMemo(
    () => (meta.secondaryActionLabel && onUse ? () => onUse(item) : undefined),
    [meta.secondaryActionLabel, onUse, item],
  );

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

  return {
    isInFocus: meta.isInFocus,
    actionLabel: meta.actionLabel,
    secondaryActionLabel: meta.secondaryActionLabel,
    isPrimaryLoading,
    isSecondaryLoading,
    handleAction,
    handleSecondaryAction,
    handleContextMenu,
    dragData,
  };
}

export const InventoryCard = memo(function InventoryCard({
  item,
  onUse,
  onSendToFocus,
  onOpenMysteryBox,
  onContextMenu,
  isCompact = false,
  isUsing = false,
  isSendingToFocus = false,
}: InventoryCardProps) {
  const reward = item.reward;
  const {
    isInFocus,
    actionLabel,
    secondaryActionLabel,
    isPrimaryLoading,
    isSecondaryLoading,
    handleAction,
    handleSecondaryAction,
    handleContextMenu,
    dragData,
  } = useInventoryItemCardPresentation(
    {
      item,
      onUse,
      onSendToFocus,
      onOpenMysteryBox,
      onContextMenu,
      isUsing,
      isSendingToFocus,
    },
    "inventory.card",
  );

  return (
    <GamifiedItemCard
      id={item.id}
      title={reward.title}
      description={reward.description}
      iconName={reward.icon || reward.iconName}
      type={reward.type}
      packageLevel={reward.packageLevel}
      category={reward.category}
      baseDurationMinutes={reward.baseDurationMinutes}
      remainingSeconds={item.remainingSeconds}
      isCompact={isCompact}
      quantity={item.quantity}
      inUse={isInFocus}
      isActiveFocusSession={isInFocus}
      isActionLoading={isPrimaryLoading}
      isSecondaryActionLoading={isSecondaryLoading}
      actionLabel={actionLabel}
      onAction={handleAction}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryAction={handleSecondaryAction}
      onContextMenu={handleContextMenu}
      dragData={dragData}
      lootItems={reward.lootItems}
    />
  );
});

export const InventoryItemRow = memo(function InventoryItemRow({
  item,
  onUse,
  onSendToFocus,
  onOpenMysteryBox,
  onContextMenu,
  isCompact = false,
  isUsing = false,
  isSendingToFocus = false,
}: InventoryCardProps) {
  const reward = item.reward;
  const {
    isInFocus,
    actionLabel,
    secondaryActionLabel,
    isPrimaryLoading,
    isSecondaryLoading,
    handleAction,
    handleSecondaryAction,
    handleContextMenu,
    dragData,
  } = useInventoryItemCardPresentation(
    {
      item,
      onUse,
      onSendToFocus,
      onOpenMysteryBox,
      onContextMenu,
      isUsing,
      isSendingToFocus,
    },
    "inventory.helpers",
  );

  return (
    <ItemRow
      id={item.id}
      title={reward?.title || item.name}
      description={reward?.description || item.description}
      type={reward?.type || item.itemType}
      packageLevel={reward?.packageLevel}
      category={reward?.category}
      iconName={reward?.icon || reward?.iconName || item.iconName}
      baseDurationMinutes={reward?.baseDurationMinutes}
      remainingSeconds={item.remainingSeconds}
      quantity={item.quantity}
      inUse={isInFocus}
      isActiveFocusSession={isInFocus}
      isActionLoading={isPrimaryLoading}
      isSecondaryActionLoading={isSecondaryLoading}
      actionLabel={actionLabel}
      onAction={handleAction}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryAction={handleSecondaryAction}
      onContextMenu={handleContextMenu}
      isCompact={isCompact}
      dragData={dragData}
    />
  );
});
