"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { GamifiedItemCard } from "@/components/ui/GamifiedItemCard";
import { ItemRow } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { InventoryCardProps } from "@/types/inventory";
import {
  executeInventoryItemAction,
  getInventoryItemActionMeta,
  resolveInventoryItemLoadingState,
} from "@/utils/inventoryHelpers";

function useInventoryItemCardPresentation({
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
>) {
  const router = useRouter();
  const t = useTranslations("inventory.card");
  const { isGamified } = useExperienceMode();

  const meta = useMemo(
    () =>
      getInventoryItemActionMeta(item, {
        openInFocus: t("openInFocus"),
        openBox: isGamified ? t("openBox") : t("openBoxProductivity"),
        sendToFocus: t("sendToFocus"),
        use: t("use"),
      }),
    [item, isGamified, t],
  );

  const { isPrimaryLoading } = resolveInventoryItemLoadingState(meta, {
    isUsing,
    isSendingToFocus,
  });

  const handleAction = useCallback(() => {
    executeInventoryItemAction(item, {
      onOpenFocus: () => router.push("/focus?from=inventory"),
      onOpenMysteryBox,
      onSendToFocus,
      onUse,
    });
  }, [item, router, onOpenMysteryBox, onSendToFocus, onUse]);

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
    isPrimaryLoading,
    handleAction,
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
  isUsing = false,
  isSendingToFocus = false,
}: InventoryCardProps) {
  const reward = item.reward;
  const {
    isInFocus,
    actionLabel,
    isPrimaryLoading,
    handleAction,
    handleContextMenu,
    dragData,
  } = useInventoryItemCardPresentation({
    item,
    onUse,
    onSendToFocus,
    onOpenMysteryBox,
    onContextMenu,
    isUsing,
    isSendingToFocus,
  });

  return (
    <GamifiedItemCard
      id={item.id}
      title={reward.title}
      description={reward.description}
      iconName={reward.icon}
      type={reward.type}
      packageLevel={reward.packageLevel}
      category={reward.category}
      baseDurationMinutes={reward.baseDurationMinutes}
      remainingSeconds={item.remainingSeconds}
      quantity={item.quantity}
      inUse={isInFocus}
      isActiveFocusSession={isInFocus}
      isActionLoading={isPrimaryLoading}
      actionLabel={actionLabel}
      onAction={handleAction}
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
  isUsing = false,
  isSendingToFocus = false,
}: InventoryCardProps) {
  const reward = item.reward;
  const {
    isInFocus,
    actionLabel,
    isPrimaryLoading,
    handleAction,
    handleContextMenu,
    dragData,
  } = useInventoryItemCardPresentation({
    item,
    onUse,
    onSendToFocus,
    onOpenMysteryBox,
    onContextMenu,
    isUsing,
    isSendingToFocus,
  });

  return (
    <ItemRow
      id={item.id}
      title={reward.title}
      description={reward.description}
      type={reward.type}
      packageLevel={reward.packageLevel}
      category={reward.category}
      iconName={reward.icon}
      baseDurationMinutes={reward.baseDurationMinutes}
      remainingSeconds={item.remainingSeconds}
      quantity={item.quantity}
      inUse={isInFocus}
      isActiveFocusSession={isInFocus}
      isActionLoading={isPrimaryLoading}
      actionLabel={actionLabel}
      onAction={handleAction}
      onContextMenu={handleContextMenu}
      dragData={dragData}
      lootItems={reward.lootItems}
    />
  );
});
