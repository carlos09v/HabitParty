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
} from "@/utils/inventoryHelpers";

export const InventoryCard = memo(function InventoryCard({
  item,
  onUse,
  onSendToFocus,
  onOpenMysteryBox,
  onContextMenu,
  isCompact = false,
}: InventoryCardProps) {
  const router = useRouter();
  const t = useTranslations("inventory.card");
  const reward = item.reward;

  const { isInFocus, actionLabel, secondaryActionLabel } = useMemo(
    () =>
      getInventoryItemActionMeta(item, {
        openInFocus: t("openInFocus"),
        openBox: t("openBox"),
        sendToFocus: t("sendToFocus"),
        use: t("use"),
      }),
    [item, t],
  );

  const handleAction = useCallback(() => {
    executeInventoryItemAction(item, {
      onOpenFocus: () => router.push("/focus"),
      onOpenMysteryBox,
      onSendToFocus,
      onUse,
    });
  }, [item, router, onOpenMysteryBox, onSendToFocus, onUse]);

  const handleSecondaryAction = useMemo(
    () => (secondaryActionLabel && onUse ? () => onUse(item) : undefined),
    [secondaryActionLabel, onUse, item],
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
      actionLabel={actionLabel}
      onAction={handleAction}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryAction={handleSecondaryAction}
      onContextMenu={handleContextMenu}
      dragData={dragData}
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
}: InventoryCardProps) {
  const router = useRouter();
  const t = useTranslations("inventory.helpers");
  const reward = item.reward;

  const { isInFocus, actionLabel, secondaryActionLabel } = useMemo(
    () =>
      getInventoryItemActionMeta(item, {
        openInFocus: t("openInFocus"),
        openBox: t("openBox"),
        sendToFocus: t("sendToFocus"),
        use: t("use"),
      }),
    [item, t],
  );

  const handleAction = useCallback(() => {
    executeInventoryItemAction(item, {
      onOpenFocus: () => router.push("/focus"),
      onOpenMysteryBox,
      onSendToFocus,
      onUse,
    });
  }, [item, router, onOpenMysteryBox, onSendToFocus, onUse]);

  const handleSecondaryAction = useMemo(
    () => (secondaryActionLabel && onUse ? () => onUse(item) : undefined),
    [secondaryActionLabel, onUse, item],
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
